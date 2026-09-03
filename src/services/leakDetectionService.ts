import {
  MoneyLeakInput,
  MoneyLeakItem,
  AggregatedLeakReport,
  LeakImpactOnGoals,
  LeakAnalysisResult,
  UserFinancialProfile,
  LeakCategory
} from '../models/types.js';
import { calculateEmergencyFundPlan } from './emergencyFundService.js';

export function normalizeFrequencies(leaks: MoneyLeakInput[] = []): MoneyLeakItem[] {
  return leaks
    .filter(leak => leak && typeof leak.monto === 'number' && leak.monto > 0)
    .map(leak => {
      let costeMensual = 0;
      let costeAnual = 0;

      switch (leak.frecuencia) {
        case 'diario':
          costeMensual = +(leak.monto * 30).toFixed(2);
          costeAnual = +(leak.monto * 365).toFixed(2);
          break;
        case 'semanal':
          costeAnual = +(leak.monto * 52).toFixed(2);
          costeMensual = +((leak.monto * 52) / 12).toFixed(2);
          break;
        case 'mensual':
          costeMensual = +leak.monto.toFixed(2);
          costeAnual = +(leak.monto * 12).toFixed(2);
          break;
        case 'anual':
          costeAnual = +leak.monto.toFixed(2);
          costeMensual = +(leak.monto / 12).toFixed(2);
          break;
        default:
          costeMensual = +leak.monto.toFixed(2);
          costeAnual = +(leak.monto * 12).toFixed(2);
          break;
      }

      return {
        ...leak,
        costeMensual,
        costeAnual
      };
    });
}

export function aggregateLeakCosts(items: MoneyLeakItem[] = []): AggregatedLeakReport {
  const defaultCategoryTotals: Record<LeakCategory, { mensual: number; anual: number }> = {
    hormiga: { mensual: 0, anual: 0 },
    vampiro: { mensual: 0, anual: 0 },
    prescindible: { mensual: 0, anual: 0 }
  };

  const porCategoria = items.reduce((acc, item) => {
    if (!acc[item.categoria]) {
      acc[item.categoria] = { mensual: 0, anual: 0 };
    }
    acc[item.categoria].mensual = +(acc[item.categoria].mensual + item.costeMensual).toFixed(2);
    acc[item.categoria].anual = +(acc[item.categoria].anual + item.costeAnual).toFixed(2);
    return acc;
  }, defaultCategoryTotals);

  const totalMensual = +(
    porCategoria.hormiga.mensual +
    porCategoria.vampiro.mensual +
    porCategoria.prescindible.mensual
  ).toFixed(2);

  const totalAnual = +(
    porCategoria.hormiga.anual +
    porCategoria.vampiro.anual +
    porCategoria.prescindible.anual
  ).toFixed(2);

  return {
    totalMensual,
    totalAnual,
    porCategoria
  };
}

export function calculateLeakImpactOnGoals(
  ahorroMensualRecuperable: number,
  profile: UserFinancialProfile
): LeakImpactOnGoals {
  const recuperable = Math.max(0, ahorroMensualRecuperable);

  // 1. Impacto en Deuda
  let deudaResult = {
    mesesBase: null as number | null,
    mesesAcelerado: null as number | null,
    mesesAhorrados: 0,
    mensaje: 'Sin deudas activas o amortización no requerida.'
  };

  const deudas = profile.deudas || [];
  const saldoTotalDeuda = deudas.reduce((acc, d) => acc + d.saldoPendiente, 0);
  const cuotaTotalDeuda = deudas.reduce((acc, d) => acc + d.cuotaMensual, 0);

  if (deudas.length > 0 && saldoTotalDeuda > 0) {
    const baseCuota = cuotaTotalDeuda > 0 ? cuotaTotalDeuda : 0;
    const mesesBase = baseCuota > 0 ? Math.ceil(saldoTotalDeuda / baseCuota) : null;
    const cuotaAcelerada = baseCuota + recuperable;
    const mesesAcelerado = cuotaAcelerada > 0 ? Math.ceil(saldoTotalDeuda / cuotaAcelerada) : null;

    let mesesAhorrados = 0;
    if (mesesBase !== null && mesesAcelerado !== null) {
      mesesAhorrados = Math.max(0, mesesBase - mesesAcelerado);
    }

    const mensaje = mesesAhorrados > 0
      ? `Reasignando ${recuperable.toFixed(2)} EUR/mes liquidarás tu deuda ${mesesAhorrados} mes(es) antes (de ${mesesBase} a ${mesesAcelerado} meses).`
      : `Capacidad de amortización actual: ${mesesAcelerado ?? 'N/A'} mes(es) estimados para saldar deuda.`;

    deudaResult = {
      mesesBase,
      mesesAcelerado,
      mesesAhorrados,
      mensaje
    };
  }

  // 2. Impacto en Fondo de Emergencia
  const emergencyPlan = calculateEmergencyFundPlan(profile);
  // Buscar el primer milestone que todavía no esté 100% conseguido
  const hitoObjetivo = emergencyPlan.metas.find(m => m.importeFalta > 0);

  let fondoResult = {
    mesesBase: null as number | null,
    mesesAcelerado: null as number | null,
    mesesAhorrados: 0,
    mensaje: 'Fondo de emergencia completado en su totalidad.'
  };

  if (hitoObjetivo) {
    const falta = hitoObjetivo.importeFalta;
    const ahorroBase = Math.max(0, profile.objetivoAhorroMensual || 0);
    const ahorroAcelerado = ahorroBase + recuperable;

    const mesesBase = ahorroBase > 0 ? Math.ceil(falta / ahorroBase) : null;
    const mesesAcelerado = ahorroAcelerado > 0 ? Math.ceil(falta / ahorroAcelerado) : null;

    let mesesAhorrados = 0;
    if (mesesBase !== null && mesesAcelerado !== null) {
      mesesAhorrados = Math.max(0, mesesBase - mesesAcelerado);
    }

    let mensaje = '';
    if (mesesBase === null && mesesAcelerado !== null) {
      mensaje = `Con el ahorro recuperado podrás alcanzar tu meta '${hitoObjetivo.nombre}' en ${mesesAcelerado} mes(es) (antes inviable sin ahorro mensual).`;
    } else if (mesesAhorrados > 0) {
      mensaje = `Aceleras tu meta '${hitoObjetivo.nombre}' ahorrando ${mesesAhorrados} mes(es) (de ${mesesBase} a ${mesesAcelerado} meses).`;
    } else {
      mensaje = `Tiempo estimado para '${hitoObjetivo.nombre}': ${mesesAcelerado ?? 'N/A'} mes(es).`;
    }

    fondoResult = {
      mesesBase,
      mesesAcelerado,
      mesesAhorrados,
      mensaje
    };
  } else {
    fondoResult = {
      mesesBase: 0,
      mesesAcelerado: 0,
      mesesAhorrados: 0,
      mensaje: 'Fondo de emergencia completado en su totalidad (100% de los hitos alcanzados).'
    };
  }

  return {
    ahorroMensualRecuperable: recuperable,
    deuda: deudaResult,
    fondoEmergencia: fondoResult
  };
}

export function analyzeMoneyLeaks(
  leaks: MoneyLeakInput[] | undefined,
  profile: UserFinancialProfile
): LeakAnalysisResult {
  const fugas = normalizeFrequencies(leaks || []);
  const agregado = aggregateLeakCosts(fugas);
  const impacto = calculateLeakImpactOnGoals(agregado.totalMensual, profile);

  return {
    fugas,
    agregado,
    impacto
  };
}
