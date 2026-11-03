import { CheckCircle, TrendingDown, IndianRupee } from 'lucide-react';
import type { SimulationResults, StrategyResult } from '../lib/calculator';
import { formatINR, formatINRPaise, formatDuration } from '../lib/calculator';

interface Props {
  results: SimulationResults;
}

const STRATEGY_META = {
  full: {
    code: 'A',
    shortLabel: 'Full balance',
    detail: 'Pay the full amount due',
    icon: <CheckCircle size={18} aria-hidden="true" />,
    color: 'green',
  },
  fixed: {
    code: 'B',
    shortLabel: 'Fixed payment',
    detail: 'Same payment every month',
    icon: <IndianRupee size={18} aria-hidden="true" />,
    color: 'graphite',
  },
  minimum: {
    code: 'C',
    shortLabel: 'Minimum due',
    detail: 'Illustrative minimum only',
    icon: <TrendingDown size={18} aria-hidden="true" />,
    color: 'vermilion',
  },
} as const;

export function ComparisonCards({ results }: Props) {
  const { strategyFull, strategyFixed, strategyMinimum, inputs } = results;
  const strategies = [strategyFull, strategyFixed, strategyMinimum];
  const maxCost = Math.max(
    inputs.startingBalance,
    ...strategies.map(item => Math.max(item.totalPaid, item.totalInterest)),
    1
  );
  const canCompareMinimum = isCompleted(strategyFixed) &&
    (isCompleted(strategyMinimum) || strategyMinimum.status === 'cap_reached');

  return (
    <section className="comparison-panel scroll-mt-24" aria-labelledby="comparison-heading">
      <div className="comparison-heading">
        <div>
          <p className="section-index">Cost map / 02</p>
          <h2 id="comparison-heading">Three ways to clear the balance</h2>
        </div>
        <p className="comparison-heading__note">Same starting balance · different outcomes</p>
      </div>

      <div className="cost-legend" aria-label="Cost bar legend">
        <span><i className="cost-legend__principal" aria-hidden="true" />Principal repaid</span>
        <span><i className="cost-legend__interest" aria-hidden="true" />Interest charged</span>
      </div>

      <div className="comparison-rows">
        {strategies.map(strategy => (
          <StrategyRow
            key={strategy.id}
            strategy={strategy}
            fixedPayment={strategy.id === 'fixed' ? inputs.fixedMonthlyPayment : undefined}
            maxCost={maxCost}
          />
        ))}
      </div>

      <p className="comparison-explanation">
        Each bar separates principal repaid from interest charged. For capped simulations,
        accrued interest may not yet be paid; a longer completed bar means a higher total cost.
      </p>

      {canCompareMinimum && (
        <MinimumCostInsight
          monthlyPayment={inputs.fixedMonthlyPayment}
          fixedResult={strategyFixed}
          minimumResult={strategyMinimum}
        />
      )}
    </section>
  );
}

function isCompleted(strategy: StrategyResult): boolean {
  return strategy.status === 'ok' ||
    strategy.status === 'zero_interest' ||
    strategy.status === 'grace_period' ||
    strategy.status === 'zero_balance';
}

