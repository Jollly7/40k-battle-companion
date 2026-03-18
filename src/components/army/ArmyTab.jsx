import { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { parseRosterJson } from '../../utils/parseRosterJson';
import { ArmyPanel } from './ArmyPanel';

const LS_ROSTERS_KEY = 'wh40k-imported-rosters';
const LS_SELECTION_KEY = 'wh40k-army-selection';

function loadImportedRosters() {
  try { return JSON.parse(localStorage.getItem(LS_ROSTERS_KEY)) ?? []; } catch { return []; }
}

function saveImportedRosters(rosters) {
  localStorage.setItem(LS_ROSTERS_KEY, JSON.stringify(rosters));
}

function loadSelection() {
  try { return JSON.parse(localStorage.getItem(LS_SELECTION_KEY)) ?? {}; } catch { return {}; }
}

function saveSelection(obj) {
  localStorage.setItem(LS_SELECTION_KEY, JSON.stringify(obj));
}

function RosterControls({ rosters, selectedLabel, onSelect, onImport }) {
  const inputRef = useRef(null);
  const [error, setError] = useState(null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset so the same file can be re-imported
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target.result);
        const roster = parseRosterJson(json);
        setError(null);
        onImport(roster);
      } catch (err) {
        setError('Invalid roster file');
        console.error('Roster parse error:', err);
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="flex items-center gap-2 min-w-0 flex-1">
      <input
        ref={inputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFile}
      />
      {rosters.length > 0 && (
        <select
          value={selectedLabel ?? ''}
          onChange={(e) => onSelect(e.target.value || null)}
          className="flex-1 min-w-0 bg-surface-inset text-text-primary rounded-panel px-2 h-7 text-xs border border-border-subtle focus:outline-none focus:border-accent transition-colors"
        >
          <option value="">— Select list —</option>
          {rosters.map((r) => (
            <option key={r.label} value={r.label}>{r.label}</option>
          ))}
        </select>
      )}
      <button
        onPointerDown={(e) => { e.preventDefault(); inputRef.current?.click(); }}
        className="shrink-0 px-3 h-7 text-xs rounded-panel bg-surface-inset border border-border-subtle text-text-secondary hover:text-text-primary hover:border-accent transition-colors"
      >
        Import .json
      </button>
      {error && <span className="text-xs text-danger truncate">{error}</span>}
    </div>
  );
}

export function ArmyTab({ attackerNum }) {
  const defenderNum = attackerNum === 1 ? 2 : 1;
  const attackerName = useGameStore((s) => s.players[attackerNum].name);
  const defenderName = useGameStore((s) => s.players[defenderNum].name);

  const [rosters, setRosters] = useState(() => loadImportedRosters());
  const [selection, setSelection] = useState(() => {
    const saved = loadSelection();
    return { attacker: saved.attacker ?? null, defender: saved.defender ?? null };
  });

  // If a selected label no longer exists in imported rosters, fall back to null
  useEffect(() => {
    const labels = rosters.map(r => r.label);
    setSelection(prev => ({
      attacker: labels.includes(prev.attacker) ? prev.attacker : null,
      defender: labels.includes(prev.defender) ? prev.defender : null,
    }));
  }, [rosters]);

  function handleSelect(playerKey, label) {
    setSelection(prev => {
      const next = { ...prev, [playerKey]: label };
      saveSelection(next);
      return next;
    });
  }

  function handleImport(playerKey, roster) {
    setRosters(prev => {
      const updated = prev.filter(r => r.label !== roster.label);
      const next = [...updated, roster];
      saveImportedRosters(next);
      return next;
    });
    setSelection(prev => {
      const next = { ...prev, [playerKey]: roster.label };
      saveSelection(next);
      return next;
    });
  }

  function getRoster(label) {
    if (!label) return null;
    return rosters.find(r => r.label === label) ?? null;
  }

  const attackerRoster = getRoster(selection.attacker);
  const defenderRoster = getRoster(selection.defender);

  return (
    <div className="h-full flex overflow-hidden">
      <ArmyPanel
        armyData={attackerRoster}
        accentClass="text-danger"
        label={attackerName}
        isLeft
        importButton={
          <RosterControls
            rosters={rosters}
            selectedLabel={selection.attacker}
            onSelect={(label) => handleSelect('attacker', label)}
            onImport={(r) => handleImport('attacker', r)}
          />
        }
      />
      <ArmyPanel
        armyData={defenderRoster}
        accentClass="text-success"
        label={defenderName}
        isLeft={false}
        importButton={
          <RosterControls
            rosters={rosters}
            selectedLabel={selection.defender}
            onSelect={(label) => handleSelect('defender', label)}
            onImport={(r) => handleImport('defender', r)}
          />
        }
      />
    </div>
  );
}
