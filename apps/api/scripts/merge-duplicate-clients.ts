/**
 * Consolida contatos e negócios duplicados que já estão no banco.
 *
 * A correção em src/lib/contact-identity.ts impede que novas duplicatas apareçam, mas
 * não conserta o que foi criado antes dela. Este script reagrupa os registros pela
 * mesma identidade canônica usada em produção e funde cada grupo no contato mais antigo.
 *
 *   pnpm tsx scripts/merge-duplicate-clients.ts            # simulação (padrão)
 *   pnpm tsx scripts/merge-duplicate-clients.ts --apply    # grava as alterações
 *
 * Nada é apagado sem antes ter o conteúdo transferido: notas, arquivos, tarefas,
 * propostas e execuções de cadência migram para o registro que fica, e os campos
 * próprios de cada negócio removido são preservados numa nota de auditoria.
 */
import { PrismaClient } from "@prisma/client";
import { contactIdentity } from "../src/lib/contact-identity.js";

const prisma = new PrismaClient({ log: ["error"] });
const APPLY = process.argv.includes("--apply");

function log(...args: unknown[]) {
    console.log(...args);
}

/** União transitiva: A e B dividem o e-mail, B e C o telefone — os três são a mesma pessoa. */
class UnionFind {
    private parent = new Map<string, string>();

    find(x: string): string {
        const p = this.parent.get(x);
        if (p === undefined) {
            this.parent.set(x, x);
            return x;
        }
        if (p === x) return x;
        const root = this.find(p);
        this.parent.set(x, root);
        return root;
    }

    union(a: string, b: string) {
        const ra = this.find(a);
        const rb = this.find(b);
        if (ra !== rb) this.parent.set(ra, rb);
    }
}

async function backfillKeys() {
    const clients = await prisma.client.findMany({
        select: { id: true, email: true, phone: true, emailKey: true, phoneKey: true },
    });

    let fixed = 0;
    for (const c of clients) {
        const identity = contactIdentity(c.email, c.phone);
        if (identity.emailKey === c.emailKey && identity.phoneKey === c.phoneKey) continue;
        fixed++;
        if (APPLY) {
            await prisma.client.update({
                where: { id: c.id },
                data: { emailKey: identity.emailKey, phoneKey: identity.phoneKey },
            });
        }
    }
    log(`Chaves de identidade recalculadas: ${fixed} de ${clients.length} contatos precisavam de ajuste.`);
}

async function buildGroups() {
    const clients = await prisma.client.findMany({
        select: { id: true, name: true, email: true, phone: true, emailKey: true, phoneKey: true, createdAt: true },
        orderBy: { createdAt: "asc" },
    });

    const uf = new UnionFind();
    const byEmail = new Map<string, string>();
    const byPhone = new Map<string, string>();

    for (const c of clients) {
        uf.find(c.id);
        // A identidade é recalculada aqui em vez de lida da coluna: em simulação o
        // backfill ainda não gravou nada, e agrupar pelas chaves persistidas faria o
        // dry-run relatar "nenhuma duplicata" justamente no banco que mais tem.
        const identity = contactIdentity(c.email, c.phone);
        if (identity.emailKey) {
            const seen = byEmail.get(identity.emailKey);
            if (seen) uf.union(c.id, seen);
            else byEmail.set(identity.emailKey, c.id);
        }
        if (identity.phoneKey) {
            const seen = byPhone.get(identity.phoneKey);
            if (seen) uf.union(c.id, seen);
            else byPhone.set(identity.phoneKey, c.id);
        }
    }

    const groups = new Map<string, typeof clients>();
    for (const c of clients) {
        const root = uf.find(c.id);
        const bucket = groups.get(root) ?? [];
        bucket.push(c);
        groups.set(root, bucket);
    }

    // Mantém a ordem por antiguidade dentro de cada grupo: o primeiro é o que fica.
    return [...groups.values()]
        .filter((g) => g.length > 1)
        .map((g) => [...g].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()));
}

