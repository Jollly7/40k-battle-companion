import { useState, useEffect } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { RosterPickerModal } from '../army/RosterPickerModal';

function PlayerSetupColumn({ playerNum, accentBorderClass }) {
  const name               = useGameStore((s) => s.players[playerNum].name);
  const setPlayerName      = useGameStore((s) => s.setPlayerName);
  const rosters            = useGameStore((s) => s.rosters);
  const selectRoster       = useGameStore((s) => s.selectRoster);
  const rosterLabel        = useGameStore((s) =>
    playerNum === 1 ? s.player1RosterLabel : s.player2RosterLabel
  );

  const [pickerOpen, setPickerOpen] = useState(false);

  const selectedRoster = rosters.find((r) => r.label === rosterLabel) ?? null;

  function handleSelect(roster) {
    selectRoster(playerNum, roster);
  }

  return (
    <div className={`flex-1 rounded-panel border-2 ${accentBorderClass} bg-surface-panel shadow-panel p-4 flex flex-col gap-4`}>
      <h2 className="font-display text-lg font-semibold text-text-primary">Player {playerNum}</h2>

      {/* Name */}
      <div className="flex flex-col gap-1">
        <label className="text-sm text-text-secondary" htmlFor={`name-p${playerNum}`}>
          Name
        </label>
        <input
          id={`name-p${playerNum}`}
          type="text"
          value={name}
          onChange={(e) => setPlayerName(playerNum, e.target.value)}
          onFocus={(e) => e.target.select()}
          className="bg-surface-inset text-text-primary rounded-panel px-3 h-12 text-base border border-border-subtle focus:outline-none focus:border-accent transition-colors"
          placeholder={`Player ${playerNum}`}
        />
      </div>

      {/* Roster picker trigger */}
      <div className="flex flex-col gap-1">
        <span className="text-sm text-text-secondary">Army Roster</span>
        <button
          onClick={() => setPickerOpen(true)}
          className={`h-12 px-3 rounded-panel border text-left text-base transition-colors
            ${selectedRoster
              ? 'bg-accent-muted border-accent text-accent font-medium'
              : 'bg-surface-inset border-border-subtle text-text-muted hover:border-border-strong'
            }`}
        >
          {selectedRoster ? selectedRoster.label : 'Select roster…'}
        </button>
        {selectedRoster && (
          <span className="text-xs text-text-muted px-1">
            {selectedRoster.faction ?? '—'}{selectedRoster.detachment ? ` — ${selectedRoster.detachment}` : ''}
          </span>
        )}
      </div>

      <RosterPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelect}
        rosters={rosters}
        selectedLabel={rosterLabel}
      />
    </div>
  );
}

export function SetupScreen({ onShowModeModal }) {
  const p1              = useGameStore((s) => s.players[1]);
  const p2              = useGameStore((s) => s.players[2]);
  const startGame       = useGameStore((s) => s.startGame);
  const fetchRosters    = useGameStore((s) => s.fetchRosters);
  const rostersLoaded   = useGameStore((s) => s.rostersLoaded);
  const rosters         = useGameStore((s) => s.rosters);
  const p1RosterLabel   = useGameStore((s) => s.player1RosterLabel);
  const p2RosterLabel   = useGameStore((s) => s.player2RosterLabel);

  useEffect(() => {
    if (!rostersLoaded) fetchRosters();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const canStart =
    p1.name.trim() !== '' && p1RosterLabel !== null &&
    p2.name.trim() !== '' && p2RosterLabel !== null;

  const noRosters = rostersLoaded && rosters.length === 0;

  return (
    <div className="relative min-h-screen bg-surface-base text-text-primary flex flex-col p-4 gap-6">
      {onShowModeModal && (
        <button
          onPointerDown={(e) => { e.preventDefault(); onShowModeModal(); }}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-surface-panel border border-border-subtle text-chrome hover:text-text-primary hover:border-border-strong transition-colors"
          aria-label="Switch device mode"
        >
          <SlidersHorizontal size={16} />
        </button>
      )}
      <h1 className="font-display text-2xl font-bold text-center text-text-primary">Game Setup</h1>

      {/* Player columns */}
      <div className="flex flex-col md:flex-row gap-4">
        <PlayerSetupColumn playerNum={1} accentBorderClass="border-accent" />
        <PlayerSetupColumn playerNum={2} accentBorderClass="border-danger" />
      </div>

      {/* No rosters hint */}
      {noRosters && (
        <p className="text-sm text-text-muted text-center">
          Upload a roster in the Army tab to get started.
        </p>
      )}

      {/* Start Game */}
      <button
        onPointerDown={(e) => { e.preventDefault(); if (canStart) startGame(); }}
        disabled={!canStart}
        className={`h-14 rounded-panel text-base font-semibold transition-colors
          ${canStart
            ? 'bg-accent hover:bg-accent-hover text-accent-foreground cursor-pointer'
            : 'bg-surface-inset text-text-muted cursor-not-allowed'
          }`}
      >
        {canStart ? 'Start Game' : 'Select a roster for each player to continue'}
      </button>
    </div>
  );
}
