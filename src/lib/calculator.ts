/**
 * Credit Card Decision Simulator — Financial Calculation Engine
 *
 * MATHEMATICAL MODEL & ASSUMPTIONS
 * ─────────────────────────────────────────────────────────────
 *
 * 1. INTEREST RATE CONVERSION
 *    Monthly Periodic Rate (MPR) = APR ÷ 12
 *    This is an educational simplification. Actual issuers may compound
 *    interest daily, use different calculation methods, or vary rates.
 *
 * 2. INTEREST CALCULATION TIMING
 *    Interest is calculated monthly on the opening balance at the start
 *    of each billing cycle. This is a simplified model; not all Indian
 *    issuers use monthly compounding. Daily compounding would require
 *    exact transaction dates unavailable in a general simulator.
 *
 * 3. REPAYMENT TIMING
 *    Payments are applied at the end of each billing cycle, after
 *    interest has been added to the opening balance.
 *
 * 4. MINIMUM PAYMENT FORMULA (ILLUSTRATIVE — not a universal issuer rule)
 *    Each cycle:
 *      pre_payment_amount = opening_balance + interest_this_cycle
 *      minimum_due = max(5% × pre_payment_amount, ₹200)
 *      actual_payment = min(minimum_due, pre_payment_amount)  [caps at balance]
 *    The 5% rate and ₹200 floor are illustrative. Actual issuer formulas vary.
 *
 * 5. EXCLUDED FROM SIMULATION
 *    • No additional purchases after the starting balance
 *    • No late-payment fees, over-limit fees, or annual fees
 *    • No GST or other applicable taxes on interest/fees
 *    • Constant APR throughout the repayment period
 *    • Payments assumed to be made on time every month
 *    • No balance transfers or cash advances
 *
 * 6. GRACE PERIOD (Strategy A)
 *    Shown only for a fresh-purchase scenario with no prior revolving balance.
 *    Condition: the full statement balance is paid by the payment due date.
 *    Result: zero interest; total repaid = original purchase amount.
 *    This is NOT applied automatically to an existing revolving balance.
 *
 * 7. SAFEGUARDS
 *    • Payments ≤ initial monthly interest are flagged as insufficient
 *      (balance cannot be reduced; shown as educational explanation)
 *    • Hard cap of 600 billing cycles (50 years) prevents infinite loops
 *    • Minimum payment simulation terminates when balance reaches ₹0
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type ScenarioType = 'fresh_purchase' | 'existing_balance';

export interface SimulatorInputs {
  /** Starting balance in INR (purchase amount or existing balance) */
  startingBalance: number;
  /** Annual Percentage Rate as a percentage (e.g. 42 for 42%) */
  aprPercent: number;
  /** Monthly fixed payment in INR (for Strategy B) */
  fixedMonthlyPayment: number;
  /** Whether this is a fresh purchase (enables Strategy A grace period) */
  scenarioType: ScenarioType;
}

export interface BillingCycle {
  month: number;
  openingBalance: number;
  interestCharged: number;
  paymentMade: number;
  closingBalance: number;
}

export interface StrategyResult {
  id: 'full' | 'fixed' | 'minimum';
  label: string;
  /** Total months to clear debt (0 for full/grace-period) */
  months: number;
  totalInterest: number;
  totalPaid: number;
  schedule: BillingCycle[];
  /** Error or warning state */
  status: 'ok' | 'insufficient_payment' | 'cap_reached' | 'grace_period' | 'zero_balance' | 'zero_interest';
  statusMessage?: string;
}

