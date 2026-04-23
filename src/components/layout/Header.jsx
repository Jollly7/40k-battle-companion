import { useState, useEffect } from 'react';
import { ChevronRight, ScrollText, Undo2, Pause, Play } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { PHASES } from '../../data/phases';

function formatTime(seconds) {
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60).toString().padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function Header({ onReset, onViewSummary }) {
  const round            = useGameStore((s) => s.round);
  const currentPhase     = useGameStore((s) => s.currentPhase);
  const activePlayer     = useGameStore((s) => s.activePlayer);
  const gameOver         = useGameStore((s) => s.gameOver);
  const timers           = useGameStore((s) => s.timers);
  const timerPaused      = useGameStore((s) => s.timerPaused);
  const timerStartedAt   = useGameStore((s) => s.timerStartedAt);
  const canUndo          = useGameStore((s) => s.history.length > 0);
  const undo             = useGameStore((s) => s.undo);
  const advancePhase     = useGameStore((s) => s.advancePhase);
  const toggleTimerPause = useGameStore((s) => s.toggleTimerPause);
  const log              = useGameStore((s) => s.log);
  const p1               = useGameStore((s) => s.players[1]);
  const p2               = useGameStore((s) => s.players[2]);

  const [logOpen, setLogOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [, setTick] = useState(0);

  const phaseName = PHASES[currentPhase]?.name ?? '—';

  // Displayed time = banked seconds + live elapsed since last resume anchor.
  // The inactive player's timer is already banked and shows its stored value.
  const liveExtra = timerStartedAt !== null && !timerPaused && !gameOver
    ? (Date.now() - timerStartedAt) / 1000 : 0;
  const displayedP1 = activePlayer === 1 ? timers.p1 + liveExtra : timers.p1;
  const displayedP2 = activePlayer === 2 ? timers.p2 + liveExtra : timers.p2;

  // Role-based colours: attacker = danger (red), defender = success (green)
  const p1Color = p1.role === 'attacker' ? 'text-danger' : 'text-success';
  const p2Color = p2.role === 'attacker' ? 'text-danger' : 'text-success';

  // Re-render every second while timers are running so displayed time stays current.
  // The store is not mutated here — elapsed is computed from timerStartedAt at render time.
  useEffect(() => {
    if (gameOver || timerPaused) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [gameOver, timerPaused]);

  return (
    <header className="h-14 flex items-center px-3 bg-surface-panel border-b border-border-subtle shadow-panel shrink-0 relative">

      {/* LEFT SECTION — Round · Phase Name · Next Phase · Pause */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-display text-xl font-semibold text-text-primary whitespace-nowrap">
          Round <span className="text-text-primary">{round}</span><span className="text-text-muted">/5</span>
        </span>

        <span className="text-border-strong">·</span>

        <span className="font-display text-sm font-medium text-text-secondary uppercase tracking-wide whitespace-nowrap max-w-[130px] truncate">
          {phaseName}
        </span>

        <button
          onPointerDown={(e) => { e.preventDefault(); if (!gameOver) advancePhase(); }}
          disabled={gameOver}
          className={`flex items-center gap-1 px-3 h-12 min-w-[48px] rounded-panel text-sm font-medium
            whitespace-nowrap transition-colors shrink-0
            ${gameOver
              ? 'bg-surface-inset text-text-muted cursor-not-allowed'
              : 'bg-accent text-accent-foreground hover:bg-accent-hover'
            }`}
        >
          {gameOver ? 'Game Over' : <><span>Next Phase</span><ChevronRight size={15} /></>}
        </button>

        {/* Pause / Resume button — next to Next Phase */}
        <button
          onPointerDown={(e) => { e.preventDefault(); toggleTimerPause(); }}
          disabled={gameOver}
          className={`flex items-center justify-center w-12 h-12 rounded-panel transition-colors shrink-0
            ${gameOver
              ? 'text-text-muted cursor-not-allowed'
              : timerPaused
                ? 'text-success hover:text-success-hover'
                : 'text-chrome hover:text-chrome-hover hover:bg-surface-inset'
            }`}
          title={timerPaused ? 'Resume timers' : 'Pause timers'}
        >
          {timerPaused ? <Play size={16} /> : <Pause size={16} />}
        </button>
      </div>

      {/* CENTER SECTION — P1 Timer · P1name [CP/VP] vs [CP/VP] P2name · P2 Timer */}
      <div className="flex-1 flex items-center justify-center gap-1.5 text-xs whitespace-nowrap min-w-0">

        {/* P1 Timer */}
        <span className={`font-display tabular-nums text-sm ${activePlayer === 1 && !gameOver && !timerPaused ? p1Color : 'text-text-muted'}`}>
          {formatTime(displayedP1)}
        </span>

        <span className="text-border-strong">·</span>

        {/* P1 name */}
        <span className={`font-display font-semibold text-sm ${activePlayer === 1 ? p1Color : 'text-text-muted'}`}>
          {p1.name}
        </span>

        {/* P1 stat block */}
        <div className="flex flex-col items-center leading-none gap-0.5">
          <span className="font-display text-lg font-semibold text-text-primary tabular-nums">
            {p1.cp}<span className="text-[10px] font-normal text-text-secondary ml-0.5">CP</span>
          </span>
          <hr className="w-full border-border-subtle" />
          <span className="font-display text-lg font-semibold text-text-primary tabular-nums">
            {p1.vp.total}<span className="text-[10px] font-normal text-text-secondary ml-0.5">VP</span>
          </span>
        </div>

        <span className="text-text-muted px-0.5">vs</span>

        {/* P2 stat block */}
        <div className="flex flex-col items-center leading-none gap-0.5">
          <span className="font-display text-lg font-semibold text-text-primary tabular-nums">
            {p2.cp}<span className="text-[10px] font-normal text-text-secondary ml-0.5">CP</span>
          </span>
          <hr className="w-full border-border-subtle" />
          <span className="font-display text-lg font-semibold text-text-primary tabular-nums">
            {p2.vp.total}<span className="text-[10px] font-normal text-text-secondary ml-0.5">VP</span>
          </span>
        </div>

        {/* P2 name */}
        <span className={`font-display font-semibold text-sm ${activePlayer === 2 ? p2Color : 'text-text-muted'}`}>
          {p2.name}
        </span>

        <span className="text-border-strong">·</span>

        {/* P2 Timer */}
        <span className={`font-display tabular-nums text-sm ${activePlayer === 2 && !gameOver && !timerPaused ? p2Color : 'text-text-muted'}`}>
          {formatTime(displayedP2)}
        </span>

      </div>

      {/* RIGHT SECTION — Undo · Log · Setup */}
      <div className="flex items-center gap-1 shrink-0">

        {/* Undo */}
        <button
          onPointerDown={(e) => { e.preventDefault(); undo(); }}
          disabled={!canUndo}
          className="flex items-center justify-center w-12 h-12 rounded-panel text-chrome
            hover:text-chrome-hover hover:bg-surface-inset disabled:text-text-muted disabled:cursor-not-allowed transition-colors"
          title="Undo last action"
        >
          <Undo2 size={16} />
        </button>

        {/* Action log toggle */}
        <button
          onClick={() => setLogOpen((o) => !o)}
          className={`flex items-center justify-center w-12 h-12 rounded-panel transition-colors
            ${logOpen ? 'text-text-primary bg-surface-inset' : 'text-chrome hover:text-chrome-hover hover:bg-surface-inset'}`}
          title="Action log"
        >
          <ScrollText size={16} />
        </button>

        {/* View Summary — only when game is over */}
        {gameOver && (
          <button
            onPointerDown={(e) => { e.preventDefault(); onViewSummary(); }}
            className="text-xs text-text-secondary hover:text-text-primary px-3 h-12 rounded-panel whitespace-nowrap transition-colors"
          >
            Summary
          </button>
        )}

        {/* Setup / Reset */}
        <button
          onPointerDown={(e) => { e.preventDefault(); setConfirmReset(true); }}
          className="text-xs text-text-muted hover:text-text-secondary px-3 h-12 rounded-panel whitespace-nowrap transition-colors"
        >
          ↩ Setup
        </button>
      </div>

      {/* Restart confirmation modal */}
      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-surface-raised border border-border-subtle rounded-panel shadow-raised p-6 w-80 flex flex-col gap-5">
            <p className="text-sm text-text-primary text-center leading-snug">
              Restart setup?<br />
              <span className="text-text-secondary">All current game data will be lost.</span>
            </p>
            <div className="flex gap-3">
              <button
                onPointerDown={(e) => { e.preventDefault(); setConfirmReset(false); }}
                className="flex-1 h-12 rounded-panel bg-surface-inset text-text-primary text-sm font-medium hover:bg-surface-panel transition-colors"
              >
                Cancel
              </button>
              <button
                onPointerDown={(e) => { e.preventDefault(); setConfirmReset(false); onReset(); }}
                className="flex-1 h-12 rounded-panel bg-surface-inset text-red-500 text-sm font-medium hover:bg-surface-panel transition-colors"
              >
                Restart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log dropdown */}
      {logOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setLogOpen(false)} />
          <div className="absolute top-full right-0 z-20 w-72 max-h-80 overflow-y-auto
            bg-surface-raised border border-border-subtle rounded-b-panel shadow-raised">
            {log.length === 0 ? (
              <p className="text-xs text-text-muted p-4 text-center">No actions logged yet.</p>
            ) : (
              <ul>
                {log.map((entry, i) => (
                  <li key={i} className="px-4 py-2 flex justify-between gap-4 text-xs
                    border-b border-border-subtle last:border-0">
                    <span className="text-text-secondary">{entry.message}</span>
                    <span className="text-text-muted font-mono whitespace-nowrap">
                      {formatTime(entry.timestamp)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </header>
  );
}
