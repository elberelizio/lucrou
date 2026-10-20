import { ResultadoCalculo } from './types';
import { formatarMT } from './calculos';
import type { Locale } from './i18n/types';
import { translate } from './i18n/messages';
import { localeToNumberFormat } from './i18n/localeUtils';

export function gerarMensagemWhatsApp(resultado: ResultadoCalculo, locale: Locale = 'en'): string {
  const nf = localeToNumberFormat(locale);
  const t = (path: string, vars?: Record<string, string | number>) => translate(locale, path, vars);
  const linhas = [
    t('whatsapp.header'),
    ``,
    `${t('whatsapp.produto')}: ${resultado.nomeProduto}`,
    `${t('whatsapp.custoReal')}: ${formatarMT(resultado.custoPorUnidade, nf)}`,
    `${t('whatsapp.precoMin')}: ${formatarMT(resultado.precoMinimo, nf)}`,
    `${t('whatsapp.precoRec')}: ${formatarMT(resultado.precoRecomendado, nf)}`,
    `${t('whatsapp.lucroUn')}: ${formatarMT(resultado.lucroPorUnidade, nf)}`,
  ];

  if (resultado.modo === 'modoA' && resultado.unidades > 1) {
    linhas.push(`${t('whatsapp.lucroTot', { n: resultado.unidades })}: ${formatarMT(resultado.lucroTotal, nf)}`);
  }

  linhas.push(``);
  linhas.push(t('whatsapp.footer'));
  linhas.push(`lucrou.vercel.app`);

  return linhas.join('\n');
}

export function abrirWhatsApp(mensagem: string): void {
  const encoded = encodeURIComponent(mensagem);
  window.open(`https://wa.me/?text=${encoded}`, '_blank');
}
