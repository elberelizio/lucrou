'use client';

import { useRouter } from 'next/navigation';
import BottomNav from '@/components/layout/BottomNav';
import Logo from '@/components/layout/Logo';
import ModoCard from '@/components/calculador/ModoCard';
import { useI18n } from '@/lib/i18n/context';

export default function CalcularPage() {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <div className="min-h-screen pb-[90px] relative">
      <Logo />
      <div className="max-w-md lg:max-w-2xl lg:px-8 mx-auto px-6 pt-8 pb-6">
        <h1 className="text-[22px] font-semibold text-texto mb-6">{t('calcular.title')}</h1>

        <div className="flex flex-col gap-4 mb-6">
          <ModoCard
            modo="modoA"
            titulo={t('calcular.modoATitle')}
            descricao={t('calcular.modoADesc')}
            selecionado={false}
            onClick={() => router.push('/calculador?modo=modoA')}
          />
          <ModoCard
            modo="modoB"
            titulo={t('calcular.modoBTitle')}
            descricao={t('calcular.modoBDesc')}
            selecionado={false}
            onClick={() => router.push('/calculador?modo=modoB')}
          />
        </div>

        <div className="text-center pb-4">
          <p className="text-sm text-texto-med">
            {t('calcular.noAccount')}{' '}
            <strong className="text-texto font-medium">{t('calcular.startNow')}</strong>
          </p>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