export interface SimulationResults {
  inputs: SimulatorInputs;
  monthlyRate: number;
  strategyFull: StrategyResult;
  strategyFixed: StrategyResult;
  strategyMinimum: StrategyResult;
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** Hard loop limit: 50 years of billing cycles */
const MAX_CYCLES = 600;

/** Illustrative minimum payment rate (5% of pre-payment amount) */
const MIN_PAYMENT_RATE = 0.05;

/** Illustrative minimum payment floor in INR */
const MIN_PAYMENT_FLOOR = 200;

/** Treat balances below this as fully repaid (floating-point tolerance) */
const ZERO_THRESHOLD = 0.005;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Round to 2 decimal places (paise precision) */
export function roundINR(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Format a number as Indian Rupees with ₹ prefix and Indian digit grouping */
export function formatINR(value: number): string {
  return value.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/** Format a number as INR with 2 decimal places */
export function formatINRPaise(value: number): string {
  return value.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Format months as a human-readable duration */
export function formatDuration(months: number): string {
  if (months === 0) return '1 billing cycle';
  if (months === 1) return '1 month';
  const years = Math.floor(months / 12);
  const rem = months % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} yr${years > 1 ? 's' : ''}`);
  if (rem > 0) parts.push(`${rem} mo`);
  return parts.join(' ');
}

// ─── Validation ──────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof SimulatorInputs, string>>;
}

export function validateInputs(inputs: SimulatorInputs): ValidationResult {
  const errors: Partial<Record<keyof SimulatorInputs, string>> = {};

  if (!Number.isFinite(inputs.startingBalance) || inputs.startingBalance < 0) {
    errors.startingBalance = 'Please enter a valid balance (₹0 or more).';
  } else if (inputs.startingBalance > 10_000_000) {
    errors.startingBalance = 'Please enter a balance up to ₹1,00,00,000.';
  }

  if (!Number.isFinite(inputs.aprPercent) || inputs.aprPercent < 0) {
    errors.aprPercent = 'Please enter a valid annual interest rate (0% or more).';
  } else if (inputs.aprPercent > 120) {
    errors.aprPercent = 'Please enter a rate up to 120%.';
  }

  if (!Number.isFinite(inputs.fixedMonthlyPayment) || inputs.fixedMonthlyPayment < 0) {
    errors.fixedMonthlyPayment = 'Please enter a valid monthly payment (₹0 or more).';
  } else if (inputs.fixedMonthlyPayment > 10_000_000) {
    errors.fixedMonthlyPayment = 'Please enter a payment amount up to ₹1,00,00,000.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// ─── Strategy A: Full Payment (Grace Period) ─────────────────────────────────

/**
 * Calculates result for paying the full statement balance by the due date.
 * For fresh purchases with no prior revolving balance, this results in ₹0
 * interest when applicable grace-period conditions are satisfied.
 * For existing revolving balances, interest has already accrued; this
 * scenario is not eligible for zero-interest treatment.
 */
export function calculateFullPayment(inputs: SimulatorInputs): StrategyResult {
  const { startingBalance, scenarioType } = inputs;

  // Zero balance: nothing to pay
  if (startingBalance <= ZERO_THRESHOLD) {
    return {
      id: 'full',
      label: 'Pay Statement Balance in Full',
      months: 0,
      totalInterest: 0,
      totalPaid: 0,
      schedule: [],
      status: 'zero_balance',
      statusMessage: 'No balance to repay.',
    };
  }

  if (scenarioType === 'fresh_purchase') {
    // Grace period applies: zero interest when paid in full by due date
    return {
      id: 'full',
      label: 'Pay Statement Balance in Full',
      months: 0,
      totalInterest: 0,
      totalPaid: roundINR(startingBalance),
      schedule: [
        {
          month: 1,
          openingBalance: startingBalance,
          interestCharged: 0,
          paymentMade: startingBalance,
          closingBalance: 0,
        },
      ],
      status: 'grace_period',
    };
  } else {
    // Existing revolving balance: one lump-sum payment, but interest has accrued
    const monthlyRate = inputs.aprPercent / 100 / 12;
    const interest = roundINR(startingBalance * monthlyRate);
    const totalDue = roundINR(startingBalance + interest);
    return {
      id: 'full',
      label: 'Pay Total Amount Due',
      months: 1,
      totalInterest: interest,
      totalPaid: totalDue,
      schedule: [
        {
          month: 1,
          openingBalance: startingBalance,
          interestCharged: interest,
          paymentMade: totalDue,
          closingBalance: 0,
        },
      ],
      status: 'ok',
    };
  }
}

// ─── Strategy B: Fixed Monthly Payment ───────────────────────────────────────

/**
 * Simulates repayment with a fixed monthly payment amount.
 *
 * Each cycle:
 *   interest = openingBalance × MPR
 *   prePay   = openingBalance + interest
 *   payment  = min(fixedAmount, prePay)   [caps final payment]
 *   closing  = prePay − payment
 */
export function calculateFixedPayment(inputs: SimulatorInputs): StrategyResult {
  const { startingBalance, aprPercent, fixedMonthlyPayment } = inputs;
  const monthlyRate = aprPercent / 100 / 12;

  // Zero balance
  if (startingBalance <= ZERO_THRESHOLD) {
    return {
      id: 'fixed',
      label: 'Pay Fixed Monthly Amount',
      months: 0,
      totalInterest: 0,
      totalPaid: 0,
      schedule: [],
      status: 'zero_balance',
    };
  }

  // Zero interest rate: simple division
  if (monthlyRate < 1e-10) {
    if (fixedMonthlyPayment <= ZERO_THRESHOLD) {
      return {
        id: 'fixed',
        label: 'Pay Fixed Monthly Amount',
        months: 0,
        totalInterest: 0,
        totalPaid: 0,
        schedule: [],
        status: 'insufficient_payment',
        statusMessage:
          'Your monthly payment is ₹0. Please enter a payment amount greater than zero to see how long it takes to clear this balance.',
      };
    }
    const months = Math.ceil(startingBalance / fixedMonthlyPayment);
    const schedule: BillingCycle[] = [];
    let balance = startingBalance;
    for (let m = 1; m <= months; m++) {
      const payment = roundINR(Math.min(fixedMonthlyPayment, balance));
      schedule.push({
        month: m,
        openingBalance: roundINR(balance),
        interestCharged: 0,
        paymentMade: payment,
        closingBalance: roundINR(Math.max(balance - payment, 0)),
      });
      balance = Math.max(balance - payment, 0);
    }
    return {
      id: 'fixed',
      label: 'Pay Fixed Monthly Amount',
      months,
      totalInterest: 0,
      totalPaid: roundINR(startingBalance),
      schedule,
      status: 'zero_interest',
    };
  }

  // Check if payment can reduce principal
  const initialInterest = roundINR(startingBalance * monthlyRate);
  if (fixedMonthlyPayment <= initialInterest) {
    return {
      id: 'fixed',
      label: 'Pay Fixed Monthly Amount',
      months: 0,
      totalInterest: 0,
      totalPaid: 0,
      schedule: [],
      status: 'insufficient_payment',
      statusMessage:
        `At ₹${fixedMonthlyPayment.toLocaleString('en-IN')} per month, your payment only covers part of the interest charge (₹${initialInterest.toLocaleString('en-IN')} in the first month). ` +
        `Your balance will not decrease — it will stay the same or grow. ` +
        `Try a higher monthly payment to start reducing what you owe.`,
    };
  }

  // Run the simulation
  const schedule: BillingCycle[] = [];
  let balance = startingBalance;
  let totalInterest = 0;
  let totalPaid = 0;

  for (let m = 1; m <= MAX_CYCLES; m++) {
    if (balance <= ZERO_THRESHOLD) break;

    const interest = roundINR(balance * monthlyRate);
    const prePay = roundINR(balance + interest);
    const payment = roundINR(Math.min(fixedMonthlyPayment, prePay));
    const closing = roundINR(Math.max(prePay - payment, 0));

    schedule.push({
      month: m,
      openingBalance: roundINR(balance),
      interestCharged: interest,
      paymentMade: payment,
      closingBalance: closing,
    });

    totalInterest = roundINR(totalInterest + interest);
    totalPaid = roundINR(totalPaid + payment);
    balance = closing;

    if (balance <= ZERO_THRESHOLD) break;

    // Safety: if somehow balance isn't decreasing (should not happen after guard above)
    if (m >= MAX_CYCLES) {
      return {
        id: 'fixed',
        label: 'Pay Fixed Monthly Amount',
        months: m,
        totalInterest,
        totalPaid,
        schedule,
        status: 'cap_reached',
        statusMessage: `Simulation capped at ${MAX_CYCLES} months (50 years). The balance may not fully clear within this period.`,
      };
    }
  }

  return {
    id: 'fixed',
    label: 'Pay Fixed Monthly Amount',
    months: schedule.length,
    totalInterest,
    totalPaid,
    schedule,
    status: 'ok',
  };
}

// ─── Strategy C: Minimum Payment (Declining) ─────────────────────────────────

/**
 * Simulates repayment using a declining minimum payment each cycle.
 *
 * Illustrative formula (not a universal Indian issuer rule):
 *   interest      = openingBalance × MPR
 *   prePay        = openingBalance + interest
 *   minimumDue    = max(5% × prePay, ₹200)
 *   actualPayment = min(minimumDue, prePay)  [caps at amount owed]
 *   closing       = prePay − actualPayment
 *
 * Termination safeguards:
 *   • Stops when closing balance ≤ ₹0.005
 *   • Hard cap at 600 cycles (50 years)
 *   • Safety check if balance is not decreasing after 10 cycles
 */
export function calculateMinimumPayment(inputs: SimulatorInputs): StrategyResult {
  const { startingBalance, aprPercent } = inputs;
  const monthlyRate = aprPercent / 100 / 12;

  // Zero balance
  if (startingBalance <= ZERO_THRESHOLD) {
    return {
      id: 'minimum',
      label: 'Pay Minimum Amount Due',
      months: 0,
      totalInterest: 0,
      totalPaid: 0,
      schedule: [],
      status: 'zero_balance',
    };
  }

  // Zero interest rate: minimum payment at floor (₹200 or 5% whichever higher)
  if (monthlyRate < 1e-10) {
    const schedule: BillingCycle[] = [];
    let balance = startingBalance;
    let totalPaid = 0;
    for (let m = 1; m <= MAX_CYCLES; m++) {
      if (balance <= ZERO_THRESHOLD) break;
      const minDue = Math.max(MIN_PAYMENT_RATE * balance, MIN_PAYMENT_FLOOR);
      const payment = roundINR(Math.min(minDue, balance));
      const closing = roundINR(Math.max(balance - payment, 0));
      schedule.push({ month: m, openingBalance: roundINR(balance), interestCharged: 0, paymentMade: payment, closingBalance: closing });
      totalPaid = roundINR(totalPaid + payment);
      balance = closing;
    }
    return {
      id: 'minimum',
      label: 'Pay Minimum Amount Due',
      months: schedule.length,
      totalInterest: 0,
      totalPaid: roundINR(totalPaid),
      schedule,
      status: 'zero_interest',
    };
  }

  const schedule: BillingCycle[] = [];
  let balance = startingBalance;
  let totalInterest = 0;
  let totalPaid = 0;
  let prevBalance = balance;
  let stuckCount = 0;

  for (let m = 1; m <= MAX_CYCLES; m++) {
    if (balance <= ZERO_THRESHOLD) break;

    const interest = roundINR(balance * monthlyRate);
    const prePay = roundINR(balance + interest);
    const minDue = Math.max(MIN_PAYMENT_RATE * prePay, MIN_PAYMENT_FLOOR);
    const payment = roundINR(Math.min(minDue, prePay));
    const closing = roundINR(Math.max(prePay - payment, 0));

    schedule.push({
      month: m,
      openingBalance: roundINR(balance),
      interestCharged: interest,
      paymentMade: payment,
      closingBalance: closing,
    });

    totalInterest = roundINR(totalInterest + interest);
    totalPaid = roundINR(totalPaid + payment);
    balance = closing;

    // Stuck detection: if balance barely moves after 10 cycles, cap it
    if (m % 10 === 0) {
      if (Math.abs(balance - prevBalance) < 0.01) {
        stuckCount++;
        if (stuckCount >= 3) {
          return {
            id: 'minimum',
            label: 'Pay Minimum Amount Due',
            months: m,
            totalInterest,
            totalPaid,
            schedule,
            status: 'cap_reached',
            statusMessage: `Balance is not meaningfully decreasing. Simulation stopped at ${m} months.`,
          };
        }
      } else {
        stuckCount = 0;
      }
      prevBalance = balance;
    }

    if (balance <= ZERO_THRESHOLD) break;
  }

  if (balance > ZERO_THRESHOLD) {
    return {
      id: 'minimum',
      label: 'Pay Minimum Amount Due',
      months: schedule.length,
      totalInterest,
      totalPaid,
      schedule,
      status: 'cap_reached',
      statusMessage: `Simulation capped at ${MAX_CYCLES} months (50 years). Balance of ${formatINR(balance)} remains unpaid.`,
    };
  }

  return {
    id: 'minimum',
    label: 'Pay Minimum Amount Due',
    months: schedule.length,
    totalInterest,
    totalPaid,
    schedule,
    status: 'ok',
  };
}

// ─── Main Simulation Entry Point ─────────────────────────────────────────────

export function runSimulation(inputs: SimulatorInputs): SimulationResults {
  const monthlyRate = inputs.aprPercent / 100 / 12;

  return {
    inputs,
    monthlyRate,
    strategyFull: calculateFullPayment(inputs),
    strategyFixed: calculateFixedPayment(inputs),
    strategyMinimum: calculateMinimumPayment(inputs),
  };
}
