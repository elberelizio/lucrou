'use client';

import { useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { UsuarioData, PlanoUtilizador } from '@/lib/types';
import { MODO_LANCAMENTO_GRATUITO } from '@/lib/limites';
import { getOrCreateVisitorId } from '@/lib/analytics';
import { readStoredLocale } from '@/lib/i18n/clientLocale';
import { translate } from '@/lib/i18n/messages';

interface AuthState {
  session: Session | null;
  usuario: UsuarioData | null;
  plano: PlanoUtilizador;
  totalCalculos: number;
  loading: boolean;
  isAuthenticated: boolean;
}

interface UseAuthReturn extends AuthState {
  enviarMagicLink: (email: string, redirectPath?: string) => Promise<{ error: string | null }>;
  criarContaPremium: (dados: {
    email: string;
    password: string;
    nome: string;
    nomeNegocio: string;
  }) => Promise<{ error: string | null }>;
  ativarCodigoPremium: (codigo: string) => Promise<{ error: string | null }>;
  criarContaGratuita: (email: string, password: string) => Promise<{ error: string | null; code?: string }>;
  loginComSenha: (email: string, password: string) => Promise<{ error: string | null; code?: string }>;
  pedirCodigoResetSenha: (email: string) => Promise<{ error: string | null; code?: string; info?: string }>;
  redefinirSenhaComCodigo: (
    email: string,
    codigo: string,
    password: string
  ) => Promise<{ error: string | null; code?: string }>;
  logout: () => Promise<void>;
  atualizarTotalCalculos: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    session: null,
    usuario: null,
    plano: 'gratuito',
    totalCalculos: 0,
    loading: true,
    isAuthenticated: false,
  });

  // Load user data from our API route (server-side, uses service_role)
  const loadUserData = useCallback(async (session: Session) => {
    try {
      const visitorId = getOrCreateVisitorId();
      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'x-visitor-id': visitorId,
        },
      });

      if (!response.ok) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      const data = await response.json();
      const planoEfetivo: PlanoUtilizador = MODO_LANCAMENTO_GRATUITO
        ? 'premium'
        : data.usuario.plano;

      setState(prev => ({
        ...prev,
        session,
        usuario: data.usuario,
        plano: planoEfetivo,
        totalCalculos: data.totalCalculos,
        isAuthenticated: true,
        loading: false,
      }));
    } catch {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Listen to Supabase Auth session changes
  useEffect(() => {
    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        loadUserData(session);
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    });

    // React to login/logout events in real time
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          await loadUserData(session);
        } else {
          setState({
            session: null,
            usuario: null,
            plano: 'gratuito',
            totalCalculos: 0,
            loading: false,
            isAuthenticated: false,
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [loadUserData]);

  // Send Magic Link — free user login (no password needed)
  const enviarMagicLink = useCallback(async (
    email: string,
    redirectPath?: string
  ): Promise<{ error: string | null }> => {
    try {
      const callbackUrl = redirectPath
        ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectPath)}`
        : `${window.location.origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: callbackUrl },
      });

      if (error) return { error: translate(readStoredLocale(), 'auth.linkFalhou') };
      return { error: null };
    } catch {
      return { error: translate(readStoredLocale(), 'auth.erroInesperado') };
    }
  }, []);

  // Create premium account — calls server API route
  const criarContaPremium = useCallback(async (dados: {
    email: string;
    password: string;
    nome: string;
    nomeNegocio: string;
  }): Promise<{ error: string | null }> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });

      const result = await response.json();
      if (!response.ok) {
        return { error: result.error || translate(readStoredLocale(), 'auth.erroCriarConta') };
      }

      // Sign in automatically after account creation
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: dados.email,
        password: dados.password,
      });

      if (signInError) {
        return { error: translate(readStoredLocale(), 'auth.contaLogin') };
      }

      return { error: null };
    } catch {
      return { error: translate(readStoredLocale(), 'auth.erroInesperado') };
    }
  }, []);

  // Activate premium code — calls server API route
  const ativarCodigoPremium = useCallback(async (
    codigo: string
  ): Promise<{ error: string | null }> => {
    if (!state.session) return { error: translate(readStoredLocale(), 'auth.naoAutenticado') };

    try {
      const response = await fetch('/api/auth/ativar-codigo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${state.session.access_token}`,
        },
        body: JSON.stringify({ codigo }),
      });

      const result = await response.json();
      if (!response.ok) {
        return { error: result.error || translate(readStoredLocale(), 'auth.codigoInvalido') };
      }

      // Reload user data to reflect new premium status
      await loadUserData(state.session);
      return { error: null };
    } catch {
      return { error: translate(readStoredLocale(), 'auth.erroInesperado') };
    }
  }, [state.session, loadUserData]);

  const criarContaGratuita = useCallback(async (
    email: string,
    password: string
  ): Promise<{ error: string | null; code?: string }> => {
    try {
      const response = await fetch('/api/auth/register-free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      let result: { error?: string; code?: string; success?: boolean } = {};
      try {
        result = await response.json();
      } catch {
        return { error: translate(readStoredLocale(), 'auth.erroCriarConta') };
      }

      if (!response.ok) {
        return {
          error: result.error || translate(readStoredLocale(), 'auth.erroCriarConta'),
          code: result.code,
        };
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        return { error: translate(readStoredLocale(), 'auth.contaLogin') };
      }

      return { error: null };
    } catch {
      return { error: translate(readStoredLocale(), 'auth.erroInesperado') };
    }
  }, []);

  const pedirCodigoResetSenha = useCallback(async (
    email: string
  ): Promise<{ error: string | null; code?: string; info?: string }> => {
    try {
      const response = await fetch('/api/auth/esqueci-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      let result: { error?: string; code?: string; message?: string; method?: string } = {};
      try {
        result = await response.json();
      } catch {
        return { error: translate(readStoredLocale(), 'conta.resetErroEnvio') };
      }

      if (!response.ok) {
        return {
          error: result.error || translate(readStoredLocale(), 'conta.resetErroEnvio'),
          code: result.code,
        };
      }

      return { error: null };
    } catch {
      return { error: translate(readStoredLocale(), 'auth.erroInesperado') };
    }
  }, []);

  const redefinirSenhaComCodigo = useCallback(async (
    email: string,
    codigo: string,
    password: string
  ): Promise<{ error: string | null; code?: string }> => {
    try {
      const response = await fetch('/api/auth/redefinir-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          codigo: codigo.trim(),
          password,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        return {
          error: result.error || translate(readStoredLocale(), 'conta.resetErroCodigo'),
          code: result.code,
        };
      }

      return { error: null };
    } catch {
      return { error: translate(readStoredLocale(), 'auth.erroInesperado') };
    }
  }, []);

  const loginComSenha = useCallback(async (
    email: string,
    password: string
  ): Promise<{ error: string | null; code?: string }> => {
    try {
      const cleanEmail = email.trim().toLowerCase();

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const result = await response.json().catch(() => ({}));

      if (response.status === 429) {
        return {
          error: result.error || translate(readStoredLocale(), 'conta.loginErro'),
          code: 'RATE_LIMITED',
        };
      }

      if (response.status === 404) {
        return {
          error: result.error || translate(readStoredLocale(), 'conta.loginSemConta'),
          code: 'EMAIL_NOT_FOUND',
        };
      }

      if (!response.ok || !result.session?.access_token || !result.session?.refresh_token) {
        return {
          error: result.error || translate(readStoredLocale(), 'conta.loginErro'),
          code: result.code || 'INVALID_CREDENTIALS',
        };
      }

      const { error } = await supabase.auth.setSession({
        access_token: result.session.access_token,
        refresh_token: result.session.refresh_token,
      });

      if (error) {
        return { error: translate(readStoredLocale(), 'conta.loginErro'), code: 'INVALID_CREDENTIALS' };
      }

      return { error: null };
    } catch {
      return { error: translate(readStoredLocale(), 'auth.erroInesperado') };
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  // Refresh calculation count
  const atualizarTotalCalculos = useCallback(async () => {
    if (!state.session) return;

    try {
      const response = await fetch('/api/calculos/count', {
        headers: { Authorization: `Bearer ${state.session.access_token}` },
      });

      if (!response.ok) return;
      const { total } = await response.json();
      setState(prev => ({ ...prev, totalCalculos: total }));
    } catch {
      // Non-critical — do not show error to user
    }
  }, [state.session]);

  return {
    ...state,
    enviarMagicLink,
    criarContaPremium,
    criarContaGratuita,
    loginComSenha,
    pedirCodigoResetSenha,
    redefinirSenhaComCodigo,
    ativarCodigoPremium,
    logout,
    atualizarTotalCalculos,
  };
}
