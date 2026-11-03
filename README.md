# Credit Card Decision Simulator

An interactive financial education project for people learning how credit card repayment choices affect interest, total repayment, and time to clear a balance.

> **Live website:** [credit-card-decision-simulator.vercel.app](https://credit-card-decision-simulator.vercel.app/)  
> The live website currently shows the original version. The Signal Modern redesign on this feature branch has not been merged or deployed.

**GitHub repository:** [tanishk7676-dev/credit-card-decision-simulator](https://github.com/tanishk7676-dev/credit-card-decision-simulator)

## Motivation and audience

Credit card interest and repayment terms can be difficult to understand before using a card. This project makes the effect of different repayment approaches easier to explore through immediate, side-by-side estimates.

It is intended primarily for first-time credit card users and young adults in India who want to learn about repayment trade-offs. It is an educational simulator, not a financial planning tool or a substitute for an issuer's terms.

## Features

- Fresh-purchase and existing-balance scenarios.
- Quick-pick example purchase amounts and Indian-formatted rupee inputs.
- APR entry with an educational explanation and input validation.
- Three repayment strategies: pay in full, pay a fixed amount monthly, or pay an illustrative minimum.
- Interactive monthly-payment slider with results that update as the amount changes.
- Repayment comparison showing principal, interest, total repayment, payoff time, and cost bars.
- Repayment chart with Balance and Total Paid views, plus an accessible data-table alternative.
- Interactive decorative credit-card visualization with restrained pointer and keyboard tilt; motion respects reduced-motion preferences.
- Context-aware educational explanations, assumptions, and financial disclosures.
- Responsive layout and Indian Rupee formatting.

## Screenshots

Screenshots will be added here when captures of the redesigned interface are available.

## Financial calculation model

The simulator uses a simplified monthly-interest model for illustration. It does not reproduce every card issuer's billing method.

### Interest rate conversion

```text
Monthly Periodic Rate (MPR) = APR ÷ 12
```

### Each billing cycle

```text
interest   = opening_balance × MPR
pre_pay    = opening_balance + interest
payment    = amount due under the active strategy (capped at pre_pay)
closing    = pre_pay − payment
```

### Strategy A — Pay in full

- **Fresh purchase:** Models a potential grace-period outcome: zero interest if the full statement balance is paid by the due date and the issuer's eligibility conditions are met.
- **Existing balance:** Models one month of interest before the balance is paid. Actual interest timing and grace-period eligibility depend on card terms.

### Strategy B — Fixed monthly payment

- Applies a fixed payment each cycle until the balance clears, with the final payment capped at the amount owed.
- Flags a payment at or below the initial monthly interest as insufficient to reduce the balance.

### Strategy C — Minimum payment (illustrative)

```text
minimum_due = max(5% × pre_pay, ₹200)
payment     = min(minimum_due, pre_pay)
```

This is an illustrative formula, not a universal Indian credit-card rule. Issuers use their own terms and formulas. Results depend on the inputs and assumptions; the simulator does not guarantee that minimum-only repayment will always cost more than every fixed-payment scenario.

### Exclusions and limitations

- Interest is modelled monthly; actual issuers may use daily or other calculation methods.
- Minimum-payment formula is illustrative and should not be used to determine an actual payment due.
- Additional purchases, late or over-limit charges, annual fees, applicable taxes, and APR changes are not modelled.
- Payments are assumed to be made on time.
- Balance transfers, cash advances, and introductory-rate offers are not modelled.
- Simulations are capped at 600 billing cycles (50 years); capped results may not represent a completed repayment.
- Geist fonts are loaded from Google Fonts, so the preferred fonts require an internet connection.

## Setup

### Prerequisites

- Node.js 18 or later
- npm 9 or later

### Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Production build

```bash
npm run build
npm run preview
```

### Tests

```bash
npm test
```

The Vitest suite in `src/lib/calculator.test.ts` currently contains **40 test cases** covering the calculation strategies, integration behavior, input validation, and edge cases. Its fixed-payment reference example checks that a ₹50,000 balance at 12% APR with ₹5,000 monthly payments clears in 11 months with ₹2,949.24 interest and ₹52,949.24 total paid. These are test expectations for that specific example, not general repayment estimates.

## Technology

| Area | Technology |
|---|---|
| UI | React 18, TypeScript |
| Development and build | Vite 6 |
| Styling | Tailwind CSS 3 and project-specific CSS |
| Charts | Recharts 2 |
| Icons | Lucide React |
| Tests | Vitest |

## AI-assisted development

- **Google Antigravity:** Initial implementation.
- **v0:** UI/UX exploration and prototyping.
- **GitHub Copilot:** Frontend redesign and refinement.
- **My contributions:** Problem selection, product decisions, prompt direction, testing, evaluation, and iterative improvements.

## Disclosures

- This project is for financial education only and does not provide personalised financial advice.
- Results are estimates based on the stated simplified model and may differ from actual card costs.
- Actual interest, minimum payments, fees, applicable taxes, and grace-period eligibility depend on the issuer's terms and the user's circumstances.
- The project is not affiliated with any bank, card issuer, or financial institution.
