import { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import { UnitAccordion } from './UnitAccordion';

/** Normalise for fuzzy matching: lowercase + strip all whitespace. Handles ALL CAPS and missing spaces (e.g. "HANDFLAMERS" vs "Hand Flamers"). */
function normalizeName(s) {
  return s.toLowerCase().replace(/\s+/g, '');
}

export function ArmyPanel({ armyData, accentClass, label, isLeft, importButton, pKey, attachments, setAttachments }) {
  const divider = isLeft ? 'border-r border-border-subtle' : '';
  const units = armyData?.units ?? [];
  const hasUnits = units.length > 0;

  // Detachment from roster data; fall back to store value if not in roster
  const storeDetachment = useGameStore((s) => {
    const p1 = s.players[1];
    const p2 = s.players[2];
    if (p1.name === label) return p1.detachment;
    if (p2.name === label) return p2.detachment;
    return null;
  });

  const faction = armyData?.faction ?? null;
  const detachment = armyData?.detachment ?? storeDetachment ?? null;
  const rules = armyData?.rules ?? {};

  // Clear this player's attachments when their roster label changes (skip first render)
  const initializedRef = useRef(false);
  const prevLabelRef = useRef(armyData?.label ?? null);
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }
    const currentLabel = armyData?.label ?? null;
    if (prevLabelRef.current !== currentLabel) {
      prevLabelRef.current = currentLabel;
      setAttachments(prev => ({ ...prev, [pKey]: {} }));
    }
  }, [armyData?.label]); // eslint-disable-line react-hooks/exhaustive-deps

  // Compute display names — duplicate unit names get a numeric suffix
  const nameCounts = {};
  units.forEach(u => { nameCounts[u.name] = (nameCounts[u.name] || 0) + 1; });
  const nameCounters = {};
  const displayNames = units.map(u => {
    if (nameCounts[u.name] === 1) return u.name;
    nameCounters[u.name] = (nameCounters[u.name] || 0) + 1;
    return `${u.name} ${nameCounters[u.name]}`;
  });

  const playerAttachments = (attachments && attachments[pKey]) ? attachments[pKey] : {};
  const attachedBodyguardIndices = new Set(Object.values(playerAttachments).map(Number));

  function handleAttach(charIdx, bodyguardIdx) {
    setAttachments(prev => ({
      ...prev,
      [pKey]: { ...(prev[pKey] ?? {}), [String(charIdx)]: String(bodyguardIdx) },
    }));
  }

  function handleDetach(charIdx) {
    setAttachments(prev => {
      const next = { ...(prev[pKey] ?? {}) };
      delete next[String(charIdx)];
      return { ...prev, [pKey]: next };
    });
  }

  // Build visible items
  const visibleItems = [];
  units.forEach((unit, i) => {
    // Bodyguards that are attached to a leader are rendered inside the merged accordion
    if (attachedBodyguardIndices.has(i)) return;

    const charIdxStr = String(i);
    const bodyguardIdxStr = playerAttachments[charIdxStr];
    const isAttached = bodyguardIdxStr !== undefined;

    if ((unit.isCharacter ?? false) && isAttached) {
      // Merged accordion: bodyguard is the main unit, leader is the character
      const bodyguardIdx = Number(bodyguardIdxStr);
      const bodyguardUnit = units[bodyguardIdx];
      if (!bodyguardUnit) return; // stale attachment — skip
      visibleItems.push(
        <UnitAccordion
          key={i}
          unit={bodyguardUnit}
          displayName={displayNames[bodyguardIdx]}
          leader={{ unit, displayName: displayNames[i], onDetach: () => handleDetach(i) }}
          rules={rules}
        />
      );
    } else {
      // Compute valid bodyguards for the Attach dropdown
      let validBodyguards;
      if (unit.isCharacter ?? false) {
        validBodyguards = units
          .map((u, idx) => ({ u, idx, displayName: displayNames[idx] }))
          .filter(({ u, idx }) => {
            if (!(unit.leaderOf ?? []).some(n => normalizeName(n) === normalizeName(u.name))) return false;
            // Exclude bodyguards already attached to a different character
            const attachedToOther = Object.entries(playerAttachments).some(
              ([cIdxStr, bIdxStr]) => Number(bIdxStr) === idx && cIdxStr !== charIdxStr
            );
            return !attachedToOther;
          });
      }

      visibleItems.push(
        <UnitAccordion
          key={i}
          unit={unit}
          displayName={displayNames[i]}
          isCharacter={unit.isCharacter ?? false}
          validBodyguards={validBodyguards}
          onAttach={(bgIdx) => handleAttach(i, bgIdx)}
          rules={rules}
        />
      );
    }
  });

  return (
    <div className={`flex-1 flex flex-col overflow-hidden bg-surface-base ${divider}`}>
      {/* Panel header */}
      <div className="px-4 py-3 border-b border-border-subtle bg-surface-panel shrink-0">
        <div className="flex items-center gap-3">
          <div className={`font-display text-base font-bold shrink-0 ${accentClass}`}>{label}</div>
          {importButton}
        </div>
        {(faction || detachment) && (
          <div className="text-sm text-text-secondary mt-0.5">
            {faction ?? '—'}{detachment ? ` — ${detachment}` : ''}
          </div>
        )}
      </div>

      {/* Scrollable unit list */}
      <div className="flex-1 overflow-y-auto">
        {hasUnits ? visibleItems : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-text-muted">No army list loaded</p>
          </div>
        )}
      </div>
    </div>
  );
}
