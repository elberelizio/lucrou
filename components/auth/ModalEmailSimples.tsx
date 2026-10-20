'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n/context';

interface ModalEmailSimplesProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  modo?: 'guardar' | 'limite';
}

type ModalState = 'idle' | 'loading' | 'sent' | 'error';

export default function ModalEmailSimples({ isOpen, onClose, modo = 'guardar' }: ModalEmailSimplesProps) {
  const [email, setEmail] = useState('');
  const [modalState, setModalState] = useState<ModalState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const { enviarMagicLink } = useAuth();
  const { t } = useI18n();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage(t('modalEmail.invalidEmail'));
      return;
    }

    setModalState('loading');

    const { error } = await enviarMagicLink(email.trim().toLowerCase(), window.location.pathname);

    if (error) {
      setErrorMessage(error);
      setModalState('error');
      return;
    }

    localStorage.setItem('lucrou_pending_save', 'true');
    setModalState('sent');
  };

  const handleClose = () => {
    setEmail('');
    setModalState('idle');
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl">
        {modalState === 'sent' ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-mint rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-verde" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-texto mb-2">{t('modalEmail.sentTitle')}</h2>
            <p className="text-sm text-texto-med mb-2">
              {t('modalEmail.sentLine1')} <strong>{email}</strong>.
            </p>
            <p className="text-sm text-texto-med mb-6">{t('modalEmail.sentLine2')}</p>
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-3 bg-verde text-white rounded-2xl font-semibold"
              style={{ backgroundColor: '#1B5E3B' }}
            >
              {t('modalEmail.okEmail')}
            </button>
          </div>
        ) : (
          <>
            {modo === 'limite' ? (
              <div className="text-center mb-6">
                <div className="text-3xl mb-3">🎉</div>
                <h2 className="text-lg font-bold text-gray-900">{t('modalEmail.limiteTitle')}</h2>
                <p className="text-sm text-gray-500 mt-2">{t('modalEmail.limiteBody')}</p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-texto mb-2">{t('modalEmail.guardarTitle')}</h2>
                <p className="text-sm text-texto-med mb-6">{t('modalEmail.guardarBody')}</p>
              </>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('modalEmail.placeholder')}
                  className="w-full bg-creme border-2 border-creme-2 rounded-2xl px-4 py-3 focus:outline-none focus:border-verde-cl"
                  disabled={modalState === 'loading'}
                  autoFocus
                />
                {modalState === 'error' && <p className="text-red-600 text-sm mt-2">{errorMessage}</p>}
              </div>

              <div className="flex gap-3">
                {modo !== 'limite' && (
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 py-3 px-4 bg-white text-texto-med border-2 border-creme-2 rounded-2xl font-medium"
                    disabled={modalState === 'loading'}
                  >
                    {t('common.cancel')}
                  </button>
                )}
                <button
                  type="submit"
                  className={`${modo === 'limite' ? 'w-full' : 'flex-1'} py-3 px-4 bg-verde text-white rounded-2xl font-semibold disabled:opacity-50`}
                  disabled={modalState === 'loading'}
                  style={{ backgroundColor: '#1B5E3B' }}
                >
                  {modalState === 'loading' ? t('common.sending') : t('modalEmail.enviarLink')}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
