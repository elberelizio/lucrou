'use client';

import { useState, useEffect } from 'react';
import AdminDashboard from '@/components/admin/AdminDashboard';

export default function SecretPage() {
  const [senhaAdmin, setSenhaAdmin] = useState('');
  const [autenticado, setAutenticado] = useState(false);
  const [erro, setErro] = useState('');
  const [tentativas, setTentativas] = useState(0);
  const [bloqueado, setBloqueado] = useState(false);
  const [aVerificar, setAVerificar] = useState(false);

  useEffect(() => {
    if (tentativas >= 5) {
      setBloqueado(true);
      const timer = setTimeout(() => {
        setTentativas(0);
        setBloqueado(false);
      }, 300000);
      return () => clearTimeout(timer);
    }
  }, [tentativas]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bloqueado) {
      setErro('Muitas tentativas. Aguarde 5 minutos.');
      return;
    }
    setAVerificar(true);
    setErro('');
    try {
      const res = await fetch('/api/admin/verify', {
        headers: { 'x-admin-password': senhaAdmin },
      });
      if (res.ok) {
        setAutenticado(true);
        setTentativas(0);
        return;
      }
      const data = (await res.json().catch(() => ({}))) as {
        code?: string;
        error?: string;
      };
      if (res.status === 503 || data.code === 'ADMIN_PASSWORD_MISSING') {
        setErro(
          data.error ||
            'ADMIN_PASSWORD não está configurada neste projecto Vercel. Confirma Settings → Environment Variables → Production e faz Redeploy.'
        );
        return;
      }
      const remaining = 5 - tentativas - 1;
      setTentativas((p) => p + 1);
      setErro(
        remaining > 0
          ? `Senha incorrecta. ${remaining} tentativa(s) restante(s).`
          : 'Bloqueado por 5 minutos.'
      );
      setSenhaAdmin('');
    } catch {
      setErro('Erro de ligação ao servidor.');
    } finally {
      setAVerificar(false);
    }
  };

  if (autenticado) {
    return (
      <AdminDashboard
        senha={senhaAdmin}
        onLogout={() => {
          setAutenticado(false);
          setSenhaAdmin('');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-creme px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-texto mb-2 text-center font-serif">
          Área Restrita
        </h1>
        <p className="text-sm text-texto-med mb-6 text-center">
          Painel de analytics — fase de testes
        </p>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-texto mb-2">Senha</label>
            <input
              type="password"
              value={senhaAdmin}
              onChange={(e) => setSenhaAdmin(e.target.value)}
              className="w-full px-4 py-3 border border-creme-2 rounded-xl focus:outline-none focus:border-verde bg-creme"
              placeholder="Senha de administrador"
              required
              disabled={bloqueado}
              autoFocus
            />
          </div>
          {erro && (
            <div className={`text-sm ${bloqueado ? 'text-red-600' : 'text-red-500'}`}>{erro}</div>
          )}
          <button
            type="submit"
            disabled={bloqueado || !senhaAdmin || aVerificar}
            className="w-full bg-verde text-white py-3 rounded-xl font-semibold hover:bg-verde-med transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#1B5E3B' }}
          >
            {aVerificar ? 'A verificar…' : bloqueado ? 'Acesso bloqueado' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
