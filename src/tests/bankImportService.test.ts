import { describe, it, expect } from 'vitest';
import { parseBankCSV, autoCategorizeConcepto, detectFugaInTransaction } from '../services/bankImportService';

describe('bankImportService', () => {
  it('categoriza correctamente conceptos típicos', () => {
    expect(autoCategorizeConcepto('Nomina empresa SL')).toBe('nomina');
    expect(autoCategorizeConcepto('Mercadona compra')).toBe('supermercado');
    expect(autoCategorizeConcepto('Netflix mensual')).toBe('suscripciones');
    expect(autoCategorizeConcepto('Gasolinera Repsol')).toBe('transporte');
    expect(autoCategorizeConcepto('Pago cuota prestamo')).toBe('deuda');
  });

  it('detecta fugas en transacciones reales', () => {
    expect(detectFugaInTransaction('Cafe bar centro', -1.80)).toBe(true);
    expect(detectFugaInTransaction('Netflix mensual', -14.99)).toBe(true);
    expect(detectFugaInTransaction('Alquiler piso', -650)).toBe(false);
  });

  it('parsea un archivo CSV bancario estándar', () => {
    const csv = `Fecha;Concepto;Importe
2026-09-01;Nomina Septiembre;2250.00
2026-09-02;Mercadona; -64.20
2026-09-03;Cafe maquina; -1.80
2026-09-05;Alquiler mensual; -650.00`;

    const txs = parseBankCSV(csv);
    expect(txs.length).toBe(4);
    expect(txs[0].categoria).toBe('nomina');
    expect(txs[0].importe).toBe(2250);
    expect(txs[1].categoria).toBe('supermercado');
    expect(txs[2].esFugaDetectada).toBe(true);
  });
});
