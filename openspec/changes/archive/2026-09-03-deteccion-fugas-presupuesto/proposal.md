# Proposal: Detección de Fugas de Presupuesto

## Intent

Identificar y cuantificar fugas financieras habituales (gastos hormiga, microgastos frecuentes, suscripciones y gastos vampiro) que erosionan silenciosamente la liquidez. Conectar el ahorro potencial recuperable directamente con la aceleración del desendeudamiento y la constitución del fondo de emergencia.

## Scope

### In Scope
- Detección automática y categorización de fugas: microgastos recurrentes, suscripciones no esenciales / gastos vampiro y gastos hormiga.
- Cálculo de coste acumulado mensual y proyección anualizada (€) por fuga y agregado.
- Impacto proyectado en metas: reducción de meses para liquidar deuda y meses ahorrados para completar el fondo de emergencia.
- Integración en `reportService` (sección dedicada) y comandos/flags CLI de forma retrocompatible.
- Soporte de entrada opcional en `UserFinancialProfile`.

### Out of Scope
- Integración bancaria directa por PSD2/Open Banking.
- Cancelación automática de suscripciones con proveedores externos.
- Modificación del cálculo base de balances preexistentes.

## Capabilities

### New Capabilities
- `money-leak-detection`: Detección, categorización (hormiga/vampiro/microgasto), anualización de costes y cálculo de impacto de desvío hacia deuda y fondo de emergencia.

### Modified Capabilities
- `financial-reporting`: Incorporar desglose de fugas detectadas y oportunidades de reasignación hacia metas financieras sin alterar métricas existentes.

## Approach

1. Modelar tipos opcionales (`MoneyLeak`, `LeakType`, `LeakImpact`) en `src/models/types.ts` preservando compatibilidad.
2. Crear `leakDetectionService.ts` para evaluar entradas explícitas y reglas heurísticas sobre gastos variables/fijos prescindibles.
3. Computar proyecciones anuales e impacto cruzado en `debtPlanService` y `emergencyFundService`.
4. Integrar visualización en `reportService.ts` y CLI manteniendo salidas existentes intactas si no hay fugas configuradas.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/models/types.ts` | Modified | Nuevas interfaces opcionales para fugas e impacto |
| `src/services/leakDetectionService.ts` | New | Lógica de detección, anualización e impacto |
| `src/services/reportService.ts` | Modified | Sección de reporte de fugas e impacto en metas |
| `src/cli.ts` | Modified | Subcomando o flags para análisis de fugas |
| `src/tests/leakDetectionService.test.ts` | New | Cobertura unitaria con Vitest |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Falsos positivos clasificando gastos esenciales como fugas | Low | Categorización configurable y flags opcionales |
| Romper compatibilidad con perfiles JSON existentes | Low | Campos estrictamente opcionales con valores por defecto |

## Rollback Plan

Revertir los commits del cambio mediante `git revert`. Al ser aditivo y desacoplado en un nuevo servicio, el modelo de datos preexistente y los comandos CLI anteriores continúan operativos sin migraciones de datos.

## Dependencies

- Ninguna externa adicional; Vitest y TypeScript existentes en el proyecto.

## Success Criteria

- [ ] `leakDetectionService` identifica y anualiza costes correctamente con tests unitarios (>90% cobertura).
- [ ] Conexión matemática validada: reducción demostrable en meses de deuda/fondo al erradicar fugas.
- [ ] Compatibilidad regresiva 100% garantizada (`npm test` pasa sin cambios en perfiles existentes).
