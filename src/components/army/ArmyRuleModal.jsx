import { useArmyRuleData } from '../../hooks/useArmyRuleData';
import { renderWahapediaHtml } from '../../utils/renderWahapediaHtml';

function RuleEntry({ name, legend, description }) {
  const rendered = renderWahapediaHtml(description);
  return (
    <div className="flex flex-col gap-1">
      <div className="font-display font-semibold text-text-primary text-sm">{name}</div>
      {legend && <div className="text-xs text-text-secondary italic">{legend}</div>}
      {rendered && (
        <div
          className="wh-content text-xs text-text-primary leading-relaxed"
          dangerouslySetInnerHTML={{ __html: rendered }}
        />
      )}
    </div>
  );
}

export function ArmyRuleModal({ isOpen, onClose, factionName, detachmentName }) {
  const { factionAbilities, detachmentAbility } = useArmyRuleData({ factionName, detachmentName });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface-raised rounded-panel shadow-raised border border-border-subtle w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle shrink-0">
          <h2 className="font-display text-lg font-semibold text-text-primary">Army Rule</h2>
          <button
            onClick={onClose}
            className="text-chrome hover:text-chrome-hover text-2xl leading-none w-12 h-12 flex items-center justify-center rounded-panel transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-6">
          <section>
            <h3 className="font-display font-semibold text-text-secondary text-xs uppercase tracking-wider mb-3">
              Faction Rule
            </h3>
            {factionAbilities.length > 0
              ? (
                <div className="flex flex-col gap-4">
                  {factionAbilities.map(a => (
                    <RuleEntry key={a.id + a.name} name={a.name} legend={a.legend} description={a.description} />
                  ))}
                </div>
              )
              : <p className="text-sm text-text-muted">No faction rule found for this army.</p>
            }
          </section>

          <section>
            <h3 className="font-display font-semibold text-text-secondary text-xs uppercase tracking-wider mb-3">
              Detachment Rule
            </h3>
            {detachmentAbility
              ? (
                <RuleEntry
                  name={detachmentAbility.name}
                  legend={detachmentAbility.legend}
                  description={detachmentAbility.description}
                />
              )
              : <p className="text-sm text-text-muted">No detachment rule found for this army.</p>
            }
          </section>
        </div>
      </div>
    </div>
  );
}
