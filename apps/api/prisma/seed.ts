/// <reference types="node" />
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding database...");

    const hashedPassword = await bcrypt.hash("FernandinhoCunha@3041***", 12);
    const admin = await prisma.user.upsert({
        where: { email: "fernando@mestresdaweb.com.br" },
        update: { password: hashedPassword, role: Role.OWNER },
        create: { name: "Fernando Cunha", email: "fernando@mestresdaweb.com.br", password: hashedPassword, role: Role.OWNER },
    });
    console.log(`✅ Admin user: ${admin.email}`);

    // ═══ Feature Library Seed ═══
    const existingCats = await prisma.featureCategory.count({ where: { userId: admin.id } });
    if (existingCats > 0) { console.log("ℹ️  Feature Library already seeded. Skipping."); return; }

    const crm = await prisma.featureCategory.create({ data: {
        userId: admin.id, name: "CRM", slug: "crm", status: "active",
        description: "Customer Relationship Management — gestão de leads, pipeline e clientes.",
        segment: "CRM", orderIndex: 0,
    }});

    const gestaoLeads = await prisma.featureModule.create({ data: {
        categoryId: crm.id, name: "Gestão de Leads", slug: "gestao-de-leads",
        description: "Captura, qualificação e gestão do ciclo de vida dos leads.", orderIndex: 0,
    }});

    const listaLeads = await prisma.featureScreen.create({ data: {
        moduleId: gestaoLeads.id, name: "Lista de Leads", slug: "lista-de-leads",
        screenType: "Listagem", complexityBase: "Média", orderIndex: 0,
    }});

    await prisma.featureItem.createMany({ data: [
        {
            screenId: listaLeads.id, name: "Criar Lead", slug: "criar-lead",
            descriptionFunc: "Permite cadastrar um novo lead manualmente com dados básicos de contato.",
            useCase: "O vendedor preenche nome, email, telefone e origem do lead após uma ligação de prospecção.",
            businessIntent: "Capturar um novo potencial cliente interessado no produto ou serviço da empresa.",
            contextTriggers: ["lead", "prospect", "novo cliente", "interessado", "cadastro"],
            interfaceExample: "Formulário modal: Nome, E-mail, Telefone, Origem (select), Responsável (select). Botões: Cancelar, Salvar.",
            techType: "CRUD Simples", featurePattern: "crud_basic", complexity: "Baixa", status: "active",
            platforms: ["Web"], reusable: false, baseWeight: 1, tags: ["leads", "crm"],
            dependencies: [], dependsOn: [], technicalComponents: ["Button", "Modal", "Form", "API REST"],
            applicableSegments: ["CRM", "SaaS"], rates: { "Gerente de Projeto": 1, "UX e UI Designer": 2, "DBA": 1, "Arquiteto de Software": 1, "Front-end Web": 4, "Back-end": 3, "Front-end Mobile": 0, "QA": 2, "DevOps": 0, "Analista de Segurança": 0 }, orderIndex: 0,
        },
        {
            screenId: listaLeads.id, name: "Filtrar Leads", slug: "filtrar-leads",
            descriptionFunc: "Permite filtrar a lista de leads por status, origem, responsável e data de criação.",
            businessIntent: "Permitir que o vendedor encontre rapidamente leads relevantes para priorizar ações de vendas.",
            contextTriggers: ["filtrar", "buscar lead", "pesquisar contato"],
            techType: "Filtro Avançado", featurePattern: "filter_search", complexity: "Média", status: "active",
            platforms: ["Web"], reusable: true, baseWeight: 1.2, tags: ["filtro", "busca"],
            dependencies: ["criar-lead"], dependsOn: [], technicalComponents: ["Filtro", "Select", "DatePicker"],
            applicableSegments: ["CRM"], rates: { "Gerente de Projeto": 1, "UX e UI Designer": 1, "DBA": 1, "Arquiteto de Software": 0, "Front-end Web": 3, "Back-end": 2, "Front-end Mobile": 0, "QA": 1, "DevOps": 0, "Analista de Segurança": 0 }, orderIndex: 1,
        },
        {
            screenId: listaLeads.id, name: "Editar Lead", slug: "editar-lead",
            descriptionFunc: "Permite editar as informações de um lead existente.",
            businessIntent: "Manter os dados do lead atualizados para garantir abordagens mais precisas.",
            contextTriggers: ["editar lead", "atualizar contato", "corrigir dados"],
            techType: "CRUD Simples", featurePattern: "crud_basic", complexity: "Baixa", status: "active",
            platforms: ["Web"], reusable: false, baseWeight: 0.8, tags: ["leads", "editar"],
            dependencies: [], dependsOn: ["criar-lead"], technicalComponents: ["Form", "Modal", "API REST"],
            applicableSegments: ["CRM"], rates: { "Gerente de Projeto": 0, "UX e UI Designer": 1, "DBA": 0, "Arquiteto de Software": 0, "Front-end Web": 2, "Back-end": 2, "Front-end Mobile": 0, "QA": 1, "DevOps": 0, "Analista de Segurança": 0 }, orderIndex: 2,
        },
        {
            screenId: listaLeads.id, name: "Excluir Lead", slug: "excluir-lead",
            descriptionFunc: "Remove um lead da base de dados com confirmação de segurança.",
            businessIntent: "Manter a base de leads limpa e sem registros duplicados ou inválidos.",
            contextTriggers: ["excluir lead", "remover contato", "deletar"],
            techType: "CRUD Simples", featurePattern: "crud_basic", complexity: "Baixa", status: "active",
            platforms: ["Web"], reusable: false, baseWeight: 0.5, tags: ["leads", "excluir"],
            dependencies: [], dependsOn: ["criar-lead"], technicalComponents: ["Modal de Confirmação", "API REST"],
            applicableSegments: ["CRM"], rates: { "Gerente de Projeto": 0, "UX e UI Designer": 0, "DBA": 0, "Arquiteto de Software": 0, "Front-end Web": 1, "Back-end": 1, "Front-end Mobile": 0, "QA": 1, "DevOps": 0, "Analista de Segurança": 0 }, orderIndex: 3,
        },
    ]});

    console.log("✅ Feature Library seeded: CRM");
    console.log("🌱 Seeding complete.");
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());

