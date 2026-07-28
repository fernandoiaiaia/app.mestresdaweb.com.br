// Recomputes the "Resultado previsto no mês" header straight from the database,
// with a full row-level breakdown, so divergences between the screen and the
// expected sums can be pinpointed. Read-only — never writes.
//
// Usage (inside the API container):
//   node scripts/audit-resultado-previsto.cjs                  (current month)
//   node scripts/audit-resultado-previsto.cjs --month=7 --year=2026
//   node scripts/audit-resultado-previsto.cjs --month=7 --year=2026 --rows   (also lists every row)

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function arg(name, fallback) {
    const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
    return hit ? hit.split("=")[1] : fallback;
}

const now = new Date();
const month = parseInt(arg("month", String(now.getMonth() + 1)), 10);
const year = parseInt(arg("year", String(now.getFullYear())), 10);
const showRows = process.argv.includes("--rows");

const FALLBACK_INCOME = new Set(["Recebimentos", "MRR", "Entregas"]);

const brl = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

async function main() {
    // Same UTC dueDate bucket the API list endpoint uses
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const [transactions, types] = await Promise.all([
        prisma.transaction.findMany({
            where: { dueDate: { gte: startDate, lte: endDate } },
            orderBy: { dueDate: "asc" },
        }),
        prisma.transactionType.findMany({ distinct: ["name"], orderBy: { createdAt: "desc" } }),
    ]);

    console.log(`\n══ Auditoria Resultado Previsto — ${String(month).padStart(2, "0")}/${year} ══`);
    console.log(`Janela (dueDate UTC): ${startDate.toISOString()} .. ${endDate.toISOString()}`);
    console.log(`Transações no mês: ${transactions.length}\n`);

    // ── Nature lookup (mirrors the frontend logic) ──────────────────────────
    const incomeNames = new Set(FALLBACK_INCOME);
    for (const t of types) {
        if (t.nature === "income") incomeNames.add(t.name);
        else incomeNames.delete(t.name);
    }
    const registered = new Map(types.map((t) => [t.name, t.nature]));
    const isReceita = (tg) => incomeNames.has(tg);

    console.log("── Tipos de lançamento cadastrados (distinct por nome, mais recente vence) ──");
    for (const t of types) {
        console.log(`  ${t.nature === "income" ? "RECEITA " : "DESPESA "} ${t.name}${t.active ? "" : "  [INATIVO]"}`);
    }

    // ── Per-typeGroup breakdown ─────────────────────────────────────────────
    const groups = new Map();
    for (const t of transactions) {
        const g = groups.get(t.typeGroup) || { count: 0, sum: 0, paid: 0, pendency: 0, pendencySum: 0 };
        g.count += 1;
        g.sum += t.value || 0;
        if (t.status === "Pago") g.paid += t.value || 0;
        if (t.pendency) { g.pendency += 1; g.pendencySum += t.value || 0; }
        groups.set(t.typeGroup, g);
    }

    console.log("\n── Somatória por tipo (typeGroup, valores brutos do banco) ──");
    for (const [name, g] of [...groups.entries()].sort((a, b) => b[1].sum - a[1].sum)) {
        const nature = name === "Transferência" ? "EXCLUÍDO" : (isReceita(name) ? "RECEITA" : "DESPESA");
        const source = name === "Transferência" ? "transferência não conta no resultado"
            : registered.has(name) ? "cadastro"
            : (FALLBACK_INCOME.has(name) ? "fallback" : "NÃO CADASTRADO → tratado como despesa");
        console.log(`  [${nature}] ${name}: ${g.count}x  total ${brl(g.sum)}  pago ${brl(g.paid)}  pendência ${g.pendency}x ${brl(g.pendencySum)}  (${source})`);
    }

    // ── Header numbers exactly as the frontend computes them ───────────────
    // Regras atuais: pendência fora; Transferência fora; soma por magnitude (Math.abs)
    const counts = (t) => !t.pendency && t.typeGroup !== "Transferência";
    const receitas = transactions.filter((t) => counts(t) && isReceita(t.typeGroup));
    const despesas = transactions.filter((t) => counts(t) && !isReceita(t.typeGroup));
    const totalRecebimentosPrevisto = receitas.reduce((a, t) => a + Math.abs(t.value || 0), 0);
    const recebimentosPagos = receitas.filter((t) => t.status === "Pago").reduce((a, t) => a + Math.abs(t.value || 0), 0);
    const totalDespesasPrevisto = despesas.reduce((a, t) => a + Math.abs(t.value || 0), 0);
    const despesasPagas = despesas.filter((t) => t.status === "Pago").reduce((a, t) => a + Math.abs(t.value || 0), 0);

    console.log("\n── Header recalculado (regra atual do frontend) ──");
    console.log(`  Recebimentos previsto: ${brl(totalRecebimentosPrevisto)}   recebido: ${brl(recebimentosPagos)}`);
    console.log(`  Despesas previsto:     ${brl(totalDespesasPrevisto)}   pago:     ${brl(despesasPagas)}`);
    console.log(`  Resultado previsto:    ${brl(totalRecebimentosPrevisto - totalDespesasPrevisto)}`);
    console.log(`  Saldo atual:           ${brl(recebimentosPagos - despesasPagas)}`);

    // ── Suspicious rows ─────────────────────────────────────────────────────
    const negativeRows = transactions.filter((t) => (t.value || 0) < 0);
    if (negativeRows.length) {
        console.log(`\n⚠ Lançamentos com VALOR NEGATIVO no banco (gerados automaticamente; o header usa o valor absoluto): ${negativeRows.length}`);
        for (const t of negativeRows.slice(0, 15)) {
            console.log(`  ${t.dueDate.toISOString().slice(0, 10)}  ${brl(t.value)}  ${t.typeGroup}  [${t.status}]  "${t.description}"`);
        }
    }

    const transferRows = transactions.filter((t) => t.typeGroup === "Transferência");
    if (transferRows.length) {
        console.log(`\n── Transferências no mês (fora do cálculo): ${transferRows.length}x  total ${brl(transferRows.reduce((a, t) => a + Math.abs(t.value || 0), 0))} ──`);
        for (const t of transferRows.slice(0, 15)) {
            console.log(`  ${t.dueDate.toISOString().slice(0, 10)}  ${brl(t.value)}  [${t.status}]  "${t.description}"`);
        }
    }

    const unknownTypes = [...groups.keys()].filter((g) => !registered.has(g) && !FALLBACK_INCOME.has(g) && g !== "Transferência");
    if (unknownTypes.length) {
        console.log(`\n⚠ Tipos usados em transações mas SEM cadastro em transaction_types (caem como despesa): ${unknownTypes.join(", ")}`);
    }

    const byKey = new Map();
    for (const t of transactions) {
        const key = `${t.description}|${t.value}|${t.dueDate.toISOString()}`;
        byKey.set(key, (byKey.get(key) || []).concat(t));
    }
    const dupes = [...byKey.values()].filter((rows) => rows.length > 1);
    if (dupes.length) {
        console.log(`\n⚠ Possíveis DUPLICATAS (mesma descrição + valor + vencimento): ${dupes.length} grupo(s)`);
        for (const rows of dupes.slice(0, 15)) {
            const t = rows[0];
            console.log(`  ${rows.length}x  ${t.dueDate.toISOString().slice(0, 10)}  ${brl(t.value)}  ${t.typeGroup}  "${t.description}"  ids: ${rows.map((r) => r.id.slice(0, 8)).join(", ")}`);
        }
        const dupeExcess = dupes.reduce((a, rows) => a + (rows.length - 1) * (rows[0].value || 0), 0);
        console.log(`  Valor somado a mais por duplicatas (aprox.): ${brl(dupeExcess)}`);
    } else {
        console.log("\n✓ Nenhuma duplicata (descrição+valor+vencimento) no mês.");
    }

    const pendencyRows = transactions.filter((t) => t.pendency);
    if (pendencyRows.length) {
        console.log(`\n── Pendências no mês (fora do cálculo): ${pendencyRows.length}x  total ${brl(pendencyRows.reduce((a, t) => a + t.value, 0))} ──`);
        for (const t of pendencyRows.slice(0, 15)) {
            console.log(`  ${t.dueDate.toISOString().slice(0, 10)}  ${brl(t.value)}  ${t.typeGroup}  [${t.status}]  "${t.description}"`);
        }
    }

    if (showRows) {
        console.log("\n── Todas as transações do mês ──");
        for (const t of transactions) {
            console.log(`  ${t.dueDate.toISOString().slice(0, 10)}  ${brl(t.value).padStart(15)}  ${(isReceita(t.typeGroup) ? "R" : "D")}  [${t.status}${t.pendency ? "/PENDÊNCIA" : ""}]  ${t.typeGroup}  "${t.description}"${t.installment ? `  (parcela ${t.installment})` : ""}${t.parentId ? "  (recorrente)" : ""}`);
        }
    }

    console.log("\nFim da auditoria (somente leitura — nada foi alterado). Use --rows para listar linha a linha.\n");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
