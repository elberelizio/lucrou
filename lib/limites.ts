// Plan limits and business constants
// Only two plans exist: 'gratuito' and 'premium'
// 'basico' and 'completo' were removed — they never existed in production

export const MODO_LANCAMENTO_GRATUITO = true;
/** Standby: esconde Resumo do menu e layout (a página /resumo continua a existir). */
export const SHOW_RESUMO = false;
export const FREE_PLAN_CALC_LIMIT = 10;
export const PREMIUM_PRICE_MT = 50;
export const PREMIUM_DURATION_MONTHS = 1;
export const STOCK_LOW_THRESHOLD = 3; // units — below this, show "stock baixo" warning
