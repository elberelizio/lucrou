'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import BottomNav from '@/components/layout/BottomNav';
import Logo from '@/components/layout/Logo';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n/context';
import { STOCK_LOW_THRESHOLD } from '@/lib/limites';
import { storage } from '@/lib/storage';

type StockFilter = 'all' | 'low' | 'out';
type MovementType = 'entrada' | 'saida';
const LOCAL_STOCK_KEY = 'lucrou_stock_local_map';

type StockItem = {
  id: string;
  nome: string;
  stockAtual: number;
  ultimaActualizacao: string;
  isDemo?: boolean;
};

export default function StockPage() {
  const { t, locale } = useI18n();
  const { session, loading: authLoading } = useAuth();

  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<StockFilter>('all');

  const [activeItem, setActiveItem] = useState<StockItem | null>(null);
  const [movementType, setMovementType] = useState<MovementType>('entrada');
  const [movementQty, setMovementQty] = useState('1');
  const [movementNote, setMovementNote] = useState('');
  const [savingMovement, setSavingMovement] = useState(false);

  const statusOf = (n: number): 'out' | 'low' | 'ok' => {
    if (n <= 0) return 'out';
    if (n <= STOCK_LOW_THRESHOLD) return 'low';
    return 'ok';
  };

  const getDemoItems = (): StockItem[] => [
    { id: 'demo-1', nome: 'Perfume Premium', stockAtual: 18, ultimaActualizacao: new Date().toISOString(), isDemo: true },
    { id: 'demo-2', nome: 'Óleo Capilar', stockAtual: 3, ultimaActualizacao: new Date().toISOString(), isDemo: true },
    { id: 'demo-3', nome: 'Creme Facial', stockAtual: 0, ultimaActualizacao: new Date().toISOString(), isDemo: true },
  ];

  const readLocalStockMap = (): Record<string, number> => {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem(LOCAL_STOCK_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed as Record<string, number> : {};
    } catch {
      return {};
    }
  };

  const saveLocalStockMap = (map: Record<string, number>) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LOCAL_STOCK_KEY, JSON.stringify(map));
  };

  const fetchStock = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      if (!session) {
        const produtos = storage.getProdutos();
        if (produtos.length === 0) {
          setItems([]);
          setLoading(false);
          return;
        }

        const stockMap = readLocalStockMap();
        const mappedLocal: StockItem[] = produtos.map((produto) => ({
          id: produto.id,
          nome: produto.nome,
          stockAtual: Number(stockMap[produto.id] ?? 0),
          ultimaActualizacao: produto.ultimaActualizacao,
        }));
        setItems(mappedLocal);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/calculos', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || t('stock.errNetwork'));
        setLoading(false);
        return;
      }

      const data = await response.json();
      const calculos: Record<string, unknown>[] = data.calculos ?? [];

      const mapped: StockItem[] = calculos.map((calc) => ({
        id: String(calc.id),
        nome: String(calc.nome_produto ?? ''),
        stockAtual: Number(calc.stock_atual ?? 0),
        ultimaActualizacao: String(calc.criado_em ?? new Date().toISOString()),
      }));

      setItems(mapped);
    } catch {
      setError(t('stock.errNetwork'));
    } finally {
      setLoading(false);
    }
  }, [session, t]);

  useEffect(() => {
    if (authLoading) return;
    fetchStock();
  }, [authLoading, fetchStock]);

  useEffect(() => {
    const handleFocus = () => {
      if (!authLoading) fetchStock();
    };

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === 'lucrou_produtos' || event.key === LOCAL_STOCK_KEY) {
        if (!authLoading) fetchStock();
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorage);
    };
  }, [authLoading, fetchStock]);

  const filteredItems = useMemo(() => {
    const base = items.filter((item) => item.nome.toLowerCase().includes(query.trim().toLowerCase()));

    if (filter === 'out') return base.filter((item) => statusOf(item.stockAtual) === 'out');
    if (filter === 'low') return base.filter((item) => statusOf(item.stockAtual) === 'low');
    return base;
  }, [items, query, filter]);

  const openMovementModal = (item: StockItem, type: MovementType) => {
    if (item.isDemo) return;
    setActiveItem(item);
    setMovementType(type);
    setMovementQty('1');
    setMovementNote('');
  };

  const closeMovementModal = () => {
    if (savingMovement) return;
    setActiveItem(null);
    setMovementNote('');
    setMovementQty('1');
  };

  const submitMovement = async () => {
    if (!activeItem || activeItem.isDemo) return;

    const qty = parseInt(movementQty, 10);
    if (!Number.isInteger(qty) || qty <= 0) {
      setError(t('stockPage.invalidQty'));
      return;
    }

    setSavingMovement(true);
    setError('');

    try {
      if (!session) {
        const current = Number(activeItem.stockAtual ?? 0);
        const newStock = movementType === 'entrada'
          ? current + qty
          : Math.max(0, current - qty);

        const map = readLocalStockMap();
        map[activeItem.id] = newStock;
        saveLocalStockMap(map);

        setItems((prev) =>
          prev.map((item) =>
            item.id === activeItem.id ? { ...item, stockAtual: newStock, ultimaActualizacao: new Date().toISOString() } : item
          )
        );

        closeMovementModal();
        return;
      }

      const response = await fetch('/api/stock/movimento', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          calculo_id: activeItem.id,
          tipo: movementType,
          quantidade: qty,
          observacao: movementNote.trim() || undefined,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        setError(result.error || t('stock.errUpdate'));
        setSavingMovement(false);
        return;
      }

      const newStock = Number(result.stock_atual ?? 0);
      setItems((prev) =>
        prev.map((item) =>
          item.id === activeItem.id ? { ...item, stockAtual: newStock, ultimaActualizacao: new Date().toISOString() } : item
        )
      );

      closeMovementModal();
    } catch {
      setError(t('stock.errNetwork'));
    } finally {
      setSavingMovement(false);
    }
  };
  const showDemo = !loading && filteredItems.length === 0;
  const renderedItems = showDemo ? getDemoItems() : filteredItems;

  return (
    <div className="min-h-screen pb-[90px] relative">
      <Logo />

      <div className="max-w-md lg:max-w-2xl lg:px-8 mx-auto px-6 py-7">
        <div className="mb-4">
          <h1 className="text-[22px] font-semibold text-texto mb-1">{t('stockPage.title')}</h1>
          <p className="text-sm text-texto-med">{t('stockPage.subtitle')}</p>
        </div>

        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-2 rounded-xl text-sm font-medium ${filter === 'all' ? 'text-white' : 'bg-white border text-texto-med'}`}
            style={filter === 'all' ? { backgroundColor: '#1B5E3B' } : { borderColor: '#E5E7EB' }}
          >
            {t('stockPage.all')}
          </button>
          <button
            type="button"
            onClick={() => setFilter('low')}
            className={`px-3 py-2 rounded-xl text-sm font-medium ${filter === 'low' ? 'text-white' : 'bg-white border text-texto-med'}`}
            style={filter === 'low' ? { backgroundColor: '#D97706' } : { borderColor: '#E5E7EB' }}
          >
            {t('stockPage.low')}
          </button>
          <button
            type="button"
            onClick={() => setFilter('out')}
            className={`px-3 py-2 rounded-xl text-sm font-medium ${filter === 'out' ? 'text-white' : 'bg-white border text-texto-med'}`}
            style={filter === 'out' ? { backgroundColor: '#DC2626' } : { borderColor: '#E5E7EB' }}
          >
            {t('stockPage.out')}
          </button>
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('stockPage.searchPlaceholder')}
          className="w-full bg-white border border-creme-2 rounded-xl px-4 py-3 text-sm mb-4"
        />

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="py-16 text-center text-texto-med">{t('common.loading')}</div>
        ) : (
          <div className="space-y-3">
            {showDemo && (
              <div className="bg-white border rounded-2xl p-6 text-center" style={{ borderColor: '#E5E7EB' }}>
                <div className="text-4xl mb-2">📦</div>
                <p className="text-texto-med text-sm mb-1">{t('stockPage.noProducts')}</p>
                <p className="text-texto-cl text-xs">{t('stockPage.emptyHint')}</p>
              </div>
            )}

            {renderedItems.map((item) => {
              const status = statusOf(item.stockAtual);
              const badgeClass =
                status === 'out'
                  ? 'bg-red-100 text-red-700'
                  : status === 'low'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-green-100 text-green-700';

              const dateText = new Date(item.ultimaActualizacao).toLocaleDateString(
                locale === 'pt' ? 'pt-MZ' : 'en-US'
              );

              return (
                <div key={item.id} className="bg-white border rounded-2xl p-4" style={{ borderColor: '#E5E7EB' }}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-texto truncate">{item.nome || '-'}</p>
                      <p className="text-xs text-texto-cl mt-0.5">
                        {t('stockPage.lastUpdated')}: {dateText}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${badgeClass}`}>
                      {status === 'out'
                        ? t('stock.esgotado')
                        : status === 'low'
                        ? t('stock.pouco', { n: item.stockAtual })
                        : t('stock.emStock', { n: item.stockAtual })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-texto-med">
                      {t('stockPage.stockNow')}: <span className="font-semibold text-texto">{item.stockAtual}</span>
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openMovementModal(item, 'entrada')}
                        disabled={item.isDemo}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-600 text-white disabled:opacity-50"
                      >
                        + {t('stockPage.addEntry')}
                      </button>
                      <button
                        type="button"
                        onClick={() => openMovementModal(item, 'saida')}
                        disabled={item.isDemo}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-600 text-white disabled:opacity-50"
                      >
                        - {t('stockPage.addExit')}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {activeItem && (
        <div className="fixed inset-0 z-[200] bg-black/50 p-4 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-5 w-full max-w-md">
            <h2 className="text-lg font-semibold text-texto mb-1">
              {movementType === 'entrada' ? t('stockPage.movementTitleEntry') : t('stockPage.movementTitleExit')}
            </h2>
            <p className="text-sm text-texto-med mb-4 truncate">{activeItem.nome}</p>

            <label className="block text-sm font-medium text-texto mb-1">{t('stockPage.quantity')}</label>
            <input
              type="number"
              min="1"
              value={movementQty}
              onChange={(e) => setMovementQty(e.target.value)}
              className="w-full bg-white border border-creme-2 rounded-xl px-4 py-3 text-sm mb-3"
            />

            <label className="block text-sm font-medium text-texto mb-1">{t('stockPage.reasonOptional')}</label>
            <input
              type="text"
              value={movementNote}
              onChange={(e) => setMovementNote(e.target.value)}
              placeholder={t('stockPage.reasonPlaceholder')}
              className="w-full bg-white border border-creme-2 rounded-xl px-4 py-3 text-sm mb-4"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={closeMovementModal}
                disabled={savingMovement}
                className="flex-1 border border-creme-2 rounded-xl py-2.5 text-sm font-medium text-texto-med"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={submitMovement}
                disabled={savingMovement}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white"
                style={{ backgroundColor: movementType === 'entrada' ? '#1B5E3B' : '#D97706' }}
              >
                {savingMovement
                  ? t('common.saving')
                  : movementType === 'entrada'
                  ? t('stockPage.confirmEntry')
                  : t('stockPage.confirmExit')}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
