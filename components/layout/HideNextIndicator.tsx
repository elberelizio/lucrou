'use client';

import { useEffect } from 'react';

export default function HideNextIndicator() {
  useEffect(() => {
    // Função para remover o indicador "N"
    const removeNextIndicator = () => {
      // Remover por atributos data-nextjs
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
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          if (el.parentNode) {
            el.parentNode.removeChild(el);
          }
        });
      });

      // Remover qualquer elemento fixo no canto inferior que contenha "N"
      const allElements = document.querySelectorAll('body > *');
      allElements.forEach(el => {
        const style = window.getComputedStyle(el);
        const isFixed = style.position === 'fixed';
        const isBottom = style.bottom === '0px' || style.bottom === '0' || parseFloat(style.bottom) < 20;
        const isRight = style.right === '0px' || style.right === '0' || parseFloat(style.right) < 20;
        
        if (isFixed && (isBottom || isRight)) {
          const text = el.textContent || '';
          const hasN = text === 'N' || (text.length === 1 && text.includes('N'));
          const hasNextJsAttr = el.hasAttribute('data-nextjs') || 
                                el.querySelector('[data-nextjs]') !== null ||
                                el.getAttribute('id')?.includes('nextjs') ||
                                el.getAttribute('class')?.includes('nextjs');
          
          if (hasN || hasNextJsAttr) {
            if (el.parentNode) {
              el.parentNode.removeChild(el);
            }
          }
        }
      });

      // Remover elementos com z-index muito alto (overlays)
      allElements.forEach(el => {
        const style = window.getComputedStyle(el);
        const zIndex = parseInt(style.zIndex);
        if (zIndex > 9999 && style.position === 'fixed') {
          const text = el.textContent || '';
          if (text.includes('N') || el.querySelector('[data-nextjs]')) {
            if (el.parentNode) {
              el.parentNode.removeChild(el);
            }
          }
        }
      });
    };

    // Executar imediatamente
    removeNextIndicator();

    // Usar MutationObserver para detectar quando elementos são adicionados
    const observer = new MutationObserver(() => {
      removeNextIndicator();
    });

    // Observar mudanças no body
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-nextjs', 'id', 'class'],
    });

    // Executar periodicamente como backup
    const interval = setInterval(removeNextIndicator, 50);

    // Limpar quando o componente desmontar
    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  return null;
}
