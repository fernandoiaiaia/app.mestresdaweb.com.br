// Deletes the "Teste QA" clients/deals — placeholder phone 11999999999, clearly internal
// test data, not real leads (confirmed by user). Straight delete, no reassignment: nothing
// here is worth preserving. Prisma's onDelete rules cascade-delete each client's own
// deals/notes/files/contacts and SetNull anything else (Proposal/AssembledProposal/
// WhatsappContact/Task), which is fine for throwaway test rows.
//
// Usage (inside the API container):
//   node scripts/delete-test-leads.cjs           (dry run, no writes)
//   node scripts/delete-test-leads.cjs --apply   (writes changes)

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const DRY_RUN = !process.argv.includes("--apply");

const TEST_PHONE_SUFFIX = "1999999999";

function phoneSuffix(phone) {
    if (!phone) return null;
    const digits = String(phone).replace(/\D/g, "");
    return digits.length >= 8 ? digits.slice(-10) : null;
}

async function main() {
    const all = await prisma.client.findMany({
        select: {
            id: true, name: true, email: true, phone: true,
            deals: { select: { id: true, title: true } },
        },
    });
    const testClients = all.filter((c) => phoneSuffix(c.phone) === TEST_PHONE_SUFFIX);

    console.log(`\n══ ${DRY_RUN ? "DRY RUN — " : ""}Remoção de leads de teste (telefone ${TEST_PHONE_SUFFIX}) ══`);
    console.log(`Encontrados: ${testClients.length}\n`);

    for (const c of testClients) {
        console.log(`${DRY_RUN ? "Seria removido" : "Removendo"}: cliente ${c.id} "${c.name}" ${c.email}`);
        for (const d of c.deals) console.log(`    negócio ${d.id} "${d.title}"`);
        if (!DRY_RUN) {
            await prisma.client.delete({ where: { id: c.id } });
        }
    }

    console.log(DRY_RUN ? "\nDry run concluído — nada foi gravado. Rode com --apply para aplicar.\n" : "\nRemoção concluída.\n");
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
