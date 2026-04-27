import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

function lookupKeyword(token, rules) {
  if (!rules) return null;
  const base = token.replace(/\s+\d+$/, '').trim();
  return rules[base] ?? rules[token] ?? null;
}

export function KeywordTokens({ keywords, rules, onKeywordClick }) {
  if (!keywords || keywords === '-') return <span className="text-text-muted">-</span>;
  const tokens = keywords.split(',').map(t => t.trim()).filter(Boolean);
  return (
    <span className="flex flex-wrap gap-1">
      {tokens.map((token, i) => {
        const desc = lookupKeyword(token, rules);
        if (desc) {
          return (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); onKeywordClick({ name: token, description: desc }); }}
              className="text-[10px] rounded px-1 py-0.5 border border-border-subtle text-text-muted hover:text-accent hover:border-accent transition-colors"
            >
              {token}
            </button>
          );
        }
        return (
          <span key={i} className="text-[10px] rounded px-1 py-0.5 border border-border-subtle text-text-muted">
            {token}
          </span>
        );
      })}
    </span>
  );
}

export function WeaponTable({ weapons, wsKey, rules, onKeywordClick }) {
  if (!weapons || weapons.length === 0) return null;
  const isRanged = wsKey === 'BS';
  return (
    <table className="w-full text-xs border-collapse mt-2 table-fixed">
      <thead>
        <tr className="border-b border-border-subtle">
          <th className="w-[30%] text-left pb-1 pr-2 font-normal text-white/40">Name</th>
          {isRanged ? <th className="w-[10%] pb-1 px-1 font-normal text-white/40 text-center">Range</th> : <th className="w-[10%]" />}
          <th className="w-[4%] pb-1 px-1 font-normal text-white/40 text-center">A</th>
          <th className="w-[4%] pb-1 px-1 font-normal text-white/40 text-center">{wsKey}</th>
          <th className="w-[4%] pb-1 px-1 font-normal text-white/40 text-center">S</th>
          <th className="w-[4%] pb-1 px-1 font-normal text-white/40 text-center">AP</th>
          <th className="w-[4%] pb-1 px-1 font-normal text-white/40 text-center">D</th>
          <th className="pb-1 pl-2 font-normal text-white/40 text-left w-[40%]">Keywords</th>
        </tr>
      </thead>
      <tbody>
        {weapons.map((w, i) => (
          <tr key={i} className="border-b border-border-subtle last:border-0">
            <td className={`py-1 pr-2 break-words ${w._isLeader ? 'text-amber-400' : 'text-text-primary'}`}>
              {w.name}{w.count > 1 && <span className="text-text-muted ml-1">(x{w.count})</span>}
            </td>
            {isRanged ? <td className="py-1 px-1 text-center text-text-secondary tabular-nums">{w.range}</td> : <td />}
            <td className="py-1 px-1 text-center text-text-secondary tabular-nums">{w.A}</td>
            <td className="py-1 px-1 text-center text-text-secondary tabular-nums">{w[wsKey]}</td>
            <td className="py-1 px-1 text-center tabular-nums">
              <span className="bg-accent/20 text-accent rounded px-0.5">{w.S}</span>
            </td>
            <td className="py-1 px-1 text-center text-text-secondary tabular-nums">{w.AP}</td>
            <td className="py-1 px-1 text-center text-text-secondary tabular-nums">{w.D}</td>
            <td className="py-1 pl-2">
              <KeywordTokens keywords={w.keywords} rules={rules} onKeywordClick={onKeywordClick} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function RenderDescription({ text }) {
  const cleaned = text.replace(/\^\^/g, '');
  const parts = cleaned.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={i}>{part.slice(2, -2)}</strong>
          : part
      )}
    </>
  );
}

export function AbilityPopup({ ability, onClose }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative z-10 bg-surface-panel border border-border-subtle rounded-lg shadow-xl p-4 max-w-md w-[90vw] max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-sm font-semibold text-text-primary leading-snug">{ability.name}</h3>
          <button
            onPointerDown={(e) => { e.preventDefault(); onClose(); }}
            className="shrink-0 text-text-muted hover:text-text-primary text-base leading-none min-w-[48px] min-h-[48px] flex items-center justify-center"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">
          <RenderDescription text={ability.description} />
        </p>
      </div>
    </div>
  );
}

export function AbilitiesSection({ abilities, unitRules, leaderAbilities, leaderUnitRules, onAbilityClick }) {
  const combined = [
    ...(abilities ?? []),
    ...(unitRules ?? []).map(r => ({ ...r, _isRule: true })),
    ...(leaderAbilities ?? []).map(a => ({ ...a, _isLeader: true })),
    ...(leaderUnitRules ?? []).map(r => ({ ...r, _isRule: true, _isLeader: true })),
  ];
  if (combined.length === 0) return null;
  return (
    <div>
      <div className="text-xs font-semibold tracking-widest uppercase border-l-2 border-emerald-400 pl-2 text-emerald-300 mb-1">Abilities / Rules</div>
      <div className="flex flex-wrap gap-1">
        {combined.map((ability, i) => (
          <button
            key={i}
            onClick={(e) => { e.stopPropagation(); onAbilityClick(ability); }}
            className={`text-[10px] rounded px-1 py-0.5 transition-colors ${
              ability._isEnhancement
                ? 'border border-fuchsia-500 text-fuchsia-400 hover:bg-fuchsia-500/10'
                : ability._isLeader && ability._isRule
                ? 'border border-orange-500 text-orange-400 hover:bg-orange-500/10'
                : ability._isLeader
                ? 'border border-amber-400 text-amber-400 hover:bg-amber-400/10'
                : ability._isRule
                ? 'text-text-muted border border-border-subtle hover:text-accent hover:border-accent'
                : 'border border-teal-500 text-teal-300 hover:bg-teal-500/10'
            }`}
          >
            {ability.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CompositionAccordion({ composition, leaderComposition, leaderName }) {
  const [open, setOpen] = useState(false);
  const hasBg = composition && composition.length > 0;
  const hasLdr = leaderComposition && leaderComposition.length > 0;
  if (!hasBg && !hasLdr) return null;

  return (
    <div>
      <button
        onPointerDown={(e) => { e.preventDefault(); setOpen(v => !v); }}
        className="flex items-center gap-1 text-xs font-semibold tracking-widest uppercase border-l-2 border-violet-400 pl-2 text-violet-300 mb-1 w-full text-left"
      >
        <ChevronRight size={12} className={`shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
        Unit Composition
      </button>
      {open && (
        <ul className="space-y-1 pl-1 mt-1">
          {(composition ?? []).map((model, i) => (
            <li key={i} className="text-xs text-text-secondary">
              <span className="text-text-primary font-medium">{model.count}x {model.name}</span>
              {model.equipment.length > 0 && (
                <span className="text-text-muted">: {model.equipment.join(', ')}</span>
              )}
            </li>
          ))}
          {hasLdr && (
            <>
              <li className="text-xs text-amber-400 font-semibold border-l-2 border-amber-400 pl-1 mt-1">
                {leaderName}
              </li>
              {leaderComposition.map((model, i) => (
                <li key={`ldr-${i}`} className="text-xs text-text-secondary border-l-2 border-amber-400/30 pl-1">
                  <span className="text-text-primary font-medium">{model.count}x {model.name}</span>
                  {model.equipment.length > 0 && (
                    <span className="text-text-muted">: {model.equipment.join(', ')}</span>
                  )}
                </li>
              ))}
            </>
          )}
        </ul>
      )}
    </div>
  );
}

function BrowseStatBlock({ stats, sv }) {
  const statItems = [
    { label: 'M',  value: stats.M  },
    { label: 'T',  value: stats.T  },
    { label: 'Sv', value: sv       },
    { label: 'W',  value: stats.W  },
    { label: 'Ld', value: stats.LD },
    { label: 'OC', value: stats.OC },
  ];
  return (
    <div className="grid grid-cols-6 gap-1.5 my-3">
      {statItems.map(({ label, value }) => (
        <div key={label} className="flex flex-col items-center rounded-lg px-1 py-2 border border-border-subtle">
          <span className="text-[9px] text-text-muted uppercase tracking-wider">{label}</span>
          <span className="text-xl font-bold tabular-nums text-text-primary">{value}</span>
        </div>
      ))}
    </div>
  );
}

export function UnitPopOut({ unit, displayName, leader, rules, roleAccent, isDead, onToggleDead, onClose, onSetAttacker, onSetDefender }) {
  const [activeAbility, setActiveAbility] = useState(null);
  const [activeKeyword, setActiveKeyword] = useState(null);

  const isMerged = !!leader;
  const { stats, ranged, melee, abilities, unitRules, keywords, composition } = unit;
  const sv = stats.invuln ? `${stats.SV} (${stats.invuln})` : stats.SV;
  const accentBorder = roleAccent === 'text-danger' ? 'border-danger' : 'border-success';

  const combinedRanged = isMerged
    ? [...(ranged ?? []), ...(leader.unit.ranged ?? []).map(w => ({ ...w, _isLeader: true }))]
    : (ranged ?? []);
  const combinedMelee = isMerged
    ? [...(melee ?? []), ...(leader.unit.melee ?? []).map(w => ({ ...w, _isLeader: true }))]
    : (melee ?? []);

  const bgKeywords = keywords ?? [];
  const leaderKeywords = isMerged ? (leader.unit.keywords ?? []) : [];
  const hasBgComp = composition && composition.length > 0;
  const hasLdrComp = isMerged && leader.unit.composition && leader.unit.composition.length > 0;

  return (
    <>
      {/* Full-screen scrim */}
      <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      {/* Centred card */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
        <div
          className={`pointer-events-auto w-[90vw] max-w-[560px] max-h-[85vh] flex flex-col bg-surface-panel rounded-xl shadow-2xl border border-border-subtle border-l-4 ${accentBorder} overflow-hidden`}
          onClick={e => e.stopPropagation()}
        >
          {/* Fixed header */}
          <div className="shrink-0 px-4 pt-4 pb-3 border-b border-border-subtle bg-surface-panel">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="min-w-0 flex-1">
                {isMerged ? (
                  <>
                    <div className="text-sm font-semibold text-amber-400 truncate">{leader.displayName}</div>
                    <div className={`text-base font-bold truncate ${roleAccent}`}>{displayName}</div>
                  </>
                ) : (
                  <div className={`text-base font-bold truncate ${roleAccent}`}>{displayName}</div>
                )}
              </div>
              <button
                onClick={onClose}
                className="shrink-0 text-text-muted hover:text-text-primary min-w-[48px] min-h-[48px] flex items-center justify-center text-lg"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <BrowseStatBlock stats={stats} sv={sv} />

            {isMerged && (
              <div className="flex items-center gap-2 text-xs mt-1 mb-1">
                <span className="text-amber-400 font-semibold">── {leader.displayName}</span>
                <div className="flex items-center gap-2 tabular-nums text-text-secondary shrink-0">
                  <span>{leader.unit.stats.M}</span>
                  <span>T{leader.unit.stats.T}</span>
                  <span>
                    {leader.unit.stats.invuln
                      ? `${leader.unit.stats.SV} (${leader.unit.stats.invuln})`
                      : leader.unit.stats.SV}
                  </span>
                  <span>W{leader.unit.stats.W}</span>
                  <span>{leader.unit.stats.LD}</span>
                  <span>OC{leader.unit.stats.OC}</span>
                </div>
              </div>
            )}
          </div>

          {/* Scrollable body */}
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

            <AbilitiesSection
              abilities={abilities}
              unitRules={unitRules}
              leaderAbilities={isMerged ? leader.unit.abilities : undefined}
              leaderUnitRules={isMerged ? leader.unit.unitRules : undefined}
              onAbilityClick={setActiveAbility}
            />

            {(bgKeywords.length > 0 || leaderKeywords.length > 0) && (
              <div>
                <div className="text-xs font-semibold tracking-widest uppercase border-l-2 border-slate-400 pl-2 text-slate-300 mb-1">Keywords</div>
                <div className="flex flex-wrap gap-1">
                  {bgKeywords.map((kw, i) => (
                    <span key={`bg-${i}`} className="text-[10px] text-text-muted border border-border-subtle rounded px-1 py-0.5">
                      [{kw}]
                    </span>
                  ))}
                  {leaderKeywords.map((kw, i) => (
                    <span key={`ldr-${i}`} className="text-[10px] border border-amber-400 text-amber-400 rounded px-1 py-0.5">
                      [{kw}]
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(hasBgComp || hasLdrComp) && (
              <CompositionAccordion
                composition={hasBgComp ? composition : []}
                leaderComposition={hasLdrComp ? leader.unit.composition : null}
                leaderName={isMerged ? leader.displayName : null}
              />
            )}
          </div>

          {/* Fixed footer — action buttons */}
          <div className="shrink-0 px-4 py-3 border-t border-border-subtle bg-surface-panel flex flex-wrap gap-2">
            <button
              onClick={() => { onToggleDead?.(); onClose(); }}
              className={`flex-1 min-w-[120px] text-xs px-3 py-2 rounded border transition-colors min-h-[48px] ${
                isDead
                  ? 'border-success text-success hover:bg-success/10'
                  : 'border-border-subtle text-text-secondary hover:border-danger hover:text-danger'
              }`}
            >
              {isDead ? 'Mark as Active' : 'Mark as Destroyed'}
            </button>
            <button
              onClick={() => onSetAttacker?.()}
              className="flex-1 min-w-[120px] text-xs px-3 py-2 rounded border border-danger/60 text-danger hover:bg-danger/10 transition-colors min-h-[48px]"
            >
              ⚔ Set as Attacker
            </button>
            <button
              onClick={() => onSetDefender?.()}
              className="flex-1 min-w-[120px] text-xs px-3 py-2 rounded border border-success/60 text-success hover:bg-success/10 transition-colors min-h-[48px]"
            >
              🛡 Set as Defender
            </button>
          </div>
        </div>
      </div>

      {activeAbility && <AbilityPopup ability={activeAbility} onClose={() => setActiveAbility(null)} />}
      {activeKeyword && <AbilityPopup ability={activeKeyword} onClose={() => setActiveKeyword(null)} />}
    </>
  );
}
