import { usersRepository } from "./users.repository.js";
import { ConflictError, NotFoundError, UnauthorizedError } from "../../lib/errors.js";
import { hashPassword, comparePassword } from "../../lib/hash.js";
import { signAccessToken } from "../../lib/jwt.js";
import { sendInviteEmail } from "./email-invite.service.js";
import { authRepository } from "../auth/auth.repository.js";
import { logger } from "../../lib/logger.js";
import type { CreateUserInput, UpdateUserFullInput, UpdateUserInput } from "./users.schemas.js";

export const usersService = {
    async getProfile(userId: string) {
        const user = await usersRepository.findById(userId);
        if (!user) throw new NotFoundError("Usuário não encontrado");
        return user;
    },

    async updateProfile(userId: string, data: UpdateUserInput) {
        const user = await usersRepository.findById(userId);
        if (!user) throw new NotFoundError("Usuário não encontrado");
        return usersRepository.update(userId, data);
    },

    async changePassword(userId: string, currentPassword: string, newPassword: string) {
        const user = await usersRepository.findByIdWithPassword(userId);
        if (!user) throw new NotFoundError("Usuário não encontrado");

        const valid = await comparePassword(currentPassword, user.password);
        if (!valid) throw new UnauthorizedError("Senha atual incorreta");

        const hashed = await hashPassword(newPassword);
        await usersRepository.updatePassword(userId, hashed);
        return { message: "Senha alterada com sucesso" };
    },

    async toggle2fa(userId: string, enabled: boolean) {
        const user = await usersRepository.findById(userId);
        if (!user) throw new NotFoundError("Usuário não encontrado");
        return usersRepository.updateTwoFactor(userId, enabled);
    },

    async updateAvatar(userId: string, avatarUrl: string | null) {
        const user = await usersRepository.findById(userId);
        if (!user) throw new NotFoundError("Usuário não encontrado");
        return usersRepository.updateAvatar(userId, avatarUrl);
    },

    async listUsers() {
        return usersRepository.findAll();
    },

    async getUserById(userId: string) {
        const user = await usersRepository.findById(userId);
        if (!user) throw new NotFoundError("Usuário não encontrado");
        return user;
    },

    async createUser(data: CreateUserInput) {
        // Check if email already exists
        const existing = await usersRepository.findByEmail(data.email);
        if (existing) throw new ConflictError("E-mail já está em uso");

        const hashedPassword = await hashPassword(data.password);

        const { permissions, ...userData } = data;

        return usersRepository.createWithPermissions({
            ...userData,
            password: hashedPassword,
            permissions: permissions ?? [],
        });
    },

    async updateUser(userId: string, data: UpdateUserFullInput) {
        const user = await usersRepository.findById(userId);
        if (!user) throw new NotFoundError("Usuário não encontrado");

        // Check email conflict if changing email
        if (data.email && data.email !== user.email) {
            const existing = await usersRepository.findByEmail(data.email);
            if (existing) throw new ConflictError("E-mail já está em uso");
        }

        const { permissions, ...userData } = data;

        return usersRepository.updateWithPermissions(userId, userData, permissions);
    },

    async deleteUser(userId: string) {
        const user = await usersRepository.findById(userId);
        if (!user) throw new NotFoundError("Usuário não encontrado");
        await usersRepository.deleteUser(userId);
        return { deleted: true };
    },

    async resendInvite(userId: string) {
        const user = await usersRepository.findById(userId);
        if (!user) throw new NotFoundError("Usuário não encontrado");

        // Generate a reset code so the invited user can set their password
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24h for invites

        await authRepository.createVerificationCode({
            userId: user.id,
            code,
            type: "password_reset",
            expiresAt,
        });

        const resetToken = signAccessToken(
            { userId: user.id, purpose: "password_reset", code },
            "24h"
        );

        // Send invite email (async — don't block response)
        sendInviteEmail(user.email, user.name, resetToken).catch((err) => {
            logger.error({ err }, "Failed to send invite email");
        });

        return { message: "Convite reenviado com sucesso" };
    },
};
