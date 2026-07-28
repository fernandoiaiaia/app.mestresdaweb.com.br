// Read-only audit of contract_templates — lists every row so we can tell whether
// the 3 templates (dev/hospedagem/suporte) already exist and why they might not
// be showing up on /dashboard/contracts/templates. Never writes.
//
// Usage (inside the API container):
//   node scripts/audit-contract-templates.cjs

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const total = await prisma.contractTemplate.count();
    console.log(`\n══ Auditoria contract_templates ══`);
    console.log(`Total de linhas na tabela: ${total}\n`);

    if (total === 0) {
        console.log("Tabela vazia — nenhum template existe no banco desta API. Precisa criar do zero.");
    } else {
        const rows = await prisma.contractTemplate.findMany({ orderBy: { createdAt: "desc" } });
        for (const r of rows) {
            console.log(`  id: ${r.id}`);
            console.log(`  nome: "${r.name}"`);
            console.log(`  status: ${r.status}`);
            console.log(`  criado em: ${r.createdAt.toISOString()}`);
            console.log(`  tamanho do content: ${r.content.length} chars`);
            console.log("  ---");
        }
    }

    console.log("\nFim da auditoria (somente leitura).\n");
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
