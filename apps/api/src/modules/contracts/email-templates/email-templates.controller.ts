import { Request, Response } from 'express';
import { emailTemplatesService } from './email-templates.service.js';

export class EmailTemplatesController {
  
  async list(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await emailTemplatesService.list(page, limit);
      res.json({ success: true, data: result.items, pagination: { total: result.total, page: result.page, totalPages: result.totalPages } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const template = await emailTemplatesService.getById(req.params.id as string);
      if (!template) {
        return res.status(404).json({ success: false, error: { message: 'Template not found' } });
      }
      res.json({ success: true, data: template });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { name, subject, content, type, isDefault } = req.body;
      const template = await emailTemplatesService.create({ name, subject, content, type, isDefault });
      res.status(201).json({ success: true, data: template });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const template = await emailTemplatesService.update(req.params.id as string, req.body);
      res.json({ success: true, data: template });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await emailTemplatesService.delete(req.params.id as string);
      res.json({ success: true, message: 'Template deleted' });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }
}

export const emailTemplatesController = new EmailTemplatesController();
