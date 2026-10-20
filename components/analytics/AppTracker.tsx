'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { getOrCreateVisitorId, registarEvento, registarVisita } from '@/lib/analytics';

const SKIP_PATHS = ['/admin-secret'];

function shouldTrack(path: string | null): path is string {
  return !!path && !SKIP_PATHS.some((p) => path.startsWith(p));
}

export default function AppTracker() {
  const pathname = usePathname();
  const prevPath = useRef<string | null>(null);
  const enterTime = useRef<number>(Date.now());

  useEffect(() => {
    registarVisita();
  }, []);

  // Página inicial após hidratação (usePathname por vezes atrasa)
  useEffect(() => {
    const timer = setTimeout(() => {
      const path = window.location.pathname;
      if (!shouldTrack(path) || prevPath.current === path) return;
      registarEvento({ tipo: 'page_view', pagina: path, acao: 'entrada' });
      prevPath.current = path;
      enterTime.current = Date.now();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Mudança de rota + tempo na página anterior
  useEffect(() => {
    if (!shouldTrack(pathname)) return;

    if (prevPath.current && prevPath.current !== pathname) {
      const duracao_seg = Math.max(1, Math.round((Date.now() - enterTime.current) / 1000));
      registarEvento({
        tipo: 'page_view',
        pagina: prevPath.current,
        acao: 'saida',
        detalhes: { duracao_seg },
      });
    }

    if (prevPath.current !== pathname) {
      registarEvento({ tipo: 'page_view', pagina: pathname, acao: 'entrada' });
      prevPath.current = pathname;
      enterTime.current = Date.now();
    }
  }, [pathname]);

  // Heartbeat de tempo a cada 30s na página actual
  useEffect(() => {
    if (!shouldTrack(pathname)) return;
    const interval = setInterval(() => {
      registarEvento({
        tipo: 'page_view',
        pagina: pathname,
        acao: 'tempo',
        detalhes: { duracao_seg: 30 },
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [pathname]);

  useEffect(() => {
    if (!shouldTrack(pathname)) return;

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const el = target.closest('a, button, [role="button"], input[type="submit"]');
      if (!el || el.closest('[data-no-track]')) return;

      const texto = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80);
      registarEvento({
        tipo: 'click',
        pagina: pathname,
        acao: texto || el.id || el.tagName.toLowerCase(),
        detalhes: {
          href: (el as HTMLAnchorElement).href || undefined,
          id: el.id || undefined,
          tag: el.tagName.toLowerCase(),
        },
      });
    };

    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, [pathname]);

  useEffect(() => {
    const onLeave = () => {
      const path = prevPath.current;
      if (!shouldTrack(path)) return;
      const duracao_seg = Math.max(1, Math.round((Date.now() - enterTime.current) / 1000));
      const visitorId = getOrCreateVisitorId();
      const body = JSON.stringify({
        visitor_id: visitorId,
        tipo: 'session_end',
        pagina: path,
        detalhes: { duracao_seg },
      });
      navigator.sendBeacon(
        '/api/analytics/event',
        new Blob([body], { type: 'application/json' })
      );
    };
    window.addEventListener('pagehide', onLeave);
    return () => window.removeEventListener('pagehide', onLeave);
  }, []);

  return null;
}