/** Move para o contato principal tudo que aponta para os duplicados. */
async function mergeClientRecords(keepId: string, dropIds: string[]) {
    if (!APPLY) return;

    await prisma.deal.updateMany({ where: { clientId: { in: dropIds } }, data: { clientId: keepId } });
    await prisma.clientContact.updateMany({ where: { clientId: { in: dropIds } }, data: { clientId: keepId } });
    await prisma.task.updateMany({ where: { clientId: { in: dropIds } }, data: { clientId: keepId } });
    await prisma.proposal.updateMany({ where: { clientId: { in: dropIds } }, data: { clientId: keepId } });
    await prisma.assembledProposal.updateMany({ where: { clientId: { in: dropIds } }, data: { clientId: keepId } });

    // whatsapp_contacts.client_id é UNIQUE: só um contato do WhatsApp pode apontar para
    // o principal. Se ele ainda não tem um, adota o primeiro; os demais são soltos.
    const keepHasWhatsapp = await prisma.whatsappContact.findFirst({ where: { clientId: keepId }, select: { id: true } });
    const orphans = await prisma.whatsappContact.findMany({ where: { clientId: { in: dropIds } }, select: { id: true } });
    for (const [i, wa] of orphans.entries()) {
        const adopt = i === 0 && !keepHasWhatsapp;
        await prisma.whatsappContact.update({ where: { id: wa.id }, data: { clientId: adopt ? keepId : null } });
    }

    // Completa lacunas do principal com o que os duplicados tinham de melhor.
    const keep = await prisma.client.findUnique({ where: { id: keepId } });
    const drops = await prisma.client.findMany({ where: { id: { in: dropIds } } });
    if (keep) {
        const firstFilled = (field: "email" | "phone" | "company" | "companyId" | "segment" | "city" | "state" | "website" | "role" | "notes") =>
            keep[field] ?? drops.map((d) => d[field]).find((v) => v != null) ?? null;

        await prisma.client.update({
            where: { id: keepId },
            data: {
                email: firstFilled("email") as string | null,
                phone: firstFilled("phone") as string | null,
                company: firstFilled("company") as string | null,
                companyId: firstFilled("companyId") as string | null,
                segment: firstFilled("segment") as string | null,
                city: firstFilled("city") as string | null,
                state: firstFilled("state") as string | null,
                website: firstFilled("website") as string | null,
                role: firstFilled("role") as string | null,
                notes: firstFilled("notes") as string | null,
                totalRevenue: keep.totalRevenue + drops.reduce((sum, d) => sum + d.totalRevenue, 0),
            },
        });

        const identity = contactIdentity(
            (firstFilled("email") as string | null),
            (firstFilled("phone") as string | null),
        );
        await prisma.client.update({
            where: { id: keepId },
            data: { emailKey: identity.emailKey, phoneKey: identity.phoneKey },
        });
    }

    await prisma.client.deleteMany({ where: { id: { in: dropIds } } });
}

/**
 * Depois da fusão o contato pode ter vários negócios abertos — os cards repetidos que
 * aparecem na pipeline. Fica o mais avançado no funil; o histórico dos outros é
 * transferido e o que era exclusivo deles vira nota de auditoria.
 */
