import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

const data = [
  { empresa: "Metalsystem", responsavel: "Silvio Riberti", celular: "55 11 98039-6312", email: "carlos.holanda@metalsystem-pecas.com.br", descricao: "Hospedagem Plataforma", tipo: "MRR", categoria: "Hospedagem / Servidor", vencimento: 10, valor: 573.06 },
  { empresa: "Metalsystem", responsavel: "Silvio Riberti", celular: "55 11 98039-6312", email: "carlos.holanda@metalsystem-pecas.com.br", descricao: "Hospedagem Power BI", tipo: "MRR", categoria: "Hospedagem / Servidor", vencimento: 10, valor: 529.90 },
  { empresa: "Metalsystem", responsavel: "Silvio Riberti", celular: "55 11 98039-6312", email: "carlos.holanda@metalsystem-pecas.com.br", descricao: "10h de Suporte", tipo: "MRR", categoria: "Suporte Contínuo", vencimento: 10, valor: 1000.00 },
  { empresa: "AWi Inspeções", responsavel: "Keuller Boy", celular: "55 31 8774-8582", email: "Keuller.boy@awiservice.com.br", descricao: "Hospedagem Plataforma", tipo: "MRR", categoria: "Hospedagem / Servidor", vencimento: 10, valor: 2200.00 },
  { empresa: "Go Task", responsavel: "Lucas Muller", celular: "55 51 9962-4931", email: "lucas.zuhaus@gmail.com", descricao: "Hospedagem Plataforma", tipo: "MRR", categoria: "Hospedagem / Servidor", vencimento: 10, valor: 529.00 },
  { empresa: "Estuda 01", responsavel: "Vinicius Miatelo", celular: "55 51 9962-4931", email: "Contato.estuda01@gmail.com", descricao: "Hospedagem Plataforma", tipo: "MRR", categoria: "Hospedagem / Servidor", vencimento: 10, valor: 800.00 },
  { empresa: "World Aviation", responsavel: "Tatiane Aparecida", celular: "55 11 94810-5969", email: "jean@worldaviation.com.br", descricao: "Hospedagem Plataforma", tipo: "MRR", categoria: "Hospedagem / Servidor", vencimento: 10, valor: 529.90 },
  { empresa: "Quero Evento", responsavel: "Pedro Henrique", celular: "55 21 97537-8882", email: "pedrolucena2003@gmail.com", descricao: "Hospedagem Plataforma", tipo: "MRR", categoria: "Hospedagem / Servidor", vencimento: 10, valor: 529.90 },
  { empresa: "Kaliga", responsavel: "Kaio Arantes", celular: "55 17 99665-8656", email: "kaio.aca@hotmail.com", descricao: "Hospedagem Plataforma", tipo: "MRR", categoria: "Hospedagem / Servidor", vencimento: 11, valor: 529.00 },
  { empresa: "Materialize", responsavel: "Alex Peiter", celular: "55 51 9703-3523", email: "peiter.construtora@gmail.com", descricao: "Hospedagem Plataforma", tipo: "MRR", categoria: "Hospedagem / Servidor", vencimento: 11, valor: 329.00 },
  { empresa: "Sinp", responsavel: "Letícia Candido", celular: "55 44 9922-9641", email: "sinpfinanceiro@gmail.com", descricao: "Hospedagem Plataforma", tipo: "MRR", categoria: "Hospedagem / Servidor", vencimento: 14, valor: 329.00 },
  { empresa: "Leishscan", responsavel: "Fabio Nogueira", celular: "55 18 99104-0371", email: "nogueiracan@uol.com.br", descricao: "Hospedagem Plataforma", tipo: "MRR", categoria: "Hospedagem / Servidor", vencimento: 15, valor: 356.40 },
  { empresa: "Shopping Fer", responsavel: "Reginaldo", celular: "55 11 95301-9454", email: "vendasshoppingfer@hotmail.com", descricao: "Hospedagem Plataforma", tipo: "MRR", categoria: "Hospedagem / Servidor", vencimento: 15, valor: 49.90 },
  { empresa: "Yuse", responsavel: "Katarine", celular: "55 61 9666-6440", email: "katarinesilva@hotmail.com", descricao: "Hospedagem Plataforma", tipo: "MRR", categoria: "Hospedagem / Servidor", vencimento: 15, valor: 320.00 },
  { empresa: "Bora", responsavel: "Carolina Reyes", celular: "55 22 99263-4041", email: "krolinanyc@gmail.com", descricao: "Hospedagem Plataforma", tipo: "MRR", categoria: "Hospedagem / Servidor", vencimento: 15, valor: 529.90 },
  { empresa: "Inspire", responsavel: "Katrícia Primo", celular: "55 84 8139-5459", email: "adeilton.primo@inspiretreinamentos.com", descricao: "Hospedagem Plataforma", tipo: "MRR", categoria: "Hospedagem / Servidor", vencimento: 16, valor: 529.90 },
  { empresa: "Agrifábricas", responsavel: "Eduardo Augusto", celular: "39 342 634 1343", email: "eduardolocksnew@gmail.com", descricao: "Hospedagem Plataforma", tipo: "MRR", categoria: "Hospedagem / Servidor", vencimento: 16, valor: 529.90 },
  { empresa: "Te Desafio", responsavel: "Laura Chiaramonte", celular: "55 19 99847-5004", email: "Laurachiaramonte54@gmail.com", descricao: "Hospedagem Plataforma", tipo: "MRR", categoria: "Hospedagem / Servidor", vencimento: 19, valor: 529.90 },
  { empresa: "Coroas Já", responsavel: "Andressa Medeiros", celular: "55 11 99925-5445", email: "andressa.medeiros01@outlook.com", descricao: "Hospedagem Plataforma", tipo: "MRR", categoria: "Hospedagem / Servidor", vencimento: 20, valor: 529.90 },
  { empresa: "Coroas Já", responsavel: "Andressa Medeiros", celular: "55 11 99925-5445", email: "andressa.medeiros01@outlook.com", descricao: "Hospedagem WordPress", tipo: "MRR", categoria: "Hospedagem / Servidor", vencimento: 20, valor: 300.00 },
  { empresa: "Qualit True", responsavel: "Raphael Vasconcelos", celular: "55 11 99303-3706", email: "Raphael@engenhariatrue.com.br", descricao: "Hospedagem Plataforma", tipo: "MRR", categoria: "Hospedagem / Servidor", vencimento: 20, valor: 529.90 },
  { empresa: "Queimando o Bacon", responsavel: "Susana Carvalho", celular: "55 14 98144-2269", email: "daniloqbacon@gmail.com", descricao: "Hospedagem Plataforma", tipo: "MRR", categoria: "Hospedagem / Servidor", vencimento: 20, valor: 529.90 },
  { empresa: "iKids", responsavel: "Túlio Schuelter", celular: "55 11 95018-6623", email: "tulioschuelter@gmail.com", descricao: "Hospedagem Homologação", tipo: "MRR", categoria: "Hospedagem / Servidor", vencimento: 20, valor: 150.00 },
  { empresa: "Mila", responsavel: "Edson da Silva", celular: "55 11 99763-5423", email: "adm@millacomercio.com.br", descricao: "Hospedagem Homologação", tipo: "MRR", categoria: "Hospedagem / Servidor", vencimento: 20, valor: 150.00 },
  { empresa: "MaidSync", responsavel: "Patrícia Ventura", celular: "1 (908) 502-6348", email: "patyy_ventura@hotmail.com", descricao: "Hospedagem Homologação", tipo: "MRR", categoria: "Hospedagem / Servidor", vencimento: 20, valor: 150.00 },
  { empresa: "FitMax", responsavel: "Victor Mendes", celular: "55 35 9831-2341", email: "victrmendes@hotmail.com", descricao: "Hospedagem Homologação", tipo: "MRR", categoria: "Hospedagem / Servidor", vencimento: 20, valor: 150.00 },
  { empresa: "ConectPront", responsavel: "Joilson Matos", celular: "55 71 9638-1916", email: "joilson@hprohope.com.br", descricao: "Hospedagem Homologação", tipo: "MRR", categoria: "Hospedagem / Servidor", vencimento: 20, valor: 150.00 },
  { empresa: "GeniusKlub", responsavel: "Bruno Pereira", celular: "55 11 91325-1977", email: "brunopesantos@hotmail.com", descricao: "Hospedagem Homologação", tipo: "MRR", categoria: "Hospedagem / Servidor", vencimento: 20, valor: 150.00 },
  { empresa: "Ativa Pronta Resposta", responsavel: "Fernanda", celular: "55 11 99137-1580", email: "douglas@ativaprontaresposta.com.br", descricao: "Hospedagem Plataforma", tipo: "MRR", categoria: "Hospedagem / Servidor", vencimento: 23, valor: 800.00 },
  { empresa: "QuicklyWear", responsavel: "Aline Camargo", celular: "55 12 98105-9612", email: "alinecnoronha2@gmail.com", descricao: "Hospedagem Plataforma", tipo: "MRR", categoria: "Hospedagem / Servidor", vencimento: 25, valor: 529.90 },
  { empresa: "Impulsse", responsavel: "Magno Gonçalves", celular: "55 31 9554-1717", email: "magno@impulsse.com.br", descricao: "Hospedagem Plataforma", tipo: "MRR", categoria: "Hospedagem / Servidor", vencimento: 25, valor: 529.90 },
  { empresa: "Planc", responsavel: "José Frederico", celular: "55 32 8855-1012", email: "jfredericogomes@gmail.com", descricao: "Hospedagem Plataforma", tipo: "MRR", categoria: "Hospedagem / Servidor", vencimento: 27, valor: 299.90 },
  { empresa: "Korrida Controler", responsavel: "Cristiano Oliveira", celular: "55 11 95962-3822", email: "cristianooliveira0303@gmail.com", descricao: "Hospedagem Plataforma", tipo: "MRR", categoria: "Hospedagem / Servidor", vencimento: 28, valor: 449.50 },
  { empresa: "Worsheep", responsavel: "Leo Bueno", celular: "55 11 93736-1102", email: "leo.boeno2@gmail.com", descricao: "Movie Creator V1", tipo: "MRR", categoria: "Hospedagem / Servidor", vencimento: 20, valor: 2510.00 }
];

