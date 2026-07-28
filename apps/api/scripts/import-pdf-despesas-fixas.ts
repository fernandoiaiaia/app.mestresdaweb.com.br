import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const despesasData = [
  { 
    nome: "Aluguel + IPTU + Garagem", typeGroup: "Despesas fixas", category: "Aluguel / Condomínio",
    valores: [16727.42, 9000.00, 9000.00, 9000.00, 9000.00, 9000.00, 9000.00, 9000.00, 9000.00, 9000.00, 9000.00, 9000.00, 9000.00]
  },
  { nome: "Luz", typeGroup: "Despesas fixas", category: "Aluguel / Condomínio", valores: Array(13).fill(600) },
  { nome: "ClickSing", typeGroup: "Despesas fixas", category: "Software / SaaS", valores: Array(13).fill(80) },
  { nome: "Monitoramento Prédio", typeGroup: "Despesas fixas", category: "Aluguel / Condomínio", valores: [204.50, 103, 103, 103, 103, 103, 103, 103, 103, 103, 103, 103, 103] },
  { nome: "Seguro Incêndio", typeGroup: "Despesas fixas", category: "Aluguel / Condomínio", valores: Array(13).fill(121.99) },
  { nome: "Café, filtro e açúcar", typeGroup: "Despesas fixas", category: "Outras Despesas Fixas", valores: Array(13).fill(150) },
  { nome: "Internet - Vivo", typeGroup: "Despesas fixas", category: "Telefonia / Internet", valores: Array(13).fill(150) },
  { nome: "Internet - Giga+", typeGroup: "Despesas fixas", category: "Telefonia / Internet", valores: Array(13).fill(135.35) },
  { nome: "Google", typeGroup: "Despesas fixas", category: "Software / SaaS", valores: Array(13).fill(6000) },
  { nome: "Facebook", typeGroup: "Despesas fixas", category: "Software / SaaS", valores: Array(13).fill(1400) },
  { nome: "Adobe", typeGroup: "Despesas fixas", category: "Software / SaaS", valores: Array(13).fill(189) },
  { nome: "Digital Ocean", typeGroup: "Despesas fixas", category: "Infraestrutura / Cloud", valores: [8508.31, 9000, 9000, 9000, 9000, 9000, 9000, 9000, 9000, 9000, 9000, 9000, 9000] },
  { nome: "Produtos de Limpeza", typeGroup: "Despesas fixas", category: "Outras Despesas Fixas", valores: Array(13).fill(400) },
  { nome: "Netlify", typeGroup: "Despesas fixas", category: "Infraestrutura / Cloud", valores: Array(13).fill(1900) },
  { nome: "Recargas Chip", typeGroup: "Despesas fixas", category: "Telefonia / Internet", valores: Array(13).fill(60) },
  { nome: "DAS", typeGroup: "Impostos", category: "DAS (Simples Nacional)", valores: [10000, 12000, 14000, 14000, 14000, 14000, 14000, 14000, 14000, 14000, 14000, 14000, 14000] },
  { nome: "Canva", typeGroup: "Despesas fixas", category: "Software / SaaS", valores: Array(13).fill(35) },
  { nome: "Livelo Club", typeGroup: "Despesas fixas", category: "Outras Despesas Fixas", valores: Array(13).fill(44.90) },
  { nome: "Starlink", typeGroup: "Despesas fixas", category: "Telefonia / Internet", valores: Array(13).fill(500) }
];

async function main() {
    console.log("Iniciando importação de Despesas Fixas...");
    
    let user = await prisma.user.findFirst({ where: { role: 'OWNER' } });
    if (!user) user = await prisma.user.findFirst();
    
    if (!user) {
        console.error("Nenhum usuário encontrado na base de dados.");
        return;
    }
    
    const userId = user.id;
    console.log(`Usuário selecionado: ${user.name} (${user.id})`);

    let companiesCreated = 0;
    let transactionsCreated = 0;

    for (const despesa of despesasData) {
        // Garantir que a "empresa/fornecedor" existe
        let company = await prisma.company.findFirst({
            where: { name: despesa.nome, userId }
        });
        
        if (!company) {
            company = await prisma.company.create({
                data: {
                    name: despesa.nome,
                    userId,
                    status: 'active'
                }
            });
            companiesCreated++;
        }

        // Iterar os 13 meses: Junho 2026 a Junho 2027
        for (let offset = 0; offset < 13; offset++) {
            const currentYear = 2026 + Math.floor((5 + offset) / 12);
            const currentMonth = (5 + offset) % 12; // 0-indexed (5 = Junho)
            
            // Como o cliente não especificou o dia de vencimento na planilha, vamos usar o dia 10
            const dueDate = new Date(Date.UTC(currentYear, currentMonth, 10, 12, 0, 0));
            const valor = despesa.valores[offset];

            if (valor > 0) {
                await prisma.transaction.create({
                    data: {
                        userId,
                        description: `Pagamento Mensal - ${despesa.nome}`,
                        client: despesa.nome,
                        value: valor,
                        typeGroup: despesa.typeGroup,
                        category: despesa.category,
                        date: dueDate,
                        dueDate: dueDate,
                        status: "Previsto",
                        account: "Caixa Interno",
                        paymentMethod: "Boleto Bancário",
                        costCenter: "Administrativo", // Ajustado para Despesas Fixas
                        notes: "Importado via PDF.",
                        installment: `Mês ${offset + 1}/13`,
                        parentId: null, // Deixamos null para permitir edição flexível
                    }
                });
                transactionsCreated++;
            }
        }
        
        console.log(`Lançamentos mapeados para ${despesa.nome}.`);
    }

    console.log("Importação de Despesas Fixas concluída com sucesso!");
    console.log(`Empresas criadas: ${companiesCreated}`);
    console.log(`Transações geradas: ${transactionsCreated}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
