/**
 * Verificação de ponta a ponta da deduplicação de leads.
 *
 * Roda os cenários que já causaram cards duplicados na pipeline e confere o resultado
 * no banco. Exige um Postgres DESCARTÁVEL: o script apaga contatos, negócios, funis e
 * usuários antes de cada cenário — nunca aponte para produção.
 *
 *   docker run -d --rm --name dedupe-check -e POSTGRES_PASSWORD=x -e POSTGRES_DB=t \
 *     -p 55433:5432 postgres:16-alpine
 *   export DATABASE_URL="postgresql://postgres:x@localhost:55433/t?schema=public"
 *   pnpm prisma db push --skip-generate
 *   pnpm tsx scripts/verify-lead-dedupe.ts
 *
 * Para conferir que os cenários realmente detectam regressão, a lógica antiga
 * (read-then-write sem lock, match por sufixo de 10 dígitos) produzia de 3 a 10
 * contatos no primeiro cenário, onde hoje o esperado é exatamente 1.
 */
import { prisma } from "../src/config/database.js";
import { upsertDealByContact } from "../src/modules/deals/deals.service.js";

async function reset() {
    await prisma.dealNote.deleteMany({});
    await prisma.deal.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.funnelStage.deleteMany({});
    await prisma.funnel.deleteMany({});
    await prisma.user.deleteMany({});
    const owner = await prisma.user.create({
        data: { name: "Owner", email: "owner@test.com", password: "x", role: "OWNER", active: true },
    });
    await prisma.funnel.create({
        data: {
            userId: owner.id, name: "Funil", isDefault: true, active: true,
            stages: { create: [{ name: "Novo Lead", orderIndex: 0 }, { name: "Negociação", orderIndex: 1 }] },
        },
    });
    return owner.id;
}

async function report(label: string) {
    const clients = await prisma.client.count();
    const deals = await prisma.deal.count();
    const open = await prisma.deal.count({ where: { status: "open" } });
    const ok = clients === 1 && open === 1;
    console.log(`${ok ? "PASS" : "FALHOU"}  ${label.padEnd(52)} clients=${clients} deals=${deals} abertos=${open}`);
    return ok;
}

