import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { WeaponTable, AbilitiesSection, AbilityPopup, CompositionAccordion } from './UnitPopOut';

// Resolve unit and leader data from the rosters array given a stored combat unit payload.
function resolveUnit(rosters, payload) {
  if (!payload) return null;
  const roster = rosters.find(r => r.label === payload.rosterLabel);
  if (!roster) return null;
  const unit = roster.units?.[payload.unitIndex] ?? null;
  const leader = payload.leaderUnitIndex != null ? (roster.units?.[payload.leaderUnitIndex] ?? null) : null;
  const rules = roster.rules ?? {};
  return { unit, leader, rules, displayName: payload.displayName, leaderDisplayName: payload.leaderDisplayName };
}

// Compact stat row for attacker card — all six stats, neutral styling
function StatRow({ stats, sv }) {
  const items = [
    { label: 'M',  value: stats.M  },
    { label: 'T',  value: stats.T  },
    { label: 'Sv', value: sv       },
    { label: 'W',  value: stats.W  },
    { label: 'Ld', value: stats.LD },
    { label: 'OC', value: stats.OC },
  ];
  return (
    <div className="grid grid-cols-6 gap-1 my-2">
      {items.map(({ label, value }) => (
        <div key={label} className="flex flex-col items-center rounded px-1 py-1.5 border border-border-subtle">
          <span className="text-[9px] text-text-muted uppercase tracking-wider">{label}</span>
          <span className="text-lg font-bold tabular-nums text-text-primary">{value}</span>
        </div>
      ))}
    </div>
  );
}

