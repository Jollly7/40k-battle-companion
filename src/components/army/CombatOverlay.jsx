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
  const bodyguardKey = `${payload.rosterLabel}:${payload.unitIndex}`;
  const leaderKey = payload.leaderUnitIndex != null ? `${payload.rosterLabel}:${payload.leaderUnitIndex}` : null;
  return { unit, leader, rules, displayName: payload.displayName, leaderDisplayName: payload.leaderDisplayName, bodyguardKey, leaderKey };
}

// Returns modelProfiles for a unit, synthesising a single entry from unit.stats for legacy rosters.
function getEffectiveProfiles(unit) {
  if (unit.modelProfiles?.length > 0) return unit.modelProfiles;
  return [{
    id: unit.name ?? 'unit',
    name: unit.name ?? 'Unit',
    count: 1,
    stats: { M: unit.stats.M, T: unit.stats.T, SV: unit.stats.SV, W: unit.stats.W, LD: unit.stats.LD, OC: unit.stats.OC },
    invuln: unit.stats.invuln ?? null,
    fnp: null,
  }];
}

// Recompute weapon counts based on casualties; sets _depleted:true when remaining reaches 0.
// Weapons without sources (legacy rosters) pass through unchanged.
function recomputeWeaponQuantities(weapons, unitKey, casualties) {
  return weapons.map(w => {
    if (!w.sources?.length) return w;
    const remaining = w.sources.reduce(
      (sum, src) => sum + Math.max(0, src.qty - (casualties[`${unitKey}:${src.profileId}`] ?? 0)),
      0,
    );
    return remaining === 0 ? { ...w, count: 0, _depleted: true } : { ...w, count: remaining };
  });
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

function AttackerCard({ data, onClose }) {
  const [activeAbility, setActiveAbility] = useState(null);
  const [activeKeyword, setActiveKeyword] = useState(null);
  const casualties = useGameStore(s => s.casualties);
  const { unit, leader, rules, displayName, leaderDisplayName, bodyguardKey, leaderKey } = data;
  if (!unit) return null;

  const sv = unit.stats.invuln ? `${unit.stats.SV} (${unit.stats.invuln})` : unit.stats.SV;

  const bgRanged  = recomputeWeaponQuantities(unit.ranged ?? [], bodyguardKey, casualties);
  const bgMelee   = recomputeWeaponQuantities(unit.melee ?? [], bodyguardKey, casualties);
  const ldrRanged = leader ? recomputeWeaponQuantities((leader.ranged ?? []).map(w => ({ ...w, _isLeader: true })), leaderKey, casualties) : [];
  const ldrMelee  = leader ? recomputeWeaponQuantities((leader.melee ?? []).map(w => ({ ...w, _isLeader: true })), leaderKey, casualties) : [];
  const combinedRanged = [...bgRanged,  ...ldrRanged];
  const combinedMelee  = [...bgMelee,   ...ldrMelee];

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
            onClick={onClose}
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
  const casualties     = useGameStore(s => s.casualties);
  const removeCasualty = useGameStore(s => s.removeCasualty);
  const addCasualty    = useGameStore(s => s.addCasualty);
  const { unit, leader, displayName, leaderDisplayName, bodyguardKey, leaderKey } = data;
  if (!unit) return null;

  // Build combined profile rows: bodyguard profiles, then leader profiles
  const profileRows = [
    ...getEffectiveProfiles(unit).map(p => ({ ...p, unitKey: bodyguardKey, isLeader: false })),
    ...(leader ? getEffectiveProfiles(leader).map(p => ({ ...p, unitKey: leaderKey, isLeader: true })) : []),
  ];

  return (
    <div
      className="w-full max-w-[560px] max-h-[calc(100vh-6rem)] flex flex-col bg-surface-panel rounded-xl shadow-2xl border border-border-subtle border-l-4 border-l-success overflow-hidden"
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="shrink-0 px-4 pt-3 pb-2 border-b border-border-subtle bg-surface-panel">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            {leaderDisplayName && (
              <div className="text-xs font-semibold text-amber-400 truncate">{leaderDisplayName}</div>
            )}
            <div className="text-base font-bold text-success truncate">{displayName}</div>
            <div className="text-[10px] text-text-muted uppercase tracking-widest mt-0.5">🛡 Defender</div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 text-text-muted hover:text-text-primary min-w-[48px] min-h-[48px] flex items-center justify-center text-lg"
            aria-label="Close defender card"
          >
            ✕
          </button>
        </div>

        {/* Per-model-type defensive stat table */}
        <table className="w-full text-[10px] border-collapse table-fixed">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="text-left pb-1 font-normal text-white/40 w-[20%]">Name</th>
              <th className="pb-1 px-0.5 font-normal text-white/40 text-center w-[7%]">M</th>
              <th className="pb-1 px-0.5 font-normal text-white/40 text-center w-[6%]">T</th>
              <th className="pb-1 px-0.5 font-normal text-white/40 text-center w-[8%]">Sv</th>
              <th className="pb-1 px-0.5 font-normal text-white/40 text-center w-[6%]">W</th>
              <th className="pb-1 px-0.5 font-normal text-white/40 text-center w-[7%]">Ld</th>
              <th className="pb-1 px-0.5 font-normal text-white/40 text-center w-[6%]">OC</th>
              <th className="pb-1 px-0.5 font-normal text-white/40 text-center w-[9%]">InvSv</th>
              <th className="pb-1 px-0.5 font-normal text-white/40 text-center w-[7%]">FNP</th>
              <th className="w-[14%]" />
            </tr>
          </thead>
          <tbody>
            {profileRows.map((row, i) => {
              const casKey = `${row.unitKey}:${row.id}`;
              const dead = casualties[casKey] ?? 0;
              const remaining = row.count - dead;
              const eliminated = remaining <= 0;
              return (
                <tr key={i} className={`border-b border-border-subtle last:border-0 transition-opacity ${eliminated ? 'opacity-40' : ''}`}>
                  <td className={`py-1 pr-1 leading-tight ${eliminated ? 'line-through' : ''} ${row.isLeader ? 'text-amber-400' : 'text-text-primary'}`}>
                    {row.name} <span className="tabular-nums">×{remaining}</span>
                  </td>
                  <td className="py-1 px-0.5 text-center text-text-secondary tabular-nums">{row.stats.M}</td>
                  <td className="py-1 px-0.5 text-center tabular-nums">
                    <span className="bg-success/20 text-success rounded px-0.5">{row.stats.T}</span>
                  </td>
                  <td className="py-1 px-0.5 text-center text-text-secondary tabular-nums">{row.stats.SV}</td>
                  <td className="py-1 px-0.5 text-center text-text-secondary tabular-nums">{row.stats.W}</td>
                  <td className="py-1 px-0.5 text-center text-text-secondary tabular-nums">{row.stats.LD}</td>
                  <td className="py-1 px-0.5 text-center text-text-secondary tabular-nums">{row.stats.OC}</td>
                  <td className="py-1 px-0.5 text-center tabular-nums">
                    {row.invuln
                      ? <span className="text-amber-400 font-semibold">{row.invuln}</span>
                      : <span className="text-text-muted">–</span>}
                  </td>
                  <td className="py-1 px-0.5 text-center tabular-nums">
                    {row.fnp
                      ? <span className="text-blue-400 font-semibold">{row.fnp}</span>
                      : <span className="text-text-muted">–</span>}
                  </td>
                  <td className="py-1 text-center">
                    <div className="flex items-center justify-center gap-0.5">
                      <button
                        onClick={() => { if (dead > 0) addCasualty(row.unitKey, row.id); }}
                        disabled={dead === 0}
                        className={`w-5 h-5 rounded flex items-center justify-center text-[10px] leading-none transition-colors ${
                          dead === 0 ? 'text-text-muted cursor-not-allowed opacity-30' : 'text-success hover:bg-success/20'
                        }`}
                        aria-label="Restore model"
                      >
                        +
                      </button>
                      <button
                        onClick={() => { if (!eliminated) removeCasualty(row.unitKey, row.id, row.count); }}
                        disabled={eliminated}
                        className={`w-5 h-5 rounded flex items-center justify-center text-[10px] leading-none transition-colors ${
                          eliminated ? 'text-text-muted cursor-not-allowed' : 'text-danger hover:bg-danger/20'
                        }`}
                        aria-label="Remove model"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
        {(!unit.abilities?.length && !unit.unitRules?.length && !leader?.abilities?.length && !leader?.unitRules?.length) && (
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
    return <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm" onClick={clearCombatUnits} />;
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
