import { prisma } from "../../config/database.js";
import crypto from "crypto";

// ═══════════════════════════════════════
// ProposalAI — Dev Documents Service
// ═══════════════════════════════════════

class DevDocumentsService {
    // ── LIST ALL DOCUMENTS BY PROJECT ──
    async listByProject(projectId: string) {
        return prisma.devProjectDocument.findMany({
            where: { projectId },
            include: { uploadedBy: { select: { id: true, name: true } }, signatures: true },
            orderBy: { createdAt: "desc" },
        });
    }

    // ── LIST DOCS BY TYPE ──
    async listByType(projectId: string, docType: string) {
        return prisma.devProjectDocument.findMany({
            where: { projectId, docType },
            include: {
                uploadedBy: { select: { id: true, name: true } },
                signatures: { orderBy: { createdAt: "asc" } },
            },
            orderBy: { createdAt: "desc" },
        });
    }

    // ── COUNT BY TYPE ──
    async countByType(projectId: string) {
        const docs = await prisma.devProjectDocument.groupBy({
            by: ["docType"],
            where: { projectId },
            _count: { id: true },
        });
        const result: Record<string, number> = {};
        docs.forEach((d) => { result[d.docType] = d._count.id; });
        return result;
    }

    // ── CREATE DOCUMENT (upload) ──
    async create(
        projectId: string,
        docType: string,
        userId: string,
        data: { title: string; notes?: string; fileName: string; storedName: string; fileSize: number; mimeType: string }
    ) {
        // Get project signatories to create signature rows
        const signatories = await prisma.devProjectSignatory.findMany({
            where: { projectId },
            include: { project: { include: { contacts: true } } },
        });

        // Build email lookup: for team members, get from User; for clients, get from DevProjectContact
        const signatureData: { signatoryId: string; name: string; email: string; role: string }[] = [];
        for (const sig of signatories) {
            let email = "";
            if (sig.source === "team") {
                const user = await prisma.user.findUnique({ where: { id: sig.sourceId }, select: { email: true } });
                email = user?.email || "";
            } else {
                const contact = await prisma.devProjectContact.findUnique({ where: { id: sig.sourceId }, select: { email: true } });
                email = contact?.email || "";
            }
            signatureData.push({ signatoryId: sig.id, name: sig.name, email, role: sig.role });
        }

        const doc = await prisma.devProjectDocument.create({
            data: {
                projectId,
                docType,
                title: data.title,
                fileName: data.fileName,
                storedName: data.storedName,
                fileSize: data.fileSize,
                mimeType: data.mimeType,
                notes: data.notes,
                uploadedById: userId,
                signatures: {
                    create: signatureData.map((s) => ({
                        signatoryId: s.signatoryId,
                        name: s.name,
                        email: s.email,
                        role: s.role,
                        status: "pending",
                    })),
                },
            },
            include: { signatures: true, uploadedBy: { select: { id: true, name: true } } },
        });
        return doc;
    }

    // ── GET BY ID ──
    async getById(id: string) {
        return prisma.devProjectDocument.findUnique({
            where: { id },
            include: {
                uploadedBy: { select: { id: true, name: true } },
                signatures: { orderBy: { createdAt: "asc" } },
            },
        });
    }

    // ── DELETE ──
    async delete(id: string) {
        return prisma.devProjectDocument.delete({ where: { id } });
    }

    // ── SEND CODE TO SINGLE SIGNATORY ──
    async sendCode(signatureId: string) {
        const code = crypto.randomBytes(3).toString("hex").toUpperCase(); // 6-char hex
        return prisma.devDocSignature.update({
            where: { id: signatureId },
            data: { code, status: "code_sent" },
        });
    }

    // ── SEND CODES TO ALL PENDING ──
    async sendAllCodes(documentId: string) {
        const sigs = await prisma.devDocSignature.findMany({
            where: { documentId, status: "pending" },
        });
        for (const sig of sigs) {
            const code = crypto.randomBytes(3).toString("hex").toUpperCase();
            await prisma.devDocSignature.update({
                where: { id: sig.id },
                data: { code, status: "code_sent" },
            });
        }
        // Update document status to "sent"
        await prisma.devProjectDocument.update({
            where: { id: documentId },
            data: { status: "sent" },
        });
        return this.getById(documentId);
    }

    // ── VALIDATE CODE ──
    async validateCode(signatureId: string, code: string) {
        const sig = await prisma.devDocSignature.findUnique({ where: { id: signatureId } });
        if (!sig) throw new Error("Assinatura não encontrada");
        if (sig.code !== code) throw new Error("Código inválido");

        await prisma.devDocSignature.update({
            where: { id: signatureId },
            data: { status: "signed", signedAt: new Date() },
        });

        // Check if all signatures are done
        const allSigs = await prisma.devDocSignature.findMany({ where: { documentId: sig.documentId } });
        const allSigned = allSigs.every((s) => s.id === signatureId || s.status === "signed");
        if (allSigned) {
            await prisma.devProjectDocument.update({
                where: { id: sig.documentId },
                data: { status: "signed" },
            });
        }

        return this.getById(sig.documentId);
    }
}

export const devDocumentsService = new DevDocumentsService();
