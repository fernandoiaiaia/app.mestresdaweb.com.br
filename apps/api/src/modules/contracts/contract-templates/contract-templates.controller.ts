import { Request, Response } from 'express';
import { contractTemplatesService, aiPromptSchema } from './contract-templates.service.js';

export class ContractTemplatesController {
  
  async list(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;
      
      const result = await contractTemplatesService.list(page, limit, search);
      res.json({ success: true, data: result.items, pagination: { total: result.total, page: result.page, totalPages: result.totalPages } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const template = await contractTemplatesService.getById(req.params.id as string);
      if (!template) {
        return res.status(404).json({ success: false, error: { message: 'Template não encontrado' } });
      }
      res.json({ success: true, data: template });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const template = await contractTemplatesService.create(req.body);
      res.status(201).json({ success: true, data: template });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const template = await contractTemplatesService.update(req.params.id as string, req.body);
      res.json({ success: true, data: template });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await contractTemplatesService.delete(req.params.id as string);
      res.json({ success: true, message: 'Template deletado' });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  async generateWithAI(req: Request, res: Response) {
    try {
      const validatedData = aiPromptSchema.parse(req.body);
      const generatedHtml = await contractTemplatesService.generateWithAI(validatedData.prompt);
      res.json({ success: true, data: generatedHtml });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }
}

export const contractTemplatesController = new ContractTemplatesController();
