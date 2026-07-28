// Read-only: finds clusters of Client records that are almost certainly the same real
// person (same last-10-digit phone suffix, or same e-mail) but ended up as separate rows —
// each with its own Deal — due to the dedup bug in upsertDealByContact (now fixed for future
// conversions). Never writes; just reports so a human can decide how to merge each cluster.
//
// Usage (inside the API container):
//   node scripts/find-duplicate-leads.cjs

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function phoneSuffix(phone) {
    if (!phone) return null;
    const digits = String(phone).replace(/\D/g, "");
    return digits.length >= 8 ? digits.slice(-10) : null;
}

function normalizeEmail(email) {
    if (!email) return null;
    return String(email).trim().toLowerCase();
}

async function main() {
    const clients = await prisma.client.findMany({
        select: {
            id: true, name: true, email: true, phone: true, createdAt: true,
            deals: { select: { id: true, title: true, status: true, stageId: true, createdAt: true, value: true } },
        },
        orderBy: { createdAt: "asc" },
    });

    const byPhone = new Map();
    const byEmail = new Map();
    for (const c of clients) {
        const suf = phoneSuffix(c.phone);
        if (suf) {
            if (!byPhone.has(suf)) byPhone.set(suf, []);
            byPhone.get(suf).push(c);
        }
        const email = normalizeEmail(c.email);
        if (email) {
            if (!byEmail.has(email)) byEmail.set(email, []);
            byEmail.get(email).push(c);
        }
    }

    const clusterKeys = new Set();
    const clusters = [];
    for (const [key, group] of [...byPhone.entries(), ...byEmail.entries()]) {
        if (group.length < 2) continue;
        const ids = group.map((c) => c.id).sort().join(",");
        if (clusterKeys.has(ids)) continue;
        clusterKeys.add(ids);
        clusters.push({ key, group });
    }

    console.log(`\n══ Leads duplicados (mesmo telefone/e-mail, clientes separados) ══`);
    console.log(`Total de clientes: ${clients.length}`);
    console.log(`Clusters encontrados: ${clusters.length}\n`);

    let totalExtraDeals = 0;
    for (const { key, group } of clusters) {
        const totalDeals = group.reduce((s, c) => s + c.deals.length, 0);
        totalExtraDeals += Math.max(0, totalDeals - 1);
        console.log(`— chave: ${key}  (${group.length} clientes, ${totalDeals} negócios)`);
        for (const c of group) {
            console.log(`    cliente ${c.id.slice(0, 8)}  "${c.name}"  ${c.email || "sem e-mail"}  ${c.phone || "sem telefone"}  criado ${c.createdAt.toISOString().slice(0, 10)}`);
            for (const d of c.deals) {
                console.log(`        negócio ${d.id.slice(0, 8)}  "${d.title}"  [${d.status}]  R$ ${d.value}  criado ${d.createdAt.toISOString().slice(0, 10)}`);
            }
        }
        console.log("");
    }

    console.log(`Negócios "a mais" que provavelmente deveriam ser 1 só (soma por cluster - 1): ${totalExtraDeals}`);
    console.log("\nFim (somente leitura — nada foi alterado). Decida manualmente como mesclar cada cluster.\n");
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
