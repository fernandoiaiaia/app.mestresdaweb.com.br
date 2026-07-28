import { google, calendar_v3 } from "googleapis";
import { prisma } from "../../config/database.js";
import { logger } from "../../lib/logger.js";
import { IntegrationSetting } from "@prisma/client";

export class GoogleCalendarService {
    private createOAuthClient(setting: IntegrationSetting) {
        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
            throw new Error("Missing Google OAuth env vars");
        }

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );

        const creds = setting.credentials as any;
        oauth2Client.setCredentials({
            access_token: creds.access_token,
            refresh_token: creds.refresh_token,
            expiry_date: creds.expiry_date,
            token_type: creds.token_type,
        });

        // Automatically update DB if tokens are refreshed
        oauth2Client.on("tokens", async (tokens) => {
            const updatedCreds = { ...creds, ...tokens };
            await prisma.integrationSetting.update({
                where: { id: setting.id },
                data: { credentials: updatedCreds }
            });
        });

        return oauth2Client;
    }

    private async getUserSetting(userId: string) {
        const setting = await prisma.integrationSetting.findUnique({
            where: { userId_provider: { userId, provider: "google_calendar" } }
        });
        if (!setting || !setting.isActive || !setting.credentials) {
            throw new Error("Usuário não tem o Google Calendar conectado.");
        }
        return setting;
    }

    /**
     * Verifica disponibilidade de horário na agenda do usuário
     */
    async checkAvailability(userId: string, timeMin: Date, timeMax: Date): Promise<calendar_v3.Schema$TimePeriod[]> {
        const setting = await this.getUserSetting(userId);
        const auth = this.createOAuthClient(setting);
        const calendar = google.calendar({ version: "v3", auth });

        try {
            const res = await calendar.freebusy.query({
                requestBody: {
                    timeMin: timeMin.toISOString(),
                    timeMax: timeMax.toISOString(),
                    items: [{ id: "primary" }],
                }
            });

            const busy = res.data.calendars?.primary?.busy || [];
            return busy;
        } catch (error) {
            logger.error({ error }, "Error checking calendar availability");
            throw new Error("Falha ao consultar disponibilidade na agenda do Google.");
        }
    }

    /**
     * Agenda uma reunião
     */
    async bookMeeting(userId: string, data: {
        summary: string;
        description?: string;
        startTime: Date;
        endTime: Date;
        attendeeEmails: string[];
    }): Promise<string> {
        const setting = await this.getUserSetting(userId);
        const auth = this.createOAuthClient(setting);
        const calendar = google.calendar({ version: "v3", auth });

        try {
            const event: calendar_v3.Schema$Event = {
                summary: data.summary,
                description: data.description || "Reunião de Ideia agendada via Assistente Mestres da Web",
                start: { dateTime: data.startTime.toISOString(), timeZone: "America/Sao_Paulo" },
                end: { dateTime: data.endTime.toISOString(), timeZone: "America/Sao_Paulo" },
                attendees: data.attendeeEmails.map(email => ({ email })),
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: "email", minutes: 60 },
                        { method: "popup", minutes: 15 }
                    ]
                },
                conferenceData: {
                    createRequest: {
                        requestId: Math.random().toString(36).substring(7),
                        conferenceSolutionKey: { type: "hangoutsMeet" }
                    }
                }
            };

            const res = await calendar.events.insert({
                calendarId: "primary",
                conferenceDataVersion: 1, // needed to create Meet link
                sendUpdates: "all", // send email to attendees
                requestBody: event,
            });

            if (!res.data.htmlLink) {
                throw new Error("Evento criado, mas link não retornado");
            }

            return res.data.htmlLink;
        } catch (error) {
            logger.error({ error }, "Error booking meeting");
            throw new Error("Falha ao agendar reunião no Google Calendar.");
        }
    }
}
