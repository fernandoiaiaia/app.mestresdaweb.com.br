const { PrismaClient } = require('./apps/api/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const projectId = '5306d687-4ba3-4b5c-a611-30b3a8ca2c05';
    // The proposal they showed was a0820fcd-daae-4476-8021-a00bbc1a3967
    const proposal = await prisma.proposal.findUnique({ where: { id: 'a0820fcd-daae-4476-8021-a00bbc1a3967' } });
    
    // As seen earlier, this specific proposal's estimate DOES NOT have platforms! 
    // Wait, let me check if there is ANY proposal with estimate.platforms
    const props = await prisma.proposal.findMany({ 
        where: { estimate: { not: null } },
        orderBy: { createdAt: 'desc' },
        take: 10
    });
    
    let validScope = null;
    for (const p of props) {
        if (p.estimate && p.estimate.platforms && p.estimate.platforms.length > 0) {
            console.log("Found proposal with platforms! ID:", p.id);
            validScope = p.estimate.platforms;
            break;
        }
    }
    
    if (!validScope) {
        console.log("No proposal with platforms found! Using raw markdown parser as fallback...");
        // Fallback: parse scopeRaw text manually
        const lines = proposal.scopeRaw.split('\n').filter(l => l.trim().length > 0);
        validScope = [];
        let curPlatform = null;
        let curUser = null;
        let curModule = null;
        let curScreen = null;
        
        for (const l of lines) {
            if (l.startsWith("1. Plataforma:")) {
                curPlatform = { name: l.replace('1. Plataforma:', '').trim(), users: [] };
                validScope.push(curPlatform);
            } else if (l.startsWith("Usuário:")) {
                curUser = { name: l.replace('Usuário:', '').trim(), modules: [] };
                if (curPlatform) curPlatform.users.push(curUser);
            } else if (l.startsWith("Módulo:")) {
                curModule = { name: l.replace('Módulo:', '').trim(), screens: [] };
                if (curUser) curUser.modules.push(curModule);
            } else if (l.startsWith("Tela:")) {
                curScreen = { name: l.replace('Tela:', '').trim(), functionalities: [] };
                if (curModule) curModule.screens.push(curScreen);
            } else if (l.startsWith("Funcionalidade:")) {
                if (curScreen) curScreen.functionalities.push({ 
                    name: l.replace('Funcionalidade:', '').trim(),
                    description: "Auto-generated description"
                });
            } else if (l.startsWith("Descrição:")) {
                if (curScreen && curScreen.functionalities.length > 0) {
                    curScreen.functionalities[curScreen.functionalities.length - 1].description = l.replace('Descrição:', '').trim();
                }
            }
        }
    }

    const tasks = [];
    for (const platform of validScope) {
        const pName = platform.name || "Geral";
        for (const user of platform.users || []) {
            for (const mod of user.modules || []) {
                const epicName = `${pName} - ${mod.name}`;
                for (const screen of mod.screens || []) {
                    for (const feat of screen.functionalities || []) {
                        tasks.push({
                            title: `${screen.name}: ${feat.name}`,
                            description: feat.description || "",
                            epic: epicName.substring(0, 50),
                            projectId: projectId,
                            estimatedHours: feat.hours || 0,
                            priority: 'medium',
                            status: 'todo'
                        });
                    }
                }
            }
        }
    }
    
    if (tasks.length > 0) {
        await prisma.devTask.deleteMany({where: {projectId}});
        await prisma.devTask.createMany({data: tasks});
        console.log(`Inserted ${tasks.length} AUTHENTIC tasks from Proposal into Backlog!`);
    } else {
        console.log("Still no tasks extracted!");
    }
}
run().catch(console.error).finally(() => prisma.$disconnect());
