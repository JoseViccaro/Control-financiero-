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

  // Transferencias internas / Traspasos entre cuentas propias de la familia
  if (c.includes('traspaso propio') || c.includes('traspaso') || c.includes('entre mis cuentas') || c.includes('transferencia interna')) {
    return 'transferencia_interna';
  }

  // Nóminas y salarios reales
  if (c.includes('nomina') || c.includes('salario') || c.includes('haber') || c.includes('transferencia recibida') || c.includes('transfer inmediata')) {
    return 'nomina';
  }
  // Vivienda: Hipoteca, alquiler, comunidad
  if (c.includes('hipoteca') || c.includes('alquiler') || c.includes('comunidad') || c.includes('oficina virtual g')) {
    return 'vivienda';
  }
  // Seguros: Vida, hogar, salud, coche, mutua, mapfre, axa, sanitas, adeslas
  if (c.includes('seguro') || c.includes('mapfre') || c.includes('axa') || c.includes('allianz') || c.includes('mutua') || c.includes('sanitas') || c.includes('adeslas') || c.includes('asisa') || c.includes('santander seguros') || c.includes('ocaso') || c.includes('santa lucia') || c.includes('linea directa') || c.includes('zurich')) {
    return 'seguros';
  }
  // Transporte y carburante (antes de suministros para que gasolinera no coincida con 'gas')
  if (c.includes('gasolina') || c.includes('gasolinera') || c.includes('repsol') || c.includes('cepsa') || c.includes('bp') || c.includes('galp') || c.includes('metro') || c.includes('renfe') || c.includes('uber') || c.includes('cabify') || c.includes('crtm') || c.includes('movili')) {
    return 'transporte';
  }
  // Suministros: Luz, agua, gas natural, internet, telefonía
  if (c.includes('luz') || c.includes('agua') || (/\bgas\b/.test(c) || c.includes('gas natural') || c.includes('butano')) || c.includes('iberdrola') || c.includes('endesa') || c.includes('naturgy') || c.includes('vodafone') || c.includes('movistar') || c.includes('orange') || c.includes('digi') || c.includes('mybox') || c.includes('totalenergies') || c.includes('repsol luz') || c.includes('holaluz')) {
    return 'suministros';
  }
  // Préstamos, Tarjetas de Crédito, Financieras
  if (c.includes('prestamo') || c.includes('préstamo') || c.includes('tarjeta') || c.includes('credito') || c.includes('crédito') || c.includes('financiera') || c.includes('cetelem') || c.includes('cofidis') || c.includes('visa &go') || c.includes('mycard') || c.includes('pres.') || c.includes('santander consumer') || c.includes('bbva consumer') || c.includes('creditea') || c.includes('wizink')) {
    return 'deuda';
  }
  if (c.includes('mercadona') || c.includes('carrefour') || c.includes('lidl') || c.includes('dia') || c.includes('supermercado') || c.includes('alcampo') || c.includes('eroski') || c.includes('ahorramas') || c.includes('supeco') || c.includes('fruteria') || c.includes('carniceria') || c.includes('panaderia') || c.includes('pescaderia')) {
    return 'supermercado';
  }
  if (c.includes('restaurante') || c.includes('bar') || c.includes('cafe') || c.includes('mcdonald') || c.includes('burger') || c.includes('glovo') || c.includes('uber eats') || c.includes('just eat') || c.includes('kfc') || c.includes('marmar') || c.includes('pizzeria') || c.includes('cerveceria')) {
    return 'ocio_restaurantes';
  }
  if (c.includes('netflix') || c.includes('spotify') || c.includes('amazon prime') || c.includes('disney') || c.includes('hbo') || c.includes('apple') || c.includes('suscripcion') || c.includes('apple.com/bill') || c.includes('youtube')) {
    return 'suscripciones';
  }
  if (c.includes('zara') || c.includes('amazon') || c.includes('aliexpress') || c.includes('shein') || c.includes('tienda') || c.includes('decimas') || c.includes('primark') || c.includes('mango')) {
    return 'compras';
  }

  return 'otros';
}

