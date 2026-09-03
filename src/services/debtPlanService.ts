import { UserFinancialProfile, DebtPlanResult, DebtStrategyPlan, DebtItem } from '../models/types.js';

export function calculateDebtPlan(profile: UserFinancialProfile, dineroExtraDisponible: number = 0): DebtPlanResult {
  const deudas = [...profile.deudas];
  const pagoMinimoTotal = deudas.reduce((sum, d) => sum + d.cuotaMensual, 0);
  const pagoExtra = Math.max(0, dineroExtraDisponible);

  const ordenAvalancha: DebtItem[] = [...deudas].sort((a, b) => b.tipoInteres - a.tipoInteres);
  const prioridadAvalancha = ordenAvalancha.length > 0 ? ordenAvalancha[0].nombre : 'Ninguna';

  const avalancha: DebtStrategyPlan = {
    metodo: 'avalancha',
    ordenDeudas: ordenAvalancha,
    descripcion: 'Pagar cuotas minimas en todas y destinar todo el dinero extra a la deuda con MAYOR tipo de interes (ahorro maximo en intereses totales).',
    deudaPrioritaria: prioridadAvalancha,
    pagoMinimoTotal,
    pagoExtraSugerido: pagoExtra
  };

  const ordenBolaDeNieve: DebtItem[] = [...deudas].sort((a, b) => a.saldoPendiente - b.saldoPendiente);
  const prioridadBola = ordenBolaDeNieve.length > 0 ? ordenBolaDeNieve[0].nombre : 'Ninguna';

  const bolaDeNieve: DebtStrategyPlan = {
    metodo: 'bola_de_nieve',
    ordenDeudas: ordenBolaDeNieve,
    descripcion: 'Pagar cuotas minimas en todas y concentrar el dinero extra en la deuda con MENOR saldo para eliminarla rapido y ganar impulso psicologico.',
    deudaPrioritaria: prioridadBola,
    pagoMinimoTotal,
    pagoExtraSugerido: pagoExtra
  };

  let metodoRecomendado: 'avalancha' | 'bola_de_nieve' = 'avalancha';
  let motivoRecomendacion = '';

  if (deudas.length <= 1) {
    metodoRecomendado = 'avalancha';
    motivoRecomendacion = 'Con una sola deuda, ambos metodos coinciden. Manten la cuota al dia y amortiza con cualquier extra.';
  } else {
    const maxInteres = ordenAvalancha[0]?.tipoInteres || 0;
    const minInteres = ordenAvalancha[ordenAvalancha.length - 1]?.tipoInteres || 0;
    
    if (maxInteres - minInteres >= 8 || maxInteres > 18) {
      metodoRecomendado = 'avalancha';
      motivoRecomendacion = 'Recomendado metodo Avalancha porque tienes una deuda con un interes elevado del ' + maxInteres + '% (' + prioridadAvalancha + '). Liquidarla primero te evitara una fuga enorme de dinero en intereses.';
    } else {
      metodoRecomendado = 'bola_de_nieve';
      motivoRecomendacion = 'Recomendado metodo Bola de Nieve para liquidar rapidamente ' + prioridadBola + ' (saldo menor: ' + (ordenBolaDeNieve[0]?.saldoPendiente || 0) + ' EUR). Te liberara una cuota mensual pronto y reducira tu estres financiero.';
    }
  }

  const ratioEndeudamiento = profile.ingresosNetosMensuales > 0
    ? (pagoMinimoTotal / profile.ingresosNetosMensuales) * 100
    : 0;

  const ratioFormateado = Math.round(ratioEndeudamiento * 100) / 100;
  const alertaEndeudamiento = ratioFormateado > 35;

  const mensajeAlerta = alertaEndeudamiento
    ? 'ALERTA CRITICA DE ENDEUDAMIENTO: Tus cuotas de deuda representan el ' + ratioFormateado + '% de tus ingresos netos (el limite prudencial es 35%). Es prioritario no asumir ninguna nueva financiacion y reajustar gastos.'
    : undefined;

  return {
    avalancha,
    bolaDeNieve,
    metodoRecomendado,
    motivoRecomendacion,
    ratioEndeudamiento: ratioFormateado,
    alertaEndeudamiento,
    mensajeAlerta
  };
}
