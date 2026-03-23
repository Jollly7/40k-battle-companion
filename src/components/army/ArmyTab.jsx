import { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { parseRosterJson } from '../../utils/parseRosterJson';
import { ArmyPanel } from './ArmyPanel';

const LS_ROSTERS_KEY = 'wh40k-imported-rosters';
const LS_SELECTION_KEY = 'wh40k-army-selection';
const LS_ATTACHMENTS_KEY = 'wh40k-leader-attachments';

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

function loadAttachments() {
  try {
    const val = JSON.parse(localStorage.getItem(LS_ATTACHMENTS_KEY));
    if (val && typeof val === 'object') return { p1: val.p1 ?? {}, p2: val.p2 ?? {} };
  } catch {}
  return { p1: {}, p2: {} };
}

function saveAttachments(obj) {
  localStorage.setItem(LS_ATTACHMENTS_KEY, JSON.stringify(obj));
}

function RosterControls({ rosters, selectedLabel, onSelect, onImport, syncing, offline, syncError }) {
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
        disabled={syncing}
        onPointerDown={(e) => { e.preventDefault(); if (!syncing) inputRef.current?.click(); }}
        className="shrink-0 px-3 h-7 text-xs rounded-panel bg-surface-inset border border-border-subtle text-text-secondary hover:text-text-primary hover:border-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {syncing ? 'Syncing…' : 'Import .json'}
      </button>
      {offline && <span className="shrink-0 text-xs text-text-secondary">● offline</span>}
      {error && <span className="text-xs text-danger truncate">{error}</span>}
      {syncError && !error && <span className="text-xs text-text-secondary truncate">{syncError}</span>}
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
  const [attachments, setAttachments] = useState(() => loadAttachments());
  const [syncing, setSyncing] = useState(false);
  const [offline, setOffline] = useState(false);
  const [syncError, setSyncError] = useState(null);

  // On mount: fetch rosters from KV; fall back to localStorage on failure
  useEffect(() => {
    setSyncing(true);
    fetch('/api/rosters')
      .then((res) => {
        if (!res.ok) throw new Error('non-200');
        return res.json();
      })
      .then(({ rosters: kvRosters }) => {
        setRosters(kvRosters);
        saveImportedRosters(kvRosters);
        setOffline(false);
      })
      .catch(() => {
        setOffline(true);
      })
      .finally(() => setSyncing(false));
  }, []);

  function updateAttachments(updater) {
    setAttachments(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveAttachments(next);
      return next;
    });
  }

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
    // Save locally and update state immediately — local-first, don't block UI
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
    // Background POST to KV
    fetch('/api/rosters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roster }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('non-200');
        setOffline(false);
        setSyncError(null);
      })
      .catch(() => {
        setSyncError('Sync failed — roster saved locally only');
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
        pKey="p1"
        attachments={attachments}
        setAttachments={updateAttachments}
        importButton={
          <RosterControls
            rosters={rosters}
            selectedLabel={selection.attacker}
            onSelect={(label) => handleSelect('attacker', label)}
            onImport={(r) => handleImport('attacker', r)}
            syncing={syncing}
            offline={offline}
            syncError={syncError}
          />
        }
      />
      <ArmyPanel
        armyData={defenderRoster}
        accentClass="text-success"
        label={defenderName}
        isLeft={false}
        pKey="p2"
        attachments={attachments}
        setAttachments={updateAttachments}
        importButton={
          <RosterControls
            rosters={rosters}
            selectedLabel={selection.defender}
            onSelect={(label) => handleSelect('defender', label)}
            onImport={(r) => handleImport('defender', r)}
            syncing={syncing}
            offline={offline}
            syncError={syncError}
          />
        }
      />
    </div>
  );
}
