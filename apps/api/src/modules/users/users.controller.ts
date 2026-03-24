import type { Request, Response } from "express";
import { usersService } from "./users.service.js";

export const usersController = {
    // GET /api/users/me
    async getProfile(req: Request, res: Response) {
        const user = await usersService.getProfile(req.user!.userId);
        res.json({ success: true, data: user });
    },

    // PATCH /api/users/me
    async updateProfile(req: Request, res: Response) {
        const user = await usersService.updateProfile(req.user!.userId, req.body);
        res.json({ success: true, data: user });
    },

    // POST /api/users/me/password
    async changePassword(req: Request, res: Response) {
        const { currentPassword, newPassword } = req.body;
        const result = await usersService.changePassword(req.user!.userId, currentPassword, newPassword);
        res.json({ success: true, data: result });
    },

    // PATCH /api/users/me/2fa
    async toggle2fa(req: Request, res: Response) {
        const result = await usersService.toggle2fa(req.user!.userId, req.body.enabled);
        res.json({ success: true, data: result });
    },

    // POST /api/users/me/avatar
    async uploadAvatar(req: Request, res: Response) {
        const file = (req as any).file;
        if (!file) {
            // If no file, allow clearing avatar
            const user = await usersService.updateAvatar(req.user!.userId, null);
            res.json({ success: true, data: user });
            return;
        }
        const avatarUrl = `/uploads/avatars/${file.filename}`;
        const user = await usersService.updateAvatar(req.user!.userId, avatarUrl);
        res.json({ success: true, data: user });
    },

    // GET /api/users
    async listUsers(req: Request, res: Response) {
        const users = await usersService.listUsers();
        res.json({ success: true, data: users });
    },

    // GET /api/users/:id
    async getUserById(req: Request, res: Response) {
        const id = req.params.id as string;
        const user = await usersService.getUserById(id);
        res.json({ success: true, data: user });
    },

    // POST /api/users
    async createUser(req: Request, res: Response) {
        const user = await usersService.createUser(req.body);
        res.status(201).json({ success: true, data: user });
    },

    // PUT /api/users/:id
    async updateUser(req: Request, res: Response) {
        const id = req.params.id as string;
        const user = await usersService.updateUser(id, req.body);
        res.json({ success: true, data: user });
    },

    // DELETE /api/users/:id
    async deleteUser(req: Request, res: Response) {
        const id = req.params.id as string;
        const result = await usersService.deleteUser(id);
        res.json({ success: true, data: result });
    },

    // POST /api/users/:id/resend-invite
    async resendInvite(req: Request, res: Response) {
        const id = req.params.id as string;
        const result = await usersService.resendInvite(id);
        res.json({ success: true, data: result });
    },
};
