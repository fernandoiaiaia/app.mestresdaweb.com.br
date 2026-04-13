import { MinimaxService } from "./src/modules/assembler/minimax.service";
import { prisma } from "./src/config/database";

async function run() {
    console.log("Starting test...");
    
    const setting = await prisma.integrationSetting.findFirst({
        where: { provider: "proposal_minimax", isActive: true }
    });
    
    if (!setting) {
        console.error("No minimax setting found.");
        return;
    }
    
    const userId = setting.userId;
    console.log("Using userId:", userId);

    const projectSummary = "Um app de delivery estilo iFood, com painel administrativo e app para entregadores.";
    const users = [
        {
            name: "Cliente Final",
            platforms: ["App Mobile (iOS/Android)"],
            platformSummary: { "App Mobile (iOS/Android)": "Fazer os pedidos" }
        }
    ];

    try {
        const scope = await MinimaxService.generateScope(userId, projectSummary, users);
        console.log("=== PARSED SCOPE ===");
        console.dir(scope, { depth: null });
    } catch (e) {
        console.error("Error:", e);
    }
}

run();
