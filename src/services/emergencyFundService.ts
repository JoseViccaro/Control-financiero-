import { UserFinancialProfile, EmergencyFundPlan, EmergencyFundMilestone } from '../models/types.js';
import { calculateExpensePlan } from './expensePlanService.js';

export function calculateEmergencyFundPlan(profile: UserFinancialProfile): EmergencyFundPlan {
  const expensePlan = calculateExpensePlan(profile);
  // Gastos esenciales: fijos y variables esenciales + cuotas obligatorias
  const cuotasObligatorias = profile.deudas.reduce((sum, d) => sum + d.cuotaMensual, 0);
  const gastosEsencialesMensuales = +(expensePlan.gastosEsencialesTotal + cuotasObligatorias).toFixed(2);

  const fondoActual = profile.fondoEmergenciaActual;
  const ahorroMensual = profile.objetivoAhorroMensual;

  const targets = [
    { nombre: 'Fondo Inicial (300 €)', metaEuros: 300 },
    { nombre: '1 Mes de Gastos Esenciales', metaEuros: gastosEsencialesMensuales * 1 },
    { nombre: '3 Meses de Gastos Esenciales', metaEuros: +(gastosEsencialesMensuales * 3).toFixed(2) },
    { nombre: '6 Meses de Gastos Esenciales', metaEuros: +(gastosEsencialesMensuales * 6).toFixed(2) }
  ];

  const metas: EmergencyFundMilestone[] = targets.map(t => {
    const falta = Math.max(0, +(t.metaEuros - fondoActual).toFixed(2));
    const porcentaje = t.metaEuros > 0 
      ? Math.min(100, Math.round((fondoActual / t.metaEuros) * 100))
      : 100;
    
    let mesesEstimados: number | null = null;
    if (falta === 0) {
      mesesEstimados = 0;
    } else if (ahorroMensual > 0) {
      mesesEstimados = Math.ceil(falta / ahorroMensual);
    }

    return {
      nombre: t.nombre,
      metaEuros: t.metaEuros,
      importeFalta: falta,
      porcentajeLogrado: porcentaje,
      mesesEstimados
    };
  });

  return {
    gastosEsencialesMensuales,
    fondoActual,
    metas,
    recomendacionTransferencia: 'Sugiero programar una transferencia automática de tu objetivo de ahorro mensual justo el día posterior a cobrar la nómina (pagarse a uno mismo primero).',
    prioridadRegla: 'Prioridad estricta: 1º Mantener todas las cuotas de deudas al día, 2º Conseguir el fondo inicial protector de 300 €, 3º Una vez alcanzados los 300 €, redirigir el extra a liquidar deudas de alto interés, 4º Ampliar el fondo a 3-6 meses.'
  };
}
