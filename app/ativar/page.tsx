'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/layout/BottomNav';
import Logo from '@/components/layout/Logo';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n/context';

type View = 'register' | 'login' | 'forgot-email' | 'forgot-reset';

const inputClass =
  'w-full rounded-2xl border border-creme-2 bg-white px-4 py-3 text-sm focus:outline-none focus:border-verde';

export default function AtivarPage() {
  const router = useRouter();
  const { t } = useI18n();
  const {
    isAuthenticated,
    usuario,
    totalCalculos,
    loading,
    criarContaGratuita,
    loginComSenha,
    pedirCodigoResetSenha,
    redefinirSenhaComCodigo,
    logout,
  } = useAuth();

  const [view, setView] = useState<View>('register');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [showProgresso, setShowProgresso] = useState(false);
  const [showEmailExistsModal, setShowEmailExistsModal] = useState(false);
  const [showResetSucesso, setShowResetSucesso] = useState(false);
  const [showContaCriadaModal, setShowContaCriadaModal] = useState(false);
  const [contaCriadaCountdown, setContaCriadaCountdown] = useState(7);
  const [loginDica, setLoginDica] = useState(false);

  useEffect(() => {
    if (!showContaCriadaModal) return;

    setContaCriadaCountdown(7);
    const interval = setInterval(() => {
      setContaCriadaCountdown((n) => (n <= 1 ? 0 : n - 1));
    }, 1000);

    const timeout = setTimeout(() => {
      setShowContaCriadaModal(false);
      router.push('/inicio');
    }, 7000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [showContaCriadaModal, router]);

  const limparMensagens = () => {
    setErro('');
    setSucesso('');
    setLoginDica(false);
  };

  const irParaLogin = () => {
    limparMensagens();
    setSenha('');
    setConfirmar('');
    setView('login');
  };

  const irParaRegisto = () => {
    limparMensagens();
    setSenha('');
    setConfirmar('');
    setView('register');
  };

  const irParaEsqueciSenha = () => {
    limparMensagens();
    setCodigo('');
    setSenha('');
    setConfirmar('');
    setView('forgot-email');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    limparMensagens();

    if (!email.includes('@')) {
      setErro(t('modalEmail.invalidEmail'));
      return;
    }
    if (senha.length < 8) {
      setErro(t('conta.senhaCurta'));
      return;
    }
    if (!/[A-Za-z]/.test(senha) || !/[0-9]/.test(senha)) {
      setErro(t('conta.senhaFraca'));
      return;
    }
    if (senha !== confirmar) {
      setErro(t('conta.senhasDiferentes'));
      return;
    }

    setEnviando(true);
    setShowProgresso(true);
    const { error, code } = await criarContaGratuita(email, senha);
    setEnviando(false);
    setShowProgresso(false);

    if (code === 'EMAIL_EXISTS') {
      setShowEmailExistsModal(true);
      return;
    }
    if (error) {
      setErro(error);
      return;
    }
    setSenha('');
    setConfirmar('');
    setShowContaCriadaModal(true);
  };

  const fecharEmailExisteModal = () => {
    setShowEmailExistsModal(false);
    irParaLogin();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    limparMensagens();

    setEnviando(true);
    setShowProgresso(true);
    const { error, code } = await loginComSenha(email, senha);
    setEnviando(false);
    setShowProgresso(false);

    if (error) {
      setErro(error);
      if (code === 'INVALID_CREDENTIALS') {
        setLoginDica(true);
      }
    }
  };

  const handleForgotEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    limparMensagens();

    if (!email.includes('@')) {
      setErro(t('modalEmail.invalidEmail'));
      return;
    }

    setEnviando(true);
    setShowProgresso(true);
    const { error, info } = await pedirCodigoResetSenha(email);
    setEnviando(false);
    setShowProgresso(false);

    if (error) {
      setErro(error);
      return;
    }

    if (info) {
      setSucesso(info);
      return;
    }

    setSucesso(t('conta.resetCodigoEnviado'));
    setView('forgot-reset');
  };

  const handleForgotReset = async (e: React.FormEvent) => {
    e.preventDefault();
    limparMensagens();

    if (codigo.trim().length < 6) {
      setErro(t('conta.resetErroCodigo'));
      return;
    }
    if (senha.length < 8) {
      setErro(t('conta.senhaCurta'));
      return;
    }
    if (!/[A-Za-z]/.test(senha) || !/[0-9]/.test(senha)) {
      setErro(t('conta.senhaFraca'));
      return;
    }
    if (senha !== confirmar) {
      setErro(t('conta.senhasDiferentes'));
      return;
    }

    setEnviando(true);
    const { error } = await redefinirSenhaComCodigo(email, codigo, senha);
    setEnviando(false);

    if (error) {
      setErro(error);
      return;
    }

    setSenha('');
    setConfirmar('');
    setCodigo('');
    setShowResetSucesso(true);
  };

  const fecharResetSucesso = () => {
    setShowResetSucesso(false);
    irParaLogin();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-texto-med">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-[90px] relative">
      <Logo />
      <div className="max-w-md lg:max-w-2xl lg:px-8 mx-auto px-6 pt-8 pb-6">
        {!showContaCriadaModal && (
          <>
            <h1 className="text-[22px] font-semibold text-texto mb-2">{t('conta.title')}</h1>
            <p className="text-sm text-texto-med mb-6">{t('conta.subtitle')}</p>
          </>
        )}

        {!showContaCriadaModal && isAuthenticated && usuario ? (
          <div className="bg-white border border-creme-2 rounded-2xl p-5 space-y-4">
            <div>
              <p className="text-xs text-texto-med uppercase tracking-wide">{t('conta.loggedInAs')}</p>
              <p className="font-semibold text-texto mt-1">{usuario.email}</p>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-texto-med">{t('conta.productsSaved')}</span>
              <span className="font-semibold text-verde">{totalCalculos}</span>
            </div>
            <p className="text-xs text-texto-med bg-mint rounded-xl px-3 py-2">{t('conta.freeHint')}</p>
            <button
              type="button"
              onClick={() => logout()}
              className="w-full py-3 border-2 text-texto-med font-medium rounded-2xl"
              style={{ borderColor: '#E5E7EB' }}
            >
              {t('conta.logout')}
            </button>
          </div>
        ) : !showContaCriadaModal ? (
          <>
            {view === 'register' && (
              <>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="text-xs text-texto-med mb-1 block">{t('conta.email')}</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-texto-med mb-1 block">{t('conta.password')}</label>
                    <input
                      type="password"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      className={inputClass}
                      required
                      minLength={8}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-texto-med mb-1 block">{t('conta.confirm')}</label>
                    <input
                      type="password"
                      value={confirmar}
                      onChange={(e) => setConfirmar(e.target.value)}
                      className={inputClass}
                      required
                      minLength={8}
                    />
                  </div>

                  {erro && <p className="text-sm text-laranja">{erro}</p>}
                  {sucesso && <p className="text-sm text-verde">{sucesso}</p>}

                  <PrimaryButton type="submit" isLoading={enviando} disabled={showProgresso} className="w-full">
                    {t('conta.register')}
                  </PrimaryButton>
                </form>

                <p className="text-center text-sm text-texto-med mt-6">
                  {t('conta.jaTensConta')}{' '}
                  <button type="button" onClick={irParaLogin} className="text-verde font-semibold underline">
                    {t('conta.irEntrar')}
                  </button>
                </p>
              </>
            )}

            {view === 'login' && (
              <>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="text-xs text-texto-med mb-1 block">{t('conta.email')}</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-texto-med">{t('conta.password')}</label>
                      <button
                        type="button"
                        onClick={irParaEsqueciSenha}
                        className="text-xs text-verde font-medium underline"
                      >
                        {t('conta.esqueciSenha')}
                      </button>
                    </div>
                    <input
                      type="password"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      className={inputClass}
                      required
                      minLength={6}
                    />
                  </div>

                  {erro && <p className="text-sm text-laranja">{erro}</p>}
                  {loginDica && (
                    <p className="text-sm text-texto-med bg-mint rounded-xl px-3 py-2">
                      {t('conta.loginErroDica')}{' '}
                      <button
                        type="button"
                        onClick={irParaEsqueciSenha}
                        className="text-verde font-semibold underline"
                      >
                        {t('conta.esqueciSenha')}
                      </button>
                    </p>
                  )}
                  {sucesso && <p className="text-sm text-verde">{sucesso}</p>}

                  <PrimaryButton type="submit" isLoading={enviando} className="w-full">
                    {t('conta.login')}
                  </PrimaryButton>
                </form>

                <p className="text-center text-sm text-texto-med mt-6">
                  {t('conta.naoTensConta')}{' '}
                  <button type="button" onClick={irParaRegisto} className="text-verde font-semibold underline">
                    {t('conta.irRegistar')}
                  </button>
                </p>
              </>
            )}

            {view === 'forgot-email' && (
              <>
                <h2 className="text-lg font-semibold text-texto mb-2">{t('conta.resetTitle')}</h2>
                <p className="text-sm text-texto-med mb-4">{t('conta.resetHint')}</p>

                <form onSubmit={handleForgotEmail} className="space-y-4">
                  <div>
                    <label className="text-xs text-texto-med mb-1 block">{t('conta.email')}</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
                      required
                    />
                  </div>

                  {erro && <p className="text-sm text-laranja">{erro}</p>}
                  {sucesso && <p className="text-sm text-verde">{sucesso}</p>}

                  <PrimaryButton type="submit" isLoading={enviando} className="w-full">
                    {t('conta.resetEnviarCodigo')}
                  </PrimaryButton>
                </form>

                <button
                  type="button"
                  onClick={irParaLogin}
                  className="w-full mt-4 text-sm text-texto-med underline"
                >
                  {t('conta.resetVoltarLogin')}
                </button>
              </>
            )}

            {view === 'forgot-reset' && (
              <>
                <h2 className="text-lg font-semibold text-texto mb-2">{t('conta.resetTitle')}</h2>
                <p className="text-sm text-texto-med mb-4">{t('conta.resetCodigoEnviado')}</p>

                <form onSubmit={handleForgotReset} className="space-y-4">
                  <div>
                    <label className="text-xs text-texto-med mb-1 block">{t('conta.resetCodigoLabel')}</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={codigo}
                      onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 8))}
                      className={inputClass}
                      placeholder="000000"
                      required
                      minLength={6}
                      maxLength={8}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-texto-med mb-1 block">{t('conta.resetNovaSenha')}</label>
                    <input
                      type="password"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      className={inputClass}
                      required
                      minLength={8}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-texto-med mb-1 block">{t('conta.resetConfirmar')}</label>
                    <input
                      type="password"
                      value={confirmar}
                      onChange={(e) => setConfirmar(e.target.value)}
                      className={inputClass}
                      required
                      minLength={8}
                    />
                  </div>

                  {erro && <p className="text-sm text-laranja">{erro}</p>}

                  <PrimaryButton type="submit" isLoading={enviando} className="w-full">
                    {t('conta.resetConfirmarBtn')}
                  </PrimaryButton>
                </form>

                <button
                  type="button"
                  onClick={() => { limparMensagens(); setView('forgot-email'); }}
                  className="w-full mt-4 text-sm text-texto-med underline"
                >
                  {t('conta.resetEnviarCodigo')}
                </button>
              </>
            )}
          </>
        ) : null}
      </div>

      {showProgresso && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-xl text-center">
            <div className="w-12 h-12 border-4 border-verde border-t-transparent rounded-full animate-spin mx-auto mb-5" />
            <h2 className="text-lg font-semibold text-texto mb-2">
              {view === 'register' ? t('conta.criandoConta') : t('common.loading')}
            </h2>
            <p className="text-sm text-texto-med">
              {view === 'register' ? t('conta.criandoContaHint') : t('conta.criandoContaHint')}
            </p>
          </div>
        </div>
      )}

      {showEmailExistsModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl text-center">
            <div className="w-14 h-14 bg-laranja-cl rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              ✉️
            </div>
            <h2 className="text-lg font-semibold text-texto mb-2">{t('conta.emailExisteTitulo')}</h2>
            <p className="text-sm text-texto-med mb-6 leading-relaxed">{t('conta.emailExisteCorpo')}</p>
            <button
              type="button"
              onClick={fecharEmailExisteModal}
              className="w-full py-3 text-white font-semibold rounded-2xl mb-3"
              style={{ backgroundColor: '#1B5E3B' }}
            >
              {t('conta.emailExisteIrLogin')}
            </button>
            <button
              type="button"
              onClick={() => setShowEmailExistsModal(false)}
              className="w-full py-2 text-sm text-texto-med underline"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {showContaCriadaModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl text-center">
            <div className="w-16 h-16 bg-mint rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              🎉
            </div>
            <h2 className="text-xl font-semibold text-texto mb-3">{t('conta.contaCriadaTitulo')}</h2>
            <p className="text-sm text-texto-med leading-relaxed mb-6">{t('conta.contaCriadaCorpo')}</p>
            <div className="w-full bg-creme-2 rounded-full h-1.5 mb-3 overflow-hidden">
              <div
                className="h-full bg-verde transition-all duration-1000 ease-linear"
                style={{ width: `${((7 - contaCriadaCountdown) / 7) * 100}%` }}
              />
            </div>
            <p className="text-xs text-texto-cl">
              {t('conta.contaCriadaRedirect', { n: contaCriadaCountdown || 1 })}
            </p>
          </div>
        </div>
      )}

      {showResetSucesso && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl text-center">
            <div className="w-14 h-14 bg-mint rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              ✓
            </div>
            <h2 className="text-lg font-semibold text-texto mb-2">{t('conta.resetSucessoTitulo')}</h2>
            <p className="text-sm text-texto-med mb-6">{t('conta.resetSucessoCorpo')}</p>
            <button
              type="button"
              onClick={fecharResetSucesso}
              className="w-full py-3 text-white font-semibold rounded-2xl"
              style={{ backgroundColor: '#1B5E3B' }}
            >
              {t('conta.resetIrLogin')}
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
