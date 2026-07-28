import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  // The production DB is different - check the API env
  const envFile = await import('fs').then(fs => fs.readFileSync('.env', 'utf-8'));
  const dbUrl = envFile.split('\n').find(l => l.startsWith('DATABASE_URL'));
  console.log("DB URL:", dbUrl?.substring(0, 60));
}
main().catch(console.error).finally(() => prisma.$disconnect());
