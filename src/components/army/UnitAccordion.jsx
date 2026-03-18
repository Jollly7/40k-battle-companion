import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

function WeaponTable({ weapons, wsKey }) {
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
            <td className="py-1 pr-2 text-text-primary break-words">
              {w.name}{w.count > 1 && <span className="text-text-muted ml-1">(x{w.count})</span>}
            </td>
            <td className="py-1 px-1 text-center text-text-secondary tabular-nums">{w.A}</td>
            <td className="py-1 px-1 text-center text-text-secondary tabular-nums">{w[wsKey]}</td>
            <td className="py-1 px-1 text-center tabular-nums">
              <span className="bg-accent/20 text-accent rounded px-0.5">{w.S}</span>
            </td>
            <td className="py-1 px-1 text-center text-text-secondary tabular-nums">{w.AP}</td>
            <td className="py-1 px-1 text-center text-text-secondary tabular-nums">{w.D}</td>
            <td className="py-1 pl-2 text-text-muted break-words">{w.keywords}</td>
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

function CompositionAccordion({ composition }) {
  const [open, setOpen] = useState(false);
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
          {composition.map((model, i) => (
            <li key={i} className="text-xs text-text-secondary">
              <span className="text-text-primary font-medium">{model.count}x {model.name}</span>
              {model.equipment.length > 0 && (
                <span className="text-text-muted">: {model.equipment.join(', ')}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function UnitAccordion({ unit }) {
  const [open, setOpen] = useState(false);
  const [activeAbility, setActiveAbility] = useState(null);
  const { name, stats, ranged, melee, abilities, keywords, composition } = unit;
  const sv = stats.invuln ? `${stats.SV} (${stats.invuln})` : stats.SV;

  const hasAbilities = abilities && abilities.length > 0;
  const hasKeywords = keywords && keywords.length > 0;

  return (
    <div className="border-b border-border-subtle last:border-0">
      {/* Collapsed row — always visible */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 min-h-[48px] text-left hover:bg-surface-panel transition-colors"
      >
        <ChevronRight
          size={14}
          className={`shrink-0 text-text-muted transition-transform ${open ? 'rotate-90' : ''}`}
        />
        <span className="flex-1 text-sm font-medium text-text-primary truncate">{name}</span>
        {/* Stat pills */}
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
      </button>

      {/* Expanded sections */}
      {open && (
        <div className="bg-white/5 border-t border-white/10 px-4 py-3 space-y-4">
          {ranged && ranged.length > 0 && (
            <div>
              <div className="text-xs font-semibold tracking-widest uppercase border-l-2 border-blue-400 pl-2 text-blue-300 mb-1">Ranged</div>
              <WeaponTable weapons={ranged} wsKey="BS" />
            </div>
          )}
          {melee && melee.length > 0 && (
            <div>
              <div className="text-xs font-semibold tracking-widest uppercase border-l-2 border-orange-400 pl-2 text-orange-300 mb-1">Melee</div>
              <WeaponTable weapons={melee} wsKey="WS" />
            </div>
          )}

          {hasAbilities && (
            <div>
              <div className="text-xs font-semibold tracking-widest uppercase border-l-2 border-emerald-400 pl-2 text-emerald-300 mb-1">Abilities</div>
              <div className="flex flex-wrap gap-1">
                {abilities.map((ability, i) => (
                  <button
                    key={i}
                    onPointerDown={() => setActiveAbility(ability)}
                    className="text-[10px] text-text-muted border border-border-subtle rounded px-1 py-0.5 hover:text-accent hover:border-accent transition-colors"
                  >
                    {ability.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {hasKeywords && (
            <div>
              <div className="text-xs font-semibold tracking-widest uppercase border-l-2 border-slate-400 pl-2 text-slate-300 mb-1">Keywords</div>
              <div className="flex flex-wrap gap-1">
                {keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="text-[10px] text-text-muted border border-border-subtle rounded px-1 py-0.5"
                  >
                    [{kw}]
                  </span>
                ))}
              </div>
            </div>
          )}

          {composition && composition.length > 0 && (
            <CompositionAccordion composition={composition} />
          )}
        </div>
      )}

      {activeAbility && (
        <AbilityPopup ability={activeAbility} onClose={() => setActiveAbility(null)} />
      )}
    </div>
  );
}
