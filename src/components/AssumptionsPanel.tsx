import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function AssumptionsPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-base">🔢</span>
          <div className="text-left">
            <p className="text-sm font-bold text-slate-800">Simulation Assumptions & Limitations</p>
            <p className="text-xs text-slate-500">Important disclosures — click to expand</p>
          </div>
        </div>
        {open ? <ChevronUp size={16} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 py-5 space-y-4 text-sm text-slate-700">
          {/* What IS modelled */}
          <div>
            <p className="font-semibold text-slate-900 mb-2">What this simulation models</p>
            <ul className="space-y-1.5 text-xs text-slate-600">
              {[
                'Monthly compounding: Monthly Periodic Rate (MPR) = APR ÷ 12',
                'Interest accrues on the opening balance at the start of each billing cycle',
                'Payment is applied to the balance at the end of each billing cycle',
                'Minimum payment (Strategy C): max(5% × pre-payment amount, ₹200) — illustrative only',
                'Fixed payment (Strategy B): constant monthly amount until balance reaches zero',
                'Grace period (Strategy A): applicable only to fresh purchases with no prior revolving balance, when full statement balance is paid by due date',
                'Final payment in each strategy is capped at the exact remaining balance owed',
              ].map(item => (
                <li key={item} className="flex gap-2">
                  <span className="text-brand-500 flex-shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* What is NOT modelled */}
          <div>
            <p className="font-semibold text-slate-900 mb-2">What is excluded from this simulation</p>
            <ul className="space-y-1.5 text-xs text-slate-600">
              {[
                'No additional purchases after the starting balance',
                'No late-payment fees or penalty charges',
                'No over-limit fees or annual card fees',
                'No applicable taxes (e.g., GST on interest and fees) — these would increase your actual costs',
                'No changes to the interest rate during the repayment period',
                'Assumes payments are made on time every month',
                'No balance transfers or cash advances',
                'No introductory 0% APR offers',
              ].map(item => (
                <li key={item} className="flex gap-2">
                  <span className="text-warning-500 flex-shrink-0">✕</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Important notices */}
          <div className="disclosure-box">
            <p className="font-semibold mb-1.5">Important notices</p>
            <ul className="space-y-1.5 text-xs">
              {[
                'Monthly compounding is an educational simplification. Actual issuers may compound interest daily or use different methods.',
                'The minimum payment formula (max 5%, ₹200 floor) is illustrative. There is no single universal minimum payment rule for Indian credit cards. Your issuer defines its own formula.',
                'Grace period eligibility, conditions, and duration vary by card issuer. Read your card agreement (MITC) carefully.',
                'All results are estimates. Actual repayment amounts, interest, and timelines may differ based on your specific card terms.',
                'This tool is for financial education only. It does not constitute personalized financial advice.',
              ].map(item => (
                <li key={item} className="flex gap-2">
                  <span className="flex-shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Calculation model reference */}
          <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500 space-y-1 font-mono">
            <p className="font-sans font-semibold text-slate-600 mb-1.5">Calculation model (each cycle)</p>
            <p>interest = opening_balance × (APR ÷ 12 ÷ 100)</p>
            <p>pre_pay  = opening_balance + interest</p>
            <p className="text-slate-400">[Strategy B] payment = min(fixed_amount, pre_pay)</p>
            <p className="text-slate-400">[Strategy C] min_due = max(5% × pre_pay, ₹200)</p>
            <p className="text-slate-400">[Strategy C] payment = min(min_due, pre_pay)</p>
            <p>closing  = pre_pay − payment</p>
          </div>
        </div>
      )}
    </div>
  );
}
