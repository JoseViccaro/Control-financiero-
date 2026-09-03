# Tasks: Detección de Fugas de Presupuesto

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~220-280 lines (new service, test suite, report wiring, types) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: stacked-to-main
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Types, leakDetectionService with TDD, report integration, and CLI wiring | PR 1 | Self-contained, fits easily within 400 lines budget |

---

## Phase 1: Foundation & Types

- [x] 1.1 Add leak domain interfaces (`LeakFrequency`, `LeakCategory`, `MoneyLeakInput`, `MoneyLeakItem`, `AggregatedLeakReport`, `LeakImpactOnGoals`, `LeakAnalysisResult`) and optional `fugasPresupuesto?: MoneyLeakInput[]` in `src/models/types.ts`.
- [x] 1.2 Validate that existing tests compile without error with `npx tsc --noEmit`.

## Phase 2: Core Domain Logic (Strict TDD)

- [x] 2.1 **RED**: Write failing unit tests in `src/tests/leakDetectionService.test.ts` for frequency normalization (`diario`, `semanal`, `mensual`, `anual`) and category aggregation (`hormiga`, `vampiro`, `prescindible`).
- [x] 2.2 **GREEN**: Implement `normalizeFrequencies` and `aggregateLeakCosts` in `src/services/leakDetectionService.ts` to satisfy Phase 2.1 tests.
- [x] 2.3 **RED**: Add failing unit tests in `src/tests/leakDetectionService.test.ts` for goal impact calculations (debt payoff reduction, emergency fund milestone acceleration, edge cases with 0 balance or zero leaks).
- [x] 2.4 **GREEN**: Implement `calculateLeakImpactOnGoals` and export primary orchestrator function `analyzeMoneyLeaks` in `src/services/leakDetectionService.ts` to pass all tests.
- [x] 2.5 **REFACTOR**: Polish internal helpers and types in `src/services/leakDetectionService.ts` ensuring clean code, immutability, and zero regression.

## Phase 3: Reporting & Integration (TDD)

- [x] 3.1 **RED**: Add integration test in `src/tests/financialPlan.test.ts` verifying section `FUGAS DE PRESUPUESTO Y OPTIMIZACIÓN` is rendered when leaks exist and omitted when absent.
- [x] 3.2 **GREEN**: Update `src/services/reportService.ts` to include conditional leaks section with itemized breakdown and goal impact.
- [x] 3.3 **GREEN**: Update `src/cli.ts` to optionally accept and display money leaks during financial analysis.

## Phase 4: Verification & Quality Gate

- [x] 4.1 Run type-check with `npx tsc --noEmit`.
- [x] 4.2 Run test suite with `npm test` ensuring 100% pass rate and backward compatibility.