async function mergeOpenDeals(clientIds: string[]): Promise<number> {
    // Recebe o grupo inteiro, não só o contato que fica: em simulação os duplicados
    // ainda existem, e olhar apenas um deles esconderia os cards que a fusão vai juntar.
    const open = await prisma.deal.findMany({
        where: { clientId: { in: clientIds }, status: "open" },
        select: {
            id: true, title: true, value: true, source: true, tags: true, createdAt: true,
            stage: { select: { orderIndex: true, name: true } },
        },
    });
    if (open.length <= 1) return 0;

    const ranked = [...open].sort((a, b) => {
        const byStage = (b.stage?.orderIndex ?? 0) - (a.stage?.orderIndex ?? 0);
        return byStage !== 0 ? byStage : a.createdAt.getTime() - b.createdAt.getTime();
    });
    const [keep, ...drops] = ranked;
    const dropIds = drops.map((d) => d.id);

    if (APPLY) {
        await prisma.dealNote.updateMany({ where: { dealId: { in: dropIds } }, data: { dealId: keep.id } });
        await prisma.dealFile.updateMany({ where: { dealId: { in: dropIds } }, data: { dealId: keep.id } });
        await prisma.task.updateMany({ where: { dealId: { in: dropIds } }, data: { dealId: keep.id } });
        await prisma.assembledProposal.updateMany({ where: { dealId: { in: dropIds } }, data: { dealId: keep.id } });
        await prisma.salesCadenceExecution.updateMany({ where: { dealId: { in: dropIds } }, data: { dealId: keep.id } });

        // O negócio que fica herda o maior valor e a união das tags dos duplicados.
        const mergedTags = [...new Set([...keep.tags, ...drops.flatMap((d) => d.tags)])];
        const maxValue = Math.max(keep.value, ...drops.map((d) => d.value));

        const owner = await prisma.deal.findUnique({ where: { id: keep.id }, select: { userId: true } });
        await prisma.dealNote.create({
            data: {
                dealId: keep.id,
                userId: owner!.userId,
                type: "system_event",
                content: [
                    `**Consolidação de negócios duplicados** — ${drops.length} card(s) unificados neste.`,
                    ...drops.map((d) =>
                        `- "${d.title}" (fonte: ${d.source}, valor: ${d.value}, etapa: ${d.stage?.name ?? "?"}, criado em ${d.createdAt.toISOString().slice(0, 10)})`),
                ].join("\n"),
            },
        });

        await prisma.deal.update({ where: { id: keep.id }, data: { tags: mergedTags, value: maxValue } });
        await prisma.deal.deleteMany({ where: { id: { in: dropIds } } });
    }

    return drops.length;
}

async function main() {
    log(APPLY ? "MODO GRAVAÇÃO — as alterações serão persistidas.\n" : "SIMULAÇÃO — nada será alterado. Use --apply para gravar.\n");

    await backfillKeys();

    const groups = await buildGroups();
    log(`\nGrupos de contatos duplicados encontrados: ${groups.length}\n`);

    let clientsRemoved = 0;
    for (const group of groups) {
        const [keep, ...drops] = group;
        const keepIdentity = contactIdentity(keep.email, keep.phone);
        log(`• ${keep.name}  [${keepIdentity.emailKey ?? "sem e-mail"} / ${keepIdentity.phoneKey ?? "sem telefone"}]`);
        log(`    fica:   ${keep.id}  (criado em ${keep.createdAt.toISOString().slice(0, 10)})`);
        for (const d of drops) {
            log(`    funde:  ${d.id}  "${d.name}"  ${d.email ?? "-"}  ${d.phone ?? "-"}`);
        }
        await mergeClientRecords(keep.id, drops.map((d) => d.id));
        clientsRemoved += drops.length;
    }

    let dealsRemoved = 0;
    const grouped = new Set(groups.flat().map((c) => c.id));

    for (const group of groups) {
        const removed = await mergeOpenDeals(group.map((c) => c.id));
        if (removed > 0) {
            dealsRemoved += removed;
            log(`• ${group[0].name}: ${removed} card(s) abertos duplicados consolidados`);
        }
    }

    // Cards repetidos existem também sem contato duplicado — dois negócios abertos em
    // paralelo para o mesmo contato — então os demais contatos entram na varredura.
    const soloClients = await prisma.client.findMany({ select: { id: true, name: true } });
    for (const c of soloClients) {
        if (grouped.has(c.id)) continue;
        const removed = await mergeOpenDeals([c.id]);
        if (removed > 0) {
            dealsRemoved += removed;
            log(`• ${c.name}: ${removed} card(s) abertos duplicados consolidados`);
        }
    }

    log(`\nResumo${APPLY ? "" : " (simulado)"}:`);
    log(`  contatos duplicados fundidos: ${clientsRemoved}`);
    log(`  cards abertos consolidados:   ${dealsRemoved}`);
    if (!APPLY) log("\nRode novamente com --apply para efetivar.");

    await prisma.$disconnect();
}

main().catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
});
