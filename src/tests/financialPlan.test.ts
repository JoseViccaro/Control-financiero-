import { describe, it, expect } from 'vitest';
import { UserFinancialProfile } from '../models/types.js';
import { calculateMonthlySummary } from '../services/summaryService.js';
import { calculateExpensePlan } from '../services/expensePlanService.js';
import { calculateDebtPlan } from '../services/debtPlanService.js';
import { calculateEmergencyFundPlan } from '../services/emergencyFundService.js';
import { generateActionPlan } from '../services/actionPlanService.js';
import { generateFinancialReport } from '../services/reportService.js';

const mockProfile: UserFinancialProfile = {
  ingresosNetosMensuales: 2000,
  dineroDisponibleActual: 800,
  gastosFijos: {
    vivienda: 600,
    suministros: 120,
    telefono: 30,
    internet: 40,
    seguros: 50,
    transporte: 80,
    cuotas: 0
  },
  gastosVariables: {
    supermercado: 350,
    ocio: 150,
    comidasFuera: 120,
    comprasOnline: 80,
    otros: 50
  },
  deudas: [
    { nombre: 'Tarjeta de Crédito', saldoPendiente: 1200, cuotaMensual: 100, tipoInteres: 21.5, fechaPago: '05' },
    { nombre: 'Préstamo Coche', saldoPendiente: 4500, cuotaMensual: 180, tipoInteres: 7.9, fechaPago: '10' }
  ],
  fondoEmergenciaActual: 150,
  objetivoAhorroMensual: 150,
  proximosGastosExcepcionales: [
    { concepto: 'ITV y revisión coche', importe: 250, fechaAproximada: 'En 2 meses' }
  ]
};

describe('1. Resumen Mensual (calculateMonthlySummary)', () => {
  it('calcula correctamente totales, dinero libre y porcentaje destinado a deudas', () => {
    const summary = calculateMonthlySummary(mockProfile);
    expect(summary.ingresos).toBe(2000);
    // Gastos fijos: 600 + 120 + 30 + 40 + 50 + 80 + 0 = 920
    expect(summary.gastosFijosTotal).toBe(920);
    // Gastos variables: 350 + 150 + 120 + 80 + 50 = 750
    expect(summary.gastosVariablesTotal).toBe(750);
    // Cuotas deudas: 100 + 180 = 280
    expect(summary.cuotasDeudaTotal).toBe(280);
    // Ahorro comprometido: 150
    expect(summary.ahorroComprometido).toBe(150);
    // Dinero libre: 2000 - (920 + 750 + 280 + 150) = -100
    expect(summary.dineroLibre).toBe(-100);
    // Ratio endeudamiento: (280 / 2000) * 100 = 14%
    expect(summary.porcentajeDestinadoDeuda).toBe(14);
  });
});

describe('2. Plan de Gastos (calculateExpensePlan)', () => {
  it('clasifica gastos en esencial, recortable y prescindible y sugiere límites', () => {
    const plan = calculateExpensePlan(mockProfile);
    expect(plan.items.length).toBeGreaterThan(5);

    const superItem = plan.items.find(i => i.categoria === 'supermercado');
    expect(superItem).toBeDefined();
    expect(superItem?.clasificacion).toBe('esencial');
    expect(superItem?.limiteMensualSugerido).toBeGreaterThan(0);
    expect(superItem?.limiteSemanalSugerido).toBeCloseTo(superItem!.limiteMensualSugerido / 4.33, 1);

    const ocioItem = plan.items.find(i => i.categoria === 'ocio');
    expect(ocioItem?.clasificacion).toBe('recortable');

    const comprasOnline = plan.items.find(i => i.categoria === 'comprasOnline');
    expect(comprasOnline?.clasificacion).toBe('prescindible');
  });
});

