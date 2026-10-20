'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { MODO_LANCAMENTO_GRATUITO } from '@/lib/limites';
import { useI18n } from '@/lib/i18n/context';

interface ModalRegistoPremiumProps {
  isOpen: boolean;
  onClose: () => void;
  emailInicial?: string;
}

export default function ModalRegistoPremium({
  isOpen,
  onClose,
  emailInicial = '',
}: ModalRegistoPremiumProps) {
  if (MODO_LANCAMENTO_GRATUITO) return null;

  const { t } = useI18n();
  const [nome, setNome] = useState('');
  const [nomeNegocio, setNomeNegocio] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { criarContaPremium, usuario, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setEmail(usuario?.email || emailInicial || '');
    }
  }, [isOpen, usuario?.email, emailInicial]);

  if (!isOpen) return null;

  const emailFinal = usuario?.email || email.trim().toLowerCase();
  const showEmailField = !isAuthenticated || !usuario?.email;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nome.trim() || nome.trim().length < 2) {
      setError(t('modalRegisto.nomeCurto'));
      return;
    }
    if (!nomeNegocio.trim() || nomeNegocio.trim().length < 2) {
      setError(t('modalRegisto.negocioCurto'));
      return;
    }
    if (!emailFinal || !emailFinal.includes('@')) {
      setError(t('modalRegisto.emailInvalido'));
      return;
    }
    if (!senha || senha.length < 6) {
      setError(t('modalRegisto.senhaCurta'));
      return;
    }
    if (senha !== confirmarSenha) {
      setError(t('modalRegisto.senhasDiferentes'));
      return;
    }

    setLoading(true);
    const { error: registerError } = await criarContaPremium({
      email: emailFinal,
      password: senha,
      nome: nome.trim(),
      nomeNegocio: nomeNegocio.trim(),
    });
    setLoading(false);

    if (registerError) {
      setError(registerError);
      return;
    }

    setSuccessMessage(t('modalRegisto.sucesso'));
    setTimeout(() => {
      onClose();
      router.push('/ativar');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl my-8">
        <h2 className="text-xl font-semibold text-texto mb-2">{t('modalRegisto.title')}</h2>
        <p className="text-sm text-texto-med mb-6">{t('modalRegisto.subtitle')}</p>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-texto mb-1">{t('modalRegisto.nome')}</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder={t('modalRegisto.phNome')}
                className="w-full bg-creme border-2 border-creme-2 rounded-2xl px-4 py-3 focus:outline-none focus:border-verde-cl"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-texto mb-1">{t('modalRegisto.negocio')}</label>
              <input
                type="text"
                value={nomeNegocio}
                onChange={(e) => setNomeNegocio(e.target.value)}
                placeholder={t('modalRegisto.phNegocio')}
                className="w-full bg-creme border-2 border-creme-2 rounded-2xl px-4 py-3 focus:outline-none focus:border-verde-cl"
                disabled={loading}
              />
            </div>

            {showEmailField ? (
              <div>
                <label className="block text-sm font-medium text-texto mb-1">{t('modalRegisto.email')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('modalEmail.placeholder')}
                  className="w-full bg-creme border-2 border-creme-2 rounded-2xl px-4 py-3 focus:outline-none focus:border-verde-cl"
                  disabled={loading}
                />
              </div>
            ) : (
              <div className="bg-mint border-2 border-verde-cl rounded-2xl px-4 py-3">
                <label className="block text-xs font-medium text-texto-med mb-1">Email</label>
                <div className="text-sm font-medium text-verde">{usuario?.email}</div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-texto mb-1">{t('modalRegisto.senha')}</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder={t('modalRegisto.phSenha')}
                className="w-full bg-creme border-2 border-creme-2 rounded-2xl px-4 py-3 focus:outline-none focus:border-verde-cl"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-texto mb-1">{t('modalRegisto.confirmar')}</label>
              <input
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder={t('modalRegisto.phConfirmar')}
                className="w-full bg-creme border-2 border-creme-2 rounded-2xl px-4 py-3 focus:outline-none focus:border-verde-cl"
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
          )}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
              {successMessage}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-white text-texto-med border-2 border-creme-2 rounded-2xl font-medium"
              disabled={loading}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-verde text-white rounded-2xl font-semibold disabled:opacity-50"
              disabled={loading}
              style={{ backgroundColor: '#1B5E3B' }}
            >
              {loading ? t('common.creating') : t('modalRegisto.botaoCriar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
