import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Config validation
const hasValidConfig =
  !!supabaseUrl &&
  !!supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  supabaseUrl.includes('.supabase.co');

const isProd = process.env.NODE_ENV === 'production';

if (!hasValidConfig && isProd) {
  throw new Error(
    'Supabase não está configurado em produção. Verifique NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no Vercel.'
  );
}

// PUBLIC CLIENT — used in the browser
// Uses anon key, respects RLS policies
// Safe to use in components and hooks
export const supabase = hasValidConfig
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-key');

// ADMIN CLIENT — used only in server-side API routes (app/api/)
// Uses service_role key, bypasses RLS
// NEVER import this in components, hooks, or any 'use client' file
export const supabaseAdmin = (supabaseServiceKey && hasValidConfig)
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-key');
