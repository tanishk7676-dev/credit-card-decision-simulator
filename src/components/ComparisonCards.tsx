import { CheckCircle, TrendingDown, Clock, IndianRupee } from 'lucide-react';
import type { SimulationResults, StrategyResult } from '../lib/calculator';
import { formatINR, formatINRPaise, formatDuration } from '../lib/calculator';

interface Props {
  results: SimulationResults;
}

export function ComparisonCards({ results }: Props) {
  const { strategyFull, strategyFixed, strategyMinimum, inputs } = results;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Repayment Strategy Comparison</h2>
        <span className="text-xs text-slate-400">Results are estimates</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StrategyCard
          strategy={strategyFull}
          startingBalance={inputs.startingBalance}
          accent="success"
          icon={<CheckCircle size={18} />}
          scenarioType={inputs.scenarioType}
        />
        <StrategyCard
          strategy={strategyFixed}
          startingBalance={inputs.startingBalance}
          accent="brand"
          icon={<IndianRupee size={18} />}
          fixedPayment={inputs.fixedMonthlyPayment}
          scenarioType={inputs.scenarioType}
        />
        <StrategyCard
          strategy={strategyMinimum}
          startingBalance={inputs.startingBalance}
          accent="warning"
          icon={<TrendingDown size={18} />}
          scenarioType={inputs.scenarioType}
        />
      </div>

      {/* Extra cost callout */}
      {strategyFixed.status === 'ok' && strategyMinimum.status === 'ok' && (
        <MinimumCostCallout
          startingBalance={inputs.startingBalance}
          fixedResult={strategyFixed}
          minimumResult={strategyMinimum}
        />
      )}
    </div>
  );
}

// ─── Strategy Card ────────────────────────────────────────────────────────────

type Accent = 'success' | 'brand' | 'warning';

interface CardProps {
  strategy: StrategyResult;
  startingBalance: number;
  accent: Accent;
  icon: React.ReactNode;
  fixedPayment?: number;
  scenarioType: string;
}

const ACCENT_COLORS: Record<Accent, { header: string; badge: string; value: string; border: string }> = {
  success: {
    header: 'bg-success-50',
    badge: 'bg-success-100 text-success-700',
    value: 'text-success-700',
    border: 'border-success-200',
  },
  brand: {
    header: 'bg-brand-50',
    badge: 'bg-brand-100 text-brand-700',
    value: 'text-brand-700',
    border: 'border-brand-200',
  },
  warning: {
    header: 'bg-warning-50',
    badge: 'bg-warning-100 text-warning-700',
    value: 'text-warning-700',
    border: 'border-warning-200',
  },
};

