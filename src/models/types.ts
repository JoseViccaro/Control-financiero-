export interface FixedExpenses {
  vivienda: number;
  suministros: number;
  telefono: number;
  internet: number;
  seguros: number;
  transporte: number;
  cuotas: number;
}

export interface VariableExpenses {
  supermercado: number;
  ocio: number;
  comidasFuera: number;
  comprasOnline: number;
  otros: number;
}

export interface DebtItem {
  nombre: string;
  saldoPendiente: number;
  cuotaMensual: number;
  tipoInteres: number; // Porcentaje anual (ej. 12.5)
  fechaPago: string; // ej. 'Día 5' o '05'
}

export interface ExceptionalExpense {
  concepto: string;
  importe: number;
  fechaAproximada?: string;
}

export interface SmartGroceryInput {
  alimentosEnCasa: string[];
  personasComen: number;
  diasCompra: number;
  presupuestoMaximo: number;
}

export interface UserFinancialProfile {
  ingresosNetosMensuales: number;
  dineroDisponibleActual: number;
  gastosFijos: FixedExpenses;
  gastosVariables: VariableExpenses;
  deudas: DebtItem[];
  fondoEmergenciaActual: number;
  objetivoAhorroMensual: number;
  proximosGastosExcepcionales: ExceptionalExpense[];
  compraInteligente?: SmartGroceryInput;
  fugasPresupuesto?: MoneyLeakInput[];
}

export type LeakFrequency = 'diario' | 'semanal' | 'mensual' | 'anual';
export type LeakCategory = 'hormiga' | 'vampiro' | 'prescindible';

export interface MoneyLeakInput {
  nombre: string;
  monto: number;
  frecuencia: LeakFrequency;
  categoria: LeakCategory;
}

export interface MoneyLeakItem extends MoneyLeakInput {
  costeMensual: number;
  costeAnual: number;
}

export interface AggregatedLeakReport {
  totalMensual: number;
  totalAnual: number;
  porCategoria: Record<LeakCategory, { mensual: number; anual: number }>;
}

export interface LeakImpactOnGoals {
  ahorroMensualRecuperable: number;
  deuda: {
    mesesBase: number | null;
    mesesAcelerado: number | null;
    mesesAhorrados: number;
    mensaje: string;
  };
  fondoEmergencia: {
    mesesBase: number | null;
    mesesAcelerado: number | null;
    mesesAhorrados: number;
    mensaje: string;
  };
}

export interface LeakAnalysisResult {
  fugas: MoneyLeakItem[];
  agregado: AggregatedLeakReport;
  impacto: LeakImpactOnGoals;
}

export interface MonthlySummary {
  ingresos: number;
  gastosFijosTotal: number;
  gastosVariablesTotal: number;
  cuotasDeudaTotal: number;
  ahorroComprometido: number;
  dineroLibre: number;
  porcentajeDestinadoDeuda: number;
}

export type ExpensePriority = 'esencial' | 'recortable' | 'prescindible';

export interface ExpenseItemClassification {
  categoria: string;
  montoActual: number;
  clasificacion: ExpensePriority;
  limiteMensualSugerido: number;
  limiteSemanalSugerido: number;
  disponibleRestante: number;
}

export interface ExpensePlan {
  items: ExpenseItemClassification[];
  gastosEsencialesTotal: number;
  gastosRecortablesTotal: number;
  gastosPrescindiblesTotal: number;
}

export interface DebtStrategyPlan {
  metodo: 'avalancha' | 'bola_de_nieve';
  ordenDeudas: DebtItem[];
  descripcion: string;
  deudaPrioritaria: string;
  pagoMinimoTotal: number;
  pagoExtraSugerido: number;
}

export interface DebtPlanResult {
  avalancha: DebtStrategyPlan;
  bolaDeNieve: DebtStrategyPlan;
  metodoRecomendado: 'avalancha' | 'bola_de_nieve';
  motivoRecomendacion: string;
  ratioEndeudamiento: number;
  alertaEndeudamiento: boolean;
  mensajeAlerta?: string;
}

export interface EmergencyFundMilestone {
  nombre: string;
  metaEuros: number;
  importeFalta: number;
  porcentajeLogrado: number;
  mesesEstimados: number | null;
}

export interface EmergencyFundPlan {
  gastosEsencialesMensuales: number;
  fondoActual: number;
  metas: EmergencyFundMilestone[];
  recomendacionTransferencia: string;
  prioridadRegla: string;
}

export interface GroceryItem {
  nombre: string;
  seccion: 'fruta y verdura' | 'proteínas' | 'despensa' | 'lácteos' | 'congelados' | 'limpieza';
  cantidad: string;
  costeEstimado: number;
  esencial: boolean;
}

export interface SmartGroceryPlan {
  items: GroceryItem[];
  costeEstimadoTotal: number;
  presupuestoMaximo: number;
  ajustesRealizados: string[];
}

export interface ActionPlanItem {
  prioridad: number;
  impacto: 'ALTO' | 'MEDIO' | 'MODERADO';
  titulo: string;
  descripcion: string;
}
