'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n/context';

interface HeroCardProps {
  showProductsLink: boolean;
}

export default function HeroCard({ showProductsLink }: HeroCardProps) {
  const { t } = useI18n();

  return (
    <div
      className="bg-gradient-to-br from-verde via-verde to-verde-med rounded-none rounded-b-[32px] lg:rounded-none text-white relative overflow-hidden lg:w-full"
      style={{ background: 'linear-gradient(160deg, #1B5E3B 0%, #2E7D52 100%)' }}
    >
      <div className="absolute -top-10 -right-10 w-[180px] h-[180px] rounded-full bg-white/6" />
      <div className="absolute -bottom-[60px] left-5 w-[140px] h-[140px] rounded-full bg-white/4" />

      <div className="relative z-10 px-6 pt-16 pb-5 max-w-md lg:max-w-[560px] lg:mx-auto">
        <div className="text-[11px] font-semibold tracking-[1.5px] uppercase opacity-70 mb-2.5">{t('hero.kicker')}</div>
        <h1 className="font-serif text-[30px] leading-[1.2] mb-2">{t('hero.title')}</h1>
        <p className="text-sm opacity-80 leading-[1.5] mb-7 max-w-[280px] lg:max-w-full">{t('hero.subtitle')}</p>
        <div className="flex flex-col gap-0">
          <Link
            href="/calcular"
            className="w-full bg-white py-[18px] px-6 rounded-2xl transition-all duration-150 hover:bg-mint active:scale-[0.98] flex items-center justify-center shadow-hero"
          >
            <span className="font-semibold text-[15px]" style={{ color: '#1B5E3B' }}>
              {t('hero.ctaCalc')}
            </span>
          </Link>
          {showProductsLink && (
            <Link
              href="/produtos"
              className="text-white/70 text-sm font-medium mt-3 flex items-center justify-center gap-1 hover:text-white transition-colors"
            >
              {t('hero.ctaProducts')} <span>→</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
