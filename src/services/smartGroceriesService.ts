import { SmartGroceryInput, SmartGroceryPlan, GroceryItem } from '../models/types.js';

// Base de datos de catálogo esencial por secciones
interface CatalogProduct {
  nombre: string;
  seccion: 'fruta y verdura' | 'proteínas' | 'despensa' | 'lácteos' | 'congelados' | 'limpieza';
  costeBasePorPersonaDia: number;
  esencial: boolean;
  equivalentesDespensa: string[];
}

const CATALOG: CatalogProduct[] = [
  // Fruta y verdura
  { nombre: 'Manzanas / Plátanos', seccion: 'fruta y verdura', costeBasePorPersonaDia: 0.8, esencial: true, equivalentesDespensa: ['fruta', 'platano', 'manzana'] },
  { nombre: 'Espinacas / Verduras de temporada', seccion: 'fruta y verdura', costeBasePorPersonaDia: 0.9, esencial: true, equivalentesDespensa: ['verdura', 'espinacas', 'zanahorias', 'calabacin'] },
  
  // Proteínas
  { nombre: 'Huevos camperos', seccion: 'proteínas', costeBasePorPersonaDia: 0.7, esencial: true, equivalentesDespensa: ['huevos'] },
  { nombre: 'Pollo / Pavo o Legumbres frescas', seccion: 'proteínas', costeBasePorPersonaDia: 1.6, esencial: true, equivalentesDespensa: ['pollo', 'pavo', 'carne', 'legumbres'] },
  { nombre: 'Atún en lata / Pescado', seccion: 'proteínas', costeBasePorPersonaDia: 1.2, esencial: false, equivalentesDespensa: ['atun', 'pescado'] },

  // Despensa
  { nombre: 'Arroz integral / Pasta', seccion: 'despensa', costeBasePorPersonaDia: 0.4, esencial: true, equivalentesDespensa: ['arroz', 'pasta'] },
  { nombre: 'Lentejas / Garbanzos en conserva', seccion: 'despensa', costeBasePorPersonaDia: 0.5, esencial: true, equivalentesDespensa: ['lentejas', 'garbanzos', 'alubias'] },
  { nombre: 'Aceite de oliva / Especias básicas', seccion: 'despensa', costeBasePorPersonaDia: 0.5, esencial: true, equivalentesDespensa: ['aceite', 'especias', 'sal'] },

  // Lácteos
  { nombre: 'Leche o bebida vegetal', seccion: 'lácteos', costeBasePorPersonaDia: 0.5, esencial: true, equivalentesDespensa: ['leche', 'bebida vegetal'] },
  { nombre: 'Yogur natural / Queso fresco', seccion: 'lácteos', costeBasePorPersonaDia: 0.6, esencial: false, equivalentesDespensa: ['yogur', 'queso'] },

  // Congelados
  { nombre: 'Verduras congeladas salteado', seccion: 'congelados', costeBasePorPersonaDia: 0.6, esencial: false, equivalentesDespensa: ['congelados', 'guisantes', 'verduras congeladas'] },

  // Limpieza
  { nombre: 'Detergente / Limpiador multiusos', seccion: 'limpieza', costeBasePorPersonaDia: 0.4, esencial: true, equivalentesDespensa: ['detergente', 'jabon', 'limpiador', 'lejia'] }
];

export function calculateSmartGroceryPlan(input: SmartGroceryInput): SmartGroceryPlan {
  const personas = Math.max(1, input.personasComen);
  const dias = Math.max(1, input.diasCompra);
  const presupuesto = input.presupuestoMaximo;
  const enCasaNormalizado = input.alimentosEnCasa.map(item => item.trim().toLowerCase());

  const items: GroceryItem[] = [];
  const ajustesRealizados: string[] = [];

  for (const prod of CATALOG) {
    // Si ya lo tiene en casa, no comprarlo para no duplicar ni gastar de más
    const yaEnCasa = prod.equivalentesDespensa.some(eq => 
      enCasaNormalizado.some(c => c.includes(eq) || eq.includes(c))
    );

    if (yaEnCasa) {
      ajustesRealizados.push('Omitido: ' + prod.nombre + ' (ya disponible en casa)');
      continue;
    }

    const costeTotalItem = +(prod.costeBasePorPersonaDia * personas * dias).toFixed(2);
    items.push({
      nombre: prod.nombre,
      seccion: prod.seccion,
      cantidad: 'Para ' + personas + ' pers. (' + dias + ' dias)',
      costeEstimado: costeTotalItem,
      esencial: prod.esencial
    });
  }

  // Comprobar coste total inicial
  let costeTotal = +(items.reduce((sum, item) => sum + item.costeEstimado, 0)).toFixed(2);

  // Si supera el presupuesto, eliminar o sustituir productos no esenciales primero
  if (presupuesto > 0 && costeTotal > presupuesto) {
    ajustesRealizados.push('Presupuesto inicial superado (' + costeTotal + ' EUR > ' + presupuesto + ' EUR). Ajustando lista...');
    
    // Primero eliminar los no esenciales
    for (let i = items.length - 1; i >= 0; i--) {
      if (!items[i].esencial && costeTotal > presupuesto) {
        const eliminado = items.splice(i, 1)[0];
        costeTotal = +(costeTotal - eliminado.costeEstimado).toFixed(2);
        ajustesRealizados.push('Eliminado no esencial: ' + eliminado.nombre + ' (ahorro: ' + eliminado.costeEstimado + ' EUR)');
      }
    }

    // Si aún supera, escalar cantidades proporcionalmente
    if (costeTotal > presupuesto && items.length > 0) {
      const factorAjuste = presupuesto / costeTotal;
      for (const item of items) {
        item.costeEstimado = +(item.costeEstimado * factorAjuste).toFixed(2);
      }
      costeTotal = +(items.reduce((sum, item) => sum + item.costeEstimado, 0)).toFixed(2);
      ajustesRealizados.push('Se ajustaron porciones y gramajes de marcas blancas para encajar exactamente en el presupuesto.');
    }
  }

  return {
    items,
    costeEstimadoTotal: costeTotal,
    presupuestoMaximo: presupuesto,
    ajustesRealizados
  };
}
