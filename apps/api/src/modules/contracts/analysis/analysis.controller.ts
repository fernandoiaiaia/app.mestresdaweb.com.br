import { Request, Response } from 'express';
import { contractAnalysisService, analysisPromptSchema } from './analysis.service.js';

export class ContractAnalysisController {
  async analyzeRisks(req: Request, res: Response) {
    try {
      const validatedData = analysisPromptSchema.parse(req.body);
      const result = await contractAnalysisService.analyzeRisks(validatedData);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }
}

export const contractAnalysisController = new ContractAnalysisController();
