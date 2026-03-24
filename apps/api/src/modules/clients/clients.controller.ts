import { Request, Response } from "express";
import { clientsService } from "./clients.service.js";

export const clientsController = {
    async create(req: Request, res: Response) {
        const client = await clientsService.create(req.body, req.user!);
        res.status(201).json({ success: true, data: client });
    },

    async bulkCreate(req: Request, res: Response) {
        const result = await clientsService.bulkCreate(req.body.clients, req.user!);
        res.status(201).json({ success: true, data: result, message: `${result.count} clientes importados com sucesso` });
    },

    async list(req: Request, res: Response) {
        const query = {
            search: typeof req.query.search === 'string' ? req.query.search : undefined,
            status: typeof req.query.status === 'string' ? req.query.status : undefined,
            segment: typeof req.query.segment === 'string' ? req.query.segment : undefined,
        };
        const clients = await clientsService.list(req.user!, query);
        res.json({ success: true, data: clients });
    },

    async getById(req: Request, res: Response) {
        const id = req.params.id as string;
        const client = await clientsService.getById(id, req.user!);
        res.json({ success: true, data: client });
    },

    async update(req: Request, res: Response) {
        const id = req.params.id as string;
        const client = await clientsService.update(id, req.body, req.user!);
        res.json({ success: true, data: client });
    },

    async delete(req: Request, res: Response) {
        const id = req.params.id as string;
        await clientsService.delete(id, req.user!);
        res.json({ success: true, message: "Cliente deletado com sucesso" });
    },
};
