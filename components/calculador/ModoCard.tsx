'use client';

import { ModoCalculo } from '@/lib/types';

interface ModoCardProps {
  modo: ModoCalculo;
  titulo: string;
  descricao: string;
  selecionado: boolean;
  onClick: () => void;
}

export default function ModoCard({ modo, titulo, descricao, selecionado, onClick }: ModoCardProps) {
  const iconA = (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );

  const iconB = (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  const isModoA = modo === 'modoA';

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl shadow-card border p-8 py-12 min-h-[200px] transition-all hover:shadow-verde active:scale-[0.98] cursor-pointer"
      style={{ 
        borderColor: '#E5E7EB',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = isModoA ? '#4CAF75' : '#D4622A';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#E5E7EB';
      }}
    >
      <div className="flex items-start gap-5">
        <div 
          className="flex-shrink-0 mt-1 rounded-xl p-2"
          style={{ 
            backgroundColor: isModoA ? '#D0EBD9' : '#FCE8D5',
            color: isModoA ? '#1B5E3B' : '#D4622A'
          }}
        >
          {modo === 'modoA' ? iconA : iconB}
        </div>
        <div className="flex-1">
          <div className="text-[17px] font-semibold text-texto mb-3 leading-tight">{titulo}</div>
          <div className="text-[14px] text-texto-med leading-relaxed">{descricao}</div>
        </div>
      </div>
    </button>
  );
}
