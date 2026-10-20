/**
 * Configura o template de email "Reset password" no Supabase para enviar código OTP.
 *
 * Uso:
 *   1. Cria token em https://supabase.com/dashboard/account/tokens
 *   2. No .env.local:
 *        SUPABASE_ACCESS_TOKEN=sbp_...
 *        NEXT_PUBLIC_SUPABASE_URL=https://XXXX.supabase.co
 *   3. npm run configurar:otp
 */
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!accessToken) {
  console.error('❌ Falta SUPABASE_ACCESS_TOKEN no .env.local');
  console.error('   Cria em: https://supabase.com/dashboard/account/tokens');
  process.exit(1);
}

if (!supabaseUrl) {
  console.error('❌ Falta NEXT_PUBLIC_SUPABASE_URL no .env.local');
  process.exit(1);
}

const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
if (!projectRef) {
  console.error('❌ URL Supabase inválida:', supabaseUrl);
  process.exit(1);
}

const recoverySubject = 'Lucrou — Código para recuperar senha';
const recoveryContent = `<h2>Recuperar senha — Lucrou</h2>
<p>Usa este código na app para definir uma nova senha:</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:4px;color:#1B5E3B;">{{ .Token }}</p>
<p style="color:#666;font-size:14px;">O código é de uso único e expira em 24 horas. Se não pediste esta alteração, ignora este email.</p>`;

console.log(`🔧 A configurar OTP no projecto ${projectRef}...\n`);

const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    mailer_subjects_recovery: recoverySubject,
    mailer_templates_recovery_content: recoveryContent,
    mailer_otp_exp: 86400,
  }),
});

if (!response.ok) {
  const body = await response.text();
  console.error('❌ Erro ao actualizar template:', response.status, body);
  process.exit(1);
}

console.log('✅ Template "Reset password" configurado para enviar código OTP ({{ .Token }})');
console.log('✅ Expiração OTP: 24 horas (86400 s)');
console.log('\nTesta em Conta → Esqueceste a senha?');
