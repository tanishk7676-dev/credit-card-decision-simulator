import { useState } from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

const EXAMPLE_PURCHASES = [
  { label: 'Smartphone', amount: 18000 },
  { label: 'Laptop', amount: 55000 },
  { label: 'Headphones', amount: 8000 },
  { label: 'Tablet', amount: 35000 },
  { label: 'Appliance', amount: 25000 },
];

import type { SimulatorInputs, ValidationResult } from '../lib/calculator';

interface Props {
  inputs: SimulatorInputs;
  validation: ValidationResult;
  onChange: (inputs: SimulatorInputs) => void;
}

export function InputPanel({ inputs, validation, onChange }: Props) {
  const [showTip, setShowTip] = useState(false);

  function update(partial: Partial<SimulatorInputs>) {
    onChange({ ...inputs, ...partial });
  }

  function parseAmount(raw: string): number {
    const cleaned = raw.replace(/[^0-9.]/g, '');
    const val = parseFloat(cleaned);
    return Number.isFinite(val) ? val : 0;
  }

  return (
    <div className="card p-6 space-y-5">
      {/* Scenario Toggle */}
      <div>
        <label className="label">What would you like to simulate?</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => update({ scenarioType: 'fresh_purchase' })}
            className={`pill-tab py-2.5 text-center border transition-all ${
              inputs.scenarioType === 'fresh_purchase'
                ? 'active border-brand-600'
                : 'inactive border-slate-200'
            }`}
          >
            <span className="text-sm">🛒</span>
            <span className="ml-1.5">A new purchase</span>
          </button>
          <button
            type="button"
            onClick={() => update({ scenarioType: 'existing_balance' })}
            className={`pill-tab py-2.5 text-center border transition-all ${
              inputs.scenarioType === 'existing_balance'
                ? 'active border-brand-600'
                : 'inactive border-slate-200'
            }`}
          >
            <span className="text-sm">💳</span>
            <span className="ml-1.5">Existing balance</span>
          </button>
        </div>
      </div>

      {/* Quick-pick examples (only for new purchase) */}
      {inputs.scenarioType === 'fresh_purchase' && (
        <div>
          <label className="label">Quick examples</label>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PURCHASES.map(ex => (
              <button
                key={ex.label}
                type="button"
                onClick={() => update({ startingBalance: ex.amount })}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                  inputs.startingBalance === ex.amount
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:text-brand-700'
                }`}
              >
                {ex.label} · ₹{ex.amount.toLocaleString('en-IN')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Balance / Purchase Amount */}
      <div>
        <label className="label">
          {inputs.scenarioType === 'fresh_purchase' ? 'Purchase amount (₹)' : 'Current outstanding balance (₹)'}
        </label>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={10000000}
          value={inputs.startingBalance || ''}
          onChange={e => update({ startingBalance: parseAmount(e.target.value) })}
          placeholder="e.g. 50,000"
          className={`input-field ${validation.errors.startingBalance ? 'error' : ''}`}
        />
        {validation.errors.startingBalance && (
          <p className="mt-1.5 text-xs text-danger-600">{validation.errors.startingBalance}</p>
        )}
        {inputs.scenarioType === 'existing_balance' && (
          <p className="mt-1.5 text-xs text-slate-500">
            Enter the balance shown on your latest credit card statement.
          </p>
        )}
      </div>

      {/* APR */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="label mb-0">Annual interest rate — APR (%)</label>
          <button
            type="button"
            onClick={() => setShowTip(v => !v)}
            className="text-slate-400 hover:text-brand-600 transition-colors"
            aria-label="What is APR?"
          >
            <Info size={15} />
          </button>
        </div>
        {showTip && (
          <div className="info-box mb-2">
            <strong>APR (Annual Percentage Rate)</strong> is the yearly interest rate your card
            charges on unpaid balances. Indian credit cards typically range from 30–48% per year.
            This example uses a <em>hypothetical illustrative rate</em> — check your card's terms
            for your actual rate.
          </div>
        )}
        <div className="relative">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            max={120}
            step={0.1}
            value={inputs.aprPercent || ''}
            onChange={e => update({ aprPercent: parseFloat(e.target.value) || 0 })}
            placeholder="e.g. 42"
            className={`input-field pr-10 ${validation.errors.aprPercent ? 'error' : ''}`}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">%</span>
        </div>
        {validation.errors.aprPercent && (
          <p className="mt-1.5 text-xs text-danger-600">{validation.errors.aprPercent}</p>
        )}
        <p className="mt-1.5 text-xs text-slate-500">
          Hypothetical example rate · Your actual rate may differ · Check your card agreement
        </p>
      </div>

      {/* Fixed Monthly Payment */}
      <div>
        <label className="label">Fixed monthly payment (₹)</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">₹</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={inputs.fixedMonthlyPayment || ''}
            onChange={e => update({ fixedMonthlyPayment: parseAmount(e.target.value) })}
            placeholder="e.g. 3,000"
            className={`input-field pl-9 ${validation.errors.fixedMonthlyPayment ? 'error' : ''}`}
          />
        </div>
        {validation.errors.fixedMonthlyPayment && (
          <p className="mt-1.5 text-xs text-danger-600">{validation.errors.fixedMonthlyPayment}</p>
        )}
        <p className="mt-1.5 text-xs text-slate-500">
          Used for "Pay Fixed Monthly Amount" strategy only.
          Minimum Amount Due is calculated automatically.
        </p>
      </div>

      {/* Rate summary */}
      <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 space-y-1">
        <div className="flex justify-between">
          <span>Monthly interest rate</span>
          <span className="font-mono font-semibold">{(inputs.aprPercent / 12).toFixed(4)}%</span>
        </div>
        <div className="flex justify-between">
          <span>First month interest on this balance</span>
          <span className="font-mono font-semibold">
            ₹{Math.round(inputs.startingBalance * inputs.aprPercent / 1200).toLocaleString('en-IN')}
          </span>
        </div>
        <p className="text-slate-400 pt-1 border-t border-slate-200">
          Monthly rate = APR ÷ 12. This is an educational simplification.
        </p>
      </div>

      {/* Collapsible: How to read this */}
      <HowToRead />
    </div>
  );
}

function HowToRead() {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <span>💡 How to read this simulator</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && (
        <div className="px-4 pb-4 text-xs text-slate-600 space-y-2 border-t border-slate-100 pt-3">
          <p><strong>Step 1 —</strong> Choose a new purchase or an existing balance.</p>
          <p><strong>Step 2 —</strong> Enter the amount, APR, and a fixed monthly payment.</p>
          <p><strong>Step 3 —</strong> Compare the three repayment strategy cards below.</p>
          <p><strong>Step 4 —</strong> Read the chart and explanations to understand why the numbers differ.</p>
          <p className="text-slate-400 pt-1">All results update automatically when you change any input.</p>
        </div>
      )}
    </div>
  );
}
