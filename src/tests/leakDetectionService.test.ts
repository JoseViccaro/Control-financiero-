import { describe, it, expect } from 'vitest';
import { MoneyLeakInput, UserFinancialProfile } from '../models/types.js';
import {
  normalizeFrequencies,
  aggregateLeakCosts,
  calculateLeakImpactOnGoals,
  analyzeMoneyLeaks
} from '../services/leakDetectionService.js';

describe('leakDetectionService', () => {
  describe('normalizeFrequencies & aggregateLeakCosts', () => {
    it('normalizes daily micro-expense (gasto hormiga) correctly', () => {
      const input: MoneyLeakInput[] = [
        { nombre: 'Café y snacks', monto: 3.50, frecuencia: 'diario', categoria: 'hormiga' }
      ];

      const items = normalizeFrequencies(input);
      expect(items).toHaveLength(1);
      expect(items[0].categoria).toBe('hormiga');
      expect(items[0].costeMensual).toBe(105); // 3.5 * 30
      expect(items[0].costeAnual).toBe(1277.5); // 3.5 * 365
    });

    it('normalizes weekly expense correctly', () => {
      const input: MoneyLeakInput[] = [
        { nombre: 'Lotería o capricho semanal', monto: 12, frecuencia: 'semanal', categoria: 'prescindible' }
      ];

      const items = normalizeFrequencies(input);
      expect(items).toHaveLength(1);
      expect(items[0].costeAnual).toBe(624); // 12 * 52
      expect(items[0].costeMensual).toBe(52); // (12 * 52) / 12 = 52
    });

    it('normalizes monthly subscription correctly', () => {
      const input: MoneyLeakInput[] = [
        { nombre: 'Gimnasio no usado', monto: 30, frecuencia: 'mensual', categoria: 'vampiro' }
      ];

      const items = normalizeFrequencies(input);
      expect(items).toHaveLength(1);
      expect(items[0].costeMensual).toBe(30);
      expect(items[0].costeAnual).toBe(360);
    });

    it('normalizes annual subscription (gasto vampiro) correctly', () => {
      const input: MoneyLeakInput[] = [
        { nombre: 'Streaming Anual', monto: 120, frecuencia: 'anual', categoria: 'vampiro' }
      ];

      const items = normalizeFrequencies(input);
      expect(items).toHaveLength(1);
      expect(items[0].categoria).toBe('vampiro');
      expect(items[0].costeMensual).toBe(10); // 120 / 12
      expect(items[0].costeAnual).toBe(120);
    });

    it('aggregates across multiple mixed-frequency leaks', () => {
      const input: MoneyLeakInput[] = [
        { nombre: 'Hormiga 1', monto: 2, frecuencia: 'diario', categoria: 'hormiga' }, // 60/mes, 730/año
        { nombre: 'Vampiro 1', monto: 25, frecuencia: 'mensual', categoria: 'vampiro' }, // 25/mes, 300/año
        { nombre: 'Prescindible 1', monto: 40, frecuencia: 'mensual', categoria: 'prescindible' } // 40/mes, 480/año
      ];

      const items = normalizeFrequencies(input);
      const aggregated = aggregateLeakCosts(items);

      expect(aggregated.totalMensual).toBe(125);
      expect(aggregated.totalAnual).toBe(1510);
      expect(aggregated.porCategoria.hormiga.mensual).toBe(60);
      expect(aggregated.porCategoria.hormiga.anual).toBe(730);
      expect(aggregated.porCategoria.vampiro.mensual).toBe(25);
      expect(aggregated.porCategoria.vampiro.anual).toBe(300);
      expect(aggregated.porCategoria.prescindible.mensual).toBe(40);
      expect(aggregated.porCategoria.prescindible.anual).toBe(480);
    });

    it('filters out non-positive amounts or handles empty leaks list gracefully', () => {
      const emptyItems = normalizeFrequencies([]);
      const aggregatedEmpty = aggregateLeakCosts(emptyItems);
      expect(aggregatedEmpty.totalMensual).toBe(0);
      expect(aggregatedEmpty.totalAnual).toBe(0);
      expect(aggregatedEmpty.porCategoria.hormiga.mensual).toBe(0);

      const invalidInput: MoneyLeakInput[] = [
        { nombre: 'Gratis', monto: 0, frecuencia: 'mensual', categoria: 'hormiga' },
        { nombre: 'Negativo', monto: -10, frecuencia: 'mensual', categoria: 'vampiro' },
        { nombre: 'Válido', monto: 15, frecuencia: 'mensual', categoria: 'prescindible' }
      ];
      const validItems = normalizeFrequencies(invalidInput);
      expect(validItems).toHaveLength(1);
      expect(validItems[0].nombre).toBe('Válido');
      const aggregatedValid = aggregateLeakCosts(validItems);
      expect(aggregatedValid.totalMensual).toBe(15);
    });
  });

  describe('calculateLeakImpactOnGoals & analyzeMoneyLeaks', () => {
    const baseProfile: UserFinancialProfile = {
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
        { nombre: 'Préstamo', saldoPendiente: 2400, cuotaMensual: 100, tipoInteres: 10, fechaPago: '01' }
      ],
      fondoEmergenciaActual: 0,
      objetivoAhorroMensual: 100,
      proximosGastosExcepcionales: []
    };

    it('calculates debt payoff acceleration accurately', () => {
      // 2400 saldo, 100 cuota base -> 24 meses base
      // Con 100 recuperados de fugas -> cuota acelerada = 200 -> 12 meses
      // Ahorro: 12 meses
      const impact = calculateLeakImpactOnGoals(100, baseProfile);
      expect(impact.ahorroMensualRecuperable).toBe(100);
      expect(impact.deuda.mesesBase).toBe(24);
      expect(impact.deuda.mesesAcelerado).toBe(12);
      expect(impact.deuda.mesesAhorrados).toBe(12);
      expect(impact.deuda.mensaje).toContain('12 mes(es) antes');
    });

    it('handles debt impact when user has zero debts', () => {
      const profileNoDebt: UserFinancialProfile = {
        ...baseProfile,
        deudas: []
      };
      const impact = calculateLeakImpactOnGoals(100, profileNoDebt);
      expect(impact.deuda.mesesBase).toBeNull();
      expect(impact.deuda.mesesAcelerado).toBeNull();
      expect(impact.deuda.mesesAhorrados).toBe(0);
      expect(impact.deuda.mensaje).toContain('Sin deudas activas');
    });

    it('calculates emergency fund milestone acceleration accurately', () => {
      const profileWithFund: UserFinancialProfile = {
        ...baseProfile,
        deudas: [],
        fondoEmergenciaActual: 0,
        objetivoAhorroMensual: 100
      };
      // Meta 1: Fondo inicial (300 EUR). Falta: 300 EUR.
      // Base: 100 EUR/mes -> 3 meses
      // Con fugas: 50 EUR -> 150 EUR/mes -> 2 meses (300 / 150)
      // Meses ahorrados: 1
      const impact = calculateLeakImpactOnGoals(50, profileWithFund);
      expect(impact.fondoEmergencia.mesesBase).toBe(3);
      expect(impact.fondoEmergencia.mesesAcelerado).toBe(2);
      expect(impact.fondoEmergencia.mesesAhorrados).toBe(1);
    });

    it('handles emergency fund impact when baseline savings is 0', () => {
      const profileZeroSavings: UserFinancialProfile = {
        ...baseProfile,
        deudas: [],
        fondoEmergenciaActual: 0,
        objetivoAhorroMensual: 0
      };
      // Meta 1: 300 EUR. Base: 0 -> null (incalculable).
      // Con fugas: 50 EUR -> 6 meses
      const impact = calculateLeakImpactOnGoals(50, profileZeroSavings);
      expect(impact.fondoEmergencia.mesesBase).toBeNull();
      expect(impact.fondoEmergencia.mesesAcelerado).toBe(6);
      expect(impact.fondoEmergencia.mesesAhorrados).toBe(0);
      expect(impact.fondoEmergencia.mensaje).toContain('6 mes(es)');
    });

    it('handles emergency fund impact when fund is already fully achieved', () => {
      const profileFundFull: UserFinancialProfile = {
        ...baseProfile,
        deudas: [],
        fondoEmergenciaActual: 20000,
        objetivoAhorroMensual: 100
      };
      const impact = calculateLeakImpactOnGoals(50, profileFundFull);
      expect(impact.fondoEmergencia.mesesBase).toBe(0);
      expect(impact.fondoEmergencia.mesesAcelerado).toBe(0);
      expect(impact.fondoEmergencia.mesesAhorrados).toBe(0);
      expect(impact.fondoEmergencia.mensaje).toContain('completado');
    });

    it('orchestrates end-to-end analysis with analyzeMoneyLeaks', () => {
      const leaks: MoneyLeakInput[] = [
        { nombre: 'Café', monto: 2, frecuencia: 'diario', categoria: 'hormiga' },
        { nombre: 'Streaming', monto: 15, frecuencia: 'mensual', categoria: 'vampiro' }
      ];
      const result = analyzeMoneyLeaks(leaks, baseProfile);

      expect(result.fugas).toHaveLength(2);
      expect(result.agregado.totalMensual).toBe(75); // 60 + 15
      expect(result.impacto.ahorroMensualRecuperable).toBe(75);
    });

    it('handles undefined or empty leaks in analyzeMoneyLeaks', () => {
      const result = analyzeMoneyLeaks(undefined, baseProfile);
      expect(result.fugas).toEqual([]);
      expect(result.agregado.totalMensual).toBe(0);
      expect(result.agregado.totalAnual).toBe(0);
      expect(result.impacto.ahorroMensualRecuperable).toBe(0);
      expect(result.impacto.deuda.mesesAhorrados).toBe(0);
      expect(result.impacto.fondoEmergencia.mesesAhorrados).toBe(0);
    });
  });
});
