import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
p.integrationSetting.findMany({where:{provider:'whatsapp'}}).then(r => console.log(JSON.stringify(r))).finally(() => p.$disconnect());
