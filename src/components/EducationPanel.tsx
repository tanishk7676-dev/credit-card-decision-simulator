import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { SimulationResults } from '../lib/calculator';
import { formatINR } from '../lib/calculator';

interface Props {
  results: SimulationResults;
}

interface Section {
  id: string;
  title: string;
  icon: string;
  content: (results: SimulationResults) => React.ReactNode;
}

export function EducationPanel({ results }: Props) {
  const [openSection, setOpenSection] = useState<string>('interest');

  const sections: Section[] = [
    {
      id: 'interest',
      title: 'What is credit card interest?',
      icon: '💰',
      content: ({ inputs, monthlyRate, strategyFixed }) => (
        <div className="space-y-3 text-sm text-slate-700">
          <p>
            When you use a credit card, you are borrowing money from your card issuer.
            If you do not pay back the full amount by the due date, the issuer charges
            you <strong>interest</strong> — a fee for borrowing.
          </p>
          <p>
            In this simulation, your card charges a hypothetical annual interest rate
            of <strong>{inputs.aprPercent}% per year</strong>. Because billing cycles
            are monthly, the calculation uses a monthly periodic rate of{' '}
            <strong>{(monthlyRate * 100).toFixed(4)}%</strong> per month
            (= {inputs.aprPercent}% ÷ 12).
          </p>
          <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
            <strong>Educational note:</strong> This simulator uses monthly compounding as a
            simplified educational model. Actual credit card interest may be calculated
            differently — for example, daily — depending on your issuer.
          </p>
          {strategyFixed.status === 'ok' && (
            <div className="bg-brand-50 rounded-lg p-3 text-brand-800 text-xs">
              With these inputs, the first month's interest charge is approximately{' '}
              <strong>{formatINR(Math.round(inputs.startingBalance * monthlyRate))}</strong>.
              This is added to your balance before your payment is applied.
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'apr',
      title: 'What does APR mean?',
      icon: '📊',
      content: () => (
        <div className="space-y-3 text-sm text-slate-700">
          <p>
            <strong>APR</strong> stands for Annual Percentage Rate. It is the
            yearly interest rate your card charges if you carry an unpaid balance.
          </p>
          <p>
            Indian credit cards often have APRs between 30% and 48% per year —
            significantly higher than personal loans or fixed deposits. Always
            check your own card agreement for your actual rate.
          </p>
          <p>
            A higher APR means you pay more interest for every month you carry
            a balance. The rates in this simulator are{' '}
            <strong>hypothetical examples</strong> to demonstrate the concept;
            your card's actual APR may be different.
          </p>
        </div>
      ),
    },
    {
      id: 'grace',
      title: 'What is a grace period?',
      icon: '🗓️',
      content: ({ inputs }) => (
        <div className="space-y-3 text-sm text-slate-700">
          <p>
            A <strong>grace period</strong> is the time between when a billing cycle
            ends and when your payment is due. If you pay your{' '}
            <em>full statement balance</em> within this window, many card issuers
            will not charge you any interest on qualifying purchases.
          </p>
          <p>
            For this to work, you typically need to:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-600">
            <li>Have no prior revolving (unpaid) balance from the previous cycle</li>
            <li>Pay the <strong>Total Amount Due</strong>, not just the Minimum Amount Due</li>
            <li>Pay on time, every month</li>
          </ul>
          {inputs.scenarioType === 'fresh_purchase' ? (
            <div className="success-box rounded-lg text-xs">
              <strong>Strategy A in this simulation</strong> models the grace-period scenario
              for a fresh purchase. The simulation assumes you pay the full statement balance by
              the due date with no prior revolving balance — resulting in ₹0 interest.
              Your issuer's actual grace-period conditions may differ.
            </div>
          ) : (
            <div className="disclosure-box rounded-lg text-xs">
              Because you selected an <strong>existing balance</strong>, you already have a
              revolving balance. Paying off even the full amount immediately will stop future
              interest, but the balance has already accrued one month of charges.
              The grace period generally does not apply to existing revolving balances.
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'terms',
      title: 'Statement Balance vs Minimum Amount Due',
      icon: '📄',
      content: () => (
        <div className="space-y-3 text-sm text-slate-700">
          <div className="space-y-2">
            {[
              {
                term: 'Statement Balance',
                def: 'The total amount you owed at the end of your last billing cycle. Paying this in full (if eligible) avoids interest on those purchases.',
              },
              {
                term: 'Total Amount Due',
                def: 'The full balance on your card right now — including any new purchases after the last statement date. Paying this clears everything.',
              },
              {
                term: 'Minimum Amount Due',
                def: 'The smallest payment your issuer will accept for that month. Paying only this keeps your account in good standing, but interest continues to build on the remaining balance.',
              },
              {
                term: 'Payment Due Date',
                def: 'The deadline for making at least the Minimum Amount Due. Missing this usually results in late-payment fees and can affect your credit history.',
              },
            ].map(({ term, def }) => (
              <div key={term} className="border-l-2 border-brand-300 pl-3">
                <p className="font-semibold text-slate-800">{term}</p>
                <p className="text-slate-600 text-xs mt-0.5">{def}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
            Terminology may differ slightly between card issuers. Always read your card's
            Most Important Terms and Conditions (MITC) document.
          </p>
        </div>
      ),
    },
    {
      id: 'minimum',
      title: 'Why minimum payments are costly',
      icon: '⚠️',
      content: ({ inputs, strategyMinimum, strategyFixed }) => (
        <div className="space-y-3 text-sm text-slate-700">
          <p>
            The Minimum Amount Due on your statement is designed to be affordable
            month to month. However, it is typically a small percentage of your balance,
            which means <strong>the remaining balance keeps attracting interest</strong>.
          </p>
          <p>
            As your balance slowly decreases, so does the minimum payment — meaning you
            repay less each month, and interest continues accumulating on an ever-present balance.
            This can make a purchase many times more expensive in the long run.
          </p>
          {strategyMinimum.status === 'ok' && strategyFixed.status === 'ok' && (
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 text-xs space-y-1">
              <p className="font-semibold text-warning-800">With your current inputs:</p>
              <p>• Minimum-only strategy: {strategyMinimum.months} months,{' '}
                <strong>{formatINR(Math.round(strategyMinimum.totalInterest))}</strong> in interest</p>
              <p>• Fixed ₹{inputs.fixedMonthlyPayment.toLocaleString('en-IN')}/month strategy: {strategyFixed.months} months,{' '}
                <strong>{formatINR(Math.round(strategyFixed.totalInterest))}</strong> in interest</p>
            </div>
          )}
          <p className="text-xs bg-slate-50 rounded-lg p-3 text-slate-500">
            The Minimum Amount Due formula used here is illustrative only:
            max(5% of the amount owed, ₹200). Your card issuer uses its own formula,
            which may differ significantly.
          </p>
        </div>
      ),
    },
    {
      id: 'paying_more',
      title: 'How paying more reduces cost',
      icon: '📈',
      content: ({ inputs, strategyFixed, strategyMinimum }) => (
        <div className="space-y-3 text-sm text-slate-700">
          <p>
            Every extra rupee you pay beyond the minimum directly reduces your
            <strong> principal balance</strong> — the amount on which interest is calculated.
            A lower principal means less interest next month, which means your balance
            falls faster, which means even less interest the month after that.
          </p>
          <p>
            This compounding benefit of paying more works in your favour:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-600 text-xs">
            <li>Shorter repayment period</li>
            <li>Less total interest paid</li>
            <li>The original purchase costs closer to its actual price</li>
          </ul>
          {strategyFixed.status === 'ok' && strategyMinimum.status === 'ok' && (
            <div className="info-box rounded-lg text-xs">
              Paying ₹{inputs.fixedMonthlyPayment.toLocaleString('en-IN')} per month instead of
              the declining minimum saves approximately{' '}
              <strong>
                {formatINR(Math.round(strategyMinimum.totalInterest - strategyFixed.totalInterest))}
              </strong>{' '}
              in interest in this simulation.
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="card p-6">
      <h2 className="text-lg font-bold text-slate-900 mb-1">Understand Your Results</h2>
      <p className="text-xs text-slate-500 mb-4">
        Explanations tailored to your simulation inputs
      </p>

      <div className="space-y-2">
        {sections.map(section => {
          const isOpen = openSection === section.id;
          return (
            <div key={section.id} className="border border-slate-100 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenSection(isOpen ? '' : section.id)}
                className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-slate-50 transition-colors"
              >
                <span className="flex items-center gap-2 font-semibold text-sm text-slate-800">
                  <span>{section.icon}</span>
                  {section.title}
                </span>
                {isOpen ? (
                  <ChevronUp size={16} className="text-slate-400 flex-shrink-0" />
                ) : (
                  <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />
                )}
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-100">
                  {section.content(results)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
