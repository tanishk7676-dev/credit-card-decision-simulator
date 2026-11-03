import { useEffect, useState } from 'react';
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

interface CurrencyInputProps {
  id: string;
  value: number;
  onChange: (value: number) => void;
  placeholder: string;
  describedBy: string;
  invalid: boolean;
  className?: string;
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.trim().replace(/[₹,\s]/g, '');
  if (!cleaned || cleaned === '.') return 0;
  if (!/^\d*\.?\d*$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

function formatAmount(value: number): string {
  if (!Number.isFinite(value) || value === 0) return '';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value);
}

function CurrencyInput({
  id,
  value,
  onChange,
  placeholder,
  describedBy,
  invalid,
  className = '',
}: CurrencyInputProps) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(() => formatAmount(value));
  const [formatError, setFormatError] = useState(false);

  useEffect(() => {
    if (!focused && !formatError) setDraft(formatAmount(value));
  }, [focused, formatError, value]);

  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-slate-600"
      >
        ₹
      </span>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        value={draft}
        onFocus={() => {
          setFocused(true);
          setDraft(value === 0 ? '' : String(value));
        }}
        onChange={event => {
          const nextDraft = event.target.value;
          setDraft(nextDraft);
          const parsed = parseAmount(nextDraft);
          setFormatError(parsed === null);
          if (parsed !== null) onChange(parsed);
        }}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        aria-describedby={`${describedBy}${formatError ? ` ${id}-format-error` : ''}`}
        aria-invalid={invalid || formatError}
        className={`input-field pl-9 ${className} ${invalid || formatError ? 'error' : ''}`}
      />
      {formatError && (
        <p id={`${id}-format-error`} className="mt-1.5 text-sm text-danger-700" role="alert">
          Enter a valid amount, for example ₹50,000.
        </p>
      )}
    </div>
  );
}

