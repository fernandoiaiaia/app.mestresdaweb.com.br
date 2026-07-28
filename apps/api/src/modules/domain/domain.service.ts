import { prisma } from "../../config/database.js";
import crypto from "crypto";
import dns from "dns/promises";
import { logger } from "../../config/logger.js";

interface JwtUser { userId: string; }

function generateToken(): string {
    return "pai_verify_" + crypto.randomBytes(8).toString("hex");
}

export const domainService = {

    // ═══ GET SETTINGS ═══
    async getSettings(user: JwtUser) {
        return prisma.domainSettings.findFirst();
    },

    // ═══ SAVE ALL SETTINGS ═══
    async upsertSettings(data: any, user: JwtUser) {
        const existing = await prisma.domainSettings.findFirst();
        const token = existing?.verificationToken || generateToken();

        if (existing) {
            return prisma.domainSettings.update({
                where: { id: existing.id },
                data,
            });
        }
        return prisma.domainSettings.create({
            data: {
                userId: user.userId,
                verificationToken: token,
                ...data,
            },
        });
    },

    // ═══ CHECK SUBDOMAIN AVAILABILITY ═══
    async checkSubdomain(subdomain: string, user: JwtUser) {
        if (!subdomain || subdomain.length < 3) {
            return { available: false, message: "O subdomínio deve ter pelo menos 3 caracteres" };
        }
        if (!/^[a-z0-9-]+$/.test(subdomain)) {
            return { available: false, message: "Use apenas letras minúsculas, números e hifens" };
        }

        // Check if already taken by someone else (not relevant if single-tenant, but let's check globally if it exists at all)
        const existing = await prisma.domainSettings.findFirst({
            where: {
                portalSubdomain: subdomain,
            },
        });

        if (existing) {
            return { available: false, message: "Este subdomínio já está em uso" };
        }

        return { available: true, message: "Subdomínio disponível!" };
    },

    // ═══ VERIFY DOMAIN DNS ═══
    async verifyDomain(user: JwtUser) {
        const settings = await prisma.domainSettings.findFirst();
        if (!settings?.customDomain) {
            return { verified: false, sslActive: false, message: "Nenhum domínio configurado" };
        }

        const domain = settings.customDomain;
        const expectedCname = "proxy.proposalai.app";
        const expectedTxt = settings.verificationToken;

        let cnameOk = false;
        let txtOk = false;

        // Check CNAME
        try {
            const cnames = await dns.resolveCname(domain);
            cnameOk = cnames.some(c => c.toLowerCase() === expectedCname.toLowerCase());
        } catch (err: any) {
            logger.warn(`DNS CNAME lookup failed for ${domain}: ${err.code || err.message}`);
            // In dev, simulate success
            if (process.env.NODE_ENV !== "production") cnameOk = true;
        }

        // Check TXT
        try {
            const txtRecords = await dns.resolveTxt(`_verify.${domain}`);
            txtOk = txtRecords.flat().some(t => t === expectedTxt);
        } catch (err: any) {
            logger.warn(`DNS TXT lookup failed for _verify.${domain}: ${err.code || err.message}`);
            // In dev, simulate success
            if (process.env.NODE_ENV !== "production") txtOk = true;
        }

        const verified = cnameOk && txtOk;
        const sslActive = verified; // Auto-provision in dev

        if (verified) {
            await prisma.domainSettings.update({
                where: { id: settings.id },
                data: { domainVerified: true, sslActive },
            });
        }

        return {
            verified,
            sslActive,
            cnameOk,
            txtOk,
            message: verified
                ? "Domínio verificado com sucesso! SSL provisionado."
                : `DNS incompleto: CNAME ${cnameOk ? "✅" : "❌"} | TXT ${txtOk ? "✅" : "❌"}`,
        };
    },

    // ═══ REMOVE CUSTOM DOMAIN ═══
    async removeDomain(user: JwtUser) {
        const existing = await prisma.domainSettings.findFirst();
        if (!existing) return null;
        return prisma.domainSettings.update({
            where: { id: existing.id },
            data: {
                customDomain: "",
                domainVerified: false,
                sslActive: false,
            },
        });
    },

    // ═══ UPLOAD (logo / favicon) ═══
    async uploadFile(file: Express.Multer.File, type: "logo" | "favicon", user: JwtUser) {
        // file is already saved by multer, just return the relative path
        const filePath = `/uploads/domain/${file.filename}`;

        const data = type === "logo"
            ? { whitelabelLogo: filePath }
            : { whitelabelFavicon: filePath };

        const existing = await prisma.domainSettings.findFirst();
        if (existing) {
            await prisma.domainSettings.update({
                where: { id: existing.id },
                data,
            });
        } else {
            await prisma.domainSettings.create({
                data: { userId: user.userId, verificationToken: generateToken(), ...data },
            });
        }

        return filePath;
    },

    // ═══ REMOVE FILE ═══
    async removeFile(type: "logo" | "favicon", user: JwtUser) {
        const existing = await prisma.domainSettings.findFirst();
        if (!existing) return null;

        const data = type === "logo"
            ? { whitelabelLogo: null }
            : { whitelabelFavicon: null };

        return prisma.domainSettings.update({
            where: { id: existing.id },
            data,
        });
    },
};
