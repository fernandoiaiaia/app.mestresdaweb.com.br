import { z } from "zod";

export const upsertNotificationSettingsSchema = z.object({
    globalEnabled: z.boolean().optional(),
    quietHoursEnabled: z.boolean().optional(),
    quietStart: z.string().optional(),
    quietEnd: z.string().optional(),
    digestEnabled: z.boolean().optional(),
    digestFrequency: z.enum(["daily", "weekly"]).optional(),
});

const preferenceItemSchema = z.object({
    eventId: z.string().min(1),
    email: z.boolean(),
    push: z.boolean(),
    inApp: z.boolean(),
});

export const bulkUpsertPreferencesSchema = z.object({
    preferences: z.array(preferenceItemSchema),
});
