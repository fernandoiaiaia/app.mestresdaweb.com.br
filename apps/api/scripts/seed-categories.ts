import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categoriesByType: Record<string, string[]> = {
    "Recebimentos": ["Desenvolvimento / Code", "Serviços Contínuos", "Setup / Setup Inicial", "Consultoria", "Licenciamento", "Aditivo Contratual", "Contrato Comercial", "Entrega Final", "Outros Recebimentos"],
    "MRR": ["Assinatura / Mensalidade", "Manutenção (SLA)", "Hospedagem / Servidor", "Hospedagem", "Licenciamento de Software", "Suporte Contínuo", "Suporte", "Outro (Recorrente)"],
    "Entregas": ["Desenvolvimento / Code", "Projetos de Desenvolvimento", "Serviços Contínuos", "Consultoria / Assessoria", "Design / UI UX", "Aditivo Contratual", "Outras Entregas"],
    "Despesas fixas": ["Software / SaaS", "Infraestrutura / Cloud", "Aluguel / Condomínio", "Contabilidade", "Assessorias", "Telefonia / Internet", "Outras Despesas Fixas"],
    "Despesas variáveis": ["Marketing / Ads", "Comercial / Comissões", "Brindes / Eventos", "Viagens / Deslocamento", "Freelancers / Terceirizados", "Materiais de Escritório", "Outras Despesas Variáveis"],
    "Pessoas": ["Folha de Pagamento", "Pró-Labore", "Benefícios (VA/VR/VT)", "Premiações / Bônus", "Treinamento / Cursos", "Outros (Pessoas)"],
    "Impostos": ["DAS (Simples Nacional)", "IRPJ / CSLL", "PIS / COFINS", "ISS", "Outros Impostos"],
};

async function main() {
    const users = await prisma.user.findMany();

    for (const user of users) {
        console.log(`Seeding categories for user: ${user.email}`);

        for (const [typeGroup, categories] of Object.entries(categoriesByType)) {
            for (const categoryName of categories) {
                const existing = await prisma.transactionCategory.findFirst({
                    where: {
                        userId: user.id,
                        name: categoryName,
                        typeGroup: typeGroup,
                    }
                });

                if (!existing) {
                    await prisma.transactionCategory.create({
                        data: {
                            userId: user.id,
                            name: categoryName,
                            typeGroup: typeGroup,
                        }
                    });
                }
            }
        }
    }

    console.log("Seeding completed.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
