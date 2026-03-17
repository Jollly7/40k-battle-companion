import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { ROSTERS } from '../../data/rosters/index.js';
import { ArmyPanel } from './ArmyPanel';

const rosterEntries = Object.entries(ROSTERS);

const LS_KEY = 'wh40k-army-selection';

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) ?? {}; } catch { return {}; }
}

function saveSaved(obj) {
  localStorage.setItem(LS_KEY, JSON.stringify(obj));
}

function RosterDropdown({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex-1 min-w-0 bg-surface-inset text-text-primary rounded-panel px-2 h-7 text-xs border border-border-subtle focus:outline-none focus:border-accent transition-colors"
    >
      <option value="">— Select army list —</option>
      {rosterEntries.map(([key, roster]) => (
        <option key={key} value={key}>{roster.label}</option>
      ))}
    </select>
  );
}

export function ArmyTab({ attackerNum }) {
  const defenderNum = attackerNum === 1 ? 2 : 1;
  const attackerName = useGameStore((s) => s.players[attackerNum].name);
  const defenderName = useGameStore((s) => s.players[defenderNum].name);
  const attackerDetachment = useGameStore((s) => s.players[attackerNum].detachment);
  const defenderDetachment = useGameStore((s) => s.players[defenderNum].detachment);

  const saved = loadSaved();
  const [attackerKey, setAttackerKey] = useState(saved.attacker ?? '');
  const [defenderKey, setDefenderKey] = useState(saved.defender ?? '');

  function handleAttackerChange(key) {
    setAttackerKey(key);
    saveSaved({ ...loadSaved(), attacker: key });
  }

  function handleDefenderChange(key) {
    setDefenderKey(key);
    saveSaved({ ...loadSaved(), defender: key });
  }

  return (
    <div className="h-full flex overflow-hidden">
      <ArmyPanel
        armyData={ROSTERS[attackerKey] ?? null}
        accentClass="text-danger"
        label={attackerName}
        detachment={attackerDetachment}
        isLeft
        dropdown={<RosterDropdown value={attackerKey} onChange={handleAttackerChange} />}
      />
      <ArmyPanel
        armyData={ROSTERS[defenderKey] ?? null}
        accentClass="text-success"
        label={defenderName}
        detachment={defenderDetachment}
        isLeft={false}
        dropdown={<RosterDropdown value={defenderKey} onChange={handleDefenderChange} />}
      />
    </div>
  );
}
