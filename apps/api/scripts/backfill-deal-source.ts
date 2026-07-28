import { PrismaClient } from "@prisma/client";
import { classifySourceLabel, extractConversionUrlValues } from "../src/modules/deals/deals.source-classifier.js";

// Reclassifies Deal.source from the tracked conversion URL recorded in each deal's notes
// ("URL de conversão:" / "Dados da URL:"), matching the rule described for the CRM "Fonte" field.
// Only touches deals that have at least one note carrying that data — deals without any
// conversion-URL note (WhatsApp, manual creation, imports, webhooks) are left untouched.
//
// Usage:
//   pnpm --filter api exec tsx scripts/backfill-deal-source.ts             (dry run, no writes)
//   pnpm --filter api exec tsx scripts/backfill-deal-source.ts --apply     (writes changes)

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
                orderBy: { createdAt: "asc" }, // oldest first = first-touch attribution
            },
        },
    });

    let withSignal = 0;
    let changed = 0;
    let skippedNoSignal = 0;
    const countsByLabel: Record<string, number> = {};

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
