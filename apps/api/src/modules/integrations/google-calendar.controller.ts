import { Router, Request, Response } from "express";
import { prisma } from "../../config/database.js";
import { logger } from "../../lib/logger.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { google } from "googleapis";

const router = Router();

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI // e.g. https://api.mestresdaweb.com.br/api/integrations/google/callback
);

const SCOPES = [
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
];

/**
 * GET /api/integrations/google/auth-url
 * Returns the Google OAuth2 consent screen URL
 */
router.get("/auth-url", authMiddleware, (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, error: "Não autorizado" });
            return;
        }

        // Validate required env vars
        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
            logger.error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET env vars");
            res.status(500).json({ 
                success: false, 
                error: "Credenciais OAuth do Google não configuradas no servidor. Contate o administrador para configurar GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET." 
            });
            return;
        }
        if (!process.env.GOOGLE_REDIRECT_URI) {
            logger.error("Missing GOOGLE_REDIRECT_URI env var");
            res.status(500).json({ 
                success: false, 
                error: "GOOGLE_REDIRECT_URI não configurada no servidor. Contate o administrador." 
            });
            return;
        }

        // Generate a url that asks permissions for Google Calendar scopes
        const url = oauth2Client.generateAuthUrl({
            access_type: "offline",
            prompt: "consent", // Force to get refresh token
            scope: SCOPES,
            state: userId // pass userId as state to retrieve it in the callback
        });

        logger.info({ userId, urlPrefix: url.substring(0, 60) }, "Generated Google Auth URL");
        res.json({ success: true, data: { url } });
    } catch (err) {
        logger.error({ err }, "Error generating Google Auth URL");
        res.status(500).json({ success: false, error: "Falha ao gerar URL do Google" });
    }
});

/**
 * GET /api/integrations/google/callback
 * Handles the OAuth2 callback from Google
 */
router.get("/callback", async (req: Request, res: Response) => {
    const { code, state, error } = req.query;

    if (error) {
        logger.error({ error }, "Google OAuth error");
        // Redirect to frontend with error
        res.redirect(`${process.env.FRONTEND_URL || "https://advisor.mestresdaweb.com.br"}/dashboard/settings/integrations/sdr_google_calendar?error=google_auth_failed`);
        return;
    }

    if (!code || !state) {
        res.status(400).send("Faltando código ou state");
        return;
    }

    const userId = state as string;

    try {
        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code as string);

        // Get user info to save email
        oauth2Client.setCredentials(tokens);
        const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" });
        const userInfo = await oauth2.userinfo.get();
        
        // Save to IntegrationSetting
        await prisma.integrationSetting.upsert({
            where: {
                userId_provider: {
                    userId: userId,
                    provider: "google_calendar"
                }
            },
            create: {
                userId: userId,
                provider: "google_calendar",
                isActive: true,
                credentials: {
                    access_token: tokens.access_token,
                    refresh_token: tokens.refresh_token,
                    expiry_date: tokens.expiry_date
                },
                metadata: {
                    email: userInfo.data.email,
                    name: userInfo.data.name
                }
            },
            update: {
                isActive: true,
                credentials: {
                    access_token: tokens.access_token,
                    // Only update refresh token if provided (Google only sends it on first consent)
                    ...(tokens.refresh_token ? { refresh_token: tokens.refresh_token } : {}),
                    expiry_date: tokens.expiry_date
                },
                metadata: {
                    email: userInfo.data.email,
                    name: userInfo.data.name
                }
            }
        });

        // Redirect back to integrations page
        res.redirect(`${process.env.FRONTEND_URL || "https://advisor.mestresdaweb.com.br"}/dashboard/settings/integrations/sdr_google_calendar?success=google_calendar_connected`);

    } catch (err) {
        logger.error({ err }, "Error in Google callback");
        res.redirect(`${process.env.FRONTEND_URL || "https://advisor.mestresdaweb.com.br"}/dashboard/settings/integrations/sdr_google_calendar?error=google_callback_failed`);
    }
});

/**
 * DELETE /api/integrations/google/disconnect
 * Removes the Google Calendar connection
 */
router.delete("/disconnect", authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, error: "Não autorizado" });
            return;
        }

        await prisma.integrationSetting.deleteMany({
            where: {
                userId: userId,
                provider: "google_calendar"
            }
        });

        res.json({ success: true });
    } catch (err) {
        logger.error({ err }, "Error disconnecting Google Calendar");
        res.status(500).json({ success: false, error: "Falha ao desconectar Google Calendar" });
    }
});

export const googleIntegrationRoutes: import("express").Router = router;
