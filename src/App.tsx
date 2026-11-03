import { useState, useMemo } from 'react';
import { CreditCard } from 'lucide-react';
import { InputPanel } from './components/InputPanel';
import { ComparisonCards } from './components/ComparisonCards';
import { RepaymentChart } from './components/RepaymentChart';
import { EducationPanel } from './components/EducationPanel';
import { AssumptionsPanel } from './components/AssumptionsPanel';
import { CardVisualization } from './components/CardVisualization';
import { formatDuration, formatINR, runSimulation, validateInputs } from './lib/calculator';
import type { SimulatorInputs, SimulationResults, ValidationResult } from './lib/calculator';

const DEFAULT_INPUTS: SimulatorInputs = {
  startingBalance: 50000,
  aprPercent: 42,
  fixedMonthlyPayment: 3000,
  scenarioType: 'fresh_purchase',
};

export default function App() {
  const [inputs, setInputs] = useState<SimulatorInputs>(DEFAULT_INPUTS);

  const validation: ValidationResult = useMemo(
    () => validateInputs(inputs),
    [inputs]
  );

  const results: SimulationResults | null = useMemo(() => {
    if (!validation.valid) return null;
    return runSimulation(inputs);
  }, [inputs, validation.valid]);
  const minimum = results?.strategyMinimum;
  const minimumIsComplete = minimum?.status === 'ok' ||
    minimum?.status === 'zero_interest' ||
    minimum?.status === 'zero_balance' ||
    minimum?.status === 'grace_period';
  const interestHeadline = minimum
    ? formatINR(Math.round(minimum.totalInterest))
    : '—';

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-slate-900">
      <header className="app-header sticky top-0 z-20 border-b border-slate-200/80 bg-[#FAFAF8]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
          <a href="#top" className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand-700 text-white">
              <CreditCard size={18} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold leading-tight text-slate-900">
                Signal / Credit
              </span>
              <span className="hidden text-[11px] leading-tight text-slate-600 sm:block">
                Decision simulator
              </span>
            </span>
          </a>
          <nav aria-label="Page sections" className="flex items-center gap-1 sm:gap-3">
            <a className="app-nav-link" href="#comparison">Compare</a>
            <a className="app-nav-link" href="#simulator">Adjust</a>
            <a className="app-nav-link hidden sm:inline-flex" href="#learn">Learn</a>
          </nav>
          <span className="hidden items-center gap-2 text-xs font-medium text-slate-700 lg:inline-flex">
            <span className="h-2 w-2 rounded-full bg-brand-600" aria-hidden="true" />
            Educational estimate
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main id="top" className="mx-auto max-w-[1440px] space-y-7 px-4 pb-14 pt-5 sm:space-y-10 sm:px-6 sm:pt-8 lg:px-10">
        <section className="signal-hero overflow-hidden rounded-[1.75rem] bg-[#171B19] text-white" aria-labelledby="hero-heading">
          <div className="grid items-center gap-8 px-5 py-7 sm:px-8 sm:py-9 lg:grid-cols-[1.1fr_0.8fr_0.9fr] lg:gap-10 lg:px-12 lg:py-12">
            <div className="max-w-2xl">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#A7C9B8]">
                Credit cost / live estimate
              </p>
              <h1 id="hero-heading" className="max-w-xl text-3xl font-semibold leading-[1.08] tracking-tight sm:text-4xl lg:text-[3.4rem]">
                The cost of carrying a balance.
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-[#D1D8D3] sm:text-base">
                See what interest can add to this balance, and how a different payment strategy changes the outcome.
              </p>
              <a href="#simulator" className="hero-action mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#DDEDE6] px-5 text-sm font-semibold text-[#104A39] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#171B19]">
                Adjust your estimate <span aria-hidden="true">↓</span>
              </a>
            </div>

            <div className="hero-insight border-y border-white/15 py-5 lg:border-y-0 lg:border-l lg:py-2 lg:pl-8">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#D1D8D3]">
                {minimum?.status === 'cap_reached' ? 'Interest accrued so far' : 'Interest in minimum-payment scenario'}
              </p>
              <p className="mt-2 font-mono text-5xl font-medium leading-none tracking-[-0.06em] tabular-nums text-[#F2B09E] sm:text-6xl lg:text-7xl">
                {interestHeadline}
              </p>
              <p className="mt-3 max-w-xs text-xs leading-relaxed text-[#B9C2BC]">
                {minimum?.status === 'cap_reached'
                  ? 'The estimate reached its simulation limit; this is not a final payoff cost.'
                  : 'Illustrative interest only. Actual issuer terms and fees may differ.'}
              </p>
              {minimum && minimum.status !== 'insufficient_payment' && (
                <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/15 pt-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-[#B9C2BC]">
                      {minimumIsComplete ? 'Total repayment' : 'Paid so far'}
                    </p>
                    <p className="mt-1 font-mono text-base font-semibold tabular-nums text-white">
                      {formatINR(Math.round(minimum.totalPaid))}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-[#B9C2BC]">
                      {minimumIsComplete ? 'Payoff time' : 'Payoff status'}
                    </p>
                    <p className="mt-1 font-mono text-base font-semibold tabular-nums text-white">
                      {minimum.status === 'zero_balance'
                        ? 'Already clear'
                        : minimumIsComplete
                          ? formatDuration(minimum.months)
                          : 'Not cleared'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="hero-card-wrap mx-auto w-full max-w-[23rem] lg:ml-auto">
              <CardVisualization />
            </div>
          </div>
          <div className="flex flex-col gap-1 border-t border-white/10 bg-black/10 px-5 py-3 text-xs leading-relaxed text-[#D1D8D3] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
            <p>Educational estimates only · Not personalised financial advice</p>
            <p>Monthly-interest model · Fees, taxes and grace-period rules vary by issuer</p>
          </div>
        </section>

        <div id="comparison" className="scroll-mt-24">
        {results ? (
          <ComparisonCards results={results} />
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center sm:p-8">
            <h3 className="text-lg font-semibold text-slate-800 mb-1">
              Fix the highlighted inputs to see your results
            </h3>
            <p className="text-slate-600 text-sm">
              Results will update automatically as you adjust the values.
            </p>
          </div>
        )}
        </div>

        <section id="simulator" className="scroll-mt-24" aria-labelledby="simulator-heading">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Make it yours / 01</p>
              <h2 id="simulator-heading" className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Tune your scenario
              </h2>
            </div>
            <p className="max-w-sm text-sm text-slate-600">Change the amount, APR, or monthly payment. Results recalculate instantly.</p>
          </div>

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(300px,0.82fr)_minmax(0,1.4fr)] xl:gap-8">
            <div>
            <InputPanel
              inputs={inputs}
              validation={validation}
              onChange={setInputs}
            />
            </div>

            <div id="learn" className="space-y-6 scroll-mt-24">
            {results ? (
              <>
                <RepaymentChart results={results} />
                <EducationPanel results={results} />
              </>
            ) : null}
            <AssumptionsPanel />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-[#F2F1EE]">
        <div className="mx-auto max-w-[1440px] space-y-1 px-4 py-6 text-center text-xs text-slate-600 sm:px-6 lg:px-10">
          <p>
            Credit Card Decision Simulator · Built for financial education · Target audience: first-time credit card users in India
          </p>
          <p>
            Results are estimates based on a simplified educational model. Actual issuer terms, fees, taxes, and conditions vary.
            Not affiliated with any bank or financial institution.
          </p>
        </div>
      </footer>
    </div>
  );
}
