import { useArmyRuleData } from '../../hooks/useArmyRuleData';
import { RulesAccordion } from './RulesAccordion';
import { StratagemCard } from './StratagemCard';

export function StratagemsModal({ isOpen, onClose, factionName, detachmentName }) {
  const { coreStratagems, detachmentStratagems } = useArmyRuleData({ factionName, detachmentName });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface-raised rounded-panel shadow-raised border border-border-subtle w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle shrink-0">
          <h2 className="font-display text-lg font-semibold text-text-primary">Stratagems</h2>
          <button
            onClick={onClose}
            className="text-chrome hover:text-chrome-hover text-2xl leading-none w-12 h-12 flex items-center justify-center rounded-panel transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          <RulesAccordion title="Detachment" defaultOpen={true}>
            {detachmentStratagems.length > 0
              ? detachmentStratagems.map(s => <StratagemCard key={s.id} stratagem={s} />)
              : <p className="text-sm text-text-muted">No detachment stratagems found for this army.</p>
            }
          </RulesAccordion>

          <RulesAccordion title="Core" defaultOpen={false}>
            {coreStratagems.map(s => <StratagemCard key={s.id} stratagem={s} />)}
          </RulesAccordion>
        </div>
      </div>
    </div>
  );
}
