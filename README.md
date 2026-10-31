# Credit Card Decision Simulator

A free, interactive financial education tool for first-time credit card users in India.

## What It Does

Helps young adults (18–25) understand how different credit card repayment decisions affect:
- The **total cost** of a purchase
- The **amount of interest** paid
- The **time required** to clear a balance

Users can compare three repayment strategies:
- **A. Pay the full statement balance** — demonstrates potential zero-interest outcome under grace-period conditions
- **B. Pay a fixed monthly amount** — shows how a consistent payment accelerates repayment
- **C. Pay only the Minimum Amount Due** — illustrates the high long-term cost of minimum-only payments

---

## Quick Start

### Prerequisites
- Node.js v18 or later
- npm v9 or later

### Install and Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

### Run Tests

```bash
npm test
```

---

## Features

| Feature | Status |
|---------|--------|
| Fresh purchase scenario | ✅ |
| Existing balance scenario | ✅ |
| Quick-pick example purchases (smartphone, laptop, etc.) | ✅ |
| APR input with educational tooltip | ✅ |
| Three repayment strategies with full calculation | ✅ |
| Declining minimum payment (illustrative formula) | ✅ |
| Insufficient payment detection | ✅ |
| Interactive area chart (balance + cumulative paid views) | ✅ |
| Educational explanations (accordion, context-aware) | ✅ |
| Prominent financial disclosures | ✅ |
| Simulation assumptions panel | ✅ |
| Input validation with error messages | ✅ |
| Responsive design (mobile + desktop) | ✅ |
| Indian Rupee formatting with Indian digit grouping | ✅ |
| Automated financial calculation tests | ✅ |

---

## Financial Calculation Model

### Interest Rate Conversion

```
Monthly Periodic Rate (MPR) = APR ÷ 12
```

**Educational simplification.** Actual credit card issuers may use daily compounding or other methods. Monthly compounding is used here because it maps cleanly to billing cycles and is transparent for educational purposes.

### Each Billing Cycle

```
interest   = opening_balance × MPR
pre_pay    = opening_balance + interest
payment    = amount due under the active strategy (capped at pre_pay)
closing    = pre_pay − payment
```

### Strategy A — Full Payment (Grace Period)

- **Fresh purchase:** If the user pays the full statement balance by the due date with no prior revolving balance, zero interest is charged (grace period applies). Total repaid = purchase amount.
- **Existing balance:** One month of interest is charged; paying in full stops further accrual.

### Strategy B — Fixed Monthly Payment

- Constant payment each cycle until balance reaches zero.
- Final payment is capped at the remaining amount owed (not the full fixed amount).
- If the payment ≤ initial monthly interest, the simulation flags this as insufficient and explains why.

### Strategy C — Minimum Payment (Illustrative)

```
minimum_due = max(5% × pre_pay, ₹200)
payment     = min(minimum_due, pre_pay)   ← caps at amount owed
```

**This formula is illustrative only.** There is no single universal minimum payment rule for Indian credit cards. Each issuer defines its own formula. This simulator uses a simplified educational example.

### Excluded from Simulation

- Additional purchases after the starting balance
- Late-payment fees, over-limit fees, annual fees
- Applicable taxes (e.g. GST on interest and fees)
- Changes to APR during repayment
- Balance transfers, cash advances, or introductory rates

---

## Test Coverage

Tests are written with **Vitest** and use **independently calculated expected values** (not derived from the implementation itself).

| Test category | Cases covered |
|---------------|--------------|
| Strategy A (full payment) | Grace period zero interest; existing balance interest; zero balance; zero APR |
| Strategy B (fixed payment) | 11-month/₹2,949.24 independent calculation; schedule consistency; final payment cap; zero APR; insufficient payment detection; zero balance; large payment clears in 1 cycle; APR affects results; payment amount affects results |
| Strategy C (minimum payment) | Declining payments; month-1 formula; small balance cap; more months than fixed; more interest than fixed; consistency check; zero balance; zero APR; non-negative balances |
| Integration | All strategies return results; minimum always costs more; full always cheapest; monthly rate formula |
| Validation | Negative balance; APR > 120%; negative payment; zero APR + zero balance; extreme but valid; over-limit |
| Edge cases | Very small balance; oversized payment; roundINR floating-point; ₹200 balance |

Run `npm test` to execute all tests.

---

## Technology Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | React 18 + TypeScript | Type-safe components; broad ecosystem |
| Build tool | Vite 6 | Fast HMR; simple config |
| Styling | Tailwind CSS 3 | Utility-first; consistent design tokens |
| Charting | Recharts 2 | React-native; good AreaChart support |
| Icons | Lucide React | Lightweight; consistent style |
| Testing | Vitest | Native Vite integration; Jest-compatible API |

---

## Limitations and Known Issues

1. **Monthly compounding only.** Daily-compounding issuers will have different actual results.
2. **Minimum payment formula is illustrative.** Real issuer formulas vary; do not rely on Strategy C figures for actual payment planning.
3. **No fees or taxes.** Actual costs will be higher due to GST (currently 18% on interest/fees in India), late fees, etc.
4. **APR assumed constant.** Variable-rate cards are not modelled.
5. **Simulation cap at 600 months.** Extreme inputs (very high APR + very low payment) are capped and flagged.
6. **No offline support.** Google Fonts requires internet connectivity for optimal rendering.

---

## Disclosures

- This tool is for **financial education only**.
- Results are **estimates** based on a simplified model.
- This application does **not** provide personalised financial advice.
- Not affiliated with any bank, card issuer, or financial institution.
- Actual credit card interest, minimum payments, fees, taxes, and grace-period eligibility depend on your specific card issuer's terms and your individual circumstances.
