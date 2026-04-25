import { useState } from 'react';
import { ChevronRight, X } from 'lucide-react';

export function UnitAccordion({ unit, displayName, leader, isCharacter, validBodyguards, onAttach, isDead, onSelect, onToggleDead }) {
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  const isMerged = !!leader;
  const effectiveName = displayName ?? unit.name;
  const { stats, composition } = unit;
  const sv = stats.invuln ? `${stats.SV} (${stats.invuln})` : stats.SV;
  const totalModels = composition ? composition.reduce((sum, m) => sum + m.count, 0) : null;
  const displayPts = isMerged
    ? (unit.pts ?? 0) + (leader.unit.pts ?? 0)
    : (unit.pts ?? 0);

  const hasValidBodyguards = isCharacter && validBodyguards && validBodyguards.length > 0;

  return (
    <div className="border-b border-border-subtle last:border-0">
      {/* Collapsed row — tap to open/replace/close pop-out */}
      <div
        onClick={() => onSelect?.()}
        className={`w-full flex items-start gap-2 px-3 py-2 min-h-[48px] text-left hover:bg-surface-panel transition-colors cursor-pointer${isDead ? ' opacity-50' : ''}`}
      >
        <ChevronRight
          size={14}
          className="shrink-0 text-text-muted mt-[3px]"
        />

        {/* Title column */}
        <div className="flex-1 min-w-0 flex flex-col">
          {isMerged ? (
            <>
              <span className="text-sm font-semibold text-amber-400 truncate">{leader.displayName}</span>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-text-primary truncate">
                  {effectiveName}{totalModels > 1 && <span className="text-xs text-text-muted"> x{totalModels}</span>}
                </span>
                <div
                  className="shrink-0 flex items-center justify-center min-w-[48px] text-text-muted hover:text-danger transition-colors cursor-pointer"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); leader.onDetach(); }}
                  role="button"
                  aria-label="Detach leader"
                >
                  <X size={14} />
                </div>
              </div>
              {displayPts > 0 && (
                <span className="text-xs text-text-secondary">{displayPts} pts</span>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-text-primary truncate">{effectiveName}</span>
                {totalModels > 1 && (
                  <span className="text-xs text-text-muted shrink-0">x{totalModels}</span>
                )}
              </div>
              {displayPts > 0 && (
                <span className="text-xs text-text-secondary">{displayPts} pts</span>
              )}
            </>
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
      </div>
    </div>
  );
}
