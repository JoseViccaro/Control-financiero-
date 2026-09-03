import { UserFinancialProfile, ExpensePlan, ExpenseItemClassification } from '../models/types.js';

export function calculateExpensePlan(profile: UserFinancialProfile): ExpensePlan {
  const f = profile.gastosFijos;
  const v = profile.gastosVariables;

  const items: ExpenseItemClassification[] = [
    // Gastos fijos (Generalmente esenciales o contratos)
    { categoria: 'vivienda', montoActual: f.vivienda, clasificacion: 'esencial', limiteMensualSugerido: f.vivienda, limiteSemanalSugerido: +(f.vivienda / 4.33).toFixed(2), disponibleRestante: 0 },
    { categoria: 'suministros', montoActual: f.suministros, clasificacion: 'esencial', limiteMensualSugerido: f.suministros, limiteSemanalSugerido: +(f.suministros / 4.33).toFixed(2), disponibleRestante: 0 },
    { categoria: 'telefono', montoActual: f.telefono, clasificacion: 'recortable', limiteMensualSugerido: Math.max(15, f.telefono * 0.8), limiteSemanalSugerido: +(Math.max(15, f.telefono * 0.8) / 4.33).toFixed(2), disponibleRestante: 0 },
    { categoria: 'internet', montoActual: f.internet, clasificacion: 'esencial', limiteMensualSugerido: f.internet, limiteSemanalSugerido: +(f.internet / 4.33).toFixed(2), disponibleRestante: 0 },
    { categoria: 'seguros', montoActual: f.seguros, clasificacion: 'esencial', limiteMensualSugerido: f.seguros, limiteSemanalSugerido: +(f.seguros / 4.33).toFixed(2), disponibleRestante: 0 },
    { categoria: 'transporte', montoActual: f.transporte, clasificacion: 'esencial', limiteMensualSugerido: f.transporte, limiteSemanalSugerido: +(f.transporte / 4.33).toFixed(2), disponibleRestante: 0 },
    { categoria: 'cuotas', montoActual: f.cuotas, clasificacion: 'esencial', limiteMensualSugerido: f.cuotas, limiteSemanalSugerido: +(f.cuotas / 4.33).toFixed(2), disponibleRestante: 0 },

    // Gastos variables
    {
      categoria: 'supermercado',
      montoActual: v.supermercado,
      clasificacion: 'esencial',
      limiteMensualSugerido: v.supermercado,
      limiteSemanalSugerido: +(v.supermercado / 4.33).toFixed(2),
      disponibleRestante: +(v.supermercado * 0.25).toFixed(2) // estimación de margen
    },
    {
      categoria: 'ocio',
      montoActual: v.ocio,
      clasificacion: 'recortable',
      limiteMensualSugerido: +(v.ocio * 0.7).toFixed(2),
      limiteSemanalSugerido: +((v.ocio * 0.7) / 4.33).toFixed(2),
      disponibleRestante: +(v.ocio * 0.15).toFixed(2)
    },
    {
      categoria: 'comidasFuera',
      montoActual: v.comidasFuera,
      clasificacion: 'recortable',
      limiteMensualSugerido: +(v.comidasFuera * 0.6).toFixed(2),
      limiteSemanalSugerido: +((v.comidasFuera * 0.6) / 4.33).toFixed(2),
      disponibleRestante: +(v.comidasFuera * 0.1).toFixed(2)
    },
    {
      categoria: 'comprasOnline',
      montoActual: v.comprasOnline,
      clasificacion: 'prescindible',
      limiteMensualSugerido: +(v.comprasOnline * 0.3).toFixed(2),
      limiteSemanalSugerido: +((v.comprasOnline * 0.3) / 4.33).toFixed(2),
      disponibleRestante: 0
    },
    {
      categoria: 'otros',
      montoActual: v.otros,
      clasificacion: 'recortable',
      limiteMensualSugerido: +(v.otros * 0.8).toFixed(2),
      limiteSemanalSugerido: +((v.otros * 0.8) / 4.33).toFixed(2),
      disponibleRestante: 0
    }
  ];

  const gastosEsencialesTotal = items
    .filter(i => i.clasificacion === 'esencial')
    .reduce((sum, i) => sum + i.montoActual, 0);

  const gastosRecortablesTotal = items
    .filter(i => i.clasificacion === 'recortable')
    .reduce((sum, i) => sum + i.montoActual, 0);

  const gastosPrescindiblesTotal = items
    .filter(i => i.clasificacion === 'prescindible')
    .reduce((sum, i) => sum + i.montoActual, 0);

  return {
    items,
    gastosEsencialesTotal,
    gastosRecortablesTotal,
    gastosPrescindiblesTotal
  };
}
