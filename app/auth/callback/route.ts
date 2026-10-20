import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// This route handles the Magic Link redirect
// Supabase sends the user here after they click the link in their email
// URL format: /auth/callback?code=xxxx&next=/resultado
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/calculador?modo=modoA';
  const response = NextResponse.redirect(`${requestUrl.origin}${next}`);
  const cookieStore = await cookies();

  if (code) {
    // Exchange the temporary code for a real session
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options) {
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options) {
            response.cookies.set({ name, value: '', ...options, maxAge: 0 });
          },
        },
      }
    );
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Redirect to the page the user was on before login
  return response;
}
