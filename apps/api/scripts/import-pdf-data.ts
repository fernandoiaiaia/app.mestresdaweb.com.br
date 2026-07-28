import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const rawData = [
  { empresa: "Estimulos", responsavel: "Leticia Bringel", celular: "55 63 9965-4055", email: "leticiabringel2@gmail.com", valor: 30000.00 },
  { empresa: "INTP", responsavel: "Hilton Queiroz", celular: "55 27 99578-2206", email: "hilton@intp.com.br", valor: 40751.66 },
  { empresa: "Biagiotti", responsavel: "Elder Biagiotti", celular: "55 11 99661-6767", email: "Elder.b@biagiottifs.com.br", valor: 30164.00 },
  { empresa: "Biagiotti", responsavel: "Elder Biagiotti", celular: "55 11 99661-6767", email: "Elder.b@biagiottifs.com.br", valor: 55331.00 },
  { empresa: "Menu Doctor", responsavel: "Sérgio Brito", celular: "55 85 9926-9478", email: "sergiobritosaude@gmail.com", valor: 30000.00 },
  { empresa: "Qualit True", responsavel: "Raphael Vasconcelos", celular: "55 11 99303-3706", email: "Raphael@engenhariatrue.com.br", valor: 17962.03 },
  { empresa: "Qualit True", responsavel: "Raphael Vasconcelos", celular: "55 11 99303-3706", email: "Raphael@engenhariatrue.com.br", valor: 10720.00 },
  { empresa: "Protecin", responsavel: "Charles", celular: "55 11 98531-0960", email: "compras@protecin.com.br", valor: 2450.00 },
  { empresa: "Booat", responsavel: "Felipe Pontes", celular: "55 13 99100-1001", email: "ffelipe.pontes@hotmail.com", valor: 2889.60 },
  { empresa: "GeniusKlub", responsavel: "Bruno Pereira", celular: "55 11 91325-1977", email: "brunopesantos@hotmail.com", valor: 22894.40 },
  { empresa: "Law Hub", responsavel: "Henrique Forti", celular: "55 17 99607-3884", email: "hfesilvaa@gmail.com", valor: 45000.00 },
  { empresa: "Yuse", responsavel: "Katarine", celular: "55 61 9666-6440", email: "katarinesilva@hotmail.com", valor: 2999.80 },
];

function calculateNextDate(baseDate: Date, frequency: string, occurrences: number): Date {
    const nextDate = new Date(baseDate);
    switch (frequency) {
        case "Mensal":
            nextDate.setMonth(nextDate.getMonth() + occurrences);
            break;
    }
    return nextDate;
}

async function main() {
    console.log("Iniciando importação de dados...");
    
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

    for (const data of rawData) {
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
        
        const baseDate = new Date("2026-06-25T12:00:00.000Z"); 
        
        for (let i = 0; i < 12; i++) {
            const dueDate = calculateNextDate(baseDate, "Mensal", i);
            const isFirst = i === 0;

            await prisma.transaction.create({
                data: {
                    userId,
                    description: "Entrega Final",
                    client: data.empresa, 
                    value: data.valor,
                    typeGroup: "Entregas",
                    category: "Desenvolvimento / Code",
                    date: dueDate,
                    dueDate: dueDate,
                    status: "Previsto",
                    account: "Caixa Interno",
                    paymentMethod: "Boleto Bancário",
                    costCenter: "Comercial",
                    notes: `Importado via PDF.\nResponsável: ${data.responsavel}\nE-mail: ${data.email}\nCelular: ${data.celular}`,
                    installment: `Recorrente ${i + 1}`,
                    parentId: isFirst ? null : parentId,
                }
            });
            transactionsCreated++;
        }
        
        console.log(`Transações geradas para ${data.empresa} - Valor: ${data.valor}`);
    }

    console.log("Importação concluída com sucesso!");
    console.log(`Empresas criadas: ${companiesCreated}`);
    console.log(`Clientes/Contatos criados: ${clientsCreated}`);
    console.log(`Transações geradas: ${transactionsCreated} (12 por entrada)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