function StrategyCard({ strategy, startingBalance, accent, icon, fixedPayment, scenarioType }: CardProps) {
  const colors = ACCENT_COLORS[accent];
  const extraCost = strategy.totalInterest;
  const isInsufficient = strategy.status === 'insufficient_payment';
  const isCapReached = strategy.status === 'cap_reached';

  return (
    <div className={`card overflow-hidden border ${colors.border}`}>
      {/* Card Header */}
      <div className={`${colors.header} px-4 py-3 flex items-center gap-2`}>
        <span className={`${colors.value}`}>{icon}</span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Strategy {strategy.id === 'full' ? 'A' : strategy.id === 'fixed' ? 'B' : 'C'}
          </p>
          <p className="text-sm font-bold text-slate-800 leading-tight">{strategy.label}</p>
        </div>
      </div>

      {/* Card Body */}
      <div className="px-4 py-4 space-y-3">
        {/* Sub-label for fixed payment */}
        {strategy.id === 'fixed' && fixedPayment != null && (
          <p className="text-xs text-slate-500">
            ₹{fixedPayment.toLocaleString('en-IN')} per month
          </p>
        )}
        {strategy.id === 'minimum' && (
          <p className="text-xs text-slate-500">
            Illustrative formula · actual issuer rules vary
          </p>
        )}

        {/* Insufficient payment warning */}
        {isInsufficient && (
          <div className="danger-box rounded-lg">
            <p className="font-semibold mb-1">⚠️ Payment too low</p>
            <p className="text-xs leading-relaxed">{strategy.statusMessage}</p>
          </div>
        )}

        {/* Cap reached */}
        {isCapReached && (
          <div className="disclosure-box rounded-lg">
            <p className="font-semibold mb-1">⏱ Simulation limit reached</p>
            <p className="text-xs">{strategy.statusMessage}</p>
          </div>
        )}

        {/* Zero balance */}
        {strategy.status === 'zero_balance' && (
          <p className="text-slate-400 text-sm">No balance to repay.</p>
        )}

        {/* Normal stats */}
        {!isInsufficient && strategy.status !== 'zero_balance' && (
          <>
            {/* Grace period callout */}
            {strategy.status === 'grace_period' && (
              <div className="success-box rounded-lg text-xs leading-relaxed">
                <strong>✓ Grace period may apply.</strong> If you pay the full statement balance
                by the due date for a fresh purchase with no prior revolving balance, no interest
                is charged — provided all your issuer's conditions are met.
              </div>
            )}

            {/* Existing balance note for Strategy A */}
            {strategy.id === 'full' && scenarioType === 'existing_balance' && (
              <div className="info-box rounded-lg text-xs">
                This is an existing revolving balance. Paying it off immediately stops further
                interest accrual, but one month's interest has already been added.
              </div>
            )}

            <Stat
              label="Total amount repaid"
              value={formatINR(strategy.totalPaid)}
              valueClass={colors.value}
            />
            <Stat
              label="Total interest paid"
              value={strategy.totalInterest === 0 ? '₹0' : formatINRPaise(extraCost)}
              valueClass={extraCost === 0 ? 'text-success-600' : 'text-danger-600'}
              subLabel={
                extraCost > 0 && startingBalance > 0
                  ? `+${((extraCost / startingBalance) * 100).toFixed(1)}% extra`
                  : undefined
              }
            />
            <Stat
              label="Time to clear"
              value={
                strategy.months === 0 && strategy.status === 'grace_period'
                  ? '1 billing cycle'
                  : formatDuration(strategy.months)
              }
              valueClass="text-slate-800"
              icon={<Clock size={13} className="text-slate-400" />}
            />
          </>
        )}
      </div>
    </div>
  );
}

// ─── Stat Row ─────────────────────────────────────────────────────────────────

function Stat({
  label,
  value,
  valueClass,
  subLabel,
  icon,
}: {
  label: string;
  value: string;
  valueClass?: string;
  subLabel?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <p className="stat-label">{label}</p>
      <div className="flex items-center gap-1 mt-0.5">
        {icon}
        <p className={`stat-value text-xl ${valueClass ?? ''}`}>{value}</p>
      </div>
      {subLabel && <p className="text-xs text-danger-500 font-medium mt-0.5">{subLabel}</p>}
    </div>
  );
}

// ─── Minimum Cost Callout ─────────────────────────────────────────────────────

function MinimumCostCallout({
  startingBalance,
  fixedResult,
  minimumResult,
}: {
  startingBalance: number;
  fixedResult: StrategyResult;
  minimumResult: StrategyResult;
}) {
  const extraInterest = minimumResult.totalInterest - fixedResult.totalInterest;
  const extraMonths = minimumResult.months - fixedResult.months;

  if (extraInterest <= 0 && extraMonths <= 0) return null;

  return (
    <div className="bg-gradient-to-r from-warning-50 to-orange-50 border border-warning-200 rounded-xl p-4">
      <p className="text-sm font-bold text-warning-800 mb-1">
        💡 Minimum payment vs fixed payment comparison
      </p>
      <div className="grid grid-cols-2 gap-3 text-sm">
        {extraInterest > 0 && (
          <div>
            <p className="text-xs text-warning-600 font-medium uppercase tracking-wider">Extra interest</p>
            <p className="font-bold text-warning-900 text-lg">{formatINR(Math.round(extraInterest))}</p>
            <p className="text-xs text-warning-600">
              more than the fixed strategy
              {startingBalance > 0 && ` (+${((extraInterest / startingBalance) * 100).toFixed(0)}%)`}
            </p>
          </div>
        )}
        {extraMonths > 0 && (
          <div>
            <p className="text-xs text-warning-600 font-medium uppercase tracking-wider">Extra time</p>
            <p className="font-bold text-warning-900 text-lg">{formatDuration(extraMonths)}</p>
            <p className="text-xs text-warning-600">longer to clear debt</p>
          </div>
        )}
      </div>
    </div>
  );
}
