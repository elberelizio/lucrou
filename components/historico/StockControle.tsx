'use client';

import { useState, useMemo } from 'react';
import { StockStatus } from '@/lib/types';
import { STOCK_LOW_THRESHOLD } from '@/lib/limites';
import { useI18n } from '@/lib/i18n/context';

interface StockControleProps {
  calculoId: string;
  stockAtual: number;
  sessionToken: string;
  onStockUpdated: (newStock: number, newStatus: StockStatus) => void;
}

function getStockStatus(stock: number): StockStatus {
  if (stock === 0) return 'esgotado';
  if (stock <= STOCK_LOW_THRESHOLD) return 'baixo';
  return 'disponivel';
}

const statusStyles: Record<StockStatus, string> = {
  disponivel: 'text-green-600',
  baixo: 'text-yellow-600',
  esgotado: 'text-red-600',
};

export function StockControle({
  calculoId,
  stockAtual,
  sessionToken,
  onStockUpdated,
}: StockControleProps) {
  const { t } = useI18n();
  const [currentStock, setCurrentStock] = useState(stockAtual);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = getStockStatus(currentStock);

  const statusLabel = useMemo(
    () =>
      ({
        disponivel: (n: number) => t('stock.emStock', { n }),
        baixo: (n: number) => t('stock.pouco', { n }),
        esgotado: () => t('stock.esgotado'),
      }) as Record<StockStatus, (n: number) => string>,
    [t]
  );

  const registerMovement = async (tipo: 'entrada' | 'saida') => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stock/movimento', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ calculo_id: calculoId, tipo, quantidade: 1 }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || t('stock.errUpdate'));
        return;
      }

      const newStock: number = result.stock_atual;
      const newStatus: StockStatus = result.stock_status;
      setCurrentStock(newStock);
      onStockUpdated(newStock, newStatus);
    } catch {
      setError(t('stock.errNetwork'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 mt-2">
      <button
        type="button"
        onClick={() => registerMovement('saida')}
        disabled={loading || currentStock === 0}
        aria-label={t('stock.ariaMenos')}
        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 text-lg font-bold disabled:opacity-40 active:scale-95 transition-transform"
      >
        −
      </button>

      <span className={`text-sm font-medium min-w-[110px] text-center ${statusStyles[status]}`}>
        {status === 'esgotado' ? statusLabel.esgotado(0) : statusLabel[status](currentStock)}
      </span>

      <button
        type="button"
        onClick={() => registerMovement('entrada')}
        disabled={loading}
        aria-label={t('stock.ariaMais')}
        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 text-lg font-bold disabled:opacity-40 active:scale-95 transition-transform"
      >
        +
      </button>

      {error && <span className="text-xs text-red-500 ml-1">{error}</span>}
    </div>
  );
}
