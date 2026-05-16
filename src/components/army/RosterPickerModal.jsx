import { useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { parseRosterJson } from '../../utils/parseRosterJson';

const LS_ROSTERS_KEY = 'wh40k-imported-rosters';

function saveImportedRosters(rosters) {
  localStorage.setItem(LS_ROSTERS_KEY, JSON.stringify(rosters));
}

export function RosterPickerModal({ open, onClose, onSelect, rosters, selectedLabel }) {
  const fetchRosters = useGameStore((s) => s.fetchRosters);
  const setRosters = useGameStore((s) => s.setRosters);
  const inputRef = useRef(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploading, setUploading] = useState(false);

  if (!open) return null;

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const json = JSON.parse(evt.target.result);
        const roster = parseRosterJson(json);
        setUploadError(null);

        // Optimistic update: update localStorage and store immediately
        const current = (() => {
          try { return JSON.parse(localStorage.getItem(LS_ROSTERS_KEY) ?? '[]'); } catch { return []; }
        })();
        const updated = [...current.filter((r) => r.label !== roster.label), roster];
        saveImportedRosters(updated);
        setRosters(updated);

        // Auto-select the newly uploaded roster for this player
        onSelect(roster);
        onClose();

        // Background POST to KV, then re-sync store
        setUploading(true);
        try {
          const res = await fetch('/api/rosters', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roster }),
          });
          if (!res.ok) throw new Error('non-200');
          fetchRosters();
        } catch {
          // KV sync failed — store already updated from localStorage, continue silently
        } finally {
          setUploading(false);
        }
      } catch (err) {
        setUploadError('Invalid roster file');
        console.error('Roster parse error:', err);
      }
    };
    reader.readAsText(file);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface-panel rounded-panel border border-border-subtle shadow-panel w-full max-w-[480px] max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle shrink-0">
          <h2 className="font-display text-base font-semibold text-text-primary">Select Roster</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full text-text-muted hover:text-text-primary transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Roster list */}
        <div className="flex-1 overflow-y-auto">
          {rosters.length === 0 ? (
            <div className="flex items-center justify-center h-24 px-4">
              <p className="text-sm text-text-muted text-center">No rosters found.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {rosters.map((roster) => {
                const isSelected = roster.label === selectedLabel;
                return (
                  <li key={roster.label}>
                    <button
                      onClick={() => { onSelect(roster); onClose(); }}
                      className={`w-full min-h-[64px] px-4 py-3 text-left flex flex-col gap-0.5 transition-colors
                        ${isSelected
                          ? 'bg-accent-muted border-l-4 border-accent'
                          : 'hover:bg-surface-inset border-l-4 border-transparent'
                        }`}
                    >
                      <span className={`text-sm font-semibold ${isSelected ? 'text-accent' : 'text-text-primary'}`}>
                        {roster.label}
                      </span>
                      <span className="text-xs text-text-muted">
                        {roster.faction ?? '—'}{roster.detachment ? ` — ${roster.detachment}` : ''}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Upload button */}
        <div className="px-4 py-3 border-t border-border-subtle shrink-0 flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFile}
          />
          {uploadError && (
            <p className="text-xs text-danger">{uploadError}</p>
          )}
          <button
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="w-full min-h-[48px] px-4 py-2 rounded-panel bg-surface-inset border border-border-subtle text-sm font-medium text-text-secondary hover:text-text-primary hover:border-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading…' : '＋ Upload new roster'}
          </button>
        </div>
      </div>
    </div>
  );
}
