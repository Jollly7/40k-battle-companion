import { UnitAccordion } from './UnitAccordion';

export function ArmyPanel({ armyData, accentClass, label, detachment, isLeft, dropdown }) {
  const divider = isLeft ? 'border-r border-border-subtle' : '';
  const hasUnits = armyData?.units?.length > 0;

  return (
    <div className={`flex-1 flex flex-col overflow-hidden bg-surface-base ${divider}`}>
      {/* Panel header */}
      <div className="px-4 py-3 border-b border-border-subtle bg-surface-panel shrink-0">
        <div className="flex items-center gap-3">
          <div className={`font-display text-base font-bold shrink-0 ${accentClass}`}>{label}</div>
          {dropdown}
        </div>
        {armyData && (
          <div className="text-sm text-text-secondary mt-0.5">
            {armyData.faction ?? '—'}{detachment ? ` — ${detachment}` : ''}
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