async function main() {
    // 1. Get User ID (first user in DB)
    const user = await prisma.user.findFirst();
    if (!user) {
        console.error("Nenhum usuário encontrado no banco de dados.");
        process.exit(1);
    }
    const userId = user.id;

    console.log(`Usando userId: ${userId} (${user.name})`);

    // Months to generate (Junho 2026 to Maio 2027 = 12 meses)
    const monthsToGenerate = 12;

    for (const item of data) {
        // 2. Upsert Company
        let company = await prisma.company.findFirst({
            where: { name: item.empresa, userId }
        });

        if (!company) {
            company = await prisma.company.create({
                data: {
                    name: item.empresa,
                    userId,
                    status: "active"
                }
            });
            console.log(`Criou Empresa: ${company.name}`);
        }

        // 3. Upsert Client (Responsável)
        let client = await prisma.client.findFirst({
            where: { email: item.email, userId }
        });

        if (!client) {
            client = await prisma.client.create({
                data: {
                    name: item.responsavel,
                    email: item.email,
                    phone: item.celular,
                    companyId: company.id,
                    userId,
                    status: "active",
                    isFavorite: false
                }
            });
            console.log(`Criou Contato: ${client.name} para a empresa ${company.name}`);
        } else if (!client.companyId) {
            await prisma.client.update({
                where: { id: client.id },
                data: { companyId: company.id }
            });
        }

        // 4. Create Transactions (12 months starting June 2026)
        const parentId = crypto.randomUUID();
        
        for (let i = 0; i < monthsToGenerate; i++) {
            // Junho é mês 5 no construtor do JS Date (0 indexado)
            // 2026-06-XX
            let txDate = new Date(2026, 5 + i, item.vencimento);
            let txDueDate = new Date(2026, 5 + i, item.vencimento);

            // Ajuste para não cair no final de semana, se necessário (simplificado aqui)
            
            const desc = i === 0 ? item.descricao : `${item.descricao} (Recorrência #${i + 1})`;

            await prisma.transaction.create({
                data: {
                    userId,
                    description: desc,
                    client: item.empresa,
                    value: item.valor,
                    typeGroup: "MRR",
                    category: item.categoria,
                    date: txDate,
                    dueDate: txDueDate,
                    status: "Previsto",
                    account: "Caixa Interno",
                    paymentMethod: "Boleto Bancário",
                    costCenter: "Comercial",
                    parentId,
                }
            });
        }
        console.log(`Criou 12 meses de transação MRR para: ${item.empresa} (${item.descricao})`);
    }

    console.log("Migração de MRR concluída com sucesso!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
