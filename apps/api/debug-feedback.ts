import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const proposalId = "ab753002-4c02-4596-b38e-4e9e891fe5d6";
    
    const proposal = await prisma.assembledProposal.findUnique({
        where: { id: proposalId },
        select: {
            id: true,
            title: true,
            userId: true,
            scopeData: true,
        }
    });
    
    if (!proposal) {
        console.log("Proposal not found!");
        return;
    }
    
    console.log("=== PROPOSAL ===");
    console.log("ID:", proposal.id);
    console.log("Title:", proposal.title);
    console.log("UserId:", proposal.userId);
    
    const scopeData = proposal.scopeData as Record<string, unknown>;
    const feedbacks = scopeData?.clientFeedback as unknown[];
    
    console.log("\n=== CLIENT FEEDBACKS ===");
    console.log("Total feedbacks:", feedbacks?.length || 0);
    
    if (feedbacks && feedbacks.length > 0) {
        feedbacks.forEach((fb: any, idx: number) => {
            console.log(`\n--- Feedback #${idx + 1} ---`);
            console.log("  ID:", fb.id);
            console.log("  Screen:", fb.screenTitle);
            console.log("  Module:", fb.moduleName);
            console.log("  Author:", fb.author);
            console.log("  Date:", fb.date);
            console.log("  Read:", fb.read);
            console.log("  Text:", fb.text?.substring(0, 100));
        });
    } else {
        console.log("NO FEEDBACKS FOUND in scopeData.clientFeedback");
        console.log("\nAll scopeData keys:", Object.keys(scopeData || {}));
    }
    
    // Also check notifications for this proposal
    const notifications = await prisma.notification.findMany({
        where: {
            metadata: {
                path: ["proposalId"],
                equals: proposalId,
            }
        }
    });
    
    console.log("\n=== NOTIFICATIONS referencing this proposal ===");
    console.log("Count:", notifications.length);
    notifications.forEach((n, i) => {
        console.log(`\n--- Notification #${i + 1} ---`);
        console.log("  ID:", n.id);
        console.log("  Type:", n.type);
        console.log("  Title:", n.title);
        console.log("  Description:", n.description);
        console.log("  Metadata:", JSON.stringify(n.metadata));
    });
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