export function InputPanel({ inputs, validation, onChange }: Props) {
  const [showTip, setShowTip] = useState(false);

  function update(partial: Partial<SimulatorInputs>) {
    onChange({ ...inputs, ...partial });
  }

  const sliderMax = Math.min(
    10_000_000,
    Math.max(
      10_000,
      Math.ceil(Math.max(inputs.startingBalance, inputs.fixedMonthlyPayment) / 1000) * 1000
    )
  );

  return (
    <section className="control-panel space-y-6" aria-labelledby="input-panel-heading">
      <div>
        <p className="section-index">Scenario settings</p>
        <h2 id="input-panel-heading" className="mt-1 text-lg font-bold text-slate-900">
          Start with your balance
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Adjust these details to compare repayment outcomes.
        </p>
      </div>

      <fieldset>
        <legend className="label">What would you like to simulate?</legend>
        <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
          <button
            type="button"
            aria-pressed={inputs.scenarioType === 'fresh_purchase'}
            onClick={() => update({ scenarioType: 'fresh_purchase' })}
            className={`pill-tab min-h-11 border text-center ${
              inputs.scenarioType === 'fresh_purchase'
                ? 'active border-brand-600'
                : 'inactive border-slate-200'
            }`}
          >
            <span aria-hidden="true">🛒</span>
            <span className="ml-1.5">A new purchase</span>
          </button>
          <button
            type="button"
            aria-pressed={inputs.scenarioType === 'existing_balance'}
            onClick={() => update({ scenarioType: 'existing_balance' })}
            className={`pill-tab min-h-11 border text-center ${
              inputs.scenarioType === 'existing_balance'
                ? 'active border-brand-600'
                : 'inactive border-slate-200'
            }`}
          >
            <span aria-hidden="true">💳</span>
            <span className="ml-1.5">Existing balance</span>
          </button>
        </div>
      </fieldset>

      {inputs.scenarioType === 'fresh_purchase' && (
        <fieldset>
          <legend className="label">Quick-pick a purchase</legend>
          <p id="quick-picks-hint" className="mb-2 text-xs text-slate-600">
            Choose an example to fill in the purchase amount.
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PURCHASES.map(example => {
              const selected = inputs.startingBalance === example.amount;
              return (
                <button
                  key={example.label}
                  type="button"
                  aria-pressed={selected}
                  aria-describedby="quick-picks-hint"
                  aria-label={`Set purchase amount to ₹${example.amount.toLocaleString('en-IN')} for ${example.label}`}
                  onClick={() => update({ startingBalance: example.amount })}
                  className={`min-h-11 rounded-lg border px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 ${
                    selected
                      ? 'border-brand-700 bg-brand-700 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-brand-400 hover:text-brand-800'
                  }`}
                >
                  {example.label} · ₹{example.amount.toLocaleString('en-IN')}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div>
        <label htmlFor="starting-balance" className="label">
          {inputs.scenarioType === 'fresh_purchase' ? 'Purchase amount' : 'Current outstanding balance'}
        </label>
        <CurrencyInput
          id="starting-balance"
          value={inputs.startingBalance}
          onChange={startingBalance => update({ startingBalance })}
          placeholder="e.g. 50,000"
          describedBy={[
            'starting-balance-hint',
            validation.errors.startingBalance ? 'starting-balance-error' : '',
          ].filter(Boolean).join(' ')}
          invalid={Boolean(validation.errors.startingBalance)}
        />
        {validation.errors.startingBalance ? (
          <p id="starting-balance-error" className="mt-1.5 text-sm text-danger-700" role="alert">
            {validation.errors.startingBalance}
          </p>
        ) : null}
        <p id="starting-balance-hint" className="mt-1.5 text-xs text-slate-600">
          {inputs.scenarioType === 'fresh_purchase'
            ? 'Enter an amount up to ₹1,00,00,000. You can type or paste ₹50,000.'
            : 'Enter the balance shown on your latest statement, up to ₹1,00,00,000.'}
        </p>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <label htmlFor="apr-percent" className="label mb-0">
            Annual interest rate (APR)
          </label>
          <button
            type="button"
            onClick={() => setShowTip(open => !open)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-600 transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            aria-label="What is APR?"
            aria-expanded={showTip}
            aria-controls="apr-tip"
          >
            <Info size={18} aria-hidden="true" />
          </button>
        </div>
        {showTip && (
          <div id="apr-tip" className="info-box mb-2">
            <strong>APR (Annual Percentage Rate)</strong> is the yearly interest rate your card
            charges on unpaid balances. Indian credit cards typically range from 30–48% per year.
            This example uses a <em>hypothetical illustrative rate</em> — check your card's terms
            for your actual rate.
          </div>
        )}
        <div className="relative">
          <input
            id="apr-percent"
            type="number"
            inputMode="decimal"
            min={0}
            max={120}
            step={0.1}
            value={inputs.aprPercent || ''}
            onChange={event => update({ aprPercent: parseFloat(event.target.value) || 0 })}
            placeholder="e.g. 42"
            aria-describedby={[
              'apr-hint',
              validation.errors.aprPercent ? 'apr-error' : '',
            ].filter(Boolean).join(' ')}
            aria-invalid={Boolean(validation.errors.aprPercent)}
            className={`input-field pr-10 ${validation.errors.aprPercent ? 'error' : ''}`}
          />
          <span aria-hidden="true" className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-600">%</span>
        </div>
        {validation.errors.aprPercent ? (
          <p id="apr-error" className="mt-1.5 text-sm text-danger-700" role="alert">
            {validation.errors.aprPercent}
          </p>
        ) : null}
        <p id="apr-hint" className="mt-1.5 text-xs text-slate-600">
          Illustrative rate only. Check your card agreement for your actual APR (0–120%).
        </p>
      </div>

      <div>
        <label htmlFor="fixed-monthly-payment" className="label">
          Fixed monthly payment (Strategy B)
        </label>
        <CurrencyInput
          id="fixed-monthly-payment"
          value={inputs.fixedMonthlyPayment}
          onChange={fixedMonthlyPayment => update({ fixedMonthlyPayment })}
          placeholder="e.g. 3,000"
          describedBy={[
            'fixed-monthly-payment-hint',
            validation.errors.fixedMonthlyPayment ? 'fixed-monthly-payment-error' : '',
          ].filter(Boolean).join(' ')}
          invalid={Boolean(validation.errors.fixedMonthlyPayment)}
        />
        {validation.errors.fixedMonthlyPayment ? (
          <p id="fixed-monthly-payment-error" className="mt-1.5 text-sm text-danger-700" role="alert">
            {validation.errors.fixedMonthlyPayment}
          </p>
        ) : null}
        <p id="fixed-monthly-payment-hint" className="mt-1.5 text-xs text-slate-600">
          Used for the fixed-payment strategy. Minimum payments are calculated automatically.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="fixed-payment-slider" className="text-sm font-semibold text-slate-700">
            Try a different monthly payment
          </label>
          <output htmlFor="fixed-payment-slider" className="font-mono text-sm font-semibold tabular-nums text-slate-900">
            ₹{inputs.fixedMonthlyPayment.toLocaleString('en-IN')}
          </output>
        </div>
        <input
          id="fixed-payment-slider"
          type="range"
          min={0}
          max={sliderMax}
          step={100}
          value={Math.min(inputs.fixedMonthlyPayment, sliderMax)}
          onChange={event => update({ fixedMonthlyPayment: Number(event.target.value) })}
          aria-valuetext={`₹${inputs.fixedMonthlyPayment.toLocaleString('en-IN')} per month`}
          aria-describedby="payment-slider-hint"
          className="range-input w-full"
        />
        <div className="flex justify-between font-mono text-xs tabular-nums text-slate-600">
          <span>₹0</span>
          <span>₹{sliderMax.toLocaleString('en-IN')}</span>
        </div>
        <p id="payment-slider-hint" className="text-xs text-slate-600">
          Drag to see how changing your payment updates the repayment comparison.
        </p>
      </div>

      <div className="rounded-xl bg-slate-100 p-4 text-xs text-slate-700 space-y-2">
        <div className="flex justify-between gap-3">
          <span>Monthly interest rate</span>
          <span className="font-mono font-semibold tabular-nums">{(inputs.aprPercent / 12).toFixed(4)}%</span>
        </div>
        <div className="flex justify-between gap-3">
          <span>First month interest</span>
          <span className="font-mono font-semibold tabular-nums">
            ₹{Math.round(inputs.startingBalance * inputs.aprPercent / 1200).toLocaleString('en-IN')}
          </span>
        </div>
        <p className="border-t border-slate-300 pt-2 text-slate-600">
          Monthly rate = APR ÷ 12. This is an educational simplification.
        </p>
      </div>

      <HowToRead />
    </section>
  );
}

function HowToRead() {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        aria-expanded={open}
        aria-controls="how-to-read-content"
        className="flex min-h-11 w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600"
      >
        <span>💡 How to read this simulator</span>
        {open ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
      </button>
      {open && (
        <div id="how-to-read-content" className="space-y-2 border-t border-slate-200 px-4 pb-4 pt-3 text-xs text-slate-700">
          <p><strong>Step 1 —</strong> Choose a new purchase or an existing balance.</p>
          <p><strong>Step 2 —</strong> Enter the amount, APR, and a fixed monthly payment.</p>
          <p><strong>Step 3 —</strong> Compare the three repayment strategy cards above.</p>
          <p><strong>Step 4 —</strong> Read the chart and explanations to understand why the numbers differ.</p>
          <p className="pt-1 text-slate-600">All results update automatically when you change any input.</p>
        </div>
      )}
    </div>
  );
}
