import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export function RulesAccordion({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-border-subtle rounded-panel overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface-panel text-left min-h-[48px]"
        aria-expanded={open}
      >
        <span className="font-display font-semibold text-text-primary text-sm">{title}</span>
        <ChevronDown
          size={18}
          className={`text-text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div className={open ? '' : 'hidden'}>
        <div className="px-4 py-3 grid grid-cols-2 gap-3 bg-surface-base">
          {children}
        </div>
      </div>
    </div>
  );
}
