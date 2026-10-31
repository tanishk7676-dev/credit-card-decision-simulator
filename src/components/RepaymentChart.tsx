import { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { SimulationResults, BillingCycle } from '../lib/calculator';
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

  function getValue(schedule: BillingCycle[], month: number, mode: ViewMode): number | undefined {
    if (mode === 'balance') {
      const cycle = schedule.find(c => c.month === month);
      if (cycle) return Math.max(cycle.closingBalance, 0);
      // After schedule ends: 0 (fully repaid)
      if (month > schedule.length && schedule.length > 0) return 0;
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
      const v = getValue(strategyFixed.schedule, m, viewMode);
      if (v !== undefined) point.fixed = Math.round(v);
    }
    if (strategyMinimum.schedule.length > 0) {
      const v = getValue(strategyMinimum.schedule, m, viewMode);
      if (v !== undefined) point.minimum = Math.round(v);
    }
    if (strategyFull.schedule.length > 0) {
      const v = getValue(strategyFull.schedule, m, viewMode);
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

  const yTickFormatter = (v: number) => {
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
    if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
    return `₹${v}`;
  };

  return (
    <div className="card p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Repayment Visualisation</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {viewMode === 'balance'
              ? 'Outstanding balance remaining over time'
              : 'Cumulative amount paid over time'}
          </p>
        </div>

        {/* View toggle */}
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('balance')}
            className={`pill-tab text-xs px-3 py-1.5 ${viewMode === 'balance' ? 'active' : 'inactive'}`}
          >
            Balance
          </button>
          <button
            type="button"
            onClick={() => setViewMode('cumulative')}
            className={`pill-tab text-xs px-3 py-1.5 ${viewMode === 'cumulative' ? 'active' : 'inactive'}`}
          >
            Total Paid
          </button>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
          No chart data available for the current inputs.
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="colorFixed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorMinimum" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorFull" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                label={{ value: 'Month', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#94a3b8' }}
              />
              <YAxis
                tickFormatter={yTickFormatter}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                width={55}
              />
              <Tooltip content={<CustomTooltip viewMode={viewMode} />} />
              <Legend
                formatter={(value) =>
                  value === 'fixed' ? 'Fixed Payment' :
                  value === 'minimum' ? 'Min. Payment' :
                  'Full Payment'
                }
                wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
              />
              {hasFullData && (
                <Area
                  type="monotone"
                  dataKey="full"
                  name="full"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#colorFull)"
                  dot={false}
                  connectNulls
                />
              )}
              {hasFixedData && (
                <Area
                  type="monotone"
                  dataKey="fixed"
                  name="fixed"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#colorFixed)"
                  dot={false}
                  connectNulls
                />
              )}
              {hasMinimumData && (
                <Area
                  type="monotone"
                  dataKey="minimum"
                  name="minimum"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="url(#colorMinimum)"
                  dot={false}
                  connectNulls
                />
              )}
            </AreaChart>
          </ResponsiveContainer>

          {chartData.length >= 240 && (
            <p className="text-center text-xs text-slate-400 mt-2">
              Chart limited to 240 months (20 years) for readability.
            </p>
          )}
        </>
      )}

      <p className="text-xs text-slate-400 text-center mt-3">
        Chart reflects the same calculation engine as the comparison cards above.
        Results are estimates based on simplified assumptions.
      </p>
    </div>
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

  const names: Record<string, string> = {
    fixed: 'Fixed Payment',
    minimum: 'Min. Payment',
    full: 'Full Payment',
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 min-w-[160px]">
      <p className="text-xs font-semibold text-slate-500 mb-2">Month {label}</p>
      {payload.map(entry => (
        <div key={entry.name} className="flex items-center justify-between gap-3 text-xs mb-1">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-600">{names[entry.name] ?? entry.name}</span>
          </div>
          <span className="font-semibold text-slate-800">{formatINR(entry.value)}</span>
        </div>
      ))}
      <p className="text-slate-400 text-xs mt-2 pt-2 border-t border-slate-100">
        {viewMode === 'balance' ? 'Balance remaining' : 'Cumulative paid'}
      </p>
    </div>
  );
}
