import { 
  UserFinancialProfile, 
  MonthlySummary, 
  DebtPlanResult, 
  EmergencyFundPlan, 
  ActionPlanItem 
} from '../models/types.js';

export function generateActionPlan(
  profile: UserFinancialProfile,
  summary: MonthlySummary,
  debtPlan: DebtPlanResult,
  fundPlan: EmergencyFundPlan
): ActionPlanItem[] {
  const actions: ActionPlanItem[] = [];

  if (summary.dineroLibre < 0) {
    actions.push({
      prioridad: 1,
      impacto: 'ALTO',
      titulo: 'Frenar deficit mensual de inmediato',
      descripcion: 'Tu balance actual es deficitario (' + summary.dineroLibre + ' EUR). Esta semana congela compras online y recorta ocio/comidas fuera para equilibrar tus finanzas.'
    });
  } else if (debtPlan.alertaEndeudamiento) {
    actions.push({
      prioridad: 1,
      impacto: 'ALTO',
      titulo: 'Freno de endeudamiento y revision de cuotas',
      descripcion: 'Tus cuotas (' + summary.cuotasDeudaTotal + ' EUR) superan el 35% de tus ingresos (' + debtPlan.ratioEndeudamiento + '%). No contrates ninguna financiacion adicional.'
    });
  }

  // Si el perfil está completamente en blanco (sin ingresos ni gastos), no generar misiones vacías con 0 EUR
  if (profile.ingresosNetosMensuales === 0 && summary.gastosFijosTotal === 0 && summary.gastosVariablesTotal === 0) {
    return [
      {
        prioridad: 1,
        impacto: 'ALTO',
        titulo: 'Cargar o ingresar tus datos reales del mes',
        descripcion: 'Importa tu extracto bancario en la sección de Tesorería o pulsa en "Meter Mis Datos" para que la app pueda analizar tus ingresos y gastos y recomendarte tu hoja de ruta.'
      }
    ];
  }

  const meta300 = fundPlan.metas[0];
  if (meta300 && meta300.importeFalta > 0) {
    actions.push({
      prioridad: actions.length + 1,
      impacto: 'ALTO',
      titulo: 'Completar el colchon salvavidas de 300 EUR',
      descripcion: 'Te faltan ' + meta300.importeFalta + ' EUR para alcanzar los primeros 300 EUR de seguridad. Destina cualquier ingreso puntual aqui.'
    });
  }

  if (profile.deudas.length > 0) {
    const recomendada = debtPlan.metodoRecomendado === 'avalancha' ? debtPlan.avalancha : debtPlan.bolaDeNieve;
    actions.push({
      prioridad: actions.length + 1,
      impacto: 'ALTO',
      titulo: 'Foco de ataque de deuda: ' + recomendada.deudaPrioritaria,
      descripcion: 'Manten pagos minimos en todas y canaliza todo excedente hacia ' + recomendada.deudaPrioritaria + ' (' + debtPlan.motivoRecomendacion + ').'
    });
  }

  if (profile.objetivoAhorroMensual > 0) {
    actions.push({
      prioridad: actions.length + 1,
      impacto: 'MEDIO',
      titulo: 'Configurar transferencia automatica de ahorro',
      descripcion: 'Programa una transferencia automatica de ' + profile.objetivoAhorroMensual + ' EUR justo el dia posterior al cobro de tu nomina.'
    });
  }

  if (profile.gastosVariables.supermercado > 0) {
    actions.push({
      prioridad: actions.length + 1,
      impacto: 'MODERADO',
      titulo: 'Comprar con lista cerrada y limite semanal',
      descripcion: 'Establece un techo semanal en supermercado de ' + +(profile.gastosVariables.supermercado / 4.33).toFixed(2) + ' EUR y revisa la despensa antes de comprar.'
    });
  }

  return actions.slice(0, 5);
}
