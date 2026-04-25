import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import { UnitAccordion } from './UnitAccordion';
import { UnitPopOut } from './UnitPopOut';

/** Normalise for fuzzy matching: lowercase + strip all whitespace. Handles ALL CAPS and missing spaces (e.g. "HANDFLAMERS" vs "Hand Flamers"). */
function normalizeName(s) {
  return s.toLowerCase().replace(/\s+/g, '');
}

export function ArmyPanel({ armyData, accentClass, label, isLeft, importButton, pKey, attachments, setAttachments, elevated, pendingRole, chipData }) {
  const divider = isLeft ? 'border-r border-border-subtle' : '';
  const units = armyData?.units ?? [];
  const hasUnits = units.length > 0;

  const setAttackerUnit = useGameStore(s => s.setAttackerUnit);
  const setDefenderUnit = useGameStore(s => s.setDefenderUnit);

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

  const [deadUnits, setDeadUnits] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('wh40k-dead-units') ?? '{}');
      const result = {};
      for (const [k, v] of Object.entries(raw)) {
        result[k] = new Set(Array.isArray(v) ? v : []);
      }
      return result;
    } catch { return {}; }
  });

  const [selectedUnitIndex, setSelectedUnitIndex] = useState(null);

  useEffect(() => {
    try {
      const current = JSON.parse(localStorage.getItem('wh40k-dead-units') ?? '{}');
      for (const [k, v] of Object.entries(deadUnits)) {
        current[k] = [...v];
      }
      localStorage.setItem('wh40k-dead-units', JSON.stringify(current));
    } catch {}
  }, [deadUnits]);

  const rosterLabel = armyData?.label ?? null;
  const deadSet = rosterLabel ? (deadUnits[rosterLabel] ?? new Set()) : new Set();

  function handleToggleDead(unitIdx) {
    if (!rosterLabel) return;
    setDeadUnits(prev => {
      const prevSet = new Set(prev[rosterLabel] ?? []);
      if (prevSet.has(unitIdx)) {
        prevSet.delete(unitIdx);
      } else {
        prevSet.add(unitIdx);
      }
      return { ...prev, [rosterLabel]: prevSet };
    });
  }

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
      setSelectedUnitIndex(null);
    }
  }, [armyData?.label]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const grandTotal = units.reduce((sum, u) => sum + (u.pts ?? 0), 0);
  const aliveTotal = units.reduce((sum, u, i) => {
    const bodyguardIdxStr = playerAttachments[String(i)];
    const effectiveIdx = ((u.isCharacter ?? false) && bodyguardIdxStr !== undefined)
      ? Number(bodyguardIdxStr)
      : i;
    return deadSet.has(effectiveIdx) ? sum : sum + (u.pts ?? 0);
  }, 0);
  const showPts = grandTotal > 0;

  function handleAttach(charIdx, bodyguardIdx) {
    setSelectedUnitIndex(null);
    setAttachments(prev => ({
      ...prev,
      [pKey]: { ...(prev[pKey] ?? {}), [String(charIdx)]: String(bodyguardIdx) },
    }));
  }

  function handleDetach(charIdx) {
    setSelectedUnitIndex(null);
    setAttachments(prev => {
      const next = { ...(prev[pKey] ?? {}) };
      delete next[String(charIdx)];
      return { ...prev, [pKey]: next };
    });
  }

  function handleUnitSelect(primaryIdx) {
    if (pendingRole) {
      const item = itemsWithMeta.find(i => i.primaryIdx === primaryIdx);
      if (!item || !rosterLabel) return;
      const payload = {
        rosterLabel,
        unitIndex: item.unitPopOutProps.unitIndex,
        leaderUnitIndex: item.unitPopOutProps.leaderUnitIndex,
        displayName: item.unitPopOutProps.displayName,
        leaderDisplayName: item.unitPopOutProps.leaderDisplayName,
      };
      if (pendingRole === 'attacker') setAttackerUnit(payload);
      else setDefenderUnit(payload);
      return;
    }
    setSelectedUnitIndex(prev => prev === primaryIdx ? null : primaryIdx);
  }

  const itemsWithMeta = [];
  units.forEach((unit, i) => {
    if (attachedBodyguardIndices.has(i)) return;

    const charIdxStr = String(i);
    const bodyguardIdxStr = playerAttachments[charIdxStr];
    const isAttached = bodyguardIdxStr !== undefined;

    if ((unit.isCharacter ?? false) && isAttached) {
      const bodyguardIdx = Number(bodyguardIdxStr);
      const bodyguardUnit = units[bodyguardIdx];
      if (!bodyguardUnit) return;
      const isDead = deadSet.has(bodyguardIdx);
      itemsWithMeta.push({
        primaryIdx: bodyguardIdx,
        isDead,
        unitPopOutProps: {
          unit: bodyguardUnit,
          displayName: displayNames[bodyguardIdx],
          leader: { unit, displayName: displayNames[i] },
          isDead,
          onToggleDead: () => { handleToggleDead(bodyguardIdx); setSelectedUnitIndex(null); },
          unitIndex: bodyguardIdx,
          leaderUnitIndex: i,
          leaderDisplayName: displayNames[i],
        },
        element: (
          <UnitAccordion
            key={i}
            unit={bodyguardUnit}
            displayName={displayNames[bodyguardIdx]}
            leader={{ unit, displayName: displayNames[i], onDetach: () => handleDetach(i) }}
            rules={rules}
            isDead={isDead}
            onSelect={() => handleUnitSelect(bodyguardIdx)}
            onToggleDead={() => handleToggleDead(bodyguardIdx)}
          />
        ),
      });
    } else {
      let validBodyguards;
      if (unit.isCharacter ?? false) {
        validBodyguards = units
          .map((u, idx) => ({ u, idx, displayName: displayNames[idx] }))
          .filter(({ u, idx }) => {
            if (!(unit.leaderOf ?? []).some(n => normalizeName(n) === normalizeName(u.name))) return false;
            const attachedToOther = Object.entries(playerAttachments).some(
              ([cIdxStr, bIdxStr]) => Number(bIdxStr) === idx && cIdxStr !== charIdxStr
            );
            return !attachedToOther;
          });
      }

      const isDead = deadSet.has(i);
      itemsWithMeta.push({
        primaryIdx: i,
        isDead,
        unitPopOutProps: {
          unit,
          displayName: displayNames[i],
          leader: undefined,
          isDead,
          onToggleDead: () => { handleToggleDead(i); setSelectedUnitIndex(null); },
          unitIndex: i,
          leaderUnitIndex: null,
          leaderDisplayName: null,
        },
        element: (
          <UnitAccordion
            key={i}
            unit={unit}
            displayName={displayNames[i]}
            isCharacter={unit.isCharacter ?? false}
            validBodyguards={validBodyguards}
            onAttach={(bgIdx) => handleAttach(i, bgIdx)}
            rules={rules}
            isDead={isDead}
            onSelect={() => handleUnitSelect(i)}
            onToggleDead={() => handleToggleDead(i)}
          />
        ),
      });
    }
  });

  itemsWithMeta.sort((a, b) => {
    if (a.isDead === b.isDead) return a.primaryIdx - b.primaryIdx;
    return a.isDead ? 1 : -1;
  });

  const visibleItems = itemsWithMeta.map(item => item.element);
  const selectedItem = selectedUnitIndex !== null
    ? itemsWithMeta.find(item => item.primaryIdx === selectedUnitIndex) ?? null
    : null;

  return (
    <div className={`flex-1 flex flex-col overflow-hidden bg-surface-base ${divider}${(elevated || chipData) ? ' relative z-[60]' : ''}`}>
      {/* Panel header */}
      <div className="px-4 py-3 border-b border-border-subtle bg-surface-panel shrink-0">
        <div className="flex items-center gap-3">
          <div className={`font-display text-base font-bold shrink-0 ${accentClass}`}>{label}</div>
          {showPts && (
            <span className="text-sm text-text-secondary">{aliveTotal}/{grandTotal} pts</span>
          )}
          {importButton}
        </div>
        {(faction || detachment) && (
          <div className="text-sm text-text-secondary mt-0.5">
            {faction ?? '—'}{detachment ? ` — ${detachment}` : ''}
          </div>
        )}
      </div>

      {/* Pending selection prompt — shown when this panel is the target for auto-set */}
      {pendingRole && (
        <div className="shrink-0 px-4 py-2 text-xs text-center text-text-muted border-b border-border-subtle bg-surface-panel">
          Tap a unit to set as {pendingRole === 'attacker' ? '⚔ Attacker' : '🛡 Defender'}
        </div>
      )}

      {/* Scrollable unit list */}
      <div className="flex-1 overflow-y-auto">
        {hasUnits ? visibleItems : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-text-muted">No army list loaded</p>
          </div>
        )}
      </div>

      {/* Browse pop-out — suppressed when this panel is in pending auto-set mode */}
      {selectedItem && !pendingRole && (
        <UnitPopOut
          {...selectedItem.unitPopOutProps}
          rules={rules}
          roleAccent={accentClass}
          onClose={() => setSelectedUnitIndex(null)}
          onSetAttacker={() => {
            if (rosterLabel) {
              setAttackerUnit({
                rosterLabel,
                unitIndex: selectedItem.unitPopOutProps.unitIndex,
                leaderUnitIndex: selectedItem.unitPopOutProps.leaderUnitIndex,
                displayName: selectedItem.unitPopOutProps.displayName,
                leaderDisplayName: selectedItem.unitPopOutProps.leaderDisplayName,
              });
            }
            setSelectedUnitIndex(null);
          }}
          onSetDefender={() => {
            if (rosterLabel) {
              setDefenderUnit({
                rosterLabel,
                unitIndex: selectedItem.unitPopOutProps.unitIndex,
                leaderUnitIndex: selectedItem.unitPopOutProps.leaderUnitIndex,
                displayName: selectedItem.unitPopOutProps.displayName,
                leaderDisplayName: selectedItem.unitPopOutProps.leaderDisplayName,
              });
            }
            setSelectedUnitIndex(null);
          }}
        />
      )}

      {/* Pending chip — floats centred within this panel when a unit from here is designated but the other hasn't been picked yet */}
      {chipData && (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className={`bg-surface-panel rounded-xl border border-l-4 ${chipData.role === 'attacker' ? 'border-danger' : 'border-success'} shadow-xl px-4 py-3 max-w-[220px] w-full mx-4`}>
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className={`text-xs font-semibold ${chipData.role === 'attacker' ? 'text-danger' : 'text-success'} truncate min-w-0 flex-1`}>
                {chipData.role === 'attacker' ? '⚔' : '🛡'} {chipData.displayName}
              </div>
              <button
                onPointerDown={(e) => { e.preventDefault(); chipData.role === 'attacker' ? setAttackerUnit(null) : setDefenderUnit(null); }}
                className="shrink-0 text-text-muted hover:text-text-primary min-w-[32px] min-h-[32px] flex items-center justify-center text-sm"
                aria-label="Clear selection"
              >
                ✕
              </button>
            </div>
            <div className="text-[10px] text-text-muted leading-snug">
              Tap a unit to set as {chipData.role === 'attacker' ? 'Defender' : 'Attacker'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
