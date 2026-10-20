'use client';

import { useRouter } from 'next/navigation';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';
import { MODO_LANCAMENTO_GRATUITO } from '@/lib/limites';
import { useI18n } from '@/lib/i18n/context';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const router = useRouter();
  const { t } = useI18n();

  if (MODO_LANCAMENTO_GRATUITO) return null;
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-hero">
        <h2 className="font-serif text-2xl text-verde mb-2">{t('upgradeModal.title')}</h2>
        <p className="text-texto-med mb-6">{t('upgradeModal.body')}</p>
        <div className="space-y-3">
          <PrimaryButton
            onClick={() => {
              router.push('/ativar');
              onClose();
            }}
            className="w-full"
          >
            {t('common.continue')}
          </PrimaryButton>
          <SecondaryButton onClick={onClose} className="w-full">
            {t('common.cancel')}
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
}
