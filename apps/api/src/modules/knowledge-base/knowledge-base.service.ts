import { prisma } from "../../config/database.js";

export class KnowledgeBaseService {
    static async getFilesByUser(userId: string) {
        return prisma.knowledgeBaseFile.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" }
        });
    }

    static async uploadFile(userId: string, data: { name: string; content: string; sizeBytes?: number }) {
        return prisma.knowledgeBaseFile.create({
            data: {
                userId,
                name: data.name,
                content: data.content,
                sizeBytes: data.sizeBytes || Buffer.byteLength(data.content, "utf8"),
            }
        });
    }

    static async deleteFile(userId: string, fileId: string) {
        // First check if the file belongs to the user
        const file = await prisma.knowledgeBaseFile.findUnique({
            where: { id: fileId }
        });

        if (!file || file.userId !== userId) {
            throw new Error("NOT_FOUND");
        }

        return prisma.knowledgeBaseFile.delete({
            where: { id: fileId }
        });
    }
}
