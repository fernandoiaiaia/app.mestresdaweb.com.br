import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Pegar o primeiro usuário para atribuir as empresas e clientes
    const user = await prisma.user.findFirst();
    
    if (!user) {
        console.error("Nenhum usuário encontrado no banco de dados.");
        process.exit(1);
    }

    const userId = user.id;

    console.log(`Criando mocks para o usuário: ${user.name}`);

    // Mock Empresas
    const mockCompanies = [
        { name: "Acme Corp", cnpj: "12.345.678/0001-90", city: "São Paulo", state: "SP", address: "Av. Paulista, 1000", segment: "Tecnologia" },
        { name: "Global Industries", cnpj: "98.765.432/0001-10", city: "Rio de Janeiro", state: "RJ", address: "Rua do Ouvidor, 50", segment: "Manufatura" },
        { name: "Tech Solutions Ltda", cnpj: "45.123.890/0001-55", city: "Belo Horizonte", state: "RJ", address: "Av. Rio Branco, 200", segment: "TI" },
        { name: "Mestres da Web", cnpj: "11.222.333/0001-44", city: "Mogi das Cruzes", state: "SP", address: "Rua Coronel Souza Franco, 123", segment: "Agência Digital" },
        { name: "Inovação Brasil S/A", cnpj: "55.666.777/0001-88", city: "Curitiba", state: "MG", address: "Av. Afonso Pena, 500", segment: "Startups" },
        { name: "Comercial Silva", cnpj: "99.888.777/0001-66", city: "Porto Alegre", state: "PR", address: "Rua das Flores, 10", segment: "Varejo" },
        { name: "Logística Express", cnpj: "33.444.555/0001-22", city: "Campinas", state: "RS", address: "Av. Brasil, 900", segment: "Transportes" },
        { name: "Consultoria Alpha", cnpj: "77.111.222/0001-33", city: "Brasília", state: "SC", address: "Setor Comercial Sul, Q 2", segment: "Consultoria" },
        { name: "Design Criativo", cnpj: "22.555.888/0001-11", city: "Florianópolis", state: "DF", address: "Rua da Praia, 30", segment: "Marketing" },
        { name: "Saúde & Cia", cnpj: "66.999.000/0001-77", city: "Salvador", state: "BA", address: "Av. ACM, 1500", segment: "Saúde" }
    ];

    const createdCompanies = [];

    for (const comp of mockCompanies) {
        const created = await prisma.company.create({
            data: {
                userId,
                name: comp.name,
                cnpj: comp.cnpj,
                city: comp.city,
                state: comp.state,
                address: comp.address,
                segment: comp.segment,
                status: "active"
            }
        });
        createdCompanies.push(created);
        console.log(`Empresa criada: ${created.name}`);
    }

    // Mock Contatos (Clientes) vinculados às empresas
    const roles = ["CEO", "Diretor(a)", "Gerente", "Coordenador(a)", "Analista"];
    
    for (const company of createdCompanies) {
        for (let i = 0; i < 3; i++) {
            const contactName = `Contato ${i + 1} da ${company.name.split(' ')[0]}`;
            await prisma.client.create({
                data: {
                    userId,
                    name: contactName,
                    email: `contato${i+1}@${company.name.toLowerCase().replace(/[^a-z]/g, '')}.com`,
                    phone: `(11) 9${Math.floor(Math.random() * 90000) + 10000}-${Math.floor(Math.random() * 9000) + 1000}`,
                    role: roles[i % roles.length],
                    company: company.name,
                    companyId: company.id,
                    status: "prospect",
                    source: "Indicação"
                }
            });
            console.log(`Contato criado: ${contactName} (${company.name})`);
        }
    }

    console.log("Mock data inserido com sucesso!");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
