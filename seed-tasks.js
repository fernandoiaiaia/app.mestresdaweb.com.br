const { PrismaClient } = require('./apps/api/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const projectId = '5306d687-4ba3-4b5c-a611-30b3a8ca2c05';
    
    await prisma.devTask.deleteMany({where: {projectId}});
    
    const tasks = [
        { projectId, title: 'Configurar Repositório e CI/CD', description: 'Setup inicial estrutural do monorepo', epic: 'Infraestrutura', estimatedHours: 12, status: 'done' },
        { projectId, title: 'Modelar Banco de Dados no Prisma', description: 'Mapeamento relacional de todas as tabelas', epic: 'Infraestrutura', estimatedHours: 8, status: 'in_progress' },
        { projectId, title: 'Desenvolver Módulo de Autenticação (JWT)', description: 'Login, Registro e JWT', epic: 'API Backend', priority: 'high', estimatedHours: 16, status: 'todo' },
        { projectId, title: 'Codificar Home Page Interativa', description: 'Interfaces react complexas com framer-motion', epic: 'Frontend Web', estimatedHours: 24, status: 'todo' },
        { projectId, title: 'Integração com Gateway de Pagamento', description: 'Webhooks de recorrência via Cartão de Crédito', epic: 'API Backend', priority: 'critical', estimatedHours: 32, status: 'todo' },
        { projectId, title: 'Painel Admin de Clientes', description: 'Tabela interativa de gestão global', epic: 'Frontend Painel', priority: 'medium', estimatedHours: 18, status: 'todo' },
        { projectId, title: 'Notificações Push no Mobile', description: 'Integração Expo Notifications', epic: 'App React Native', priority: 'high', estimatedHours: 22, status: 'review' }
    ];
    
    await prisma.devTask.createMany({ data: tasks });
    
    await prisma.devProject.update({
        where: { id: projectId },
        data: { 
            progress: 14, 
            hoursEstimated: 132,
            health: "on_track",
            phase: "development"
        }
    });
    
    console.log(`Successfully injected ${tasks.length} contextual tasks into project ${projectId}`);
}
run().catch(console.error).finally(() => prisma.$disconnect());
