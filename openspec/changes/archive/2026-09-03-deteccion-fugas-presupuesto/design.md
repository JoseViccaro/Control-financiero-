# Design: Detección de Fugas de Presupuesto

## Technical Approach

Implementar detección, categorización y cuantificación de fugas financieras (`hormiga`, `vampiro`, `prescindible`) como servicio funcional puro e independiente (`leakDetectionService.ts`). El servicio normaliza frecuencias temporales a proyecciones mensuales y anuales, y calcula la aceleración en la amortización de deudas e hitos del fondo de emergencia al reasignar el capital recuperado. Se integra limpiamente en `reportService.ts` de forma aditiva y condicional (sección dedicada sólo visible si existen fugas activas), preservando total compatibilidad regresiva con `UserFinancialProfile` y perfiles históricos.

## Architecture Decisions

| Opción | Tradeoff | Decisión |
|---|---|---|
| **Motor de cálculo**: Servicio funcional puro (`leakDetectionService.ts`) vs Extender `summaryService.ts` | Extender sobrecarga `summaryService` que solo calcula flujos brutos; un servicio desacoplado aísla la heurística de frecuencias e impactos. | **Servicio funcional puro dedicado**: Funciones deterministas sin efectos secundarios, testeable unitariamente al 100%. |
| **Modelado de datos**: Enriquecer `UserFinancialProfile` con `fugasPresupuesto?: MoneyLeakInput[]` opcional vs Obligatorio con migración | Obligatorio rompería llamadas existentes en `cli.ts` y tests previos; opcional mantiene compatibilidad total sin requerir migración. | **Opcional (`?`) en `UserFinancialProfile`**: `fugasPresupuesto` es un array opcional; si se omite, retorna estructura vacía neutra. |
| **Integración en Reporte**: Sección condicional dedicada vs Mezclar en Resumen Mensual | Mezclar en Resumen altera los totales de caja neta existente y rompe tests previos; sección dedicada es modular. | **Sección condicional "FUGAS DE PRESUPUESTO Y OPTIMIZACIÓN"**: Solo se renderiza si hay fugas registradas, sin alterar secciones 1-6. |
| **Fórmulas de proyección**: Base 30 días/mes y 365 días/año para `diario`, 52 semanas para `semanal` | Discrepancia menor calendario vs consistencia determinista estándar financiera. | **Estándar especificado**: `diario` = monto × 30 (mes) / monto × 365 (año); `semanal` = (monto × 52)/12 (mes) / monto × 52 (año); `mensual` = monto / monto × 12; `anual` = monto/12 / monto. |

## Data Flow

```
[CLI / Input Profile]
        │
        ▼ (fugasPresupuesto?)
[leakDetectionService] ─── normalizeFrequencies() ───→ [MoneyLeakItem[]]
        │
        ├── aggregateLeakCosts() ─────────────────────→ [AggregatedLeakReport]
        │
        └── calculateLeakImpactOnGoals() ─────────────→ [LeakImpactOnGoals]
                 │ (saldo total deuda, cuotas, fondo)          │
                 ▼                                             ▼
       [debtPlanService] / [emergencyFundService]    [Complete LeakReport]
                                                               │
                                                               ▼
                                                      [reportService.ts]
                                                (Sección dedicada si fugas > 0)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/models/types.ts` | Modify | Añadir tipos `LeakFrequency`, `LeakCategory`, `MoneyLeakInput`, `MoneyLeakItem`, `AggregatedLeakReport`, `LeakImpactOnGoals`, `LeakAnalysisResult` y campo opcional en `UserFinancialProfile`. |
| `src/services/leakDetectionService.ts` | Create | Motor funcional puro: validación, normalización de costes, agregaciones por categoría y cálculo de aceleración de metas. |
| `src/services/reportService.ts` | Modify | Integrar sección `FUGAS DE PRESUPUESTO Y OPTIMIZACIÓN` cuando existan fugas reportadas. |
| `src/cli.ts` | Modify | Añadir bloque opcional interactivo de captura de fugas respetando flujo previo. |
| `src/tests/leakDetectionService.test.ts` | Create | Suite completa de tests unitarios TDD para normalización, agregaciones, impactos y casos borde. |

## Interfaces / Contracts

```typescript
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
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit (`leakDetectionService.test.ts`) | Normalización frecuencias (`diario`, `semanal`, `mensual`, `anual`) y anualizaciones | Vitest: casos de prueba paramétricos con valores de spec (`Café 3.50€`, suscripciones anuales). |
| Unit (`leakDetectionService.test.ts`) | Desglose agregado por categoría y totales acumulados | Vitest: verificación de suma exacta por categoría (`hormiga`, `vampiro`, `prescindible`). |
| Unit (`leakDetectionService.test.ts`) | Impacto cruzado en deuda (deuda 2400€ a 100€/mes vs +100€ fuga recuperada) | Vitest: validar reducción de 24 a 12 meses (12 meses ahorrados), perfiles sin deuda (0 meses). |
| Unit (`leakDetectionService.test.ts`) | Impacto en Fondo de Emergencia (hitos faltantes, baseline 0 vs acelerado) | Vitest: validar meses ahorrados y transición de infinito/incalculable a objetivo viable. |
| Unit (`leakDetectionService.test.ts`) | Casos bordes: lista vacía, montos negativos o cero | Vitest: filtrado de no positivos, retorno neutro sin excepciones. |
| Integration (`financialPlan.test.ts`) | Renderizado en `reportService` y regresión | Vitest: reporte incluye sección dedicada con fugas y la omite limpiamente si no hay fugas. |

## Migration / Rollout

No migration required. El campo `fugasPresupuesto` es puramente opcional en `UserFinancialProfile`. Todo cálculo maneja listas vacías o valores ausentes por defecto devolviendo impacto cero.

## Open Questions

- None.
