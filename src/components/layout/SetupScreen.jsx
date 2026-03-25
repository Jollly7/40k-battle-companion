import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { FACTIONS } from '../../data/factions';
import { FACTION_IMAGES } from '../../data/factionImages';
import { useGameStore } from '../../store/gameStore';
import { PickerModal } from './PickerModal';

const PINNED_FACTIONS = ["Genestealer Cults", "Grey Knights", "Orks", "T'au Empire"];

// Space Marine chapters hidden in v1 — only "Space Marines" is shown; chapter data kept in factions.js for future use
const HIDDEN_FACTIONS = [
  "Black Templars",
  "Blood Angels",
  "Dark Angels",
  "Deathwatch",
  "Imperial Fists",
  "Iron Hands",
  "Raven Guard",
  "Salamanders",
  "Ultramarines",
  "White Scars",
];

// Items for the faction grid — pinned factions first, then a separator, then the rest alphabetically
const FACTION_ITEMS = [
  ...PINNED_FACTIONS.map((name) => ({ label: name, imageUrl: FACTION_IMAGES[name], hideLabel: true })),
  { separator: true },
  ...Object.keys(FACTIONS).sort().filter((f) => !PINNED_FACTIONS.includes(f) && !HIDDEN_FACTIONS.includes(f)).map((name) => ({
    label: name,
    imageUrl: FACTION_IMAGES[name],
  })),
];

function PlayerSetupColumn({ playerNum, accentBorderClass }) {
  const name       = useGameStore((s) => s.players[playerNum].name);
  const faction    = useGameStore((s) => s.players[playerNum].faction);
  const detachment = useGameStore((s) => s.players[playerNum].detachment);
  const setPlayerName       = useGameStore((s) => s.setPlayerName);
  const setPlayerFaction    = useGameStore((s) => s.setPlayerFaction);
  const setPlayerDetachment = useGameStore((s) => s.setPlayerDetachment);

  const [showFactionPicker,    setShowFactionPicker]    = useState(false);
  const [showDetachmentPicker, setShowDetachmentPicker] = useState(false);

  const detachmentItems = faction
    ? [...FACTIONS[faction]]
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
        .map((d) => ({ label: d }))
    : [];

  function handleFactionSelect(selectedFaction) {
    setPlayerFaction(playerNum, selectedFaction);
    setShowFactionPicker(false);
    setShowDetachmentPicker(true); // immediately open detachment picker
  }

  function handleDetachmentSelect(selectedDetachment) {
    setPlayerDetachment(playerNum, selectedDetachment);
    setShowDetachmentPicker(false);
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

      {/* Faction trigger */}
      <div className="flex flex-col gap-1">
        <span className="text-sm text-text-secondary">Faction</span>
        <button
          onClick={() => setShowFactionPicker(true)}
          className={`h-12 px-3 rounded-panel border text-left text-base transition-colors
            ${faction
              ? 'bg-accent-muted border-accent text-accent font-medium'
              : 'bg-surface-inset border-border-subtle text-text-muted hover:border-border-strong'
            }`}
        >
          {faction ?? 'Select faction…'}
        </button>
      </div>

      {/* Detachment trigger — only shown once a faction is chosen */}
      {faction && (
        <div className="flex flex-col gap-1">
          <span className="text-sm text-text-secondary">Detachment</span>
          <button
            onClick={() => setShowDetachmentPicker(true)}
            className={`h-12 px-3 rounded-panel border text-left text-base transition-colors
              ${detachment
                ? 'bg-accent-muted border-accent text-accent font-medium'
                : 'bg-surface-inset border-border-subtle text-text-muted hover:border-border-strong'
              }`}
          >
            {detachment ?? 'Select detachment…'}
          </button>
        </div>
      )}

      {/* Faction picker modal */}
      {showFactionPicker && (
        <PickerModal
          title="Select Faction"
          items={FACTION_ITEMS}
          onSelect={handleFactionSelect}
          onClose={() => setShowFactionPicker(false)}
        />
      )}

      {/* Detachment picker modal */}
      {showDetachmentPicker && faction && (
        <PickerModal
          title={`Select Detachment — ${faction}`}
          items={detachmentItems}
          onSelect={handleDetachmentSelect}
          onClose={() => setShowDetachmentPicker(false)}
        />
      )}
    </div>
  );
}

export function SetupScreen({ onShowModeModal }) {
  const p1        = useGameStore((s) => s.players[1]);
  const p2        = useGameStore((s) => s.players[2]);
  const startGame = useGameStore((s) => s.startGame);

  const canStart =
    p1.name.trim() !== '' && p1.faction !== null && p1.detachment !== null &&
    p2.name.trim() !== '' && p2.faction !== null && p2.detachment !== null;

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
        {canStart ? 'Start Game' : 'Complete setup to continue'}
      </button>
    </div>
  );
}
