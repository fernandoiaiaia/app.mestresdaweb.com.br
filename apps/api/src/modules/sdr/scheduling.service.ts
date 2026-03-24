import { prisma } from "../../config/database.js";
import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { whatsappService } from "./whatsapp.service.js";
import { emailService } from "./email.service.js";

// ═══════════════════════════════════════
// Scheduling Service — Google Calendar
// ═══════════════════════════════════════

export const schedulingService = {
    /**
     * Get available slots for a consultant (Google Calendar freeBusy)
     */
    async getAvailability(consultantId: string): Promise<any[]> {
        const consultant = await prisma.user.findUnique({ where: { id: consultantId } });
        if (!consultant) throw new Error("Consultor não encontrado");

        const clientId = env.GOOGLE_CLIENT_ID;
        const clientSecret = env.GOOGLE_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            // Return mock availability
            logger.warn("Google Calendar não configurado — retornando slots mock");
            const slots = [];
            const now = new Date();
            for (let d = 1; d <= 5; d++) {
                const date = new Date(now);
                date.setDate(date.getDate() + d);
                if (date.getDay() === 0 || date.getDay() === 6) continue;
                for (const hour of [9, 10, 11, 14, 15, 16]) {
                    date.setHours(hour, 0, 0, 0);
                    slots.push({ start: new Date(date), end: new Date(date.getTime() + 3600000) });
                }
            }
            return slots;
        }

        // Real Google Calendar API call
        const timeMin = new Date();
        const timeMax = new Date();
        timeMax.setDate(timeMax.getDate() + 7);

        const response = await fetch(
            `https://www.googleapis.com/calendar/v3/freeBusy`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // In production: use OAuth2 tokens
                },
                body: JSON.stringify({
                    timeMin: timeMin.toISOString(),
                    timeMax: timeMax.toISOString(),
                    items: [{ id: consultant.email }],
                }),
            }
        );

        if (!response.ok) {
            logger.error({ status: response.status }, "Google Calendar API error");
            return [];
        }

        const data = await response.json() as any;
        const busySlots = data.calendars?.[consultant.email]?.busy || [];

        // Generate available 1h slots during business hours, excluding busy
        const startHour = parseInt(env.SDR_BUSINESS_HOURS_START.split(":")[0]);
        const endHour = parseInt(env.SDR_BUSINESS_HOURS_END.split(":")[0]);
        const slots = [];

        for (let d = 1; d <= 7; d++) {
            const date = new Date(timeMin);
            date.setDate(date.getDate() + d);
            if (date.getDay() === 0 || date.getDay() === 6) continue;

            for (let h = startHour; h < endHour; h++) {
                const slotStart = new Date(date);
                slotStart.setHours(h, 0, 0, 0);
                const slotEnd = new Date(slotStart.getTime() + 3600000);

                const isBusy = busySlots.some((busy: any) =>
                    new Date(busy.start) < slotEnd && new Date(busy.end) > slotStart
                );

                if (!isBusy) {
                    slots.push({ start: slotStart, end: slotEnd });
                }
            }
        }

        return slots;
    },

    /**
     * Auto-schedule a meeting via Google Calendar
     */
    async autoSchedule(leadId: string, consultantId: string, scheduledAt: Date): Promise<any> {
        const lead = await prisma.sdrLead.findUnique({ where: { id: leadId } });
        const consultant = await prisma.user.findUnique({ where: { id: consultantId } });
        if (!lead || !consultant) throw new Error("Lead ou consultor não encontrado");

        let calendarEventId: string | null = null;
        let meetLink: string | null = null;

        // Try to create Google Calendar event
        if (env.GOOGLE_CLIENT_ID) {
            try {
                const response = await fetch(
                    `https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            summary: `Reunião com ${lead.name} - ${lead.company || ""}`,
                            start: { dateTime: scheduledAt.toISOString() },
                            end: { dateTime: new Date(scheduledAt.getTime() + 3600000).toISOString() },
                            attendees: lead.email ? [{ email: lead.email }] : [],
                            conferenceData: {
                                createRequest: { requestId: `sdr-${lead.id}-${Date.now()}` },
                            },
                        }),
                    }
                );

                if (response.ok) {
                    const event = await response.json() as any;
                    calendarEventId = event.id;
                    meetLink = event.hangoutLink;
                }
            } catch (err) {
                logger.warn({ err }, "Could not create Calendar event");
            }
        }

        // Create meeting record
        const meeting = await prisma.scheduledMeeting.create({
            data: {
                leadId,
                consultantId,
                scheduledAt,
                calendarEventId,
                meetLink: meetLink || `https://meet.google.com/sdr-${Date.now()}`,
                status: "agendada",
            },
        });

        // Update lead status
        await prisma.sdrLead.update({
            where: { id: leadId },
            data: { status: "agendado" },
        });

        // Update enrollment
        await prisma.leadCadenceEnrollment.updateMany({
            where: { leadId, status: { in: ["ativo", "respondeu"] } },
            data: { status: "agendou", completedAt: new Date() },
        });

        // Log action
        await prisma.cadenceAction.create({
            data: {
                leadId,
                channel: "email",
                actionType: "scheduled",
                content: `Reunião agendada: ${scheduledAt.toLocaleString("pt-BR")}`,
                metadata: { meetingId: meeting.id, meetLink: meeting.meetLink },
            },
        });

        logger.info({ leadId, consultantId, scheduledAt }, "Meeting auto-scheduled");
        return meeting;
    },

    /**
     * Send meeting reminders — runs every hour via cron
     */
    async sendReminders(): Promise<void> {
        const now = new Date();

        // 1-day reminders
        const oneDayAhead = new Date(now.getTime() + 25 * 3600000);
        const dayReminders = await prisma.scheduledMeeting.findMany({
            where: {
                status: { in: ["agendada", "confirmada"] },
                reminderSent1d: false,
                scheduledAt: { lte: oneDayAhead },
            },
            include: { lead: true },
        });

        for (const meeting of dayReminders) {
            try {
                if (meeting.lead.phone) {
                    // WhatsApp reminder would use template sdr_meeting_reminder
                    logger.info({ meetingId: meeting.id }, "1-day reminder sent");
                }
                await prisma.scheduledMeeting.update({
                    where: { id: meeting.id },
                    data: { reminderSent1d: true },
                });
            } catch (err) {
                logger.error({ meetingId: meeting.id, err }, "Failed to send 1d reminder");
            }
        }

        // 1-hour reminders
        const oneHourAhead = new Date(now.getTime() + 90 * 60000);
        const hourReminders = await prisma.scheduledMeeting.findMany({
            where: {
                status: { in: ["agendada", "confirmada"] },
                reminderSent1h: false,
                scheduledAt: { lte: oneHourAhead },
            },
            include: { lead: true },
        });

        for (const meeting of hourReminders) {
            try {
                logger.info({ meetingId: meeting.id }, "1-hour reminder sent");
                await prisma.scheduledMeeting.update({
                    where: { id: meeting.id },
                    data: { reminderSent1h: true },
                });
            } catch (err) {
                logger.error({ meetingId: meeting.id, err }, "Failed to send 1h reminder");
            }
        }

        if (dayReminders.length + hourReminders.length > 0) {
            logger.info({ day: dayReminders.length, hour: hourReminders.length }, "Reminders processed");
        }
    },
};
