import type { Metadata } from "next";
import { DM_Serif_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import SplashProvider from "@/components/layout/SplashProvider";
import HideNextIndicator from "@/components/layout/HideNextIndicator";
import SecureConsole from "@/components/layout/SecureConsole";
import AppTracker from "@/components/analytics/AppTracker";
import MetaPixel from "@/components/analytics/MetaPixel";
import { I18nProvider } from "@/lib/i18n/context";

const dmSerif = DM_Serif_Display({
  weight: ['400'],
  variable: "--font-serif",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  weight: ['400', '500', '700'],
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lucrou — Preço certo, lucro garantido",
  description: "Calculadora de preço de venda para revendedores informais em Moçambique",
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Segurança: Limpar console e ocultar informações sensíveis
                (function secureConsole() {
                  // Sobrescrever console antes de qualquer coisa
                  const noop = function() {};
                  const originalLog = console.log;
                  const originalError = console.error;
                  const originalWarn = console.warn;
                  const originalInfo = console.info;
                  const originalDebug = console.debug;
                  
                  console.log = noop;
                  console.error = noop;
                  console.warn = noop;
                  console.info = noop;
                  console.debug = noop;
                  
                  // Limpar console imediatamente
                  if (typeof window !== 'undefined' && window.console) {
                    try {
                      window.console.clear();
                    } catch(e) {}
                  }
                  
                  // Ocultar stack traces de erros
                  window.addEventListener('error', function(e) {
                    e.preventDefault();
                    return false;
                  }, true);
                  
                  window.addEventListener('unhandledrejection', function(e) {
                    e.preventDefault();
                    return false;
                  }, true);
                })();
                
                // Função agressiva para remover o indicador "N"
                const removeNextIndicator = () => {
                  // Remover por seletores específicos
                  const selectors = [
                    '[data-nextjs-dialog]',
                    '[data-nextjs-toast]',
                    '[data-nextjs-router]',
                    '[data-nextjs-dialog-overlay]',
                    '[data-nextjs-toast-container]',
                    'iframe[src*="__nextjs"]',
                    'iframe[src*="nextjs"]',
                  ];
                  
                  selectors.forEach(selector => {
                    try {
                      const elements = document.querySelectorAll(selector);
                      elements.forEach(el => {
                        if (el && el.parentNode) {
                          el.parentNode.removeChild(el);
                        }
                      });
                    } catch(e) {}
                  });
                  
                  // Remover qualquer elemento fixo que contenha "N"
                  try {
                    const allElements = document.querySelectorAll('body > *');
                    allElements.forEach(el => {
                      const style = window.getComputedStyle(el);
                      const isFixed = style.position === 'fixed';
                      const isBottom = style.bottom === '0px' || style.bottom === '0' || parseFloat(style.bottom) < 20;
                      const isRight = style.right === '0px' || style.right === '0' || parseFloat(style.right) < 20;
                      
                      if (isFixed && (isBottom || isRight)) {
                        const text = (el.textContent || '').trim();
                        const hasN = text === 'N' || (text.length === 1 && text.includes('N'));
                        const hasNextJsAttr = el.hasAttribute('data-nextjs') || 
                                              el.querySelector('[data-nextjs]') !== null ||
                                              (el.getAttribute('id') || '').includes('nextjs') ||
                                              (el.getAttribute('class') || '').includes('nextjs');
                        
                        if (hasN || hasNextJsAttr) {
                          if (el.parentNode) {
                            el.parentNode.removeChild(el);
                          }
                        }
                      }
                    });
                  } catch(e) {}
                };
                
                // Executar imediatamente
                removeNextIndicator();
                
                // Executar quando o DOM estiver pronto
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', removeNextIndicator);
                } else {
                  removeNextIndicator();
                }
                
                // Executar periodicamente
                setInterval(removeNextIndicator, 50);
                
                // Usar MutationObserver
                if (typeof MutationObserver !== 'undefined') {
                  const observer = new MutationObserver(removeNextIndicator);
                  observer.observe(document.body, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['data-nextjs', 'id', 'class', 'style'],
                  });
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${dmSerif.variable} ${dmSans.variable} font-sans antialiased text-texto`}
        style={{ backgroundColor: '#FAF7F2' }}
      >
        <I18nProvider>
          <MetaPixel />
          <AppTracker />
          <SecureConsole />
          <HideNextIndicator />
          <SplashProvider>
            {children}
          </SplashProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
