import { NextRequest } from 'next/server';

/**
 * Senha admin — APENAS ADMIN_PASSWORD (servidor).
 * Nunca usar NEXT_PUBLIC_ADMIN_PASSWORD: o prefixo NEXT_PUBLIC_
 * embute o valor no JavaScript do browser.
 */
export function getAdminPassword(): string | null {
  const password = process.env.ADMIN_PASSWORD?.trim();
  return password || null;
}

export function isAdminAuthenticated(request: NextRequest): boolean {
  const passwordHeader = request.headers.get('x-admin-password');
  const adminPassword = getAdminPassword();
  if (!adminPassword || !passwordHeader) return false;
  return passwordHeader.trim() === adminPassword;
}

/** Requisitos mínimos de senha (servidor). */
export function validatePasswordStrength(password: string): string | null {
  if (typeof password !== 'string' || password.length < 8) {
    return 'A senha deve ter pelo menos 8 caracteres';
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'A senha deve incluir letras e números';
  }
  return null;
}

/** Remove tags HTML básicas de texto livre (anti-XSS em armazenamento). */
export function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/javascript:/gi, '')
    .trim();
}
