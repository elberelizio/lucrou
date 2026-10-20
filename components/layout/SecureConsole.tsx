'use client';

import { useEffect } from 'react';

export default function SecureConsole() {
  useEffect(() => {
    // Sobrescrever métodos do console para não mostrar informações sensíveis
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;
    const originalDebug = console.debug;

    // Função para sanitizar mensagens (remover caminhos de arquivos)
    const sanitizeMessage = (message: any): any => {
      if (typeof message === 'string') {
        // Remover caminhos de arquivos
        return message
          .replace(/[A-Z]:\\[^\s]+/gi, '[path removed]')
          .replace(/\/[^\s]+/g, '[path removed]')
          .replace(/file:\/\/\/[^\s]+/gi, '[path removed]')
          .replace(/at\s+[^\s]+\s+\([^)]+\)/g, 'at [location removed]')
          .replace(/Error:\s+[^\n]+/g, 'Error: [detalhes removidos]');
      }
      return message;
    };

    // Sobrescrever console.log
    console.log = (...args: any[]) => {
      // Não mostrar nada em produção ou desenvolvimento
      // Comentar a linha abaixo se quiser ver logs em desenvolvimento
      return;
      // originalLog(...args.map(sanitizeMessage));
    };

    // Sobrescrever console.error (mostrar apenas mensagens genéricas)
    console.error = (...args: any[]) => {
      // Mostrar apenas mensagens genéricas sem stack traces
      const sanitized = args.map(arg => {
        if (arg instanceof Error) {
          return 'Error: [details removed for security]';
        }
        return sanitizeMessage(arg);
      });
      // Não mostrar nada - comentar se quiser ver erros genéricos
      return;
      // originalError(...sanitized);
    };

    // Sobrescrever console.warn
    console.warn = (...args: any[]) => {
      return;
      // originalWarn(...args.map(sanitizeMessage));
    };

    // Sobrescrever console.info
    console.info = (...args: any[]) => {
      return;
      // originalInfo(...args.map(sanitizeMessage));
    };

    // Sobrescrever console.debug
    console.debug = (...args: any[]) => {
      return;
      // originalDebug(...args.map(sanitizeMessage));
    };

    // Limpar console periodicamente
    const intervalId = setInterval(() => {
      if (typeof window !== 'undefined' && window.console) {
        // Limpar apenas se não estiver em modo de desenvolvimento explícito
        // window.console.clear();
      }
    }, 5000);

    // Limpar console ao carregar
    if (typeof window !== 'undefined' && window.console) {
      // window.console.clear();
    }

    // Remover informações do window que podem expor estrutura
    if (typeof window !== 'undefined') {
      // Tentar remover __NEXT_DATA__ se possível (readonly, mas tentamos)
      try {
        Object.defineProperty(window, '__NEXT_DATA__', {
          value: {},
          writable: false,
          configurable: false,
        });
      } catch (e) {
        // Ignorar se não for possível
      }
    }

    return () => {
      clearInterval(intervalId);
      // Restaurar métodos originais se necessário (opcional)
      // console.log = originalLog;
      // console.error = originalError;
      // console.warn = originalWarn;
      // console.info = originalInfo;
      // console.debug = originalDebug;
    };
  }, []);

  return null;
}
