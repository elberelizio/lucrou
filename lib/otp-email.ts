const RECOVERY_SUBJECT = 'Lucrou — Código para recuperar senha';

function recoveryEmailHtml(otp: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1B5E3B; margin-bottom: 16px;">Recuperar senha — Lucrou</h2>
      <p style="color: #333; line-height: 1.5;">
        Usa este código na app para definir uma nova senha:
      </p>
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1B5E3B; margin: 24px 0;">
        ${otp}
      </p>
      <p style="color: #666; font-size: 14px; line-height: 1.5;">
        O código é de uso único e expira em 24 horas. Se não pediste esta alteração, ignora este email.
      </p>
    </div>
  `.trim();
}

export async function sendRecoveryOtpEmail(
  to: string,
  otp: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    return { ok: false, error: 'Email não configurado (RESEND_API_KEY / EMAIL_FROM)' };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: RECOVERY_SUBJECT,
      html: recoveryEmailHtml(otp),
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.error('[otp-email] Resend:', response.status, body);
    return { ok: false, error: 'Falha ao enviar email com o código' };
  }

  return { ok: true };
}

export function hasCustomOtpEmailProvider(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}
