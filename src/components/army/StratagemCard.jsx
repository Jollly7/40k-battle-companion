import { renderWahapediaHtml } from '../../utils/renderWahapediaHtml';

export function StratagemCard({ stratagem }) {
  const rendered = renderWahapediaHtml(stratagem.description);

  return (
    <div className="bg-surface-inset border border-border-subtle rounded-panel px-4 py-3 flex flex-col gap-1.5">
      <div className="flex items-start justify-between gap-2">
        <div className="font-display font-semibold text-text-primary text-sm leading-snug">
          {stratagem.name}
        </div>
        {stratagem.cp_cost !== '' && (
          <span className="shrink-0 bg-accent/20 text-accent text-xs font-semibold px-2 py-0.5 rounded-full">
            {stratagem.cp_cost} CP
          </span>
        )}
      </div>

      {stratagem.type && (
        <div className="text-[11px] text-text-muted">{stratagem.type}</div>
      )}

      {(stratagem.turn || stratagem.phase) && (
        <div className="text-[11px] text-text-secondary">
          {[stratagem.turn, stratagem.phase].filter(Boolean).join(' · ')}
        </div>
      )}

      {rendered && (
        <div
          className="wh-content text-xs text-text-primary leading-relaxed mt-1"
          dangerouslySetInnerHTML={{ __html: rendered }}
        />
      )}
    </div>
  );
}
