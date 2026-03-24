import { PrismaClient } from '@prisma/client';
import { signAccessToken } from './src/lib/jwt.js';

async function testAccess() {
    const prisma = new PrismaClient();
    const user = await prisma.user.findFirst();
    if (!user) { console.error("No user found"); return; }

    const token = signAccessToken({ userId: user.id, role: user.role });

    const res = await fetch(`http://localhost:3333/api/deals/2f08596b-17e6-4c1d-a79b-1c4dbb38b793`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log("Status:", res.status);
    console.log("Headers:", res.headers);
    console.log("Body:", await res.text());

    await prisma.$disconnect();
}
testAccess().catch(console.error);
