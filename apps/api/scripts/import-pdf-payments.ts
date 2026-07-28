import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Data mapped directly from "Contas - NOVA MESTRES - Pagamentos Normais.pdf"
const paymentsData = [
  { empresa: "MaidSync", responsavel: "Patrícia Ventura", celular: "1 (908) 502-6348", email: "patyy_ventura@hotmail.com", vencimento: 20,
    meses: [15000.00, 15000.00, 15000.00, 15000.00, 15000.00, 15000.00, 15000.00, 15000.00] },
  { empresa: "iKids", responsavel: "Túlio Schuelter", celular: "55 11 95018-6623", email: "tulioschuelter@gmail.com", vencimento: 15,
    meses: [16903.71, 16903.71, 16903.71, 16903.71, 16903.71, 16903.71, 0, 0] },
  { empresa: "FitMax", responsavel: "Victor Mendes", celular: "55 35 9831-2341", email: "victrmendes@hotmail.com", vencimento: 15,
    meses: [15833.33, 0, 0, 0, 0, 0, 0, 0] },
  { empresa: "Mila", responsavel: "Edson da Silva", celular: "55 11 99763-5423", email: "adm@millacomercio.com.br", vencimento: 25,
    meses: [25000.00, 25000.00, 25000.00, 25000.00, 25000.00, 25000.00, 25000.00, 0] },
  { empresa: "BetterPeople", responsavel: "Leticia Martins", celular: "1 (862) 230-6537", email: "Leticiamartins2808@gmail.com", vencimento: 25, // default para 'x'
    meses: [4870.83, 0, 8283.33, 0, 0, 0, 0, 0] },
  { empresa: "Impulsse", responsavel: "Magno Gonçalves", celular: "55 31 9554-1717", email: "magno@impulsse.com.br", vencimento: 25,
    meses: [9818.27, 9818.27, 9818.27, 9818.33, 0, 0, 0, 0] },
];

async function main() {
    console.log("Iniciando importação de dados - Pagamentos Normais (Variáveis)...");
    
    let user = await prisma.user.findFirst({ where: { role: 'OWNER' } });
    if (!user) user = await prisma.user.findFirst();
    
    if (!user) {
        console.error("Nenhum usuário encontrado na base de dados.");
        return;
    }
    
    const userId = user.id;
    console.log(`Usuário selecionado: ${user.name} (${user.id})`);

    let companiesCreated = 0;
    let clientsCreated = 0;
    let transactionsCreated = 0;

    for (const data of paymentsData) {
        let company = await prisma.company.findFirst({
            where: { name: data.empresa, userId }
        });
        
        if (!company) {
            company = await prisma.company.create({
                data: {
                    name: data.empresa,
                    userId,
                    status: 'active'
                }
            });
            companiesCreated++;
            console.log(`Company criada: ${data.empresa}`);
        }

        let client = await prisma.client.findFirst({
            where: { email: data.email, userId }
        });
        
        if (!client && data.email) {
            client = await prisma.client.create({
                data: {
                    name: data.responsavel,
                    email: data.email,
                    phone: data.celular,
                    company: data.empresa,
                    companyId: company.id,
                    userId,
                    status: 'active'
                }
            });
            clientsCreated++;
            console.log(`Client criado: ${data.responsavel} (${data.empresa})`);
        }

        const parentId = uuidv4();
        
        for (let monthIndex = 0; monthIndex < 8; monthIndex++) {
            const valor = data.meses[monthIndex];
            
            // Só lança transação se o valor for maior que zero
            if (valor <= 0) continue;

            // Calcula a data: monthIndex 0 = Junho 2026, monthIndex 7 = Janeiro 2027
            // Usa 12:00:00 UTC para evitar que timezones alterem o dia.
            const dataBaseMesAno = new Date(Date.UTC(2026, 5 + monthIndex, data.vencimento, 12, 0, 0));

            await prisma.transaction.create({
                data: {
                    userId,
                    description: "Contrato de Desenvolvimento",
                    client: data.empresa,
                    value: valor,
                    typeGroup: "Recebimentos", // PDF lista como Recebimento
                    category: "Desenvolvimento / Code",
                    date: dataBaseMesAno,
                    dueDate: dataBaseMesAno,
                    status: "Previsto",
                    account: "Caixa Interno",
                    paymentMethod: "Boleto Bancário",
                    costCenter: "Comercial",
                    notes: `Importado via PDF.\nResponsável: ${data.responsavel}\nE-mail: ${data.email}\nCelular: ${data.celular}`,
                    installment: `Mês ${monthIndex + 1}/8`,
                    parentId: parentId, // Agrupa todas sob a mesma origem
                }
            });
            transactionsCreated++;
        }
        
        console.log(`Transações mapeadas geradas para ${data.empresa}`);
    }

    console.log("Importação concluída com sucesso!");
    console.log(`Empresas criadas: ${companiesCreated}`);
    console.log(`Clientes/Contatos criados: ${clientsCreated}`);
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
