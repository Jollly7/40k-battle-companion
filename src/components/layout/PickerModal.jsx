import { useState } from 'react';

// items: Array<{ label: string, imageUrl?: string, separator?: boolean }>
// separator items render as a full-width divider — they are not selectable
export function PickerModal({ title, items, onSelect, onClose, selectedLabel, cardAspect }) {
  const hasImages = items.filter((i) => !i.separator).some((i) => i.imageUrl);
  const [preview, setPreview] = useState(null);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-surface-raised rounded-panel shadow-raised border border-border-subtle w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle shrink-0">
          <h2 className="font-display text-lg font-semibold text-text-primary">{title}</h2>
          <button
            onPointerDown={(e) => { e.preventDefault(); onClose(); }}
            className="text-chrome hover:text-chrome-hover text-2xl leading-none w-12 h-12 flex items-center justify-center rounded-panel transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          {hasImages ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {items.map((item, i) =>
                item.separator
                  ? <div key={`sep-${i}`} className="col-span-full border-t border-border-subtle my-1" />
                  : <ImageCard
                      key={item.label}
                      item={item}
                      onSelect={onSelect}
                      onPreview={cardAspect ? (it) => setPreview(it) : null}
                      selected={item.label === selectedLabel}
                      cardAspect={cardAspect}
                    />
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {items.map((item, i) =>
                item.separator
                  ? <div key={`sep-${i}`} className="col-span-full border-t border-border-subtle my-1" />
                  : (
                    <button
                      key={item.label}
                      onPointerDown={(e) => { e.preventDefault(); onSelect(item.label); }}
                      className={`min-h-12 px-4 py-3 rounded-panel bg-surface-inset border border-border-subtle hover:border-border-strong text-text-primary text-sm text-left transition-colors ${item.label === selectedLabel ? 'ring-2 ring-accent bg-accent-muted' : ''}`}
                    >
                      {item.label}
                    </button>
                  )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen card preview — shown on first tap when cardAspect is set */}
      {preview && (
        <CardPreview
          item={preview}
          onBack={() => setPreview(null)}
          onConfirm={() => { onSelect(preview.label); setPreview(null); }}
        />
      )}
    </div>
  );
}

function CardPreview({ item, onBack, onConfirm }) {
  // Container width = min(height-constrained width for 620:1063 card, viewport width)
  // 8rem accounts for: button h-14 (3.5rem) + gap (0.75rem) + top+bottom py-4 (2rem) + buffer
  const containerStyle = {
    width: 'min(calc((100vh - 8rem) * 620 / 1063), calc(100vw - 2rem))',
  };

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center"
      style={{ zIndex: 60 }}
      onClick={onBack}
    >
      <div
        className="flex flex-col items-stretch gap-3 py-4"
        style={containerStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={item.imageUrl}
          alt={item.label}
          className="w-full h-auto rounded-panel"
          draggable={false}
        />
        <button
          onPointerDown={(e) => { e.preventDefault(); onConfirm(); }}
          className="w-full h-14 rounded-panel bg-accent hover:bg-accent-hover active:bg-accent-hover text-accent-foreground text-base font-semibold transition-colors"
        >
          Confirm — {item.label}
        </button>
      </div>
    </div>
  );
}

function ImageCard({ item, onSelect, onPreview, selected, cardAspect }) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <button
      onClick={() => { onPreview ? onPreview(item) : onSelect(item.label); }}
      className={`relative rounded-panel overflow-hidden bg-surface-inset hover:ring-2 hover:ring-accent/40 active:ring-accent/70 transition-all text-left w-full ${cardAspect ? '' : 'min-h-48'} ${selected ? 'ring-2 ring-accent' : ''}`}
      style={cardAspect ? { aspectRatio: cardAspect } : undefined}
    >
      {/* Background image */}
      {item.imageUrl && !imgFailed && (
        <img
          src={item.imageUrl}
          alt=""
          onError={() => setImgFailed(true)}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      )}

      {/* Name band at bottom — hidden when the image already contains the name */}
      {!item.hideLabel && (
        <div className="absolute inset-x-0 bottom-0 bg-black/65 px-2 py-2">
          <span className="text-text-inverse text-xs font-medium leading-tight block">
            {item.label}
          </span>
        </div>
      )}
    </button>
  );
}
