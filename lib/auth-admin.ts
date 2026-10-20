import type { AuthError, User } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase';

export function isAuthEmailExistsError(error: AuthError | null | undefined): boolean {
  if (!error) return false;
  const msg = error.message.toLowerCase();
  return (
    error.status === 422 ||
    error.code === 'email_exists' ||
    msg.includes('already been registered') ||
    msg.includes('already registered') ||
    msg.includes('already exists') ||
    msg.includes('user already')
  );
}

export async function findAuthUserByEmail(email: string): Promise<User | null> {
  const cleanEmail = email.trim().toLowerCase();
  let page = 1;
  const perPage = 200;

  while (page <= 10) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error || !data?.users?.length) return null;

    const found = data.users.find((u) => u.email?.toLowerCase() === cleanEmail);
    if (found) return found;

    if (data.users.length < perPage) return null;
    page += 1;
  }

  return null;
}

/** Resolve auth user via usuarios table (fast) then fallback to auth list. */
export async function resolveAuthUserForEmail(email: string): Promise<User | null> {
  const cleanEmail = email.trim().toLowerCase();

  const { data: usuario } = await supabaseAdmin
    .from('usuarios')
    .select('id')
    .eq('email', cleanEmail)
    .maybeSingle();

  if (usuario?.id) {
    const { data: byId } = await supabaseAdmin.auth.admin.getUserById(usuario.id);
    if (byId?.user?.email?.toLowerCase() === cleanEmail) {
      return byId.user;
    }
  }

  return findAuthUserByEmail(cleanEmail);
}