function StrategyRow({
  strategy,
  fixedPayment,
  maxCost,
}: {
  strategy: StrategyResult;
  fixedPayment?: number;
  maxCost: number;
}) {
  const meta = STRATEGY_META[strategy.id];
  const insufficient = strategy.status === 'insufficient_payment';
  const capped = strategy.status === 'cap_reached';
  const finalCycle = strategy.schedule[strategy.schedule.length - 1];
  const outstanding = capped ? finalCycle?.closingBalance ?? 0 : 0;
  const principalPaid = Math.max(0, Math.min(strategy.totalPaid, strategy.totalPaid - strategy.totalInterest));
  const principalWidth = (principalPaid / maxCost) * 100;
  const interestWidth = (strategy.totalInterest / maxCost) * 100;

  return (
    <article className={`strategy-card comparison-row comparison-row--${meta.color}`}>
      <div className="comparison-row__identity">
        <span className="comparison-row__icon">{meta.icon}</span>
        <div>
          <p className="comparison-row__eyebrow">STRATEGY {meta.code}</p>
          <h3>{meta.shortLabel}</h3>
          <p className="comparison-row__detail">{meta.detail}</p>
          {fixedPayment !== undefined && (
            <p className="comparison-row__payment">{formatINR(fixedPayment)} / month</p>
          )}
        </div>
      </div>

      <div className="comparison-row__cost">
        {insufficient ? (
          <div className="comparison-status comparison-status--danger" role="status">
            <strong>Payment too low to reduce the balance</strong>
            <span>{strategy.statusMessage}</span>
          </div>
        ) : capped ? (
          <div className="comparison-status comparison-status--warning" role="status">
            <strong>Simulation stopped before payoff</strong>
            <span>{strategy.statusMessage}</span>
          </div>
        ) : strategy.status === 'grace_period' ? (
          <p className="comparison-row__note comparison-row__note--positive">
            Possible interest-free period when all issuer conditions are met.
          </p>
        ) : strategy.status === 'zero_balance' ? (
          <p className="comparison-row__note">No balance to repay.</p>
        ) : null}

        {!insufficient && (
          <>
            <div className="comparison-row__figures">
              <div>
                <p className="comparison-row__label">{capped ? 'Principal paid' : 'Principal'}</p>
                <p className="comparison-row__principal">{formatINR(Math.round(principalPaid))}</p>
              </div>
              <div>
                <p className="comparison-row__label">{capped ? 'Paid so far' : 'Total repayment'}</p>
                <p className="comparison-row__total">{formatINR(strategy.totalPaid)}</p>
              </div>
              <div>
                <p className="comparison-row__label">{capped ? 'Interest charged so far' : 'Interest paid'}</p>
                <p className={`comparison-row__interest ${strategy.totalInterest > 0 ? 'is-nonzero' : ''}`}>
                  {strategy.totalInterest === 0 ? '₹0' : formatINRPaise(strategy.totalInterest)}
                </p>
              </div>
              <div>
                <p className="comparison-row__label">{capped ? 'Payoff status' : 'Payoff time'}</p>
                <p className={`comparison-row__duration ${capped ? 'is-capped' : ''}`}>
                  {capped
                    ? `Not cleared · ${formatDuration(strategy.months)}`
                    : strategy.status === 'grace_period'
                      ? '1 billing cycle'
                      : strategy.status === 'zero_balance'
                        ? 'Already clear'
                        : formatDuration(strategy.months)}
                </p>
              </div>
            </div>

            <div
              className="cost-bar"
              role="img"
              aria-label={`${meta.shortLabel}: ${formatINR(principalPaid)} principal repaid and ${formatINR(strategy.totalInterest)} interest ${capped ? 'charged so far, not necessarily paid' : 'paid'}`}
            >
              <span className="cost-bar__principal" style={{ width: `${principalWidth}%` }} />
              <span className="cost-bar__interest" style={{ width: `${interestWidth}%` }} />
            </div>
            {capped && (
              <p className="comparison-row__remaining">
                Outstanding balance: <strong>{formatINR(outstanding)}</strong>
              </p>
            )}
          </>
        )}
        {insufficient && (
          <div className="comparison-row__figures comparison-row__figures--unavailable">
            <div>
              <p className="comparison-row__label">Principal</p>
              <p className="comparison-row__duration">Not available</p>
            </div>
            <div>
              <p className="comparison-row__label">Total repayment</p>
              <p className="comparison-row__duration">Not available</p>
            </div>
            <div>
              <p className="comparison-row__label">Interest charged</p>
              <p className="comparison-row__duration">Not available</p>
            </div>
            <div>
              <p className="comparison-row__label">Payoff time</p>
              <p className="comparison-row__duration is-capped">Balance will not decrease</p>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function MinimumCostInsight({
  monthlyPayment,
  fixedResult,
  minimumResult,
}: {
  monthlyPayment: number;
  fixedResult: StrategyResult;
  minimumResult: StrategyResult;
}) {
  const extraInterest = minimumResult.totalInterest - fixedResult.totalInterest;
  const extraMonths = minimumResult.months - fixedResult.months;
  const incomplete = minimumResult.status === 'cap_reached';
  const remaining = minimumResult.schedule.length
    ? minimumResult.schedule[minimumResult.schedule.length - 1].closingBalance
    : 0;

  if (!incomplete && extraInterest <= 0 && extraMonths <= 0) return null;

  return (
    <aside className="minimum-insight" role="status" aria-live="polite">
      <span className="minimum-insight__mark" aria-hidden="true">!</span>
      <div className="minimum-insight__body">
        <p className="minimum-insight__eyebrow">The difference / minimum vs fixed</p>
        {incomplete ? (
          <>
            <h3>The minimum-payment estimate has not reached payoff.</h3>
            <p>
              It has accrued {formatINR(Math.round(minimumResult.totalInterest))} in interest so far,
              with {formatINR(remaining)} still outstanding. A final payoff time or cost cannot be
              estimated from a capped simulation.
            </p>
          </>
        ) : (
          <>
            <h3>Paying the minimum costs more over time.</h3>
            <div className="minimum-insight__stats">
              {extraInterest > 0 && (
                <p>
                  <strong>{formatINR(Math.round(extraInterest))}</strong>
                  <span>additional interest</span>
                </p>
              )}
              {extraMonths > 0 && (
                <p>
                  <strong>{formatDuration(extraMonths)}</strong>
                  <span>additional time to repay</span>
                </p>
              )}
            </div>
            <p className="minimum-insight__footnote">
              Difference from paying {formatINR(monthlyPayment)} monthly. Minimum formula is illustrative; issuer rules vary.
            </p>
          </>
        )}
      </div>
    </aside>
  );
}
