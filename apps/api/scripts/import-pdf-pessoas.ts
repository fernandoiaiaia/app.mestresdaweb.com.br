import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const pessoasData = [
  { nome: "Nelson Barbosa", categoria: "Vendedor", renda: 1500, vt: 11 },
  { nome: "Maria Eduarda", categoria: "Sócio", renda: 5000, vt: 11 },
  { nome: "Maria Clara", categoria: "Engenheiro de IA (Estágio)", renda: 1500, vt: 11 },
  { nome: "Marco Antonio", categoria: "Engenheiro de IA (Estágio)", renda: 3000, vt: 19 },
  { nome: "Kim Baccilieri", categoria: "Engenheiro de IA PJ", renda: 3000, vt: 0 },
  { nome: "Julio Cesar", categoria: "Engenheiro de IA PJ", renda: 3500, vt: 0 },
  { nome: "Isabela Brojota", categoria: "Engenheiro de IA (Estágio)", renda: 1500, vt: 10.4 },
  { nome: "Fernando Cunha", categoria: "Sócio", renda: 17000, vt: 0 },
  { nome: "Fabricio Vieira", categoria: "Audio Visual", renda: 1500, vt: 11 },
  { nome: "Edson Luiz", categoria: "Vendedor", renda: 5000, vt: 23.9 },
  { nome: "Ana Beatriz", categoria: "Engenheiro de IA (Estágio)", renda: 1200, vt: 11 },
  { nome: "José Felipe", categoria: "Sócio", renda: 8000, vt: 23.9 },
  { nome: "Ivone Campos", categoria: "Limpeza", renda: 1717, vt: 11 }
];

function getWorkingDaysAndDatesUTC(year: number, month: number) {
    const nextMonth = new Date(Date.UTC(year, month + 1, 1, 12, 0, 0));
    nextMonth.setUTCDate(0); // Último dia do mês atual
    const lastDay = nextMonth.getUTCDate();
    
    let workingDaysCount = 0;
    let firstWorkingDay = null;
    let lastWorkingDay = null;
    
    for (let day = 1; day <= lastDay; day++) {
        const date = new Date(Date.UTC(year, month, day, 12, 0, 0));
        const dayOfWeek = date.getUTCDay(); // 0 = Domingo, 6 = Sábado
        
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            workingDaysCount++;
            if (!firstWorkingDay) {
                firstWorkingDay = new Date(date);
            }
            lastWorkingDay = new Date(date);
        }
    }
    
    return {
        count: workingDaysCount,
        first: firstWorkingDay,
        last: lastWorkingDay
    };
}

async function main() {
    console.log("Iniciando importação de Despesas de Pessoas...");
    
    let user = await prisma.user.findFirst({ where: { role: 'OWNER' } });
    if (!user) user = await prisma.user.findFirst();
    
    if (!user) {
        console.error("Nenhum usuário encontrado na base de dados.");
        return;
    }
    
    const userId = user.id;
    console.log(`Usuário selecionado: ${user.name} (${user.id})`);

    let transactionsCreated = 0;

    for (const pessoa of pessoasData) {
        // Criar ID base para agrupar as transações da mesma pessoa
        const salaryParentId = uuidv4();
        const vtParentId = uuidv4();

        // 12 meses, de Junho 2026 (mês 5 em JS) até Maio 2027
        for (let offset = 0; offset < 12; offset++) {
            const currentYear = 2026 + Math.floor((5 + offset) / 12);
            const currentMonth = (5 + offset) % 12;
            const dates = getWorkingDaysAndDatesUTC(currentYear, currentMonth);

            // Folha de Pagamento
            if (pessoa.renda > 0 && dates.first) {
                await prisma.transaction.create({
                    data: {
                        userId,
                        description: `Folha de Pagamento - ${pessoa.categoria}`,
                        client: pessoa.nome,
                        value: pessoa.renda,
                        typeGroup: "Pessoas",
                        category: "Folha de Pagamento",
                        date: dates.first,
                        dueDate: dates.first,
                        status: "Previsto",
                        account: "Caixa Interno",
                        paymentMethod: "TED",
                        costCenter: "Comercial",
                        notes: "Importado via PDF.",
                        installment: `Mês ${offset + 1}/12`,
                        parentId: null,
                    }
                });
                transactionsCreated++;
            }

            // Vale Transporte
            if (pessoa.vt > 0 && dates.last) {
                const vtTotal = pessoa.vt * dates.count;
                await prisma.transaction.create({
                    data: {
                        userId,
                        description: `Vale Transporte - ${dates.count} dias úteis`,
                        client: pessoa.nome,
                        value: vtTotal,
                        typeGroup: "Pessoas",
                        category: "Benefícios (VA/VR/VT)",
                        date: dates.last,
                        dueDate: dates.last,
                        status: "Previsto",
                        account: "Caixa Interno",
                        paymentMethod: "TED",
                        costCenter: "Comercial",
                        notes: `Importado via PDF.\nDiária VT: R$ ${pessoa.vt}\nDias Úteis: ${dates.count}`,
                        installment: `Mês ${offset + 1}/12`,
                        parentId: null,
                    }
                });
                transactionsCreated++;
            }
        }
        
        console.log(`Lançamentos mapeados para ${pessoa.nome}.`);
    }

    console.log("Importação concluída com sucesso!");
    console.log(`Transações de Pessoas (Salário e VT) geradas: ${transactionsCreated}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
