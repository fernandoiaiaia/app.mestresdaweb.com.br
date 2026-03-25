// ═══════════════════════════════════════
// 2FA Email Service — Brevo
// ═══════════════════════════════════════

import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { getSystemEmailConfig } from "../../lib/email-config.js";

/**
 * Send a 2FA verification code via Brevo
 */
export async function send2faEmail(to: string, code: string, userName: string): Promise<void> {
  const { apiKey, fromEmail, fromName } = await getSystemEmailConfig();
  
  if (!apiKey) {
    logger.warn("BREVO_API_KEY not configured — 2FA email not sent. Code: " + code);
    return;
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;border:1px solid rgba(255,255,255,0.06);overflow:hidden;">
  <!-- Header -->
  <tr><td style="padding:32px 32px 20px;text-align:center;">
    <div style="font-size:24px;font-weight:800;color:#fff;letter-spacing:-0.5px;">🔐 Código de Verificação</div>
    <div style="font-size:14px;color:#94a3b8;margin-top:8px;">Olá, <strong style="color:#fff;">${userName}</strong></div>
  </td></tr>
  <!-- Code -->
  <tr><td style="padding:0 32px 24px;text-align:center;">
    <div style="background:#0f172a;border:2px solid #22c55e;border-radius:12px;padding:24px;margin:0 auto;max-width:280px;">
      <div style="font-size:36px;font-weight:900;letter-spacing:12px;color:#22c55e;font-family:monospace;">${code}</div>
    </div>
  </td></tr>
  <!-- Info -->
  <tr><td style="padding:0 32px 32px;text-align:center;">
    <p style="color:#94a3b8;font-size:13px;margin:0 0 8px;">Use este código para completar seu login.</p>
    <p style="color:#64748b;font-size:12px;margin:0;">⏱ Válido por <strong style="color:#f59e0b;">10 minutos</strong></p>
    <p style="color:#475569;font-size:11px;margin:16px 0 0;">Se você não solicitou este código, ignore este e-mail.</p>
  </td></tr>
  <!-- Footer -->
  <tr><td style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
    <p style="color:#475569;font-size:11px;margin:0;">ProposalAI — Cezani</p>
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
        "Accept": "application/json",
      },
      body: JSON.stringify({
        sender: { email: fromEmail, name: fromName },
        to: [{ email: to }],
        subject: `${code} — Código de Verificação ProposalAI`,
        htmlContent: html,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      logger.error({ status: response.status, err }, "Brevo 2FA email error");
    } else {
      logger.info({ to }, "2FA code email sent via Brevo");
    }
  } catch (err) {
    logger.error({ err }, "Error sending 2FA email via Brevo");
  }
}
