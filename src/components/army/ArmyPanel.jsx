import { useGameStore } from '../../store/gameStore';
import { UnitAccordion } from './UnitAccordion';

export function ArmyPanel({ armyData, accentClass, label, isLeft, importButton, playerNum }) {
  const divider = isLeft ? 'border-r border-border-subtle' : '';
  const hasUnits = armyData?.units?.length > 0;

  // Detachment from roster data; fall back to store value if not in roster
  const storeDetachment = useGameStore((s) => {
    // Find the player whose name matches label — used only as fallback
    const p1 = s.players[1];
    const p2 = s.players[2];
    if (p1.name === label) return p1.detachment;
    if (p2.name === label) return p2.detachment;
    return null;
  });

  const faction = armyData?.faction ?? null;
  const detachment = armyData?.detachment ?? storeDetachment ?? null;

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
        {hasUnits ? (
          armyData.units.map((unit, i) => (
            <UnitAccordion key={i} unit={unit} />
          ))
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-text-muted">No army list loaded</p>
          </div>
        )}
      </div>
    </div>
  );
}
