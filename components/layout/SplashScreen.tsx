'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useI18n } from '@/lib/i18n/context';

export default function SplashScreen() {
  const { t } = useI18n();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Verificar se já foi mostrado antes (primeira abertura real)
    const hasSeenSplash = typeof window !== 'undefined' 
      ? localStorage.getItem('lucrou_splash_shown') === 'true'
      : true;

    // Só mostrar se nunca foi mostrado antes
    if (!hasSeenSplash) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Marcar como já visto
        if (typeof window !== 'undefined') {
          localStorage.setItem('lucrou_splash_shown', 'true');
        }
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Não mostrar se já foi visto antes
  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className={`fixed inset-0 z-[9999] bg-black/20 backdrop-blur-sm flex flex-col items-center justify-center gap-8 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Logo - o pop-up é o próprio logo */}
      <div className="relative w-96 h-32">
        <Image 
          src="/lucrou.webp" 
          alt="Lucrou" 
          fill
          className="object-contain"
          priority
        />
      </div>
      
      {/* Slogan */}
      <p className="text-center text-white text-sm leading-relaxed max-w-[280px] drop-shadow-lg">
        {t('splash.slogan')}
      </p>
      
      {/* Loading Spinner - branco com parte verde */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          {/* Círculo branco de fundo */}
          <div className="absolute inset-0 border-4 border-white/30 rounded-full"></div>
          {/* Parte verde a processar */}
          <div className="absolute inset-0 border-4 border-white border-t-transparent border-r-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  );
}
