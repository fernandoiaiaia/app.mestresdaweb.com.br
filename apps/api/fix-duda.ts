import { prisma } from './src/config/database.js';
import bcrypt from 'bcryptjs';

async function run() {
    const email = 'duda@gmail.com';
    
    // 1. Check current state
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.log("USER NOT FOUND!");
        await prisma.$disconnect();
        return;
    }
    
    console.log("=== CURRENT DB STATE ===");
    console.log("id:", user.id);
    console.log("name:", user.name);
    console.log("email:", user.email);
    console.log("role:", user.role);
    console.log("active:", user.active);
    console.log("allowedApps:", user.allowedApps);
    console.log("twoFactorEnabled:", user.twoFactorEnabled);
    
    // 2. Test password
    const testPassword = "123456";
    const passwordMatch = await bcrypt.compare(testPassword, user.password);
    console.log("\n=== PASSWORD TEST ===");
    console.log(`Password "123456" match:`, passwordMatch);
    
    // 3. Check available roles in the enum
    console.log("\n=== FIXING USER ===");
    
    // Reset password to a known value
    const newHash = await bcrypt.hash("cliente123", 12);
    
    // Update user - set allowedApps to include both "hub" and "client" for maximum compatibility
    await prisma.user.update({
        where: { email },
        data: {
            password: newHash,
            allowedApps: ["hub", "client"],
            active: true,
            twoFactorEnabled: false,
        }
    });
    
    // Verify
    const updated = await prisma.user.findUnique({ where: { email } });
    console.log("\n=== AFTER FIX ===");
    console.log("role:", updated!.role);
    console.log("allowedApps:", updated!.allowedApps);
    console.log("active:", updated!.active);
    console.log("twoFactorEnabled:", updated!.twoFactorEnabled);
    
    // Test new password
    const newMatch = await bcrypt.compare("cliente123", updated!.password);
    console.log('Password "cliente123" match:', newMatch);
    
    await prisma.$disconnect();
}
run();
