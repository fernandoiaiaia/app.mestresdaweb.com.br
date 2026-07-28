// Merges the 10 HIGH-CONFIDENCE duplicate-lead clusters identified from
// find-duplicate-leads.cjs's output (manually reviewed — same name/e-mail, unambiguous).
// Ambiguous clusters (different names sharing only a phone/e-mail) are intentionally
// NOT touched here.
//
// For each cluster:
//   1. Picks a survivor Deal: prefers "open" status (highest value, then most recent);
//      falls back to highest value / most recent among "lost" deals if none is open.
//   2. Reassigns every child record (DealNote, DealFile, Task, Contract, AssembledProposal,
//      ClientContact, Proposal, WhatsappContact) from the redundant deals/clients onto the
//      survivor BEFORE deleting anything — nothing is lost to a cascade delete.
//   3. Appends a DealNote on the survivor summarizing what was merged in (ids, values,
//      status) so the merge is auditable from the CRM's own Histórico tab.
//   4. Deletes the redundant deals, then the redundant clients.
//
// Usage (inside the API container):
//   node scripts/merge-duplicate-leads.cjs             (dry run — prints the plan, no writes)
//   node scripts/merge-duplicate-leads.cjs --apply     (writes changes, one DB transaction per cluster)

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const DRY_RUN = !process.argv.includes("--apply");

// [type, key] — exactly the 10 clusters reviewed and approved as high-confidence merges.
const CLUSTERS = [
    ["phone", "8984577837"],              // Nicolas Brenner
    ["phone", "1986084658"],              // Hikelvi Hallison
    ["phone", "7996123729"],              // Hercules
    ["phone", "1963271836"],              // Vinicius Dantas
    ["phone", "5511973430"],              // Kauan (e-mails differ by a typo'd leading letter)
    ["email", "isaac128@gmail.com"],      // Isaac
    ["email", "dani.emile@icloud.com"],   // Danielli Cury / Dani Emile
    ["email", "manoelfelizardo443@gmail.com"], // Manoel Felizardo
    ["email", "ronielsonaraujoo748@gmail.com"], // Ronielson Araujoo
    ["email", "gabriel2013raull@gmail.com"],    // Gabriel Raul
];

function phoneSuffix(phone) {
    if (!phone) return null;
    const digits = String(phone).replace(/\D/g, "");
    return digits.length >= 8 ? digits.slice(-10) : null;
}
function normalizeEmail(email) {
    return email ? String(email).trim().toLowerCase() : null;
}
const brl = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

async function findClusterMembers(type, key) {
    const all = await prisma.client.findMany({
        select: {
            id: true, name: true, email: true, phone: true, createdAt: true, userId: true,
            deals: { select: { id: true, title: true, status: true, value: true, createdAt: true } },
        },
    });
    return type === "phone"
        ? all.filter((c) => phoneSuffix(c.phone) === key)
        : all.filter((c) => normalizeEmail(c.email) === key);
}

function pickSurvivorDeal(deals) {
    const open = deals.filter((d) => d.status === "open");
    const pool = open.length > 0 ? open : deals;
    return [...pool].sort((a, b) => {
        if (b.value !== a.value) return b.value - a.value;
        return new Date(b.createdAt) - new Date(a.createdAt);
    })[0];
}

