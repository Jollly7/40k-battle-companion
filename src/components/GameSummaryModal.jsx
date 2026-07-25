import { useGameStore } from '../store/gameStore';
import { normalizeDetachment } from '../utils/normalizeDetachment';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

// Hex values matching CSS tokens --color-danger and --color-success
const ATTACKER_COLOR = '#EF4444';
const DEFENDER_COLOR = '#22C55E';

function roleColor(player) {
  return player.role === 'attacker' ? ATTACKER_COLOR : DEFENDER_COLOR;
}

function formatTime(seconds) {
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60).toString().padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function GameSummaryModal({ firstPlayerNum, secondPlayerNum, onClose }) {
  const players = useGameStore((s) => s.players);
  const timers  = useGameStore((s) => s.timers);

  const left  = players[firstPlayerNum];   // goes first → left panel
  const right = players[secondPlayerNum];  // goes second → right panel

  const leftVP  = left.vp.total;
  const rightVP = right.vp.total;

  let winnerName;
  if (leftVP > rightVP)       winnerName = left.name;
  else if (rightVP > leftVP)  winnerName = right.name;
  else                        winnerName = null;

  // Build cumulative VP chart data keyed by player name
  const chartData = [1, 2, 3, 4, 5].map((round) => {
    const leftCum = left.vp.byRound
      .slice(0, round)
      .reduce((sum, r) => sum + r.primary + r.sec1 + r.sec2, 0);
    const rightCum = right.vp.byRound
      .slice(0, round)
      .reduce((sum, r) => sum + r.primary + r.sec1 + r.sec2, 0);
    return { round, [left.name]: leftCum, [right.name]: rightCum };
  });

  const totalTime = timers.p1 + timers.p2;

  // VP table helpers
  const anyData = (r) => r.primary !== 0 || r.sec1 !== 0 || r.sec2 !== 0;
  const sub = (r) => r.primary + r.sec1 + r.sec2;
  const cell = (val) => val === 0 ? '—' : val;

  const leftColor  = roleColor(left);
  const rightColor = roleColor(right);

  const leftDetachments  = normalizeDetachment(left.detachment);
  const rightDetachments = normalizeDetachment(right.detachment);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div
        className="bg-surface-panel border border-border-subtle rounded-panel shadow-raised
          w-full max-w-[1200px] mx-4 h-[760px] flex flex-col overflow-hidden"
      >
        {/* Winner Banner */}
        <div className="shrink-0 px-6 py-4 border-b border-border-subtle flex items-center justify-between gap-4">

          {/* Left player card */}
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-xl font-bold truncate" style={{ color: leftColor }}>
                {left.name}
              </span>
              <span className="text-xs font-medium uppercase tracking-wide shrink-0" style={{ color: leftColor }}>
                {left.role}
              </span>
            </div>
            <div className="text-xs text-text-secondary truncate">
              {left.faction ?? '—'}
              {leftDetachments.length > 0
                ? <span className="text-text-muted"> · {leftDetachments.join(', ')}</span>
                : null}
            </div>
          </div>

          {/* Centre: VP scores + outcome */}
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <div className="flex items-center gap-3">
              <span className="font-display text-3xl font-bold tabular-nums" style={{ color: leftColor }}>
                {leftVP}
              </span>
              <span className="text-text-muted text-lg">–</span>
              <span className="font-display text-3xl font-bold tabular-nums" style={{ color: rightColor }}>
                {rightVP}
              </span>
            </div>
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
              {winnerName ? `${winnerName} wins` : 'Draw'}
            </span>
          </div>

          {/* Right player card */}
          <div className="flex flex-col items-end gap-0.5 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-medium uppercase tracking-wide shrink-0" style={{ color: rightColor }}>
                {right.role}
              </span>
              <span className="font-display text-xl font-bold truncate" style={{ color: rightColor }}>
                {right.name}
              </span>
            </div>
            <div className="text-xs text-text-secondary truncate text-right">
              {right.faction ?? '—'}
              {rightDetachments.length > 0
                ? <span className="text-text-muted"> · {rightDetachments.join(', ')}</span>
                : null}
            </div>
          </div>

        </div>

        {/* Body — table + chart + time */}
        <div className="flex-1 flex gap-4 px-6 py-4 min-h-0 overflow-hidden">

          {/* Left: VP table */}
          <div className="flex flex-col shrink-0">
            <p className="text-[11px] font-medium text-text-secondary uppercase tracking-wide mb-2">
              VP Breakdown
            </p>
            <table className="text-xs tabular-nums border-collapse">
              <thead>
                <tr className="text-text-muted">
                  <th className="text-left pr-3 pb-1 font-normal">Rnd</th>
                  {/* Left player columns */}
                  <th className="px-2 pb-1 font-normal" style={{ color: leftColor }}>Pri</th>
                  <th className="px-2 pb-1 font-normal" style={{ color: leftColor }}>S1</th>
                  <th className="px-2 pb-1 font-normal" style={{ color: leftColor }}>S2</th>
                  <th className="px-2 pb-1 font-semibold border-r border-border-subtle" style={{ color: leftColor }}>Sub</th>
                  {/* Right player columns */}
                  <th className="px-2 pb-1 font-normal" style={{ color: rightColor }}>Pri</th>
                  <th className="px-2 pb-1 font-normal" style={{ color: rightColor }}>S1</th>
                  <th className="px-2 pb-1 font-normal" style={{ color: rightColor }}>S2</th>
                  <th className="px-2 pb-1 font-semibold" style={{ color: rightColor }}>Sub</th>
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2, 3, 4].map((i) => {
                  const l = left.vp.byRound[i];
                  const r = right.vp.byRound[i];
                  const hasData = anyData(l) || anyData(r);
                  return (
                    <tr key={i} className="border-t border-border-subtle/50">
                      <td className="pr-3 py-1 text-text-secondary font-medium">{i + 1}</td>
                      <td className="px-2 py-1 text-center text-text-primary">{hasData ? cell(l.primary) : '—'}</td>
                      <td className="px-2 py-1 text-center text-text-primary">{hasData ? cell(l.sec1) : '—'}</td>
                      <td className="px-2 py-1 text-center text-text-primary">{hasData ? cell(l.sec2) : '—'}</td>
                      <td className="px-2 py-1 text-center font-semibold text-text-primary border-r border-border-subtle">
                        {hasData ? sub(l) : '—'}
                      </td>
                      <td className="px-2 py-1 text-center text-text-primary">{hasData ? cell(r.primary) : '—'}</td>
                      <td className="px-2 py-1 text-center text-text-primary">{hasData ? cell(r.sec1) : '—'}</td>
                      <td className="px-2 py-1 text-center text-text-primary">{hasData ? cell(r.sec2) : '—'}</td>
                      <td className="px-2 py-1 text-center font-semibold text-text-primary">{hasData ? sub(r) : '—'}</td>
                    </tr>
                  );
                })}
                {/* Totals row */}
                <tr className="border-t-2 border-border-strong">
                  <td className="pr-3 py-1.5 text-text-secondary font-semibold text-[11px] uppercase">Total</td>
                  <td className="px-2 py-1.5 text-center text-text-muted">{cell(left.vp.primary)}</td>
                  <td colSpan={2} />
                  <td className="px-2 py-1.5 text-center font-bold border-r border-border-subtle" style={{ color: leftColor }}>
                    {leftVP}
                  </td>
                  <td className="px-2 py-1.5 text-center text-text-muted">{cell(right.vp.primary)}</td>
                  <td colSpan={2} />
                  <td className="px-2 py-1.5 text-center font-bold" style={{ color: rightColor }}>
                    {rightVP}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Time summary */}
            <div className="mt-auto pt-4 border-t border-border-subtle flex flex-col gap-1.5 text-xs">
              <p className="text-[11px] font-medium text-text-secondary uppercase tracking-wide mb-1">
                Game Time
              </p>
              <div className="flex justify-between gap-8">
                <span className="text-text-secondary">Total</span>
                <span className="tabular-nums text-text-primary font-semibold">{formatTime(totalTime)}</span>
              </div>
              <div className="flex justify-between gap-8">
                <span style={{ color: leftColor }}>{left.name}</span>
                <span className="tabular-nums text-text-primary">{formatTime(timers[`p${firstPlayerNum}`])}</span>
              </div>
              <div className="flex justify-between gap-8">
                <span style={{ color: rightColor }}>{right.name}</span>
                <span className="tabular-nums text-text-primary">{formatTime(timers[`p${secondPlayerNum}`])}</span>
              </div>
            </div>
          </div>

          {/* Right: Cumulative VP chart */}
          <div className="flex-1 flex flex-col min-w-0">
            <p className="text-[11px] font-medium text-text-secondary uppercase tracking-wide mb-2 shrink-0">
              Cumulative VP by Round
            </p>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis
                    dataKey="round"
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.15)' }}
                    tickLine={false}
                    label={{ value: 'Round', position: 'insideBottom', offset: -2, fill: '#6b7280', fontSize: 11 }}
                  />
                  <YAxis
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.15)' }}
                    tickLine={false}
                    width={32}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#252320',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '4px',
                      fontSize: '12px',
                    }}
                    labelFormatter={(v) => `Round ${v}`}
                    labelStyle={{ color: '#9ca3af' }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px', paddingTop: '4px' }}
                    formatter={(value) => (
                      <span style={{ color: value === left.name ? leftColor : rightColor }}>
                        {value}
                      </span>
                    )}
                  />
                  <Line
                    type="monotone"
                    dataKey={left.name}
                    stroke={leftColor}
                    strokeWidth={2}
                    dot={{ fill: leftColor, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey={right.name}
                    stroke={rightColor}
                    strokeWidth={2}
                    dot={{ fill: rightColor, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-3 border-t border-border-subtle flex justify-end">
          <button
            onPointerDown={(e) => { e.preventDefault(); onClose(); }}
            className="px-6 h-10 rounded-panel bg-surface-inset text-text-primary text-sm
              font-medium hover:bg-surface-raised transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
