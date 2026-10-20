'use client';

import { useEffect } from 'react';
import { registarVisita } from '@/lib/analytics';

export default function VisitTracker() {
  useEffect(() => {
    registarVisita();
  }, []);

  return null;
}
