import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const proposal = await prisma.assembledProposal.findFirst({
    where: { scopeData: { path: ['clientFeedback'], not: null } }
  });
  if (proposal) {
    const data = proposal.scopeData as any;
    console.log(JSON.stringify(data.clientFeedback, null, 2));
    if (data.users && data.users.length > 0) {
      console.log("FIRST SCREEN ID:", data.users[0].platforms[0].modules[0].screens[0].id);
    }
  } else {
    console.log("NO PROPOSALS WITH FEEDBACK");
  }
}
main().finally(() => prisma.$disconnect());
