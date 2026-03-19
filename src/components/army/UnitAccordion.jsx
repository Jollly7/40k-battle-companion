import { useState } from 'react';
import { ChevronRight, X } from 'lucide-react';

/** Strip trailing number suffix to find base keyword name: "Rapid Fire 1" → "Rapid Fire" */
function lookupKeyword(token, rules) {
  if (!rules) return null;
  const base = token.replace(/\s+\d+$/, '').trim();
  return rules[base] ?? rules[token] ?? null;
}

function KeywordTokens({ keywords, rules, onKeywordClick }) {
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
              onPointerDown={(e) => { e.preventDefault(); onKeywordClick({ name: token, description: desc }); }}
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

function WeaponTable({ weapons, wsKey, rules, onKeywordClick }) {
  if (!weapons || weapons.length === 0) return null;
  return (
    <table className="w-full text-xs border-collapse mt-2 table-fixed">
      <thead>
        <tr className="border-b border-border-subtle">
          <th className="w-[30%] text-left pb-1 pr-2 font-normal text-white/40">Name</th>
          <th className="w-[7%] pb-1 px-1 font-normal text-white/40 text-center">A</th>
          <th className="w-[7%] pb-1 px-1 font-normal text-white/40 text-center">{wsKey}</th>
          <th className="w-[7%] pb-1 px-1 font-normal text-white/40 text-center">S</th>
          <th className="w-[7%] pb-1 px-1 font-normal text-white/40 text-center">AP</th>
          <th className="w-[7%] pb-1 px-1 font-normal text-white/40 text-center">D</th>
          <th className="w-[35%] pb-1 pl-2 font-normal text-white/40 text-left">Keywords</th>
        </tr>
      </thead>
      <tbody>
        {weapons.map((w, i) => (
          <tr key={i} className="border-b border-border-subtle last:border-0">
            <td className={`py-1 pr-2 break-words ${w._isLeader ? 'text-amber-400' : 'text-text-primary'}`}>
              {w.name}{w.count > 1 && <span className="text-text-muted ml-1">(x{w.count})</span>}
            </td>
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

/** Renders BattleScribe markdown: strips ^^ delimiters, renders **text** as <strong>. */
function RenderDescription({ text }) {
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

function AbilityPopup({ ability, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onPointerDown={onClose}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative z-10 bg-surface-panel border border-border-subtle rounded-lg shadow-xl p-4 max-w-md w-[90vw] max-h-[80vh] overflow-y-auto"
        onPointerDown={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-sm font-semibold text-text-primary leading-snug">{ability.name}</h3>
          <button
            onPointerDown={onClose}
            className="shrink-0 text-text-muted hover:text-text-primary text-base leading-none"
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

function CompositionAccordion({ composition, leaderComposition, leaderName }) {
  const [open, setOpen] = useState(false);
  const hasBg = composition && composition.length > 0;
  const hasLdr = leaderComposition && leaderComposition.length > 0;
  if (!hasBg && !hasLdr) return null;

  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
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

/**
 * UnitAccordion
 *
 * Standard mode: unit + displayName + optional character attach controls
 * Merged mode:   unit = bodyguard, leader = { unit, displayName, onDetach }
 */
export function UnitAccordion({ unit, displayName, leader, isCharacter, validBodyguards, onAttach, rules }) {
  const [open, setOpen] = useState(false);
  const [activeAbility, setActiveAbility] = useState(null);
  const [activeKeyword, setActiveKeyword] = useState(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  const isMerged = !!leader;
  const effectiveName = displayName ?? unit.name;
  const { stats, ranged, melee, abilities, keywords, composition } = unit;
  const sv = stats.invuln ? `${stats.SV} (${stats.invuln})` : stats.SV;

  const hasValidBodyguards = isCharacter && validBodyguards && validBodyguards.length > 0;

  // Combined weapons/abilities/keywords for merged mode
  const combinedRanged = isMerged
    ? [...(ranged ?? []), ...(leader.unit.ranged ?? []).map(w => ({ ...w, _isLeader: true }))]
    : (ranged ?? []);
  const combinedMelee = isMerged
    ? [...(melee ?? []), ...(leader.unit.melee ?? []).map(w => ({ ...w, _isLeader: true }))]
    : (melee ?? []);
  const combinedAbilities = isMerged
    ? [...(abilities ?? []), ...(leader.unit.abilities ?? []).map(a => ({ ...a, _isLeader: true }))]
    : (abilities ?? []);
  const bgKeywords = keywords ?? [];
  const leaderKeywords = isMerged ? (leader.unit.keywords ?? []) : [];

  const hasBgComp = composition && composition.length > 0;
  const hasLdrComp = isMerged && leader.unit.composition && leader.unit.composition.length > 0;

  return (
    <div className="border-b border-border-subtle last:border-0">
      {/* Collapsed row */}
      <div
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 min-h-[48px] text-left hover:bg-surface-panel transition-colors cursor-pointer"
      >
        <ChevronRight
          size={14}
          className={`shrink-0 text-text-muted transition-transform ${open ? 'rotate-90' : ''}`}
        />

        {/* Title + detach button */}
        <div className="flex-1 flex items-center gap-1 min-w-0">
          <span className="text-sm font-medium text-text-primary truncate">
            {isMerged ? (
              <>
                {effectiveName}{' '}
                <span className="text-amber-400 font-semibold">+ {leader.displayName}</span>
              </>
            ) : effectiveName}
          </span>
          {isMerged && (
            <div
              className="shrink-0 flex items-center justify-center min-w-[48px] min-h-[48px] text-text-muted hover:text-danger transition-colors cursor-pointer"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); leader.onDetach(); }}
              role="button"
              aria-label="Detach leader"
            >
              <X size={14} />
            </div>
          )}
        </div>

        {/* Attach dropdown for unattached character units */}
        {!isMerged && hasValidBodyguards && (
          <div
            className="relative shrink-0 flex items-center min-h-[48px]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); setShowAttachMenu(v => !v); }}
              className="text-xs px-2 py-1 border border-border-subtle rounded text-text-secondary hover:border-accent hover:text-accent transition-colors"
            >
              Attach ▾
            </button>
            {showAttachMenu && (
              <>
                {/* Backdrop to close menu */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => { e.stopPropagation(); setShowAttachMenu(false); }}
                />
                <div className="absolute right-0 top-full mt-1 z-20 bg-surface-panel border border-border-subtle rounded shadow-lg min-w-[160px]">
                  {validBodyguards.map(({ idx, displayName: bgName }) => (
                    <button
                      key={idx}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); onAttach(idx); setShowAttachMenu(false); }}
                      className="w-full text-left text-xs px-3 py-3 min-h-[48px] hover:bg-surface-inset text-text-primary transition-colors"
                    >
                      {bgName}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Stat pills (bodyguard stats in merged mode) */}
        <div className="flex items-center gap-2 text-xs tabular-nums text-text-secondary shrink-0">
          <span>{stats.M}</span>
          <span>
            <span className="bg-accent/20 text-accent rounded px-0.5">T{stats.T}</span>
          </span>
          <span>{sv}</span>
          <span>W{stats.W}</span>
          <span>{stats.LD}</span>
          <span>OC{stats.OC}</span>
        </div>
      </div>

      {/* Expanded sections */}
      {open && (
        <div className="bg-white/5 border-t border-white/10 px-4 py-3 space-y-4">

          {/* Leader stat row */}
          {isMerged && (
            <div className="border-t border-border-subtle mt-2 pt-2 flex items-center gap-2 text-xs">
              <span className="text-amber-400 font-semibold flex-1 truncate">── {leader.displayName}</span>
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

          {combinedAbilities.length > 0 && (
            <div>
              <div className="text-xs font-semibold tracking-widest uppercase border-l-2 border-emerald-400 pl-2 text-emerald-300 mb-1">Abilities</div>
              <div className="flex flex-wrap gap-1">
                {combinedAbilities.map((ability, i) => (
                  <button
                    key={i}
                    onPointerDown={() => setActiveAbility(ability)}
                    className={`text-[10px] rounded px-1 py-0.5 transition-colors ${
                      ability._isLeader
                        ? 'border border-amber-400 text-amber-400 hover:bg-amber-400/10'
                        : 'text-text-muted border border-border-subtle hover:text-accent hover:border-accent'
                    }`}
                  >
                    {ability.name}
                  </button>
                ))}
              </div>
            </div>
          )}

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
      )}

      {activeAbility && (
        <AbilityPopup ability={activeAbility} onClose={() => setActiveAbility(null)} />
      )}
      {activeKeyword && (
        <AbilityPopup ability={activeKeyword} onClose={() => setActiveKeyword(null)} />
      )}
    </div>
  );
}
