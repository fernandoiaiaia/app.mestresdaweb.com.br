import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
p.integrationSetting.findMany({where:{provider:'whatsapp'}}).then(r => console.dir(r, {depth: null})).finally(() => p.$disconnect());
