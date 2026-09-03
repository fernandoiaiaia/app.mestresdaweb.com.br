// Remove um lead de teste que entrou pelo Connech, com o contato e o negócio que o
// Connech criou via POST /api/leads/public/full. As regras onDelete do Prisma apagam
// em cascata os deals/notas/arquivos/cadências/contatos do cliente e zeram a FK
// (SetNull) de Proposal/AssembledProposal/WhatsappContact/Task, que sobrevivem.
//
// Trava de segurança: só remove contato de origem Connech (pelo source do próprio
// contato ou por ter negócio marcado assim). Um homônimo vindo de outro canal é
// listado e ignorado.
//
// Atenção: apagar o Deal aqui NÃO apaga a Opportunity no Connech. Ela fica com o
// crmDealId apontando para um negócio inexistente e nunca mais aceita escopo — o
// webhook responde DEAL_NOT_FOUND. O script lista os ids para conferência.
//
// Uso (dentro do container da API):
//   node scripts/delete-connech-test-lead.cjs            (dry run, não grava nada)
//   node scripts/delete-connech-test-lead.cjs --apply    (aplica)
//   node scripts/delete-connech-test-lead.cjs --name="Outro Nome"

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const DRY_RUN = !process.argv.includes("--apply");
const nameArg = process.argv.find((a) => a.startsWith("--name="));
const NAME = nameArg ? nameArg.slice("--name=".length) : "Fernando Cesar Ferreira da Cunha";

/** Mesmo critério do AssemblerService.isConnechDeal(). */
function isConnechDeal(deal) {
    if (deal.source && deal.source.trim().toLowerCase() === "connech") return true;
    return (deal.tags || []).some((t) => t.trim().toLowerCase() === "connech");
}

async function main() {
    console.log(`\n══ ${DRY_RUN ? "DRY RUN — " : ""}Remoção de lead de teste do Connech ══`);
    console.log(`Nome procurado: "${NAME}"\n`);

    const candidates = await prisma.client.findMany({
        where: { name: { contains: NAME, mode: "insensitive" } },
        include: {
            deals: { select: { id: true, title: true, source: true, tags: true, status: true } },
            contacts: { select: { id: true } },
        },
    });

    const clients = candidates.filter(
        (c) => (c.source || "").trim().toLowerCase() === "connech" || c.deals.some(isConnechDeal),
    );

    const skipped = candidates.length - clients.length;
    if (skipped > 0) {
        console.log(`${skipped} contato(s) com esse nome ignorado(s) — não têm origem Connech.\n`);
    }
    if (clients.length === 0) {
        console.log("Nenhum contato do Connech corresponde. Nada a fazer.\n");
        return;
    }
    if (clients.length > 1) {
        console.log(`ATENÇÃO: ${clients.length} contatos correspondem. Confira a lista antes de aplicar.\n`);
    }

    for (const c of clients) {
        const dealIds = c.deals.map((d) => d.id);

        console.log("─".repeat(70));
        console.log(`${DRY_RUN ? "Seria removido" : "Removendo"}: cliente ${c.id} "${c.name}" <${c.email || "sem e-mail"}>`);
        console.log(`    tel: ${c.phone || "—"}   origem: ${c.source || "—"}`);

        console.log(`\n  Apagados em cascata:`);
        for (const d of c.deals) {
            console.log(`    negócio ${d.id} "${d.title}" [${d.status}] origem: ${d.source} tags: ${(d.tags || []).join(", ") || "—"}`);
        }
        console.log(`    ${c.contacts.length} contato(s) adicional(is)`);

        if (dealIds.length > 0) {
            const [notes, files, cadences] = await Promise.all([
                prisma.dealNote.count({ where: { dealId: { in: dealIds } } }),
                prisma.dealFile.count({ where: { dealId: { in: dealIds } } }),
                prisma.salesCadenceExecution.count({ where: { dealId: { in: dealIds } } }),
            ]);
            console.log(`    ${notes} nota(s), ${files} arquivo(s), ${cadences} cadência(s)`);
        }

        const [proposals, tasks, whatsapp] = await Promise.all([
            prisma.assembledProposal.count({ where: { clientId: c.id } }),
            prisma.task.count({ where: { clientId: c.id } }),
            prisma.whatsappContact.count({ where: { clientId: c.id } }),
        ]);
        console.log(`\n  Preservados, porém desvinculados:`);
        console.log(`    ${proposals} proposta(s) do Montador, ${tasks} tarefa(s), ${whatsapp} contato(s) de WhatsApp`);

        if (dealIds.length > 0) {
            console.log(`\n  No Connech, as oportunidades com estes crmDealId ficarão órfãs:`);
            for (const id of dealIds) console.log(`    ${id}`);
        }
        console.log("");

        if (!DRY_RUN) {
            await prisma.client.delete({ where: { id: c.id } });
        }
    }

    console.log("─".repeat(70));
    console.log(
        DRY_RUN
            ? "\nDry run concluído — nada foi gravado. Rode com --apply para aplicar.\n"
            : `\nRemoção concluída: ${clients.length} contato(s).\n`,
    );
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
