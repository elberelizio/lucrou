'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n/context';

interface ModalAvaliacaoProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (estrelas: number) => Promise<void>;
}

export default function ModalAvaliacao({ isOpen, onClose, onSubmit }: ModalAvaliacaoProps) {
  const { t } = useI18n();
  const [estrelas, setEstrelas] = useState(0);
  const [hover, setHover] = useState(0);
  const [enviando, setEnviando] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (estrelas < 1) return;
    setEnviando(true);
    try {
      await onSubmit(estrelas);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl text-center">
        <h2 className="text-lg font-semibold text-texto mb-1">{t('avaliacao.title')}</h2>
        <p className="text-sm text-texto-med mb-5">{t('avaliacao.subtitle')}</p>

        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setEstrelas(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              className="text-3xl transition-transform active:scale-95"
              aria-label={`${n} ${t('avaliacao.stars')}`}
            >
              {(hover || estrelas) >= n ? '★' : '☆'}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={estrelas < 1 || enviando}
          className="w-full py-3 text-white font-semibold rounded-2xl disabled:opacity-50 mb-3"
          style={{ backgroundColor: '#1B5E3B' }}
        >
          {enviando ? t('common.sending') : t('avaliacao.submit')}
        </button>

        <button
          type="button"
          onClick={onClose}
          disabled={enviando}
          className="w-full py-2 text-sm text-texto-med hover:text-texto"
        >
          {t('avaliacao.later')}
        </button>
      </div>
    </div>
  );
}
