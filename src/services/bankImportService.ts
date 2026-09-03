import { FinancialTransaction, TransactionCategory } from '../models/types.js';

export function parseBankCSV(csvText: string): FinancialTransaction[] {
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const transactions: FinancialTransaction[] = [];

  for (const line of lines) {
    // Detectar separador (; o ,)
    const separator = line.includes(';') ? ';' : ',';
    const cols = line.split(separator).map(c => c.trim().replace(/^[\"']|[\"']$/g, ''));

    if (cols.length < 3) continue;

    // Buscar si alguna columna parece fecha (YYYY-MM-DD o DD/MM/YYYY)
    let fecha = '';
    let concepto = '';
    let importe = 0;

    for (let i = 0; i < cols.length; i++) {
      const col = cols[i];
      // Fecha
      if (!fecha && /(\d{4}[-/]\d{2}[-/]\d{2})|(\d{2}[-/]\d{2}[-/]\d{4})/.test(col)) {
        fecha = col;
        continue;
      }

      // Importe numérico (con posibles comas o puntos decimales)
      const cleaned = col.replace(/\s+/g, '').replace('€', '').replace('EUR', '');
      const parsedNum = parseFloat(cleaned.replace(',', '.'));
      if (!isNaN(parsedNum) && Math.abs(parsedNum) > 0 && /[\d]+([.,]\d+)?/.test(cleaned)) {
        importe = parsedNum;
        continue;
      }

      // Si no es fecha ni número y tiene texto largo, es concepto
      if (col.length > 2 && !concepto) {
        concepto = col;
      }
    }

    if (fecha && importe !== 0) {
      const cat = autoCategorizeConcepto(concepto);
      transactions.push({
        id: 'tx_' + Math.random().toString(36).substring(2, 9),
        fecha,
        concepto: concepto || 'Movimiento bancario',
        importe,
        categoria: cat,
        esFugaDetectada: detectFugaInTransaction(concepto, importe)
      });
    }
  }

  return transactions;
}

export function autoCategorizeConcepto(concepto: string): TransactionCategory {
  const c = concepto.toLowerCase();

  if (c.includes('nomina') || c.includes('salario') || c.includes('haber') || c.includes('transferencia recibida')) {
    return 'nomina';
  }
  if (c.includes('alquiler') || c.includes('hipoteca') || c.includes('comunidad')) {
    return 'vivienda';
  }
  if (c.includes('mercadona') || c.includes('carrefour') || c.includes('lidl') || c.includes('dia') || c.includes('supermercado') || c.includes('alcampo') || c.includes('eroski')) {
    return 'supermercado';
  }
  if (c.includes('restaurante') || c.includes('bar') || c.includes('cafe') || c.includes('mcdonald') || c.includes('burger') || c.includes('glovo') || c.includes('uber eats') || c.includes('just eat')) {
    return 'ocio_restaurantes';
  }
  if (c.includes('netflix') || c.includes('spotify') || c.includes('amazon prime') || c.includes('disney') || c.includes('hbo') || c.includes('apple') || c.includes('suscripcion')) {
    return 'suscripciones';
  }
  if (c.includes('gasolina') || c.includes('repsol') || c.includes('cepsa') || c.includes('metro') || c.includes('renfe') || c.includes('uber') || c.includes('cabify')) {
    return 'transporte';
  }
  if (c.includes('luz') || c.includes('agua') || c.includes('iberdrola') || c.includes('endesa') || c.includes('naturgy') || c.includes('vodafone') || c.includes('movistar') || c.includes('orange')) {
    return 'suministros';
  }
  if (c.includes('prestamo') || c.includes('tarjeta') || c.includes('credito') || c.includes('financiera') || c.includes('cetelem')) {
    return 'deuda';
  }
  if (c.includes('zara') || c.includes('amazon') || c.includes('aliexpress') || c.includes('shein') || c.includes('tienda')) {
    return 'compras';
  }

  return 'otros';
}

export function detectFugaInTransaction(concepto: string, importe: number): boolean {
  const c = concepto.toLowerCase();
  // Gastos hormiga: microimportes entre 1€ y 7€ repetidos (cafés, máquinas, snacks)
  if (importe < 0 && Math.abs(importe) <= 7 && (c.includes('cafe') || c.includes('vending') || c.includes('kiosco') || c.includes('tabaco') || c.includes('panaderia'))) {
    return true;
  }
  // Gastos vampiro: suscripciones
  if (c.includes('netflix') || c.includes('spotify') || c.includes('prime') || c.includes('hbo') || c.includes('apple') || c.includes('disney')) {
    return true;
  }
  return false;
}
