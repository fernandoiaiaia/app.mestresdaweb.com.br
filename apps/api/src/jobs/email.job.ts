import { logger } from "../lib/logger.js";

// Placeholder for email sending job
// Will use BullMQ when email integration is configured

export interface EmailJobData {
    to: string;
    subject: string;
    html: string;
}

export async function processEmailJob(data: EmailJobData): Promise<void> {
    logger.info({ to: data.to, subject: data.subject }, "📧 Processing email job");
    // TODO: Integrate with SMTP/SES when ready
}
