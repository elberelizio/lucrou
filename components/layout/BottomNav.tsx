'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import type { Locale } from '@/lib/i18n/types';
import { SHOW_RESUMO } from '@/lib/limites';

export default function BottomNav() {
  const pathname = usePathname();
  const { t, locale, setLocale } = useI18n();

  const navItems = [
    {
      href: '/inicio',
      label: t('nav.home'),
      icon: (
        <svg className="w-5 h-5 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      href: '/calcular',
      label: t('nav.calculate'),
      icon: (
        <svg className="w-5 h-5 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      href: '/produtos',
      label: t('nav.history'),
      icon: (
        <svg className="w-5 h-5 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      href: '/stock',
      label: t('nav.stock'),
      icon: (
        <svg className="w-5 h-5 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    ...(SHOW_RESUMO
      ? [
          {
            href: '/resumo',
            label: t('nav.summary'),
            icon: (
              <svg className="w-5 h-5 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13h4v8H3v-8zm7-6h4v14h-4V7zm7-4h4v18h-4V3z" />
              </svg>
            ),
          },
        ]
      : []),
    {
      href: '/sugestoes',
      label: t('nav.suggestions'),
      icon: (
        <svg className="w-5 h-5 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      href: '/ativar',
      label: t('nav.account'),
      icon: (
        <svg className="w-5 h-5 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <div
        className="fixed bottom-[88px] lg:bottom-[80px] right-3 z-[60] flex rounded-lg border border-creme-2 overflow-hidden text-[11px] font-bold shadow-sm bg-white"
        role="group"
        aria-label="Language"
      >
        <button
          type="button"
          onClick={() => setLocale('en' as Locale)}
          className={`px-2 py-1 ${locale === 'en' ? 'bg-verde text-white' : 'text-texto-med'}`}
        >
          {t('common.localeEn')}
        </button>
        <button
          type="button"
          onClick={() => setLocale('pt' as Locale)}
          className={`px-2 py-1 ${locale === 'pt' ? 'bg-verde text-white' : 'text-texto-med'}`}
        >
          {t('common.localePt')}
        </button>
      </div>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-creme-2 safe-area-bottom lg:h-[72px]">
        <div className="max-w-md lg:max-w-2xl lg:px-8 mx-auto flex items-center justify-around py-2.5 pb-4 lg:py-0 lg:h-full">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === '/inicio' && (pathname === '/' || pathname === '/inicio')) ||
              (item.href === '/calcular' && pathname?.startsWith('/calculador')) ||
              (item.href === '/produtos' && pathname?.startsWith('/produtos')) ||
              (item.href === '/stock' && pathname?.startsWith('/stock')) ||
              (item.href === '/sugestoes' && pathname?.startsWith('/sugestoes'));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col lg:flex-row items-center gap-1 lg:gap-[6px] transition-colors lg:py-3 lg:px-5 lg:rounded-xl ${
                  isActive ? 'text-verde lg:bg-[#E8F5EE]' : 'text-texto-cl'
                }`}
              >
                <div
                  className={`${
                    isActive ? 'bg-mint rounded-xl px-4 py-1 lg:bg-transparent lg:p-0' : ''
                  } lg:w-8 lg:h-8 flex items-center justify-center`}
                >
                  <div className="lg:w-8 lg:h-8">{item.icon}</div>
                </div>
                <span
                  className={`text-[11px] lg:text-[13px] lg:font-semibold font-medium ${
                    isActive ? 'text-verde' : 'text-texto-cl'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
