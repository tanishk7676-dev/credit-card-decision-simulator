import { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { SimulationResults, BillingCycle, StrategyResult } from '../lib/calculator';
import { formatINR } from '../lib/calculator';

interface Props {
  results: SimulationResults;
}

type ViewMode = 'balance' | 'cumulative';

interface ChartPoint {
  month: number;
  fixed?: number;
  minimum?: number;
  full?: number;
}

export function RepaymentChart({ results }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('balance');

  const { strategyFull, strategyFixed, strategyMinimum } = results;

  // Build chart data: align all strategies on a shared month axis
  const maxMonths = Math.max(
    strategyFixed.schedule.length,
    strategyMinimum.schedule.length,
    strategyFull.schedule.length,
    1
  );

  function getValue(
    schedule: BillingCycle[],
    status: StrategyResult['status'],
    month: number,
    mode: ViewMode
  ): number | undefined {
    if (mode === 'balance') {
      const cycle = schedule.find(c => c.month === month);
      if (cycle) return Math.max(cycle.closingBalance, 0);
      if (month > schedule.length && schedule.length > 0 && status !== 'cap_reached') return 0;
      return undefined;
    } else {
      // Cumulative total paid up to this month
      const cycles = schedule.filter(c => c.month <= month);
      return cycles.reduce((sum, c) => sum + c.paymentMade, 0);
    }
  }

  const data: ChartPoint[] = [];
  for (let m = 1; m <= Math.min(maxMonths, 240); m++) {
    const point: ChartPoint = { month: m };
    if (strategyFixed.schedule.length > 0 && strategyFixed.status !== 'insufficient_payment') {
      const v = getValue(strategyFixed.schedule, strategyFixed.status, m, viewMode);
      if (v !== undefined) point.fixed = Math.round(v);
    }
    if (strategyMinimum.schedule.length > 0) {
      const v = getValue(strategyMinimum.schedule, strategyMinimum.status, m, viewMode);
      if (v !== undefined) point.minimum = Math.round(v);
    }
    if (strategyFull.schedule.length > 0) {
      const v = getValue(strategyFull.schedule, strategyFull.status, m, viewMode);
      if (v !== undefined) point.full = Math.round(v);
    }
    data.push(point);
  }

  // Filter out trailing months where all values are 0 or undefined
  const lastMeaningful = data.reduce((last, d, i) => {
    const hasNonZero = (d.fixed ?? 0) > 0 || (d.minimum ?? 0) > 0 || (d.full ?? 0) > 0;
    return hasNonZero ? i : last;
  }, 0);
  const chartData = data.slice(0, Math.min(lastMeaningful + 2, data.length));

  const hasFixedData = strategyFixed.status !== 'insufficient_payment' && strategyFixed.schedule.length > 0;
  const hasMinimumData = strategyMinimum.schedule.length > 0;
  const hasFullData = strategyFull.schedule.length > 0 && viewMode === 'cumulative';
  const chartDescription = viewMode === 'balance'
    ? 'Line chart showing remaining balance by month for fixed and minimum payments.'
    : 'Line chart showing cumulative payments by month for all available strategies.';
  const cappedStrategies = [
    { label: 'Fixed monthly payment', result: strategyFixed },
    { label: 'Minimum payment', result: strategyMinimum },
    { label: 'Full payment', result: strategyFull },
  ].filter(({ result }) => result.status === 'cap_reached');

  const yTickFormatter = (v: number) => {
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
    if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
    return `₹${v}`;
  };

  return (
    <section className="chart-panel card p-4 sm:p-6" aria-labelledby="repayment-chart-heading">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 id="repayment-chart-heading" className="text-lg font-bold text-slate-900">Repayment over time</h2>
          <p id="chart-description" className="text-sm text-slate-700 mt-1">
            {viewMode === 'balance'
              ? 'See how quickly your outstanding balance falls.'
              : 'See how much you have paid in total at each point.'}
          </p>
        </div>

        {/* View toggle */}
        <div className="flex w-full gap-1 rounded-lg bg-slate-100 p-1 sm:w-auto sm:self-auto" role="group" aria-label="Chart view">
          <button
            type="button"
            onClick={() => setViewMode('balance')}
            aria-pressed={viewMode === 'balance'}
            className={`pill-tab text-xs px-3 py-1.5 ${viewMode === 'balance' ? 'active' : 'inactive'}`}
          >
            Balance remaining
          </button>
          <button
            type="button"
            onClick={() => setViewMode('cumulative')}
            aria-pressed={viewMode === 'cumulative'}
            className={`pill-tab text-xs px-3 py-1.5 ${viewMode === 'cumulative' ? 'active' : 'inactive'}`}
          >
            Total paid
          </button>
        </div>
      </div>

      <div className="chart-key" aria-label="Strategies shown in chart">
        {viewMode === 'cumulative' && hasFullData && (
          <span><i className="chart-key__full" aria-hidden="true" />Pay in full</span>
        )}
        {hasFixedData && (
          <span><i className="chart-key__fixed" aria-hidden="true" />Fixed monthly payment</span>
        )}
        {hasMinimumData && (
          <span><i className="chart-key__minimum" aria-hidden="true" />Minimum payment</span>
        )}
        {viewMode === 'balance' && !hasFixedData && !hasMinimumData && (
          <span className="text-slate-600">No repayment schedule is available to plot.</span>
        )}
      </div>

      {chartData.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-slate-600">
          No chart data available for the current inputs.
        </div>
      ) : (
        <>
          <div role="img" aria-label={chartDescription} aria-describedby="chart-description">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 14, bottom: 24 }}>
              <CartesianGrid strokeDasharray="2 6" stroke="#D8D7D1" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: '#55544E', fontFamily: 'Geist Mono, monospace' }}
                tickLine={false}
                axisLine={false}
                minTickGap={24}
                label={{ value: 'Month', position: 'insideBottom', offset: -14, fontSize: 12, fill: '#3F3E39' }}
              />
              <YAxis
                tickFormatter={yTickFormatter}
                tick={{ fontSize: 11, fill: '#55544E', fontFamily: 'Geist Mono, monospace' }}
                tickLine={false}
                axisLine={false}
                width={64}
                label={{
                  value: viewMode === 'balance' ? 'Balance remaining (₹)' : 'Cumulative paid (₹)',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#3F3E39',
                  fontSize: 11,
                  textAnchor: 'middle',
                }}
              />
              <Tooltip content={<CustomTooltip viewMode={viewMode} />} />
              {hasFullData && (
                <Area
                  type="monotone"
                  dataKey="full"
                  name="Pay in full"
                  stroke="#176B52"
                  strokeWidth={2}
                  fill="#176B52"
                  fillOpacity={0.08}
                  dot={false}
                  connectNulls
                />
              )}
              {hasFixedData && (
                <Area
                  type="monotone"
                  dataKey="fixed"
                  name="Fixed monthly payment"
                  stroke="#151515"
                  strokeWidth={2}
                  fill="#151515"
                  fillOpacity={0.06}
                  dot={false}
                  connectNulls
                />
              )}
              {hasMinimumData && (
                <Area
                  type="monotone"
                  dataKey="minimum"
                  name="Minimum payment"
                  stroke="#D4482B"
                  strokeWidth={2}
                  fill="#D4482B"
                  fillOpacity={0.08}
                  dot={false}
                  connectNulls
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
          </div>

          {chartData.length >= 240 && (
            <p className="mt-2 text-center text-xs text-slate-600">
              Chart limited to 240 months (20 years) for readability.
            </p>
          )}
          {cappedStrategies.length > 0 && (
            <div className="mt-2 space-y-1 text-xs text-warning-800" role="status">
              {cappedStrategies.map(({ label, result }) => {
                const lastCycle = result.schedule[result.schedule.length - 1];
                const remaining = lastCycle?.closingBalance ?? 0;
                return (
                  <p key={result.id}>
                    {label} stopped at month {result.months}; the balance remaining was {formatINR(remaining)}.
                    {result.months > 240 ? ' This endpoint is beyond the 240-month chart range.' : ''}
                  </p>
                );
              })}
            </div>
          )}

          <details className="mt-4 rounded-lg border border-slate-200">
            <summary className="min-h-11 cursor-pointer px-4 py-3 text-sm font-semibold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600">
              View chart data as a table
            </summary>
            <div className="overflow-x-auto border-t border-slate-200">
              <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
                <caption className="sr-only">
                  {viewMode === 'balance' ? 'Outstanding balance remaining' : 'Cumulative payments'} by month and repayment strategy
                </caption>
                <thead className="bg-slate-100 text-xs font-semibold text-slate-800">
                  <tr>
                    <th scope="col" className="px-3 py-2.5">Month</th>
                    {hasFullData && <th scope="col" className="px-3 py-2.5">Pay in full</th>}
                    {hasFixedData && <th scope="col" className="px-3 py-2.5">Fixed monthly payment</th>}
                    {hasMinimumData && <th scope="col" className="px-3 py-2.5">Minimum payment</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {chartData.map(point => (
                    <tr key={point.month}>
                      <th scope="row" className="px-3 py-2 font-mono font-medium tabular-nums">
                        {point.month}
                      </th>
                      {hasFullData && (
                        <td className="px-3 py-2 font-mono tabular-nums">
                          {point.full === undefined ? '—' : formatINR(point.full)}
                        </td>
                      )}
                      {hasFixedData && (
                        <td className="px-3 py-2 font-mono tabular-nums">
                          {point.fixed === undefined ? '—' : formatINR(point.fixed)}
                        </td>
                      )}
                      {hasMinimumData && (
                        <td className="px-3 py-2 font-mono tabular-nums">
                          {point.minimum === undefined ? '—' : formatINR(point.minimum)}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}

      <p className="mt-3 text-center text-xs text-slate-600">
        Chart reflects the same calculation engine as the comparison cards above.
        Results are estimates based on simplified assumptions.
      </p>
    </section>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  label,
  viewMode,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: number;
  viewMode: ViewMode;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="min-w-[180px] rounded-xl border border-slate-300 bg-white p-3 shadow-lg">
      <p className="mb-2 text-xs font-semibold text-slate-800">Month {label}</p>
      {payload.map(entry => (
        <div key={entry.name} className="flex items-center justify-between gap-3 text-xs mb-1">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-700">{entry.name}</span>
          </div>
          <span className="font-semibold text-slate-800 font-mono tabular-nums">{formatINR(entry.value)}</span>
        </div>
      ))}
      <p className="mt-2 border-t border-slate-200 pt-2 text-xs text-slate-700">
        {viewMode === 'balance' ? 'Balance remaining' : 'Cumulative paid'} · INR
      </p>
    </div>
  );
}
