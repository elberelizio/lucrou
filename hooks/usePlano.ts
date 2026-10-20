'use client';

import { useState, useEffect } from 'react';
import { PlanoUtilizador } from '@/lib/types';
import { storage } from '@/lib/storage';

export function usePlano() {
  const [plano, setPlano] = useState<PlanoUtilizador>('gratuito');

  useEffect(() => {
    setPlano(storage.getPlano());
  }, []);

  const atualizarPlano = (novoPlano: PlanoUtilizador) => {
    storage.setPlano(novoPlano);
    setPlano(novoPlano);
  };

  return { plano, atualizarPlano };
}
