import { FormularioModoA, FormularioModoB, ResultadoCalculo, StatusPreco } from './types';

export function calcularModoA(form: FormularioModoA): ResultadoCalculo {
  const totalOutros = form.outrosCustos.reduce((acc, c) => acc + c.valor, 0);
  const custoTotal = form.totalPago + form.transporte + totalOutros;
  const custoPorUnidade = custoTotal / form.unidades;
  const precoMinimo = custoPorUnidade;
  const precoRecomendado = custoPorUnidade * (1 + form.lucroPercent / 100);
  const lucroPorUnidade = precoRecomendado - custoPorUnidade;
  const lucroTotal = lucroPorUnidade * form.unidades;
  const margemPercent = form.lucroPercent;

  const decomposicao: Record<string, number> = {
    'Purchase price': form.totalPago,
    Shipping: form.transporte,
  };
  form.outrosCustos.forEach(c => { decomposicao[c.nome] = c.valor; });

  return {
    nomeProduto: form.nomeProduto,
    custoPorUnidade,
    precoMinimo,
    precoRecomendado,
    lucroPorUnidade,
    lucroTotal,
    margemPercent,
    status: 'bom',
    unidades: form.unidades,
    decomposicao,
    modo: 'modoA',
  };
}

export function calcularModoB(form: FormularioModoB): ResultadoCalculo {
  // Custo total = (preço por unidade × unidades) + custos adicionais
  const custoTotal = (form.precoPorUnidade * form.unidades) + form.custosAdicionais;
  // Custo por unidade = custo total ÷ unidades
  const custoPorUnidade = custoTotal / form.unidades;
  
  // Preço recomendado com margem de 30% sobre o custo por unidade
  const precoRecomendado = custoPorUnidade * 1.30;
  
  // Lucro por unidade com o preço atual
  const lucroPorUnidade = form.precoActual - custoPorUnidade;
  
  // Lucro total = lucro por unidade × unidades
  const lucroTotal = lucroPorUnidade * form.unidades;
  
  // Margem actual em percentagem
  const margemActual = custoPorUnidade > 0
    ? ((form.precoActual - custoPorUnidade) / custoPorUnidade) * 100
    : 0;

  let status: StatusPreco;
  if (form.precoActual >= custoPorUnidade * 1.10) status = 'bom';
  else if (form.precoActual >= custoPorUnidade) status = 'limite';
  else status = 'prejuizo';

  return {
    nomeProduto: form.nomeProduto,
    custoPorUnidade,
    precoMinimo: custoPorUnidade,
    precoRecomendado,
    lucroPorUnidade,
    lucroTotal,
    margemPercent: margemActual,
    status,
    unidades: form.unidades,
    decomposicao: {
      'Supplier price': form.precoPorUnidade * form.unidades,
      'Extra costs': form.custosAdicionais,
    },
    modo: 'modoB',
  };
}

export function formatarMT(valor: number, numberLocale: string = 'pt-MZ'): string {
  return `${Math.round(valor).toLocaleString(numberLocale)} MT`;
}