describe('3. Plan de Deudas (calculateDebtPlan)', () => {
  it('nunca sugiere dejar de pagar cuotas y genera Avalancha y Bola de Nieve', () => {
    const plan = calculateDebtPlan(mockProfile, 50); // con 50€ extra hipotéticos
    expect(plan.avalancha.metodo).toBe('avalancha');
    // Avalancha: mayor tipo de interés primero (Tarjeta 21.5% antes que Coche 7.9%)
    expect(plan.avalancha.ordenDeudas[0].nombre).toBe('Tarjeta de Crédito');
    
    // Bola de nieve: menor saldo primero (Tarjeta 1200 antes que Coche 4500)
    expect(plan.bolaDeNieve.ordenDeudas[0].nombre).toBe('Tarjeta de Crédito');

    expect(plan.alertaEndeudamiento).toBe(false);
  });

  it('activa alerta de endeudamiento si total cuotas supera 35% de ingresos netos', () => {
    const highDebtProfile: UserFinancialProfile = {
      ...mockProfile,
      ingresosNetosMensuales: 1000, // 280 / 1000 = 28%
      deudas: [
        { nombre: 'Préstamo A', saldoPendiente: 5000, cuotaMensual: 400, tipoInteres: 10, fechaPago: '01' }
      ] // 400 / 1000 = 40% > 35%
    };
    const plan = calculateDebtPlan(highDebtProfile, 0);
    expect(plan.ratioEndeudamiento).toBe(40);
    expect(plan.alertaEndeudamiento).toBe(true);
    expect(plan.mensajeAlerta).toContain('35%');
  });
});

describe('4. Fondo de Emergencia (calculateEmergencyFundPlan)', () => {
  it('calcula metas progresivas: 300 euros, 1 mes, 3 meses y 6 meses esenciales', () => {
    const plan = calculateEmergencyFundPlan(mockProfile);
    expect(plan.metas.length).toBe(4);
    
    const meta300 = plan.metas[0];
    expect(meta300.nombre).toBe('Fondo Inicial (300 €)');
    expect(meta300.metaEuros).toBe(300);
    expect(meta300.importeFalta).toBe(150); // 300 - 150 actual
    expect(meta300.porcentajeLogrado).toBe(50);
    expect(meta300.mesesEstimados).toBe(1); // 150 faltante / 150 ahorro mensual

    expect(plan.recomendacionTransferencia).toContain('posterior a cobrar');
  });
});

describe('5. Acciones de Hoy (generateActionPlan)', () => {
  it('devuelve un máximo de 5 acciones concretas ordenadas por impacto', () => {
    const summary = calculateMonthlySummary(mockProfile);
    const debtPlan = calculateDebtPlan(mockProfile, 0);
    const fundPlan = calculateEmergencyFundPlan(mockProfile);

    const actions = generateActionPlan(mockProfile, summary, debtPlan, fundPlan);
    expect(actions.length).toBeGreaterThan(0);
    expect(actions.length).toBeLessThanOrEqual(5);
    expect(actions[0].prioridad).toBe(1);
    expect(actions[0].impacto).toBe('ALTO');
  });
});

describe('6. Reporte Financiero con Fugas de Presupuesto (generateFinancialReport)', () => {
  it('omite la sección de fugas cuando no hay fugas registradas', () => {
    const report = generateFinancialReport(mockProfile);
    expect(report).not.toContain('FUGAS DE PRESUPUESTO Y OPTIMIZACIÓN');
    expect(report).toContain('1. RESUMEN MENSUAL');
    expect(report).toContain('2. PLAN DE GASTOS Y CLASIFICACIÓN');
  });

  it('renderiza la sección FUGAS DE PRESUPUESTO Y OPTIMIZACIÓN con desglose e impacto cuando existen fugas', () => {
    const profileWithLeaks: UserFinancialProfile = {
      ...mockProfile,
      fugasPresupuesto: [
        { nombre: 'Café de máquina', monto: 2, frecuencia: 'diario', categoria: 'hormiga' },
        { nombre: 'Suscripción streaming', monto: 15, frecuencia: 'mensual', categoria: 'vampiro' }
      ]
    };
    const report = generateFinancialReport(profileWithLeaks);
    expect(report).toContain('FUGAS DE PRESUPUESTO Y OPTIMIZACIÓN');
    expect(report).toContain('Café de máquina');
    expect(report).toContain('HORMIGA');
    expect(report).toContain('Suscripción streaming');
    expect(report).toContain('VAMPIRO');
    expect(report).toContain('TOTAL FUGA MENSUAL:');
    expect(report).toContain('75.00 EUR'); // 60 + 15
    expect(report).toContain('Impacto proyectado');
  });
});
