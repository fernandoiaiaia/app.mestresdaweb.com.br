// Plain CommonJS port of backfill-deal-source.ts for environments without tsx/ts-node
// (e.g. running directly inside the production container via `node`). Keep both files
// in sync if the classification rule changes.
//
// Usage (inside the API container):
//   node scripts/backfill-deal-source.cjs             (dry run, no writes)
//   node scripts/backfill-deal-source.cjs --apply      (writes changes)

const { PrismaClient } = require("@prisma/client");

const DEAL_SOURCE_GOOGLE_ADS = "Google Ads";
const DEAL_SOURCE_META_ADS = "Meta Ads (Facebook)";
const DEAL_SOURCE_ORGANIC = "Google Orgânico (SEO)";

const CONVERSION_URL_FIELD_REGEX = /(?:URL de convers[aã]o|Dados da URL)\s*:\s*(\S+)/gi;

function classifyTrackedUrl(rawValue) {
    if (!rawValue) return null;
    const trimmed = rawValue.trim();
    if (!trimmed || trimmed === "/") return null;

    let decoded;
    try {
        decoded = decodeURIComponent(trimmed);
    } catch {
        decoded = trimmed;
    }
    const lower = decoded.toLowerCase();

    const isGoogleAds =
        lower.includes("gclid=") ||
        lower.includes("gad_source=") ||
        lower.includes("gad_campaignid=") ||
        lower.includes("gbraid=") ||
        lower.includes("utm_source=googleads") ||
        lower.includes("utm_source=google");
    if (isGoogleAds) return DEAL_SOURCE_GOOGLE_ADS;

    const isMetaAds =
        lower.includes("fbclid=") ||
        lower.includes("utm_source=metaads") ||
        lower.includes("utm_source=meta") ||
        lower.includes("facebook") ||
        lower.includes("instagram");
    if (isMetaAds) return DEAL_SOURCE_META_ADS;

    return null;
}

function extractConversionUrlValues(content) {
    const values = [];
    const re = new RegExp(CONVERSION_URL_FIELD_REGEX);
    let match;
    while ((match = re.exec(content)) !== null) {
        values.push(match[1]);
    }
    return values;
}

function classifySourceLabel(values) {
    for (const value of values) {
        const label = classifyTrackedUrl(value);
        if (label) return label;
    }
    return DEAL_SOURCE_ORGANIC;
}

const prisma = new PrismaClient();
const DRY_RUN = !process.argv.includes("--apply");

async function main() {
    const deals = await prisma.deal.findMany({
        where: { notes: { some: {} } },
        select: {
            id: true,
            source: true,
            notes: {
                select: { content: true },
                orderBy: { createdAt: "asc" },
            },
        },
    });

    let withSignal = 0;
    let changed = 0;
    let skippedNoSignal = 0;
    const countsByLabel = {};

    for (const deal of deals) {
        const values = deal.notes.flatMap((note) => extractConversionUrlValues(note.content));
        if (values.length === 0) {
            skippedNoSignal++;
            continue;
        }

        withSignal++;
        const classified = classifySourceLabel(values);
        countsByLabel[classified] = (countsByLabel[classified] || 0) + 1;

        if (classified === deal.source) continue;

        changed++;
        console.log(`Deal ${deal.id}: "${deal.source}" -> "${classified}"`);

        if (!DRY_RUN) {
            await prisma.deal.update({ where: { id: deal.id }, data: { source: classified } });
        }
    }

    console.log(`\n${DRY_RUN ? "[DRY RUN] " : ""}Deals with a conversion-URL note: ${withSignal}`);
    console.log(`${DRY_RUN ? "Would update" : "Updated"}: ${changed}`);
    console.log(`Skipped (no conversion-URL note found): ${skippedNoSignal}`);
    console.log("Classified breakdown:", countsByLabel);

    if (DRY_RUN) {
        console.log("\nThis was a dry run — no data was changed. Re-run with --apply to write these changes.");
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