// Defender-specific stat display — T, W, and Sv dominate; M, Ld, OC smaller below
function DefenderStatDisplay({ stats, sv }) {
  return (
    <div className="flex flex-col gap-2 my-2">
      <div className="flex gap-2">
        <div className="flex-1 flex flex-col items-center rounded-xl border-2 border-success bg-success/10 py-3">
          <span className="text-[10px] text-text-muted uppercase tracking-widest">Toughness</span>
          <span className="text-5xl font-bold tabular-nums text-text-primary leading-none mt-1">{stats.T}</span>
        </div>
        <div className="flex-1 flex flex-col items-center rounded-xl border-2 border-success bg-success/10 py-3">
          <span className="text-[10px] text-text-muted uppercase tracking-widest">Save</span>
          <span className="text-5xl font-bold tabular-nums text-text-primary leading-none mt-1">{sv}</span>
        </div>
        <div className="flex-1 flex flex-col items-center rounded-xl border-2 border-success bg-success/10 py-3">
          <span className="text-[10px] text-text-muted uppercase tracking-widest">Wounds</span>
          <span className="text-5xl font-bold tabular-nums text-text-primary leading-none mt-1">{stats.W}</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {[
          { label: 'M',  value: stats.M  },
          { label: 'Ld', value: stats.LD },
          { label: 'OC', value: stats.OC },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center rounded px-1 py-1 border border-border-subtle">
            <span className="text-[9px] text-text-muted uppercase">{label}</span>
            <span className="text-base font-bold tabular-nums text-text-primary">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AttackerCard({ data, onClose }) {
  const [activeAbility, setActiveAbility] = useState(null);
  const [activeKeyword, setActiveKeyword] = useState(null);
  const { unit, leader, rules, displayName, leaderDisplayName } = data;
  if (!unit) return null;

  const sv = unit.stats.invuln ? `${unit.stats.SV} (${unit.stats.invuln})` : unit.stats.SV;
  const combinedRanged = leader
    ? [...(unit.ranged ?? []), ...(leader.ranged ?? []).map(w => ({ ...w, _isLeader: true }))]
    : (unit.ranged ?? []);
  const combinedMelee = leader
    ? [...(unit.melee ?? []), ...(leader.melee ?? []).map(w => ({ ...w, _isLeader: true }))]
    : (unit.melee ?? []);

  return (
    <div
      className="w-full max-w-[560px] max-h-[calc(100vh-6rem)] flex flex-col bg-surface-panel rounded-xl shadow-2xl border border-border-subtle border-l-4 border-l-danger overflow-hidden"
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="shrink-0 px-4 pt-3 pb-2 border-b border-border-subtle bg-surface-panel">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {leaderDisplayName && (
              <div className="text-xs font-semibold text-amber-400 truncate">{leaderDisplayName}</div>
            )}
            <div className="text-base font-bold text-danger truncate">{displayName}</div>
            <div className="text-[10px] text-text-muted uppercase tracking-widest mt-0.5">⚔ Attacker</div>
          </div>
          <button
            onPointerDown={(e) => { e.preventDefault(); onClose(); }}
            className="shrink-0 text-text-muted hover:text-text-primary min-w-[48px] min-h-[48px] flex items-center justify-center text-lg"
            aria-label="Close attacker card"
          >
            ✕
          </button>
        </div>
        <StatRow stats={unit.stats} sv={sv} />
      </div>

      {/* Scrollable body — full content, weapons first */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {combinedRanged.length > 0 && (
          <div>
            <div className="text-xs font-semibold tracking-widest uppercase border-l-2 border-blue-400 pl-2 text-blue-300 mb-1">Ranged</div>
            <WeaponTable weapons={combinedRanged} wsKey="BS" rules={rules} onKeywordClick={setActiveKeyword} />
          </div>
        )}
        {combinedMelee.length > 0 && (
          <div>
            <div className="text-xs font-semibold tracking-widest uppercase border-l-2 border-orange-400 pl-2 text-orange-300 mb-1">Melee</div>
            <WeaponTable weapons={combinedMelee} wsKey="WS" rules={rules} onKeywordClick={setActiveKeyword} />
          </div>
        )}
        {combinedRanged.length === 0 && combinedMelee.length === 0 && (
          <p className="text-xs text-text-muted">No weapon profiles found.</p>
        )}
        <AbilitiesSection
          abilities={unit.abilities}
          unitRules={unit.unitRules}
          leaderAbilities={leader?.abilities}
          leaderUnitRules={leader?.unitRules}
          onAbilityClick={setActiveAbility}
        />
        <CompositionAccordion
          composition={unit.composition}
          leaderComposition={leader?.composition}
          leaderName={leaderDisplayName}
        />
      </div>

      {activeAbility && <AbilityPopup ability={activeAbility} onClose={() => setActiveAbility(null)} />}
      {activeKeyword && <AbilityPopup ability={activeKeyword} onClose={() => setActiveKeyword(null)} />}
    </div>
  );
}

function DefenderCard({ data, onClose }) {
  const [activeAbility, setActiveAbility] = useState(null);
  const { unit, leader, rules, displayName, leaderDisplayName } = data;
  if (!unit) return null;

  const sv = unit.stats.invuln ? `${unit.stats.SV} (${unit.stats.invuln})` : unit.stats.SV;
  const leaderSv = leader?.stats
    ? (leader.stats.invuln ? `${leader.stats.SV} (${leader.stats.invuln})` : leader.stats.SV)
    : null;

  return (
    <div
      className="w-full max-w-[560px] max-h-[calc(100vh-6rem)] flex flex-col bg-surface-panel rounded-xl shadow-2xl border border-border-subtle border-l-4 border-l-success overflow-hidden"
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="shrink-0 px-4 pt-3 pb-2 border-b border-border-subtle bg-surface-panel">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {leaderDisplayName && (
              <div className="text-xs font-semibold text-amber-400 truncate">{leaderDisplayName}</div>
            )}
            <div className="text-base font-bold text-success truncate">{displayName}</div>
            <div className="text-[10px] text-text-muted uppercase tracking-widest mt-0.5">🛡 Defender</div>
          </div>
          <button
            onPointerDown={(e) => { e.preventDefault(); onClose(); }}
            className="shrink-0 text-text-muted hover:text-text-primary min-w-[48px] min-h-[48px] flex items-center justify-center text-lg"
            aria-label="Close defender card"
          >
            ✕
          </button>
        </div>

        {/* T, W, Sv dominant + M, Ld, OC below */}
        <DefenderStatDisplay stats={unit.stats} sv={sv} />

        {/* Attached leader secondary stats row */}
        {leader && (
          <div className="flex items-center gap-2 text-xs mt-1 mb-1 flex-wrap">
            <span className="text-amber-400 font-semibold shrink-0">— {leaderDisplayName}</span>
            <div className="flex items-center gap-2 tabular-nums text-text-secondary">
              <span>{leader.stats.M}</span>
              <span>T{leader.stats.T}</span>
              <span>{leaderSv}</span>
              <span>W{leader.stats.W}</span>
              <span>{leader.stats.LD}</span>
              <span>OC{leader.stats.OC}</span>
            </div>
          </div>
        )}
      </div>

      {/* Scrollable body — abilities focus */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        <AbilitiesSection
          abilities={unit.abilities}
          unitRules={unit.unitRules}
          leaderAbilities={leader?.abilities}
          leaderUnitRules={leader?.unitRules}
          onAbilityClick={setActiveAbility}
        />
        {(!unit.abilities?.length && !unit.unitRules?.length) && (
          <p className="text-xs text-text-muted">No abilities found.</p>
        )}
      </div>

      {activeAbility && <AbilityPopup ability={activeAbility} onClose={() => setActiveAbility(null)} />}
    </div>
  );
}

export function CombatOverlay({ rosters, attackerRosterLabel }) {
  const attackerUnit  = useGameStore(s => s.attackerUnit);
  const defenderUnit  = useGameStore(s => s.defenderUnit);
  const setAttackerUnit  = useGameStore(s => s.setAttackerUnit);
  const setDefenderUnit  = useGameStore(s => s.setDefenderUnit);
  const clearCombatUnits = useGameStore(s => s.clearCombatUnits);

  if (!attackerUnit && !defenderUnit) return null;

  const attackerData = resolveUnit(rosters, attackerUnit);
  const defenderData = resolveUnit(rosters, defenderUnit);
  const bothActive   = !!attackerUnit && !!defenderUnit;

  // Left = attacker panel (roster label matches attackerRosterLabel)
  const attackerIsLeft = attackerUnit?.rosterLabel === attackerRosterLabel;

  if (!bothActive) {
    return <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm" />;
  }

  return (
    <>
      {/* Scrim — only rendered when both cards are active */}
      <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm" onClick={clearCombatUnits} />

      {/* Side-by-side cards, large top/bottom padding, small sides/gap */}
      <div className="fixed inset-0 z-[60] flex items-center py-12 px-3 gap-3 pointer-events-none">
        {attackerIsLeft ? (
          <>
            <div className="w-1/2 flex items-center justify-center pointer-events-auto">
              {attackerData && <AttackerCard data={attackerData} onClose={() => setAttackerUnit(null)} />}
            </div>
            <div className="w-1/2 flex items-center justify-center pointer-events-auto">
              {defenderData && <DefenderCard data={defenderData} onClose={() => setDefenderUnit(null)} />}
            </div>
          </>
        ) : (
          <>
            <div className="w-1/2 flex items-center justify-center pointer-events-auto">
              {defenderData && <DefenderCard data={defenderData} onClose={() => setDefenderUnit(null)} />}
            </div>
            <div className="w-1/2 flex items-center justify-center pointer-events-auto">
              {attackerData && <AttackerCard data={attackerData} onClose={() => setAttackerUnit(null)} />}
            </div>
          </>
        )}
      </div>
    </>
  );
}