async function main() {
    let allOk = true;

    // ── 1. Rajada simultânea idêntica (duplo clique / retry de webhook) ──
    let userId = await reset();
    await Promise.all(Array.from({ length: 12 }, (_, i) =>
        upsertDealByContact({
            userId, name: "João Silva", email: "joao@empresa.com",
            phone: "+55 11 98765-4321", source: `Envio ${i}`,
        })));
    allOk = await report("12 envios idênticos simultâneos") && allOk;

    // ── 2. Rajada simultânea com o MESMO contato escrito de formas diferentes ──
    userId = await reset();
    const variantes = [
        { email: "Joao@Empresa.com ", phone: "+55 11 98765-4321", source: "Site" },
        { email: "joao@empresa.com", phone: "(11) 98765-4321", source: "Blog" },
        { email: null, phone: "551187654321", source: "whatsapp_direct" }, // legado, sem o 9
        { email: "  JOAO@EMPRESA.COM", phone: "11987654321", source: "Webhook" },
        { email: null, phone: "1187654321", source: "Ligação" },
        { email: "joao@empresa.com", phone: null, source: "Indicação" },
    ];
    await Promise.all(variantes.map((v) =>
        upsertDealByContact({ userId, name: "João Silva", ...v })));
    allOk = await report("6 variações de escrita, todas simultâneas") && allOk;

    // ── 3. Mesma sequência, porém serial (caminho do dia a dia) ──
    userId = await reset();
    for (const v of variantes) {
        await upsertDealByContact({ userId, name: "João Silva", ...v });
    }
    allOk = await report("as mesmas 6 variações, uma após a outra") && allOk;

    // ── 4. Pessoas realmente diferentes não podem ser fundidas ──
    userId = await reset();
    await Promise.all([
        upsertDealByContact({ userId, name: "João", email: "joao@x.com", phone: "11987654321", source: "Site" }),
        upsertDealByContact({ userId, name: "Maria", email: "maria@x.com", phone: "21987654321", source: "Site" }),
        upsertDealByContact({ userId, name: "Pedro", email: "pedro@x.com", phone: "11933334444", source: "Site" }),
    ]);
    const c4 = await prisma.client.count();
    const d4 = await prisma.deal.count();
    const ok4 = c4 === 3 && d4 === 3;
    console.log(`${ok4 ? "PASS" : "FALHOU"}  ${"3 pessoas distintas seguem distintas".padEnd(52)} clients=${c4} deals=${d4}`);
    allOk = ok4 && allOk;

    // ── 5. Reconversão devolve o negócio à primeira etapa (MQL) ──
    userId = await reset();
    const primeira = await prisma.funnelStage.findFirst({ where: { orderIndex: 0 } });
    const segunda = await prisma.funnelStage.findFirst({ where: { orderIndex: 1 } });
    const ana = await upsertDealByContact({ userId, name: "Ana", email: "ana@x.com", phone: "11991112222", source: "Site" });
    await prisma.deal.update({ where: { id: ana.dealId }, data: { stageId: segunda!.id } });
    await upsertDealByContact({ userId, name: "Ana", email: "ana@x.com", phone: "11991112222", source: "Blog" });
    const dealAna = await prisma.deal.findUnique({ where: { id: ana.dealId }, select: { stageId: true, status: true } });
    const ok5 = dealAna?.stageId === primeira!.id && dealAna.status === "open" && (await prisma.deal.count()) === 1;
    console.log(`${ok5 ? "PASS" : "FALHOU"}  ${"reconversão devolve o negócio para o MQL".padEnd(52)} voltou=${dealAna?.stageId === primeira!.id} cards=${await prisma.deal.count()}`);
    allOk = ok5 && allOk;

    // ── 6. Cliente que já fechou também volta para o MQL, no mesmo card ──
    userId = await reset();
    const mql = await prisma.funnelStage.findFirst({ where: { orderIndex: 0 } });
    const bia = await upsertDealByContact({ userId, name: "Bia", email: "bia@x.com", phone: "11994443333", source: "Site" });
    const ultima = await prisma.funnelStage.findFirst({ where: { orderIndex: 1 } });
    await prisma.deal.update({ where: { id: bia.dealId }, data: { status: "won", stageId: ultima!.id } });
    await upsertDealByContact({ userId, name: "Bia", email: "bia@x.com", phone: "11994443333", source: "Site" });
    const dealBia = await prisma.deal.findUnique({ where: { id: bia.dealId }, select: { status: true, stageId: true } });
    const ok6 = dealBia?.status === "open" && dealBia.stageId === mql!.id
        && (await prisma.deal.count()) === 1 && (await prisma.client.count()) === 1;
    console.log(`${ok6 ? "PASS" : "FALHOU"}  ${"cliente que fechou volta ao MQL no mesmo card".padEnd(52)} status=${dealBia?.status} cards=${await prisma.deal.count()}`);
    allOk = ok6 && allOk;

    // ── 7. Cards abertos duplicados de antes da correção são unificados ──
    userId = await reset();
    const carlos = await upsertDealByContact({ userId, name: "Carlos", email: "carlos@x.com", phone: "11995556666", source: "Site" });
    const dealCarlos = await prisma.deal.findUnique({ where: { id: carlos.dealId } });
    // Simula o legado: um segundo card aberto para o mesmo contato.
    await prisma.deal.create({
        data: {
            userId, clientId: dealCarlos!.clientId, funnelId: dealCarlos!.funnelId, stageId: dealCarlos!.stageId,
            consultantId: userId, assigneeIds: [userId], title: "Card duplicado do legado", status: "open", source: "Site",
        },
    });
    const antes = await prisma.deal.count({ where: { status: "open" } });
    await upsertDealByContact({ userId, name: "Carlos", email: "carlos@x.com", phone: "11995556666", source: "Blog" });
    const depois = await prisma.deal.count({ where: { status: "open" } });
    const ok7 = antes === 2 && depois === 1;
    console.log(`${ok7 ? "PASS" : "FALHOU"}  ${"card duplicado do legado é unificado na entrada".padEnd(52)} antes=${antes} depois=${depois}`);
    allOk = ok7 && allOk;

    console.log(allOk ? "\nTODOS OS CENÁRIOS PASSARAM" : "\nHÁ CENÁRIO FALHANDO");
    await prisma.$disconnect();
    process.exit(allOk ? 0 : 1);
}

main();
