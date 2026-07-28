// Backfills the Source catalog (settings/sources) so every "Fonte" value that is
// actually selectable/used shows up there for editing — today the pipeline/opportunity
// "Fonte" dropdowns are a hardcoded string list, disconnected from the Source table.
//
// This script:
//   1. Resolves the company OWNER (fallback ADMIN) — sources are universal/company-wide.
//   2. Ensures a default SourceType category exists to bucket these under.
//   3. Creates a Source row (skipping ones that already exist by name) for:
//      - every distinct non-empty Deal.source value currently in the database
//      - the historic hardcoded dropdown options, so they stay selectable going forward
//        even if no deal currently uses them
//
// Usage (inside the API container):
//   node scripts/backfill-sources-catalog.cjs           (dry run, no writes)
//   node scripts/backfill-sources-catalog.cjs --apply   (writes changes)

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const DRY_RUN = !process.argv.includes("--apply");

const HISTORIC_DROPDOWN_OPTIONS = [
    "Google Ads",
    "Instagram",
    "Indicação de Clientes",
    "Google Orgânico (SEO)",
    "LinkedIn",
    "Contato Direto (Site)",
    "Meta Ads (Facebook)",
    "Eventos & Webinars",
    "Website",
];

async function getOwnerUserId() {
    const owner = await prisma.user.findFirst({
        where: { role: "OWNER", active: true },
        select: { id: true },
        orderBy: { createdAt: "asc" },
    });
    if (owner) return owner.id;
    const admin = await prisma.user.findFirst({
        where: { role: "ADMIN", active: true },
        select: { id: true },
        orderBy: { createdAt: "asc" },
    });
    return admin?.id ?? null;
}

async function main() {
    const ownerId = await getOwnerUserId();
    if (!ownerId) {
        console.log("Nenhum OWNER/ADMIN ativo encontrado — abortando.");
        return;
    }
    console.log(`Owner resolvido: ${ownerId}\n`);

    const distinctDeals = await prisma.deal.findMany({
        select: { source: true },
        distinct: ["source"],
        where: { source: { not: "" } },
    });
    const dealSources = distinctDeals.map((d) => d.source).filter(Boolean);

    const allNames = Array.from(new Set([...dealSources, ...HISTORIC_DROPDOWN_OPTIONS])).sort();
    console.log(`Valores distintos a garantir (${allNames.length}):`, allNames.join(", "), "\n");

    const existing = await prisma.source.findMany({ where: { userId: ownerId }, select: { name: true } });
    const existingNames = new Set(existing.map((s) => s.name));

    const missing = allNames.filter((n) => !existingNames.has(n));
    console.log(`Já cadastradas: ${existingNames.size} | Faltando criar: ${missing.length}`);
    if (missing.length === 0) {
        console.log("Nada a fazer — todas já existem em Source.");
        return;
    }
    console.log("Faltando:", missing.join(", "), "\n");

    let typeId;
    const existingType = await prisma.sourceType.findFirst({ where: { userId: ownerId, name: "Geral" } });
    if (existingType) {
        typeId = existingType.id;
        console.log(`Usando SourceType existente "Geral" (${typeId})`);
    } else {
        console.log(`${DRY_RUN ? "[DRY RUN] Criaria" : "Criando"} SourceType "Geral"`);
        if (!DRY_RUN) {
            const created = await prisma.sourceType.create({
                data: { userId: ownerId, name: "Geral", emoji: "📈", color: "#22c55e" },
            });
            typeId = created.id;
        }
    }

    for (const name of missing) {
        console.log(`${DRY_RUN ? "[DRY RUN] Criaria" : "Criando"} Source "${name}"`);
        if (!DRY_RUN) {
            await prisma.source.create({
                data: { userId: ownerId, name, typeId, active: true },
            });
        }
    }

    console.log(`\n${DRY_RUN ? "Dry run concluído — nada foi gravado. Rode com --apply para aplicar." : "Backfill concluído."}`);
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
