import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.devProject.findUnique({where: {id: 'ec21be09-1ecf-4e2c-a33c-795eba8b5db8'}}).then(p => console.log(p));
