import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function test() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log("No user found");
    return;
  }
  
  try {
    const proposal = await prisma.assembledProposal.create({
      data: {
        userId: user.id,
        title: "Test Proposal",
        scopeData: { test: "data" },
        totalHours: 10,
        status: "draft",
        urgency: "media",
        reviewHistory: []
      }
    });
    console.log("Success:", proposal.id);
  } catch (e) {
    console.error("Error saving proposal:", e);
  } finally {
    await prisma.$disconnect();
  }
}
test();
