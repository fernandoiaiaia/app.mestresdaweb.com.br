// ═══════════════════════════════════════
// User Invite Email Service — Brevo
// ═══════════════════════════════════════

import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";

/**
 * Send a welcome/invite email to a newly created user via Brevo.
 * Includes a link to set their password (uses the password reset flow).
 */
export async function sendInviteEmail(
    to: string,
    userName: string,
    resetToken: string
): Promise<void> {
    const apiKey = env.BREVO_API_KEY;
    const frontendUrl = env.FRONTEND_URL || "http://localhost:1100";
    const resetLink = `${frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

    if (!apiKey) {
        logger.warn(
            "BREVO_API_KEY not configured — invite email not sent. Setup link: " + resetLink
        );
        return;
    }

    const fromEmail = env.BREVO_FROM_EMAIL || "noreply@mestresdaweb.com.br";
    const fromName = env.BREVO_FROM_NAME || "ProposalAI";

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;border:1px solid rgba(255,255,255,0.06);overflow:hidden;">
  <tr><td style="padding:32px 32px 20px;text-align:center;">
    <div style="font-size:24px;font-weight:800;color:#fff;letter-spacing:-0.5px;">🎉 Bem-vindo ao ProposalAI</div>
    <div style="font-size:14px;color:#94a3b8;margin-top:8px;">Olá, <strong style="color:#fff;">${userName}</strong>!</div>
  </td></tr>
  <tr><td style="padding:0 32px 24px;text-align:center;">
    <p style="color:#94a3b8;font-size:14px;margin:0 0 20px;line-height:1.6;">
      Você foi convidado para usar o ProposalAI.<br/>
      Clique no botão abaixo para configurar sua senha e acessar o sistema.
    </p>
    <a href="${resetLink}" style="display:inline-block;background:#22c55e;color:#fff;font-weight:700;font-size:14px;padding:14px 32px;border-radius:10px;text-decoration:none;letter-spacing:0.5px;">
      Configurar Minha Senha
    </a>
  </td></tr>
  <tr><td style="padding:0 32px 32px;text-align:center;">
    <p style="color:#64748b;font-size:12px;margin:0 0 8px;">⏱ Este link é válido por <strong style="color:#f59e0b;">24 horas</strong></p>
    <p style="color:#475569;font-size:11px;margin:0;">Se você não reconhece este convite, ignore este e-mail.</p>
  </td></tr>
  <tr><td style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
    <p style="color:#475569;font-size:11px;margin:0;">ProposalAI — Mestres da Web</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

    try {
        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "api-key": apiKey,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                sender: { email: fromEmail, name: fromName },
                to: [{ email: to }],
                subject: "Bem-vindo ao ProposalAI — Configure sua Senha",
                htmlContent: html,
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            logger.error({ status: response.status, err }, "Brevo invite email error");
        } else {
            logger.info({ to }, "Invite email sent via Brevo");
        }
    } catch (err) {
        logger.error({ err }, "Error sending invite email via Brevo");
    }
}
