// Read-only audit of every CRM "settings" lookup table covered by migrateSettingsToOwner
// (Fontes, Produtos, Motivos de Perda, Segmentos, Objeções, Condições de Pagamento,
// Checklist). For each table shows: total rows, how many belong to the resolved OWNER,
// and how many are "stale" (belong to someone else) — pinpoints whether a page is empty
// because the table has no data at all, or because rows exist under the wrong userId.
//
// Usage (inside the API container):
//   node scripts/audit-crm-settings-tables.cjs

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function getOwnerUserId() {
    const owner = await prisma.user.findFirst({
        where: { role: "OWNER", active: true }, select: { id: true }, orderBy: { createdAt: "asc" },
    });
    if (owner) return owner.id;
    const admin = await prisma.user.findFirst({
        where: { role: "ADMIN", active: true }, select: { id: true }, orderBy: { createdAt: "asc" },
    });
    return admin?.id ?? null;
}

const TABLES = [
    ["lossReason", "Motivos de Perda"],
    ["productCategory", "Categorias de Produto"],
    ["product", "Produtos"],
    ["sourceType", "Tipos de Fonte"],
    ["source", "Fontes"],
    ["sourceCampaign", "Campanhas de Fonte"],
    ["segment", "Segmentos"],
    ["objectionCategory", "Categorias de Objeção"],
    ["objection", "Objeções"],
    ["paymentCondition", "Condições de Pagamento"],
    ["checklistCategory", "Categorias de Checklist"],
    ["checklistQuestion", "Perguntas de Checklist"],
];

async function main() {
    const ownerId = await getOwnerUserId();
    console.log(`\n══ Auditoria de tabelas CRM/settings ══`);
    console.log(`Owner resolvido: ${ownerId || "(nenhum OWNER/ADMIN ativo encontrado!)"}\n`);

    for (const [model, label] of TABLES) {
        const total = await prisma[model].count();
        const ownerCount = ownerId ? await prisma[model].count({ where: { userId: ownerId } }) : 0;
        const distinctUsers = await prisma[model].findMany({ distinct: ["userId"], select: { userId: true } });
        const stale = total - ownerCount;
        const flag = total === 0 ? "(tabela vazia — nunca teve dado)" : stale > 0 ? "⚠ TEM DADO ÓRFÃO" : "✓ ok";
        console.log(
            `${label.padEnd(24)} total=${String(total).padEnd(4)} do owner=${String(ownerCount).padEnd(4)} ` +
            `de outros=${String(stale).padEnd(4)} donos distintos=${distinctUsers.length}  ${flag}`
        );
    }

    console.log("\nFim da auditoria (somente leitura).\n");
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
