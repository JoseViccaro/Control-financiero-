import { 
  UserFinancialProfile, 
  MonthlySummary, 
  DebtPlanResult, 
  EmergencyFundPlan, 
  ActionPlanItem,
  FinancialTransaction
} from '../models/types.js';

export function generateActionPlan(
  profile: UserFinancialProfile,
  summary: MonthlySummary,
  debtPlan: DebtPlanResult,
  fundPlan: EmergencyFundPlan
): ActionPlanItem[] {
  const actions: ActionPlanItem[] = [];
  const movs: FinancialTransaction[] = profile.movimientosReales || [];

  // Si el perfil está completamente en blanco (sin extractos ni datos), invitar a subir el primer extracto
  if (profile.ingresosNetosMensuales === 0 && summary.gastosFijosTotal === 0 && summary.gastosVariablesTotal === 0 && movs.length === 0) {
    return [
      {
        prioridad: 1,
        impacto: 'ALTO',
        titulo: 'Sube el extracto bancario de tu cuenta y el de tu esposa',
        descripcion: 'Para darte misiones financieras exactas basadas en vuestra realidad familiar, importa el archivo CSV en la sección de abajo.'
      }
    ];
  }

  // 1. ANÁLISIS DE LA SITUACIÓN FAMILIAR Y SALARIO NETO CONJUNTO
  const titulares = Array.from(new Set(movs.map(m => m.titular).filter(Boolean)));
  const hayPareja = titulares.length > 1 || titulares.some(t => t?.toLowerCase().includes('esposa'));

  // 2. DIAGNÓSTICO DE BALANCE REAL (Déficit o Superávit)
  if (summary.dineroLibre < 0) {
    actions.push({
      prioridad: 1,
      impacto: 'ALTO',
      titulo: 'Freno de emergencia: Déficit familiar de ' + Math.abs(summary.dineroLibre).toFixed(2) + ' €',
      descripcion: 'Vuestros gastos superan los ingresos reales del hogar este mes por ' + Math.abs(summary.dineroLibre).toFixed(2) + ' €. Congelad gastos en ocio, compras online y salidas hasta recuperar el equilibrio.'
    });
  }

  // 3. ANÁLISIS DE DEUDA Y TARJETAS CARAS
  if (debtPlan.alertaEndeudamiento) {
    actions.push({
      prioridad: actions.length + 1,
      impacto: 'ALTO',
      titulo: 'Alerta de Endeudamiento: ' + debtPlan.ratioEndeudamiento + '% de vuestros ingresos',
      descripcion: 'Las cuotas de deuda absorben ' + summary.cuotasDeudaTotal.toFixed(2) + ' €/mes. Superáis el límite saludable del 35%. Es prioritario no asumir ninguna nueva compra a plazos.'
    });
  } else if (profile.deudas.length > 0) {
    const recomendada = debtPlan.metodoRecomendado === 'avalancha' ? debtPlan.avalancha : debtPlan.bolaDeNieve;
    actions.push({
      prioridad: actions.length + 1,
      impacto: 'ALTO',
      titulo: 'Objetivo de Deuda: Cancelar ' + recomendada.deudaPrioritaria,
      descripcion: 'Es la deuda que más daño os hace (' + debtPlan.motivoRecomendacion + '). Mantened la cuota mínima en el resto y meted todo ahorro extraordinario aquí.'
    });
  }

  // 4. ANÁLISIS DE FUGAS REALES DETECTADAS EN LOS EXTRACTOS
  if (profile.fugasPresupuesto && profile.fugasPresupuesto.length > 0) {
    const fugaPrincipal = [...profile.fugasPresupuesto].sort((a, b) => b.monto - a.monto)[0];
    const totalFugas = profile.fugasPresupuesto.reduce((s, f) => s + f.monto, 0);
    actions.push({
      prioridad: actions.length + 1,
      impacto: 'ALTO',
      titulo: 'Eliminar fuga detectada: "' + fugaPrincipal.nombre + '" (' + fugaPrincipal.monto.toFixed(2) + ' €)',
      descripcion: 'El extracto bancario reveló un total de ' + totalFugas.toFixed(2) + ' € en micropagos/suscripciones. Cortando este gasto recuperaríais ' + (fugaPrincipal.monto * 12).toFixed(0) + ' € al año para vuestro colchón.'
    });
  }

  // 5. FONDO DE EMERGENCIA FAMILIAR
  const meta300 = fundPlan.metas[0];
  if (meta300 && meta300.importeFalta > 0) {
    actions.push({
      prioridad: actions.length + 1,
      impacto: 'ALTO',
      titulo: 'Completar colchón salvavidas de emergencia: Faltan ' + meta300.importeFalta.toFixed(2) + ' €',
      descripcion: 'Tener un fondo de 300 € a 1.000 € en cuenta separada os protegerá de tener que tirar de tarjetas si surge una avería doméstica o médica.'
    });
  }

  // 6. DISTRIBUCIÓN REAL DE NÓMINA (PÁGATE A TI MISMO PRIMERO)
  if (profile.ingresosNetosMensuales > 0) {
    const ahorroSugerido = +(profile.ingresosNetosMensuales * 0.15).toFixed(2);
    actions.push({
      prioridad: actions.length + 1,
      impacto: 'MEDIO',
      titulo: 'Automatizar ahorro conjunto: ' + ahorroSugerido + ' € el día 1',
      descripcion: 'Con vuestra nómina neta conjunta de ' + profile.ingresosNetosMensuales.toFixed(2) + ' €, programad una transferencia automática de ' + ahorroSugerido + ' € (15%) el día siguiente a cobrar.'
    });
  }

  // 7. TOPE REAL DE SUPERMERCADO
  if (profile.gastosVariables.supermercado > 0) {
    const topeSemanal = +(profile.gastosVariables.supermercado / 4.33).toFixed(2);
    actions.push({
      prioridad: actions.length + 1,
      impacto: 'MODERADO',
      titulo: 'Límite semanal en Mercadona/Supermercado: ' + topeSemanal + ' €/semana',
      descripcion: 'Vuestro gasto mensual real en alimentación es de ' + profile.gastosVariables.supermercado.toFixed(2) + ' €. Planificando la compra semanal con tope de ' + topeSemanal + ' € evitaréis desvíos a final de mes.'
    });
  }

  return actions.slice(0, 5);
}
