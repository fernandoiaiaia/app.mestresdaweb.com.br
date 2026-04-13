import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.devProject.findMany().then(p => console.log(JSON.stringify(p, null, 2)));
