import * as readline from 'readline';
import {
  UserFinancialProfile,
  DebtItem,
  ExceptionalExpense,
  SmartGroceryInput,
  MoneyLeakInput,
  LeakFrequency,
  LeakCategory
} from './models/types.js';
import { generateFinancialReport } from './services/reportService.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer: string) => {
      resolve(answer.trim());
    });
  });
}

async function askNumber(question: string, defaultValue: number = 0): Promise<number> {
  const ans = await ask(question);
  if (!ans) return defaultValue;
  const parsed = parseFloat(ans.replace(',', '.'));
  return isNaN(parsed) ? defaultValue : parsed;
}

async function main() {
  console.log('\\n=============================================================');
  console.log('       BIENVENIDO A: PLAN FINANCIERO PERSONAL');
  console.log(' Ayuda para controlar gastos, salir de deudas y fondo seguro');
  console.log(' (Nota: No solicitamos ni almacenamos ningún dato bancario)');
  console.log('=============================================================\\n');

  console.log('--- 1. INGRESOS Y DISPONIBILIDAD ---');
  const ingresos = await askNumber('-> Ingresos netos mensuales (€): ');
  const disponible = await askNumber('-> Dinero disponible actualmente (€): ');

  console.log('\\n--- 2. GASTOS FIJOS MENSUALES ---');
  const vivienda = await askNumber('-> Vivienda (alquiler/hipoteca) (€): ');
  const suministros = await askNumber('-> Suministros (luz, agua, gas) (€): ');
  const telefono = await askNumber('-> Teléfono (€): ');
  const internet = await askNumber('-> Internet (€): ');
  const seguros = await askNumber('-> Seguros (€): ');
  const transporte = await askNumber('-> Transporte (€): ');
  const cuotas = await askNumber('-> Cuotas fijas u otras suscripciones obligatorias (€): ');

  console.log('\\n--- 3. GASTOS VARIABLES DEL MES ---');
  const supermercado = await askNumber('-> Supermercado (€): ');
  const ocio = await askNumber('-> Ocio (€): ');
  const comidasFuera = await askNumber('-> Comidas fuera (€): ');
  const comprasOnline = await askNumber('-> Compras online (€): ');
  const otros = await askNumber('-> Otros variables (€): ');

  console.log('\\n--- 4. DEUDAS (Tarjetas, préstamos, financiación) ---');
  const numDeudas = await askNumber('-> ¿Cuántas deudas tienes actualmente? (0 si ninguna): ', 0);
  const deudas: DebtItem[] = [];
  for (let i = 1; i <= numDeudas; i++) {
    console.log(`  -- Deuda #${i} --`);
    const nombre = await ask('     Nombre o entidad: ') || `Deuda ${i}`;
    const saldoPendiente = await askNumber('     Saldo pendiente (€): ');
    const cuotaMensual = await askNumber('     Cuota mensual (€): ');
    const tipoInteres = await askNumber('     Tipo de interés / TAE (% anual): ');
    const fechaPago = await ask('     Día del mes de cobro (ej. 05): ') || 'Día 01';
    deudas.push({ nombre, saldoPendiente, cuotaMensual, tipoInteres, fechaPago });
  }

  console.log('\\n--- 5. FONDO DE EMERGENCIA Y AHORRO ---');
  const fondoActual = await askNumber('-> Ahorro actual en tu fondo de emergencia (€): ');
  const objetivoAhorro = await askNumber('-> Objetivo de ahorro mensual realista (€): ');

  console.log('\\n--- 6. PRÓXIMOS GASTOS EXCEPCIONALES ---');
  const hayExcepcionales = (await ask('-> ¿Tienes previstos gastos excepcionales en los próximos meses? (s/n): ')).toLowerCase() === 's';
  const gastosExcepcionales: ExceptionalExpense[] = [];
  if (hayExcepcionales) {
    const desc = await ask('     Concepto (ej. Seguro coche, dentista, ITV): ');
    const imp = await askNumber('     Importe estimado (€): ');
    const fecha = await ask('     Mes previsto: ');
    gastosExcepcionales.push({ concepto: desc, importe: imp, fechaAproximada: fecha });
  }

  console.log('\\n--- 7. COMPRA INTELIGENTE (Opcional) ---');
  const incluirCompra = (await ask('-> ¿Deseas optimizar tu lista de compra inteligente para la semana? (s/n): ')).toLowerCase() === 's';
  let compraInteligente: SmartGroceryInput | undefined = undefined;
  if (incluirCompra) {
    const alimentosCasaRaw = await ask('     Alimentos/productos que ya tienes en casa (separados por coma): ');
    const alimentosEnCasa = alimentosCasaRaw.split(',').map(s => s.trim()).filter(Boolean);
    const personasComen = await askNumber('     ¿Cuántas personas comen en casa?: ', 1);
    const diasCompra = await askNumber('     ¿Para cuántos días compras?: ', 7);
    const presupuestoMaximo = await askNumber('     Presupuesto máximo para esta compra (€): ', 60);
    compraInteligente = { alimentosEnCasa, personasComen, diasCompra, presupuestoMaximo };
  }

  console.log('\\n--- 8. FUGAS DE PRESUPUESTO Y MICRO-GASTOS (Opcional) ---');
  const registrarFugas = (await ask('-> ¿Deseas registrar gastos hormiga, suscripciones vampiro o gastos prescindibles? (s/n): ')).toLowerCase() === 's';
  const fugasPresupuesto: MoneyLeakInput[] = [];
  if (registrarFugas) {
    const numFugas = await askNumber('     ¿Cuántas fugas o micro-gastos deseas registrar?: ', 0);
    for (let i = 1; i <= numFugas; i++) {
      console.log(`     -- Fuga #${i} --`);
      const nombre = await ask('        Concepto (ej. Café diario, Streaming, Suscripción app): ') || `Gasto #${i}`;
      const monto = await askNumber('        Importe (€): ');
      const freqRaw = (await ask('        Frecuencia (diario / semanal / mensual / anual) [mensual]: ')).toLowerCase();
      const frecuencia: LeakFrequency = ['diario', 'semanal', 'mensual', 'anual'].includes(freqRaw)
        ? (freqRaw as LeakFrequency)
        : 'mensual';
      const catRaw = (await ask('        Categoría (hormiga / vampiro / prescindible) [hormiga]: ')).toLowerCase();
      const categoria: LeakCategory = ['hormiga', 'vampiro', 'prescindible'].includes(catRaw)
        ? (catRaw as LeakCategory)
        : 'hormiga';

      if (monto > 0) {
        fugasPresupuesto.push({ nombre, monto, frecuencia, categoria });
      }
    }
  }

  const profile: UserFinancialProfile = {
    ingresosNetosMensuales: ingresos,
    dineroDisponibleActual: disponible,
    gastosFijos: { vivienda, suministros, telefono, internet, seguros, transporte, cuotas },
    gastosVariables: { supermercado, ocio, comidasFuera, comprasOnline, otros },
    deudas,
    fondoEmergenciaActual: fondoActual,
    objetivoAhorroMensual: objetivoAhorro,
    proximosGastosExcepcionales: gastosExcepcionales,
    compraInteligente,
    fugasPresupuesto: fugasPresupuesto.length > 0 ? fugasPresupuesto : undefined
  };

  console.log('\\nGenerando diagnóstico financiero y planes accionables...\\n');
  const report = generateFinancialReport(profile);
  console.log(report);

  rl.close();
}

main().catch(err => {
  console.error('Error al ejecutar la aplicación:', err);
  rl.close();
});
