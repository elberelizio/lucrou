'use client';

import Link from 'next/link';

export default function UpgradeBanner() {
  return (
    <div className="bg-gradient-to-br from-verde to-verde-med rounded-3xl p-6 text-white shadow-hero mb-6">
      <h3 className="font-serif text-xl mb-2">
        Acede ao teu histórico
      </h3>
      <p className="text-sm opacity-90 mb-4">
        Guarda e consulta os teus produtos de forma simples.
      </p>
      <Link href="/ativar">
        <button className="w-full bg-white text-verde py-3 px-4 rounded-2xl font-medium hover:bg-mint transition-colors">
          Saber mais
        </button>
      </Link>
    </div>
  );
}
