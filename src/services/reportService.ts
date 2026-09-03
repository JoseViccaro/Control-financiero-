import { UserFinancialProfile, SmartGroceryInput } from '../models/types.js';
import { calculateMonthlySummary } from './summaryService.js';
import { calculateExpensePlan } from './expensePlanService.js';
import { calculateDebtPlan } from './debtPlanService.js';
import { calculateEmergencyFundPlan } from './emergencyFundService.js';
import { calculateSmartGroceryPlan } from './smartGroceriesService.js';
import { generateActionPlan } from './actionPlanService.js';
import { analyzeMoneyLeaks } from './leakDetectionService.js';

export function generateFinancialReport(profile: UserFinancialProfile): string {
  const summary = calculateMonthlySummary(profile);
  const expensePlan = calculateExpensePlan(profile);
  const debtPlan = calculateDebtPlan(profile, Math.max(0, summary.dineroLibre));
  const emergencyFund = calculateEmergencyFundPlan(profile);
  const actions = generateActionPlan(profile, summary, debtPlan, emergencyFund);

  let out = '';
  out += '===========================================================\\n';
  out += '          PLAN FINANCIERO PERSONAL - DIAGNÓSTICO           \\n';
  out += '===========================================================\\n\\n';

  // 1. Resumen Mensual
  out += '1. RESUMEN MENSUAL\\n';
  out += '-----------------------------------------------------------\\n';
  out += '  (+) Ingresos netos mensuales:        ' + summary.ingresos.toFixed(2) + ' EUR\\n';
  out += '  (-) Gastos fijos obligatorios:       ' + summary.gastosFijosTotal.toFixed(2) + ' EUR\\n';
  out += '  (-) Gastos variables del mes:        ' + summary.gastosVariablesTotal.toFixed(2) + ' EUR\\n';
  out += '  (-) Cuotas mensuales de deuda:       ' + summary.cuotasDeudaTotal.toFixed(2) + ' EUR\\n';
  out += '  (-) Ahorro mensual comprometido:     ' + summary.ahorroComprometido.toFixed(2) + ' EUR\\n';
  out += '  ---------------------------------------------------------\\n';
  out += '  (=) DINERO LIBRE / MARGEN RESTANTE:  ' + summary.dineroLibre.toFixed(2) + ' EUR\\n';
  out += '  (*) Porcentaje destinado a deuda:    ' + summary.porcentajeDestinadoDeuda.toFixed(2) + '%\\n';
  out += '  (*) Liquidez disponible actual:      ' + profile.dineroDisponibleActual.toFixed(2) + ' EUR\\n\\n';

  // 2. Plan de Gastos
  out += '2. PLAN DE GASTOS Y CLASIFICACIÓN\\n';
  out += '-----------------------------------------------------------\\n';
  out += '  [ESENCIALES]: ' + expensePlan.gastosEsencialesTotal.toFixed(2) + ' EUR | ';
  out += '[RECORTABLES]: ' + expensePlan.gastosRecortablesTotal.toFixed(2) + ' EUR | ';
  out += '[PRESCINDIBLES]: ' + expensePlan.gastosPrescindiblesTotal.toFixed(2) + ' EUR\\n\\n';
  out += '  Límites sugeridos para partidas clave:\\n';
  for (const item of expensePlan.items) {
    if (['supermercado', 'ocio', 'comidasFuera', 'comprasOnline'].includes(item.categoria)) {
      out += '  - ' + item.categoria.toUpperCase() + ' (' + item.clasificacion.toUpperCase() + '):\\n';
      out += '      Gasto actual: ' + item.montoActual.toFixed(2) + ' EUR | Límite mensual: ' + item.limiteMensualSugerido.toFixed(2) + ' EUR\\n';
      out += '      Límite semanal: ' + item.limiteSemanalSugerido.toFixed(2) + ' EUR/sem | Remanente disponible: ' + item.disponibleRestante.toFixed(2) + ' EUR\\n';
    }
  }
  out += '\\n';

  // 3. Plan de Deudas
  out += '3. PLAN DE DESENDEUDAMIENTO\\n';
  out += '-----------------------------------------------------------\\n';
  out += '  * REGLA CLAVE: Nunca dejes de pagar una cuota mínima obligatoria.\\n';
  if (debtPlan.alertaEndeudamiento) {
    out += '  /!\\ ' + debtPlan.mensajeAlerta + '\\n\\n';
  } else {
    out += '  Ratio de endeudamiento controlado: ' + debtPlan.ratioEndeudamiento + '% (límite saludable: 35%).\\n\\n';
  }

  out += '  [MÉTODO AVALANCHA] (Prioriza interés más alto):\\n';
  out += '    Orden: ' + debtPlan.avalancha.ordenDeudas.map(d => d.nombre + ' (' + d.tipoInteres + '%)').join(' -> ') + '\\n';
  out += '    Foco extra: ' + debtPlan.avalancha.deudaPrioritaria + '\\n\\n';

  out += '  [MÉTODO BOLA DE NIEVE] (Prioriza menor saldo):\\n';
  out += '    Orden: ' + debtPlan.bolaDeNieve.ordenDeudas.map(d => d.nombre + ' (' + d.saldoPendiente + ' EUR)').join(' -> ') + '\\n';
  out += '    Foco extra: ' + debtPlan.bolaDeNieve.deudaPrioritaria + '\\n\\n';

  out += '  >>> RECOMENDACIÓN: Método ' + debtPlan.metodoRecomendado.toUpperCase() + '\\n';
  out += '      Motivo: ' + debtPlan.motivoRecomendacion + '\\n\\n';

  // 4. Fondo de Emergencia
  out += '4. FONDO DE EMERGENCIA PROGRESIVO\\n';
  out += '-----------------------------------------------------------\\n';
  out += '  Gastos esenciales mensuales calculados: ' + emergencyFund.gastosEsencialesMensuales.toFixed(2) + ' EUR\\n';
  out += '  Saldo actual en fondo: ' + emergencyFund.fondoActual.toFixed(2) + ' EUR\\n\\n';
  out += '  Metas escalonadas:\\n';
  for (const m of emergencyFund.metas) {
    const meses = m.mesesEstimados !== null ? m.mesesEstimados + ' mes(es)' : 'Incalculable (sin ahorro)';
    out += '  - ' + m.nombre + ': Objetivo: ' + m.metaEuros.toFixed(2) + ' EUR | Logrado: ' + m.porcentajeLogrado + '% | Falta: ' + m.importeFalta.toFixed(2) + ' EUR (Est: ' + meses + ')\\n';
  }
  out += '\\n  Estrategia: ' + emergencyFund.prioridadRegla + '\\n';
  out += '  Consejo práctico: ' + emergencyFund.recomendacionTransferencia + '\\n\\n';

  // 5. Compra Inteligente (si se proporcionó)
  if (profile.compraInteligente) {
    const groceryPlan = calculateSmartGroceryPlan(profile.compraInteligente);
    out += '5. COMPRA INTELIGENTE OPTIMIZADA\\n';
    out += '-----------------------------------------------------------\\n';
    out += '  Comensales: ' + profile.compraInteligente.personasComen + ' | Días: ' + profile.compraInteligente.diasCompra + ' | Presupuesto máx: ' + profile.compraInteligente.presupuestoMaximo.toFixed(2) + ' EUR\\n';
    out += '  Coste estimado total de la lista: ' + groceryPlan.costeEstimadoTotal.toFixed(2) + ' EUR\\n\\n';
    
    // Agrupar por sección
    const secciones = ['fruta y verdura', 'proteínas', 'despensa', 'lácteos', 'congelados', 'limpieza'] as const;
    for (const sec of secciones) {
      const prods = groceryPlan.items.filter(i => i.seccion === sec);
      if (prods.length > 0) {
        out += '  [' + sec.toUpperCase() + ']:\\n';
        for (const p of prods) {
          out += '    * ' + p.nombre + ' - ' + p.cantidad + ' (~' + p.costeEstimado.toFixed(2) + ' EUR)\\n';
        }
      }
    }
    if (groceryPlan.ajustesRealizados.length > 0) {
      out += '\n  Ajustes para cumplir el presupuesto:\n';
      for (const a of groceryPlan.ajustesRealizados) {
        out += '    - ' + a + '\n';
      }
    }
    out += '\n';
  }

  // Fugas de Presupuesto (si existen)
  if (profile.fugasPresupuesto && profile.fugasPresupuesto.length > 0) {
    const leaksResult = analyzeMoneyLeaks(profile.fugasPresupuesto, profile);
    if (leaksResult.fugas.length > 0) {
      out += 'FUGAS DE PRESUPUESTO Y OPTIMIZACIÓN\n';
      out += '-----------------------------------------------------------\n';
      out += '  Detalle de fugas detectadas y normalizadas:\n';
      for (const f of leaksResult.fugas) {
        out += '  - [' + f.categoria.toUpperCase() + '] ' + f.nombre + ' (' + f.monto.toFixed(2) + ' EUR / ' + f.frecuencia + '):\n';
        out += '      Coste mensual: ' + f.costeMensual.toFixed(2) + ' EUR | Coste anualizado: ' + f.costeAnual.toFixed(2) + ' EUR\n';
      }
      out += '\n  Totales acumulados:\n';
      out += '  * TOTAL FUGA MENSUAL: ' + leaksResult.agregado.totalMensual.toFixed(2) + ' EUR\n';
      out += '  * TOTAL FUGA ANUAL:   ' + leaksResult.agregado.totalAnual.toFixed(2) + ' EUR\n';
      out += '  * Desglose por categoría: Hormiga: ' + leaksResult.agregado.porCategoria.hormiga.mensual.toFixed(2) + ' EUR/mes | Vampiro: ' + leaksResult.agregado.porCategoria.vampiro.mensual.toFixed(2) + ' EUR/mes | Prescindible: ' + leaksResult.agregado.porCategoria.prescindible.mensual.toFixed(2) + ' EUR/mes\n\n';

      out += '  Impacto proyectado al recuperar y reasignar estas fugas:\n';
      out += '  - En Desendeudamiento: ' + leaksResult.impacto.deuda.mensaje + '\n';
      out += '  - En Fondo de Emergencia: ' + leaksResult.impacto.fondoEmergencia.mensaje + '\n\n';
    }
  }

  // 6. Acciones de Hoy
  out += '6. ACCIONES CONCRETAS DE ESTA SEMANA (TOP ' + actions.length + ' POR IMPACTO)\\n';
  out += '-----------------------------------------------------------\\n';
  for (const act of actions) {
    out += '  [' + act.prioridad + '] [' + act.impacto + '] ' + act.titulo + '\\n';
    out += '      ' + act.descripcion + '\\n';
  }
  out += '===========================================================\\n';

  return out;
}
