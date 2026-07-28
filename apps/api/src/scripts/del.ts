import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const id = 'a1a22eca-9d92-4a5d-95a5-a81f93e5c994';
  try {
    await prisma.proposal.delete({
      where: { id },
    });
    console.log(`Deleted proposal ${id}`);
  } catch (error) {
    console.error(`Failed to delete proposal ${id}:`, error);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