async function mergeCluster(type, key) {
    const clients = await findClusterMembers(type, key);
    if (clients.length < 2) {
        console.log(`— [${key}] só ${clients.length} cliente encontrado agora (já mesclado ou mudou) — pulando.`);
        return;
    }

    const allDeals = clients.flatMap((c) => c.deals.map((d) => ({ ...d, clientId: c.id })));
    if (allDeals.length === 0) {
        console.log(`— [${key}] nenhum negócio entre os clientes — pulando (nada pra mesclar).`);
        return;
    }

    const survivorDeal = pickSurvivorDeal(allDeals);
    const survivorClientId = survivorDeal.clientId;
    const survivorClient = clients.find((c) => c.id === survivorClientId);
    const redundantClients = clients.filter((c) => c.id !== survivorClientId);
    const redundantDeals = allDeals.filter((d) => d.id !== survivorDeal.id);

    console.log(`\n— [${key}] ${clients.length} clientes, ${allDeals.length} negócios`);
    console.log(`  sobrevivente: cliente ${survivorClient.id} "${survivorClient.name}" / negócio ${survivorDeal.id} "${survivorDeal.title}" [${survivorDeal.status}] ${brl(survivorDeal.value)}`);
    for (const d of redundantDeals) {
        console.log(`  ${DRY_RUN ? "seria removido" : "removendo"}: negócio ${d.id} "${d.title}" [${d.status}] ${brl(d.value)} (cliente ${d.clientId})`);
    }
    for (const c of redundantClients) {
        console.log(`  ${DRY_RUN ? "cliente redundante seria removido" : "removendo cliente redundante"}: ${c.id} "${c.name}" ${c.email || "sem e-mail"} (após realocar contatos/propostas/tarefas/WhatsApp)`);
    }

    if (DRY_RUN) return;

    const mergeSummaryLines = redundantDeals.map(
        (d) => `- "${d.title}" [${d.status}] ${brl(d.value)}, criado ${d.createdAt.toISOString().slice(0, 10)} (negócio ${d.id})`
    );

    await prisma.$transaction(async (tx) => {
        // Reassign every child record of each redundant deal onto the survivor deal
        for (const d of redundantDeals) {
            await tx.dealNote.updateMany({ where: { dealId: d.id }, data: { dealId: survivorDeal.id } });
            await tx.dealFile.updateMany({ where: { dealId: d.id }, data: { dealId: survivorDeal.id } });
            await tx.task.updateMany({ where: { dealId: d.id }, data: { dealId: survivorDeal.id } });
            await tx.contract.updateMany({ where: { dealId: d.id }, data: { dealId: survivorDeal.id } });
            await tx.assembledProposal.updateMany({ where: { dealId: d.id }, data: { dealId: survivorDeal.id } });
            await tx.deal.delete({ where: { id: d.id } });
        }

        // Reassign every child record of each redundant client onto the survivor client
        const survivorWA = await tx.whatsappContact.findUnique({ where: { clientId: survivorClientId } });
        for (const c of redundantClients) {
            await tx.clientContact.updateMany({ where: { clientId: c.id }, data: { clientId: survivorClientId } });
            await tx.proposal.updateMany({ where: { clientId: c.id }, data: { clientId: survivorClientId } });
            await tx.assembledProposal.updateMany({ where: { clientId: c.id }, data: { clientId: survivorClientId } });
            await tx.task.updateMany({ where: { clientId: c.id }, data: { clientId: survivorClientId } });

            const rcWA = await tx.whatsappContact.findUnique({ where: { clientId: c.id } });
            if (rcWA && !survivorWA) {
                await tx.whatsappContact.update({ where: { id: rcWA.id }, data: { clientId: survivorClientId } });
            } else if (rcWA && survivorWA) {
                console.log(`  ⚠ conflito: cliente redundante ${c.id} tinha contato WhatsApp próprio (${rcWA.id}); sobrevivente já tem um — o contato do redundante ficará sem cliente vinculado.`);
            }

            await tx.client.delete({ where: { id: c.id } });
        }

        // Audit trail, visible in the CRM's own Histórico tab
        await tx.dealNote.create({
            data: {
                dealId: survivorDeal.id,
                userId: survivorClient.userId,
                content: `**Deduplicação automática**\nMesclado com ${redundantDeals.length} negócio(s) duplicado(s) do mesmo lead:\n${mergeSummaryLines.join("\n")}`,
                type: "system_event",
            },
        });
    });

    console.log(`  ✓ mesclado.`);
}

async function main() {
    console.log(`\n══ ${DRY_RUN ? "DRY RUN — " : ""}Fusão de leads duplicados (${CLUSTERS.length} clusters) ══`);
    for (const [type, key] of CLUSTERS) {
        await mergeCluster(type, key);
    }
    console.log(DRY_RUN ? "\nDry run concluído — nada foi gravado. Rode com --apply para aplicar.\n" : "\nFusão concluída.\n");
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