export function detectFugaInTransaction(concepto: string, importe: number): boolean {
  const c = concepto.toLowerCase();
  // Gastos hormiga: microimportes entre 0.10€ y 7€ repetidos (mcdonalds 1.50€, aseos 0.20€, cafes, snacks)
  if (importe < 0 && Math.abs(importe) <= 7 && (c.includes('cafe') || c.includes('vending') || c.includes('kiosco') || c.includes('tabaco') || c.includes('panaderia') || c.includes('mcdonald') || c.includes('kfc') || c.includes('aseos') || c.includes('marmar'))) {
    return true;
  }
  // Gastos vampiro: suscripciones
  if (c.includes('netflix') || c.includes('spotify') || c.includes('prime') || c.includes('hbo') || c.includes('apple') || c.includes('disney') || c.includes('apple.com/bill')) {
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

    // Si es transferencia interna entre cuentas familiares, NO es ingreso ni gasto real externo
    if (t.categoria === 'transferencia_interna') {
      continue;
    }

    if (t.importe > 0) {
      // Ignorar pequeños abonos o devoluciones de billetes / tiendas como nóminas
      if (t.categoria === 'nomina' || abs >= 300) {
        ingresosTotales += t.importe;
      }
      continue;
    }

    // Clasificación según categoría detectada
    switch (t.categoria) {
      case 'vivienda':
        vivienda += abs;
        break;
      case 'seguros':
        seguros += abs;
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

  // Detección automática de préstamos y tarjetas desde las transacciones
  const deudasDetectadasMap = new Map<string, { cuota: number; fecha: string }>();
  for (const t of transactions) {
    if (t.categoria === 'deuda' && t.importe < 0) {
      const key = t.concepto.trim();
      const abs = Math.abs(t.importe);
      const existing = deudasDetectadasMap.get(key);
      if (!existing || abs > existing.cuota) {
        deudasDetectadasMap.set(key, { cuota: abs, fecha: t.fecha ? t.fecha.substring(8, 10) : '05' });
      }
    }
  }

  const deudasAutoDetectadas: DebtItem[] = Array.from(deudasDetectadasMap.entries()).map(([nombre, info]) => {
    // Si ya existe una deuda configurada a mano por el usuario con saldo pendiente, preservarla
    const manual = baseProfile?.deudas?.find(d => {
      const dName = d.nombre.toLowerCase().trim();
      const nName = nombre.toLowerCase().trim();
      return dName === nName || dName.includes(nName) || nName.includes(dName);
    });
    if (manual) return manual;

    const lower = nombre.toLowerCase();
    const isTarjeta = lower.includes('tarjeta') || lower.includes('mycard') || lower.includes('&go') || lower.includes('wizink') || lower.includes('credito');
    const taeEstimada = isTarjeta ? 19.9 : 8.5; // TAE orientativa de mercado en España

    return {
      nombre,
      cuotaMensual: +info.cuota.toFixed(2),
      saldoPendiente: +(info.cuota * (isTarjeta ? 3 : 24)).toFixed(2), // Estimación base para la estrategia si no se conoce el saldo total
      tipoInteres: taeEstimada,
      fechaPago: `Día ${info.fecha}`,
    };
  });

  // Preservar también deudas manuales de baseProfile que no se hayan detectado explícitamente en este extracto bancario
  const deudasNoDetectadas = (baseProfile?.deudas || []).filter(manualDebt => {
    return !deudasAutoDetectadas.some(autoDebt => {
      const dName = manualDebt.nombre.toLowerCase().trim();
      const nName = autoDebt.nombre.toLowerCase().trim();
      return dName === nName || dName.includes(nName) || nName.includes(dName);
    });
  });

  const deudasFinales = [...deudasAutoDetectadas, ...deudasNoDetectadas];

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
    deudas: deudasFinales,
    fondoEmergenciaActual: baseProfile?.fondoEmergenciaActual || 0,
    objetivoAhorroMensual: +(ingresosTotales * 0.2).toFixed(2),
    proximosGastosExcepcionales: baseProfile?.proximosGastosExcepcionales || [],
    fugasPresupuesto,
    movimientosReales: transactions,
  };
}
