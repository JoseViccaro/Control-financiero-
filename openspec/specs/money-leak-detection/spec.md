# Money Leak Detection Specification

## Purpose

Provide automated detection, categorization, cost projection, and goal-acceleration analysis for recurring financial leaks (micro-expenses, vampire expenses / subscriptions, and avoidable spending) to maximize budget recovery for debt reduction and emergency fund building.

## Requirements

### Requirement: Leak Categorization and Frequency Normalization

The system MUST categorize each money leak into one of the designated categories: `hormiga` (daily/weekly micro-expenses), `vampiro` (monthly/annual subscriptions and recurring silent costs), or `prescindible` (avoidable discretionary expenses). The system MUST normalize frequency (`diario`, `semanal`, `mensual`, `anual`) into equivalent monthly and annualized costs.

#### Scenario: Categorization and normalization of daily micro-expense (Gasto Hormiga)

- GIVEN a money leak with name "Café y snacks", amount 3.50 EUR, frequency "diario" (calculated at 30 days/month and 365 days/year), and category "hormiga"
- WHEN the leak detection analysis is executed
- THEN the leak item MUST be categorized as "hormiga"
- AND the normalized monthly cost MUST equal 105.00 EUR (3.50 * 30)
- AND the annualized cost MUST equal 1277.50 EUR (3.50 * 365)

#### Scenario: Categorization and normalization of annual subscription (Gasto Vampiro)

- GIVEN a recurring subscription with name "Streaming Anual", amount 120.00 EUR, frequency "anual", and category "vampiro"
- WHEN the leak detection analysis is executed
- THEN the leak item MUST be categorized as "vampiro"
- AND the normalized monthly cost MUST equal 10.00 EUR (120 / 12)
- AND the annualized cost MUST equal 120.00 EUR

### Requirement: Aggregated Leak Cost Analysis

The system MUST aggregate all identified leaks and compute the total monthly leakage and total annualized leakage across all categories and broken down by category (`hormiga`, `vampiro`, `prescindible`).

#### Scenario: Aggregation across multiple mixed-frequency leaks

- GIVEN multiple identified leaks: 60.00 EUR/month in "hormiga", 25.00 EUR/month in "vampiro", and 40.00 EUR/month in "prescindible"
- WHEN aggregated leak calculations are performed
- THEN the total monthly leak cost MUST equal 125.00 EUR
- AND the total annualized leak cost MUST equal 1500.00 EUR (125.00 * 12)
- AND category breakdowns MUST reflect 60.00 EUR for hormiga, 25.00 EUR for vampiro, and 40.00 EUR for prescindible

### Requirement: Financial Impact on Debt Payoff Acceleration

The system MUST calculate the potential reduction in debt payoff time (in months) if total monthly leak funds are redirected towards debt amortization.

#### Scenario: Debt payoff time reduction with recovered leak funds

- GIVEN a user financial profile with total outstanding debt balance of 2400.00 EUR and current baseline monthly surplus/extra repayment of 100.00 EUR (baseline payoff: 24 months)
- AND identified monthly leaks totaling 100.00 EUR
- WHEN leak impact calculation is evaluated with leak reallocation (new repayment capacity: 200.00 EUR/month)
- THEN new accelerated payoff time MUST equal 12 months
- AND the debt reduction impact MUST report 12 months saved

#### Scenario: Debt impact when user has zero debts

- GIVEN a user financial profile with no active debts (total debt balance is 0.00 EUR)
- WHEN leak impact calculation is evaluated
- THEN debt months reduced MUST be 0
- AND the system MUST indicate no debt amortization required

### Requirement: Financial Impact on Emergency Fund Building

The system MUST calculate the acceleration in achieving emergency fund milestones (in months saved) when recovered leak savings are allocated to the emergency fund.

#### Scenario: Emergency fund acceleration with recovered leak savings

- GIVEN an emergency fund milestone requiring an additional 600.00 EUR to complete
- AND a baseline monthly savings rate of 100.00 EUR (baseline time to goal: 6 months)
- AND total recovered monthly leaks of 50.00 EUR (accelerated monthly savings: 150.00 EUR)
- WHEN emergency fund impact is calculated
- THEN the accelerated completion time MUST equal 4 months (600 / 150)
- AND the milestone months saved MUST report 2 months saved

#### Scenario: Emergency fund impact when milestone is already funded or savings rate is zero

- GIVEN an emergency fund milestone with 0.00 EUR remaining (100% achieved)
- WHEN emergency fund impact is evaluated
- THEN months saved for that milestone MUST be 0
- GIVEN an emergency fund milestone requiring 500.00 EUR where baseline savings is 0.00 EUR and recovered leaks are 50.00 EUR
- WHEN emergency fund impact is evaluated
- THEN accelerated time MUST calculate as 10 months and indicate infinity/incalculable baseline transformed to viable target

### Requirement: Zero Leaks and Edge Case Validation

The system MUST gracefully handle profiles with empty leaks list, zero amounts, or invalid negative numbers without throwing runtime exceptions.

#### Scenario: Profile with empty leaks list or zero amount

- GIVEN a user financial profile with no money leaks defined (`fugasPresupuesto: []` or undefined)
- WHEN leak detection analysis is executed
- THEN total monthly leak cost MUST be 0.00 EUR
- AND total annualized leak cost MUST be 0.00 EUR
- AND months reduced on debt and emergency fund MUST be 0
- AND the leaks list MUST be returned as an empty array

#### Scenario: Leak item with negative or non-positive amount

- GIVEN an input leak item with an amount less than or equal to 0
- WHEN leak validation is executed
- THEN the system MUST either reject the item or ignore non-positive amounts from total leak summation without corrupting totals
