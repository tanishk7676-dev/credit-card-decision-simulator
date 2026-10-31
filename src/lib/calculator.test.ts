/**
 * Calculator Test Suite
 *
 * All expected values are calculated INDEPENDENTLY (by hand or spreadsheet),
 * NOT derived from the implementation itself.
 *
 * Key verification basis:
 *   MPR = APR / 12
 *   interest_m = opening_balance_m × MPR
 *   prePay_m   = opening_balance_m + interest_m
 *   closing_m  = prePay_m − payment_m
 *
 * For the fixed-payment ₹50,000 @ 12% APR, ₹5,000/month example:
 *   MPR = 0.12 / 12 = 0.01
 *   Month 1: interest = 50000 × 0.01 = 500.00, prePay = 50500.00, payment = 5000, closing = 45500.00
 *   Month 2: interest = 45500 × 0.01 = 455.00, prePay = 45955.00, payment = 5000, closing = 40955.00
 *   Month 3: interest = 40955 × 0.01 = 409.55, prePay = 41364.55, payment = 5000, closing = 36364.55
 *   Month 4: interest = 36364.55 × 0.01 = 363.65, prePay = 36728.20, payment = 5000, closing = 31728.20
 *   Month 5: interest = 31728.20 × 0.01 = 317.28, prePay = 32045.48, payment = 5000, closing = 27045.48
 *   Month 6: interest = 27045.48 × 0.01 = 270.45, prePay = 27315.93, payment = 5000, closing = 22315.93
 *   Month 7: interest = 22315.93 × 0.01 = 223.16, prePay = 22539.09, payment = 5000, closing = 17539.09
 *   Month 8: interest = 17539.09 × 0.01 = 175.39, prePay = 17714.48, payment = 5000, closing = 12714.48
 *   Month 9: interest = 12714.48 × 0.01 = 127.14, prePay = 12841.62, payment = 5000, closing = 7841.62
 *   Month 10: interest = 7841.62 × 0.01 = 78.42, prePay = 7920.04, payment = 5000, closing = 2920.04
 *   Month 11: interest = 2920.04 × 0.01 = 29.20, prePay = 2949.24, payment = 2949.24 (capped), closing = 0
 *
 *   Total interest = 500+455+409.55+363.65+317.28+270.45+223.16+175.39+127.14+78.42+29.20 = 2,949.24
 *   Total paid     = 10×5000 + 2949.24 = 52,949.24
 *   Cross-check    = 50,000 + 2,949.24 = 52,949.24 ✓
 *
 * Note: The user-reviewed plan proposed ~₹2,966; precise independent calculation gives ₹2,949.24.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateFullPayment,
  calculateFixedPayment,
  calculateMinimumPayment,
  runSimulation,
  validateInputs,
  roundINR,
  type SimulatorInputs,
} from './calculator';

// ─── Helper ──────────────────────────────────────────────────────────────────

function makeInputs(overrides: Partial<SimulatorInputs> = {}): SimulatorInputs {
  return {
    startingBalance: 50000,
    aprPercent: 12,
    fixedMonthlyPayment: 5000,
    scenarioType: 'fresh_purchase',
    ...overrides,
  };
}

// ─── Strategy A: Full Payment ─────────────────────────────────────────────────

describe('Strategy A — Full Payment', () => {
  it('fresh purchase: zero interest, pays exactly the purchase amount', () => {
    const result = calculateFullPayment(makeInputs({ startingBalance: 50000, scenarioType: 'fresh_purchase' }));
    expect(result.status).toBe('grace_period');
    expect(result.totalInterest).toBe(0);
    expect(result.totalPaid).toBe(50000);
    expect(result.months).toBe(0);
    expect(result.schedule).toHaveLength(1);
    expect(result.schedule[0].interestCharged).toBe(0);
    expect(result.schedule[0].closingBalance).toBe(0);
  });

  it('existing balance: charges one month of interest', () => {
    // MPR = 0.42/12 = 0.035; interest = 50000 × 0.035 = 1750
    const result = calculateFullPayment(makeInputs({
      startingBalance: 50000,
      aprPercent: 42,
      scenarioType: 'existing_balance',
    }));
    expect(result.status).toBe('ok');
    expect(result.totalInterest).toBe(1750);
    expect(result.totalPaid).toBe(51750);
    expect(result.months).toBe(1);
  });

  it('zero balance returns zero_balance status', () => {
    const result = calculateFullPayment(makeInputs({ startingBalance: 0 }));
    expect(result.status).toBe('zero_balance');
    expect(result.totalPaid).toBe(0);
    expect(result.totalInterest).toBe(0);
  });

  it('fresh purchase at 0% APR: zero interest, same total paid', () => {
    const result = calculateFullPayment(makeInputs({ startingBalance: 30000, aprPercent: 0, scenarioType: 'fresh_purchase' }));
    expect(result.status).toBe('grace_period');
    expect(result.totalInterest).toBe(0);
    expect(result.totalPaid).toBe(30000);
  });
});

// ─── Strategy B: Fixed Payment ────────────────────────────────────────────────

describe('Strategy B — Fixed Monthly Payment', () => {
  it('₹50,000 at 12% APR, ₹5,000/month: 11 months, ₹2,949.24 interest', () => {
    const result = calculateFixedPayment(makeInputs({
      startingBalance: 50000,
      aprPercent: 12,
      fixedMonthlyPayment: 5000,
    }));
    expect(result.status).toBe('ok');
    expect(result.months).toBe(11);
    expect(result.totalInterest).toBe(2949.24);
    expect(result.totalPaid).toBe(52949.24);
    // Consistency: totalPaid = startingBalance + totalInterest
    expect(roundINR(result.totalPaid - result.totalInterest)).toBe(50000);
  });

  it('schedule consistency: each cycle closing = opening + interest − payment', () => {
    const result = calculateFixedPayment(makeInputs({
      startingBalance: 50000,
      aprPercent: 12,
      fixedMonthlyPayment: 5000,
    }));
    for (const cycle of result.schedule) {
      const expectedClosing = roundINR(
        roundINR(cycle.openingBalance + cycle.interestCharged) - cycle.paymentMade
      );
      expect(cycle.closingBalance).toBeCloseTo(expectedClosing, 1);
    }
  });

  it('first cycle interest is correct: 50000 × 0.01 = 500', () => {
    const result = calculateFixedPayment(makeInputs());
    expect(result.schedule[0].interestCharged).toBe(500);
  });

  it('final payment is capped at the remaining balance + interest (not full fixed amount)', () => {
    const result = calculateFixedPayment(makeInputs({
      startingBalance: 50000,
      aprPercent: 12,
      fixedMonthlyPayment: 5000,
    }));
    const lastCycle = result.schedule[result.schedule.length - 1];
    // Month 11: prePay = 2949.24, payment should be 2949.24 (not 5000)
    expect(lastCycle.paymentMade).toBe(2949.24);
    expect(lastCycle.closingBalance).toBe(0);
  });

  it('zero interest rate: simple division, no interest charged', () => {
    const result = calculateFixedPayment(makeInputs({
      startingBalance: 12000,
      aprPercent: 0,
      fixedMonthlyPayment: 3000,
    }));
    expect(result.status).toBe('zero_interest');
    expect(result.months).toBe(4);
    expect(result.totalInterest).toBe(0);
    expect(result.totalPaid).toBe(12000);
    expect(result.schedule.every(c => c.interestCharged === 0)).toBe(true);
  });

  it('payment exactly equal to initial monthly interest: insufficient payment error', () => {
    // 50000 × (42/12/100) = 50000 × 0.035 = 1750
    const result = calculateFixedPayment(makeInputs({
      startingBalance: 50000,
      aprPercent: 42,
      fixedMonthlyPayment: 1750,
    }));
    expect(result.status).toBe('insufficient_payment');
    expect(result.statusMessage).toBeTruthy();
    expect(result.months).toBe(0);
  });

  it('payment less than initial monthly interest: insufficient payment error', () => {
    // 50000 × 0.035 = 1750; paying 1000 < 1750
    const result = calculateFixedPayment(makeInputs({
      startingBalance: 50000,
      aprPercent: 42,
      fixedMonthlyPayment: 1000,
    }));
    expect(result.status).toBe('insufficient_payment');
  });

  it('zero balance returns zero_balance status', () => {
    const result = calculateFixedPayment(makeInputs({ startingBalance: 0 }));
    expect(result.status).toBe('zero_balance');
    expect(result.totalPaid).toBe(0);
  });

  it('payment larger than balance clears in one cycle', () => {
    // 10000 × 0.01 = 100 interest; prePay = 10100; payment capped at 10100
    const result = calculateFixedPayment(makeInputs({
      startingBalance: 10000,
      aprPercent: 12,
      fixedMonthlyPayment: 50000,
    }));
    expect(result.months).toBe(1);
    expect(result.totalInterest).toBe(100);
    expect(result.totalPaid).toBe(10100);
  });

  it('inputs actually affect results: higher payment = fewer months', () => {
    const low = calculateFixedPayment(makeInputs({ fixedMonthlyPayment: 2000 }));
    const high = calculateFixedPayment(makeInputs({ fixedMonthlyPayment: 8000 }));
    expect(high.months).toBeLessThan(low.months);
    expect(high.totalInterest).toBeLessThan(low.totalInterest);
  });

  it('inputs actually affect results: higher APR = more interest', () => {
    const low = calculateFixedPayment(makeInputs({ aprPercent: 12 }));
    const high = calculateFixedPayment(makeInputs({ aprPercent: 42 }));
    expect(high.totalInterest).toBeGreaterThan(low.totalInterest);
  });

  it('₹10,000 at 0% APR, ₹1,000/month: exactly 10 months, ₹0 interest', () => {
    const result = calculateFixedPayment(makeInputs({
      startingBalance: 10000,
      aprPercent: 0,
      fixedMonthlyPayment: 1000,
    }));
    expect(result.months).toBe(10);
    expect(result.totalInterest).toBe(0);
    expect(result.totalPaid).toBe(10000);
  });
});

// ─── Strategy C: Minimum Payment ─────────────────────────────────────────────

describe('Strategy C — Minimum Payment (Declining)', () => {
  it('minimum payment declines over time as balance reduces', () => {
    const result = calculateMinimumPayment(makeInputs({
      startingBalance: 50000,
      aprPercent: 36,
    }));
    // Earlier payments should be larger than later ones
    const payments = result.schedule.slice(0, 20).map(c => c.paymentMade);
    let hasDecline = false;
    for (let i = 1; i < payments.length; i++) {
      if (payments[i] < payments[i - 1]) { hasDecline = true; break; }
    }
    expect(hasDecline).toBe(true);
  });

  it('month 1 minimum payment: max(5% × prePay, ₹200)', () => {
    // 50000 × (36/1200) = 50000 × 0.03 = 1500; prePay = 51500
    // minDue = max(0.05 × 51500, 200) = max(2575, 200) = 2575
    const result = calculateMinimumPayment(makeInputs({
      startingBalance: 50000,
      aprPercent: 36,
    }));
    expect(result.schedule[0].paymentMade).toBe(2575);
    expect(result.schedule[0].interestCharged).toBe(1500);
  });

  it('small balance: payment capped at amount owed, not the formula floor', () => {
    // Balance = ₹100; 36% APR; interest = 100 × 0.03 = 3; prePay = 103
    // minDue = max(0.05 × 103, 200) = max(5.15, 200) = 200; but prePay = 103
    // actual payment = min(200, 103) = 103
    const result = calculateMinimumPayment(makeInputs({
      startingBalance: 100,
      aprPercent: 36,
    }));
    expect(result.schedule[0].paymentMade).toBe(103);
    expect(result.schedule[0].closingBalance).toBe(0);
  });

  it('minimum payment takes many more months than fixed payment', () => {
    const fixed = calculateFixedPayment(makeInputs({
      startingBalance: 50000,
      aprPercent: 36,
      fixedMonthlyPayment: 2575, // same as month 1 minimum
    }));
    const minimum = calculateMinimumPayment(makeInputs({
      startingBalance: 50000,
      aprPercent: 36,
    }));
    // Minimum should take significantly longer
    expect(minimum.months).toBeGreaterThan(fixed.months * 2);
  });

  it('minimum payment accrues more total interest than fixed payment', () => {
    const fixed = calculateFixedPayment(makeInputs({
      startingBalance: 50000,
      aprPercent: 36,
      fixedMonthlyPayment: 5000,
    }));
    const minimum = calculateMinimumPayment(makeInputs({
      startingBalance: 50000,
      aprPercent: 36,
    }));
    expect(minimum.totalInterest).toBeGreaterThan(fixed.totalInterest);
  });

  it('consistency: totalPaid ≈ startingBalance + totalInterest', () => {
    const result = calculateMinimumPayment(makeInputs({
      startingBalance: 50000,
      aprPercent: 36,
    }));
    if (result.status === 'ok') {
      const diff = Math.abs(result.totalPaid - (50000 + result.totalInterest));
      expect(diff).toBeLessThan(1); // within ₹1 for rounding
    }
  });

  it('zero balance returns zero_balance status', () => {
    const result = calculateMinimumPayment(makeInputs({ startingBalance: 0 }));
    expect(result.status).toBe('zero_balance');
    expect(result.totalPaid).toBe(0);
  });

  it('zero interest rate: balance reduces with each minimum payment', () => {
    const result = calculateMinimumPayment(makeInputs({
      startingBalance: 5000,
      aprPercent: 0,
    }));
    expect(result.totalInterest).toBe(0);
    expect(result.schedule.every(c => c.interestCharged === 0)).toBe(true);
    // Balance should decrease each cycle
    for (let i = 1; i < result.schedule.length; i++) {
      expect(result.schedule[i].openingBalance).toBeLessThan(result.schedule[i - 1].openingBalance);
    }
  });

  it('all closing balances are non-negative', () => {
    const result = calculateMinimumPayment(makeInputs({
      startingBalance: 50000,
      aprPercent: 42,
    }));
    for (const cycle of result.schedule) {
      expect(cycle.closingBalance).toBeGreaterThanOrEqual(0);
    }
  });
});

// ─── runSimulation Integration ────────────────────────────────────────────────

describe('runSimulation — integration', () => {
  it('all three strategies return results for a valid input', () => {
    const result = runSimulation(makeInputs());
    expect(result.strategyFull).toBeTruthy();
    expect(result.strategyFixed).toBeTruthy();
    expect(result.strategyMinimum).toBeTruthy();
  });

  it('minimum payment always costs more interest than fixed (for same balance and rate)', () => {
    const result = runSimulation(makeInputs({
      startingBalance: 50000,
      aprPercent: 36,
      fixedMonthlyPayment: 5000,
    }));
    if (result.strategyFixed.status === 'ok' && result.strategyMinimum.status === 'ok') {
      expect(result.strategyMinimum.totalInterest).toBeGreaterThan(result.strategyFixed.totalInterest);
    }
  });

  it('full payment costs less or equal total interest than fixed payment', () => {
    const result = runSimulation(makeInputs({ scenarioType: 'fresh_purchase' }));
    expect(result.strategyFull.totalInterest).toBeLessThanOrEqual(result.strategyFixed.totalInterest);
  });

  it('monthlyRate matches APR / 12', () => {
    const result = runSimulation(makeInputs({ aprPercent: 36 }));
    expect(result.monthlyRate).toBeCloseTo(0.03, 10);
  });
});

// ─── Validation ───────────────────────────────────────────────────────────────

describe('validateInputs', () => {
  it('valid inputs pass validation', () => {
    const result = validateInputs(makeInputs());
    expect(result.valid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  it('negative balance fails validation', () => {
    const result = validateInputs(makeInputs({ startingBalance: -100 }));
    expect(result.valid).toBe(false);
    expect(result.errors.startingBalance).toBeTruthy();
  });

  it('APR over 120% fails validation', () => {
    const result = validateInputs(makeInputs({ aprPercent: 150 }));
    expect(result.valid).toBe(false);
    expect(result.errors.aprPercent).toBeTruthy();
  });

  it('negative monthly payment fails validation', () => {
    const result = validateInputs(makeInputs({ fixedMonthlyPayment: -500 }));
    expect(result.valid).toBe(false);
    expect(result.errors.fixedMonthlyPayment).toBeTruthy();
  });

  it('zero APR and zero balance passes validation', () => {
    const result = validateInputs(makeInputs({ startingBalance: 0, aprPercent: 0 }));
    expect(result.valid).toBe(true);
  });

  it('extreme but valid values pass: ₹1,00,00,000 at 120%', () => {
    const result = validateInputs(makeInputs({ startingBalance: 10_000_000, aprPercent: 120 }));
    expect(result.valid).toBe(true);
  });

  it('balance over limit fails: ₹1,00,00,001', () => {
    const result = validateInputs(makeInputs({ startingBalance: 10_000_001 }));
    expect(result.valid).toBe(false);
  });
});

// ─── Edge Cases ───────────────────────────────────────────────────────────────

describe('Edge cases', () => {
  it('very small balance (₹1) with high APR clears in one cycle', () => {
    const result = calculateFixedPayment(makeInputs({
      startingBalance: 1,
      aprPercent: 42,
      fixedMonthlyPayment: 10,
    }));
    expect(result.months).toBe(1);
    expect(result.schedule[0].closingBalance).toBe(0);
  });

  it('payment much larger than balance: clears in 1 month', () => {
    const result = calculateFixedPayment(makeInputs({
      startingBalance: 100,
      aprPercent: 36,
      fixedMonthlyPayment: 1_000_000,
    }));
    expect(result.months).toBe(1);
    expect(result.schedule[0].closingBalance).toBe(0);
  });

  it('roundINR handles floating-point arithmetic correctly', () => {
    expect(roundINR(0.1 + 0.2)).toBe(0.3);
    expect(roundINR(1234.565)).toBe(1234.57);
    expect(roundINR(1234.564)).toBe(1234.56);
  });

  it('fresh purchase at exactly ₹200 clears with zero interest', () => {
    const result = calculateFullPayment(makeInputs({ startingBalance: 200, scenarioType: 'fresh_purchase' }));
    expect(result.totalPaid).toBe(200);
    expect(result.totalInterest).toBe(0);
  });
});
