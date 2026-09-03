# Delta for financial-reporting

## ADDED Requirements

### Requirement: Budget Leak Breakdown Section in Financial Report

The financial reporting system MUST include a dedicated section titled "FUGAS DE PRESUPUESTO Y OPTIMIZACIÓN" in the diagnostic report when one or more valid money leaks are present in the analysis. This section MUST detail:
1. Individual detected leaks with category, monthly cost, and annualized cost.
2. Aggregated totals (total monthly leak and total annualized leak).
3. Projected impact: months reduced for debt elimination and months saved toward emergency fund milestones.

#### Scenario: Display leak breakdown when leaks are detected

- GIVEN a user financial profile with detected money leaks totaling 80.00 EUR/month
- WHEN `generateFinancialReport` is invoked
- THEN the output report string MUST contain the section header `FUGAS DE PRESUPUESTO Y OPTIMIZACIÓN`
- AND the section MUST display individual leak items, category tags, and total monthly and annualized amounts
- AND the section MUST display the projected reduction in months for debt payoff or emergency fund acceleration

#### Scenario: Graceful omission of leak section when no leaks exist (Backward Compatibility)

- GIVEN a user financial profile with no money leaks defined (`fugasPresupuesto` is empty or undefined)
- WHEN `generateFinancialReport` is invoked
- THEN the report output MUST NOT display the leak breakdown section header `FUGAS DE PRESUPUESTO Y OPTIMIZACIÓN`
- AND existing report sections (Resumen Mensual, Plan de Gastos, Plan de Deudas, Fondo de Emergencia, Acciones de Hoy) MUST remain identically formatted without regressions
