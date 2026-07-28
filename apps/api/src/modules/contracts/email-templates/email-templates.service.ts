import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class EmailTemplatesService {
  
  async list(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.contractEmailTemplate.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.contractEmailTemplate.count()
    ]);
    return {
      items: data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getById(id: string) {
    return prisma.contractEmailTemplate.findUnique({
      where: { id }
    });
  }

  async create(data: { name: string; subject: string; content: string; type: string; isDefault?: boolean }) {
    if (data.isDefault) {
      await prisma.contractEmailTemplate.updateMany({
        where: { type: data.type, isDefault: true },
        data: { isDefault: false }
      });
    }

    return prisma.contractEmailTemplate.create({
      data: {
        name: data.name,
        subject: data.subject,
        content: data.content,
        type: data.type,
        isDefault: data.isDefault || false
      }
    });
  }

  async update(id: string, data: { name?: string; subject?: string; content?: string; type?: string; isDefault?: boolean }) {
    if (data.isDefault && data.type) {
      await prisma.contractEmailTemplate.updateMany({
        where: { 
          type: data.type, 
          isDefault: true,
          id: { not: id } 
        },
        data: { isDefault: false }
      });
    }

    return prisma.contractEmailTemplate.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return prisma.contractEmailTemplate.delete({
      where: { id }
    });
  }

}

export const emailTemplatesService = new EmailTemplatesService();
