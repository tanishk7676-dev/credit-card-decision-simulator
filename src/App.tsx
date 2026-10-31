import { useState, useMemo } from 'react';
import { CreditCard } from 'lucide-react';
import { InputPanel } from './components/InputPanel';
import { ComparisonCards } from './components/ComparisonCards';
import { RepaymentChart } from './components/RepaymentChart';
import { EducationPanel } from './components/EducationPanel';
import { AssumptionsPanel } from './components/AssumptionsPanel';
import { runSimulation, validateInputs } from './lib/calculator';
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-600 text-white flex-shrink-0">
            <CreditCard size={18} />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              Credit Card Decision Simulator
            </h1>
            <p className="text-xs text-slate-500 leading-tight hidden sm:block">
              For financial education · Not financial advice · Results are estimates
            </p>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="badge bg-brand-100 text-brand-700 mb-4">
            Free Educational Tool · No Personal Data Required
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 leading-tight">
            How much does your credit card
            <span className="text-brand-600"> really </span>cost?
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Compare three repayment strategies and see how your choices affect the
            total cost, interest paid, and time to clear your balance.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 space-y-6">
        {/* Disclaimer — prominent, not footer-only */}
        <div className="disclosure-box flex gap-3">
          <span className="text-lg flex-shrink-0">⚠️</span>
          <div>
            <span className="font-semibold">Educational Estimates Only. </span>
            This simulator uses a simplified monthly-interest model for learning purposes.
            Actual credit card interest, minimum payments, fees, applicable taxes, and
            grace-period eligibility depend on your card issuer's specific terms and your
            individual circumstances. This tool does not provide personalised financial advice.
          </div>
        </div>

        {/* Two-column layout: Inputs + Results */}
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
          {/* Left: Input Panel */}
          <div className="lg:sticky lg:top-20">
            <InputPanel
              inputs={inputs}
              validation={validation}
              onChange={setInputs}
            />
          </div>

          {/* Right: Results */}
          <div className="space-y-6">
            {results ? (
              <>
                <ComparisonCards results={results} />
                <RepaymentChart results={results} />
                <EducationPanel results={results} />
              </>
            ) : (
              <div className="card p-8 text-center">
                <div className="text-4xl mb-3">📊</div>
                <h3 className="text-lg font-semibold text-slate-700 mb-1">
                  Fix the highlighted inputs to see your results
                </h3>
                <p className="text-slate-500 text-sm">
                  Results will update automatically as you adjust the values.
                </p>
              </div>
            )}

            <AssumptionsPanel />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-slate-400 space-y-1">
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
