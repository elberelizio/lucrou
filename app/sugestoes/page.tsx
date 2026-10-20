'use client';

import { useState } from 'react';
import BottomNav from '@/components/layout/BottomNav';
import Logo from '@/components/layout/Logo';
import { getOrCreateVisitorId } from '@/lib/analytics';
import { useI18n } from '@/lib/i18n/context';

export default function SugestoesPage() {
  const { t } = useI18n();
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (texto.trim().length < 10) {
      setErro(t('sugestoes.minLength'));
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch('/api/sugestoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitor_id: getOrCreateVisitorId(),
          texto: texto.trim(),
        }),
      });

      if (!res.ok) {
        setErro(t('sugestoes.error'));
        return;
      }

      setSucesso(true);
      setTexto('');
    } catch {
      setErro(t('sugestoes.error'));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen pb-[90px] relative">
      <Logo />
      <div className="max-w-md lg:max-w-2xl lg:px-8 mx-auto px-6 pt-8 pb-6">
        <h1 className="text-[22px] font-semibold text-texto mb-4">{t('sugestoes.title')}</h1>

        <p className="text-sm text-texto-med leading-relaxed mb-6 bg-mint border border-creme-2 rounded-2xl px-4 py-3">
          {t('sugestoes.hint')}
        </p>

        {sucesso ? (
          <div className="bg-[#E8F5EE] border border-verde-cl rounded-2xl px-4 py-5 text-center">
            <p className="text-verde font-medium">{t('sugestoes.success')}</p>
            <button
              type="button"
              onClick={() => setSucesso(false)}
              className="mt-3 text-sm text-texto-med underline"
            >
              {t('sugestoes.sendAnother')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="sugestao-texto" className="block text-sm font-medium text-texto mb-2 leading-snug">
                {t('sugestoes.label')}
              </label>
              <textarea
                id="sugestao-texto"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder={t('sugestoes.placeholder')}
                rows={6}
                maxLength={2000}
                className="w-full rounded-2xl border border-creme-2 bg-white px-4 py-3 text-texto text-sm placeholder:text-texto-cl focus:outline-none focus:border-verde resize-none"
              />
            </div>

            {erro && (
              <p className="text-sm text-laranja">{erro}</p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="w-full py-4 text-white font-semibold rounded-2xl transition-all active:scale-[0.98] disabled:opacity-70"
              style={{ backgroundColor: '#1B5E3B' }}
            >
              {enviando ? t('common.sending') : t('sugestoes.submit')}
            </button>
          </form>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
