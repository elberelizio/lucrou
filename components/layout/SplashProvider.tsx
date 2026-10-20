'use client';

import SplashScreen from './SplashScreen';
import PageTransition from './PageTransition';

export default function SplashProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SplashScreen />
      <PageTransition>
        {children}
      </PageTransition>
    </>
  );
}
