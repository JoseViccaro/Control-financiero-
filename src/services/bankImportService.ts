import { FinancialTransaction, TransactionCategory, UserFinancialProfile } from '../models/types.js';

export function parseBankCSV(csvText: string, titular: string = 'Titular Principal'): FinancialTransaction[] {
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
      
      // Normalizar fecha a formato YYYY-MM para agrupación mensual
      let mes = '';
      if (/^\d{4}[-/]\d{2}/.test(fecha)) {
        mes = fecha.substring(0, 7).replace('/', '-');
      } else if (/^\d{2}[-/]\d{2}[-/]\d{4}/.test(fecha)) {
        const parts = fecha.split(/[-/]/);
        mes = `${parts[2]}-${parts[1]}`;
      } else {
        mes = new Date().toISOString().substring(0, 7);
      }

      transactions.push({
        id: 'tx_' + Math.random().toString(36).substring(2, 9),
        fecha,
        concepto: concepto || 'Movimiento bancario',
        importe,
        categoria: cat,
        titular,
        mes,
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

export function buildProfileFromTransactions(
  transactions: FinancialTransaction[],
  baseProfile?: Partial<UserFinancialProfile>
): UserFinancialProfile {
  let ingresosTotales = 0;
  let vivienda = 0;
  let suministros = 0;
  let internet = 0;
  let telefono = 0;
  let seguros = 0;
  let transporte = 0;
  let cuotasDeuda = 0;

  let supermercado = 0;
  let ocio = 0;
  let comidasFuera = 0;
  let comprasOnline = 0;
  let otros = 0;

  const fugasMap = new Map<string, { nombre: string; monto: number; veces: number; categoria: 'hormiga' | 'vampiro' | 'prescindible' }>();

  for (const t of transactions) {
    const abs = Math.abs(t.importe);

    if (t.importe > 0) {
      ingresosTotales += t.importe;
      continue;
    }

    // Clasificación según categoría detectada
    switch (t.categoria) {
      case 'vivienda':
        vivienda += abs;
        break;
      case 'suministros':
        suministros += abs;
        break;
      case 'transporte':
        transporte += abs;
        break;
      case 'deuda':
        cuotasDeuda += abs;
        break;
      case 'supermercado':
        supermercado += abs;
        break;
      case 'ocio_restaurantes':
        if (t.concepto.toLowerCase().includes('bar') || t.concepto.toLowerCase().includes('cafe') || t.concepto.toLowerCase().includes('restaurante') || t.concepto.toLowerCase().includes('glovo')) {
          comidasFuera += abs;
        } else {
          ocio += abs;
        }
        break;
      case 'compras':
        comprasOnline += abs;
        break;
      case 'suscripciones':
        otros += abs;
        break;
      default:
        otros += abs;
        break;
    }

    // Detección y acumulación de fugas
    if (t.esFugaDetectada) {
      const key = t.concepto.toLowerCase().trim();
      const existing = fugasMap.get(key);
      const isVampiro = t.categoria === 'suscripciones';
      if (existing) {
        existing.monto += abs;
        existing.veces += 1;
      } else {
        fugasMap.set(key, {
          nombre: t.concepto,
          monto: abs,
          veces: 1,
          categoria: isVampiro ? 'vampiro' : 'hormiga'
        });
      }
    }
  }

  const fugasPresupuesto = Array.from(fugasMap.values()).map(f => ({
    nombre: f.nombre + (f.veces > 1 ? ' (' + f.veces + ' veces)' : ''),
    monto: +(f.monto).toFixed(2),
    frecuencia: (f.categoria === 'vampiro' ? 'mensual' : 'mensual') as any,
    categoria: f.categoria
  }));

  return {
    ingresosNetosMensuales: +(ingresosTotales).toFixed(2),
    dineroDisponibleActual: baseProfile?.dineroDisponibleActual || 0,
    gastosFijos: {
      vivienda: +(vivienda).toFixed(2),
      suministros: +(suministros).toFixed(2),
      telefono: +(telefono).toFixed(2),
      internet: +(internet).toFixed(2),
      seguros: +(seguros).toFixed(2),
      transporte: +(transporte).toFixed(2),
      cuotas: +(cuotasDeuda).toFixed(2),
    },
    gastosVariables: {
      supermercado: +(supermercado).toFixed(2),
      ocio: +(ocio).toFixed(2),
      comidasFuera: +(comidasFuera).toFixed(2),
      comprasOnline: +(comprasOnline).toFixed(2),
      otros: +(otros).toFixed(2),
    },
    deudas: baseProfile?.deudas || [],
    fondoEmergenciaActual: baseProfile?.fondoEmergenciaActual || 0,
    objetivoAhorroMensual: +(ingresosTotales * 0.2).toFixed(2),
    proximosGastosExcepcionales: baseProfile?.proximosGastosExcepcionales || [],
    fugasPresupuesto,
    movimientosReales: transactions,
  };
}
