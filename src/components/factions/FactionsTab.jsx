import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { GENERAL_REMINDERS, FACTION_REMINDERS, DETACHMENT_REMINDERS } from '../../data/reminders';

const PHASE_NAMES = ['command', 'movement', 'shooting', 'charge', 'fight'];
const PHASE_LABELS = {
  command:  'Command Phase',
  movement: 'Movement Phase',
  shooting: 'Shooting Phase',
  charge:   'Charge Phase',
  fight:    'Fight Phase',
};

function getReminders(faction, detachment) {
  const merged = {};
  for (const phase of PHASE_NAMES) {
    const groups = [
      { label: 'Faction',    items: FACTION_REMINDERS[faction]?.[phase] ?? [] },
      { label: 'Detachment', items: DETACHMENT_REMINDERS[faction]?.[detachment]?.[phase] ?? [] },
      { label: 'General',    items: GENERAL_REMINDERS[phase] ?? [] },
    ].filter((g) => g.items.length > 0);
    if (groups.length) merged[phase] = groups;
  }
  return merged;
}

function FactionColumn({ playerNum, isAttacker, isLeft }) {
  const player     = useGameStore((s) => s.players[playerNum]);
  const accentText = isAttacker ? 'text-danger' : 'text-success';
  const divider    = isLeft ? 'border-r border-border-subtle' : '';

  const reminders = getReminders(player.faction, player.detachment);
  const hasReminders = Object.keys(reminders).length > 0;

  return (
    <div className={`flex-1 flex flex-col overflow-hidden bg-surface-base ${divider}`}>
      {/* Column header */}
      <div className="px-5 py-3 border-b border-border-subtle bg-surface-panel shrink-0">
        <div className={`font-display text-base font-bold ${accentText}`}>{player.name}</div>
        <div className="text-sm text-text-secondary mt-0.5">{player.faction ?? '—'}</div>
        {player.detachment && (
          <div className="text-xs text-text-muted mt-0.5">{player.detachment}</div>
        )}
      </div>

      {/* Scrollable reminders */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">

        {hasReminders ? (
          PHASE_NAMES.map((phase) =>
            reminders[phase] ? (
              <div key={phase}>
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">
                  {PHASE_LABELS[phase]}
                </h3>
                {reminders[phase].map((group, gi) => (
                  <div key={group.label}>
                    {reminders[phase].length > 1 && (
                      <span className="text-[10px] text-text-muted uppercase tracking-wide">{group.label}</span>
                    )}
                    <ul className="flex flex-col gap-1">
                      {group.items.map((text, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-sm text-text-secondary leading-snug">
                          <span className="shrink-0 mt-1.5 w-1 h-1 rounded-full bg-text-muted" />
                          {text}
                        </li>
                      ))}
                    </ul>
                    {gi < reminders[phase].length - 1 && <hr className="border-border-subtle my-1.5" />}
                  </div>
                ))}
              </div>
            ) : null
          )
        ) : (
          <p className="text-sm text-text-muted">Select a faction to see reminders.</p>
        )}

        {/* Add note stub */}
        <button className="flex items-center gap-2 px-3 py-3 rounded-panel border border-dashed border-border-subtle
          text-sm text-text-muted hover:text-text-secondary hover:border-border-strong transition-colors min-h-[48px]">
          <Plus size={14} />
          Add note
        </button>
      </div>
    </div>
  );
}

export function FactionsTab({ firstPlayerNum, secondPlayerNum, attackerNum }) {
  const firstName    = useGameStore((s) => s.players[firstPlayerNum].name);
  const secondName   = useGameStore((s) => s.players[secondPlayerNum].name);
  const firstFaction  = useGameStore((s) => s.players[firstPlayerNum].faction);
  const secondFaction = useGameStore((s) => s.players[secondPlayerNum].faction);
  const [mobileActivePlayer, setMobileActivePlayer] = useState('first');

  const firstIsAttacker  = firstPlayerNum === attackerNum;
  const firstAccentText  = firstIsAttacker ? 'text-danger' : 'text-success';
  const secondAccentText = firstIsAttacker ? 'text-success' : 'text-danger';

  const firstLabel  = `P${firstPlayerNum} · ${firstFaction ?? firstName}`;
  const secondLabel = `P${secondPlayerNum} · ${secondFaction ?? secondName}`;

  return (
    <>
      {/* Desktop layout */}
      <div className="hidden md:flex h-full overflow-hidden">
        <FactionColumn playerNum={firstPlayerNum} isAttacker={firstIsAttacker} isLeft />
        <FactionColumn playerNum={secondPlayerNum} isAttacker={!firstIsAttacker} isLeft={false} />
      </div>

      {/* Mobile layout */}
      <div className="flex flex-col md:hidden h-full overflow-hidden">
        {/* Player toggle bar */}
        <div className="shrink-0 h-12 flex border-b border-border-subtle bg-surface-panel">
          <button
            onPointerDown={(e) => { e.preventDefault(); setMobileActivePlayer('first'); }}
            className={`flex-1 h-12 text-sm font-medium transition-colors
              ${mobileActivePlayer === 'first'
                ? `${firstAccentText} border-b-2 border-current`
                : 'text-chrome'}`}
          >
            {firstLabel}
          </button>
          <button
            onPointerDown={(e) => { e.preventDefault(); setMobileActivePlayer('second'); }}
            className={`flex-1 h-12 text-sm font-medium transition-colors
              ${mobileActivePlayer === 'second'
                ? `${secondAccentText} border-b-2 border-current`
                : 'text-chrome'}`}
          >
            {secondLabel}
          </button>
        </div>

        {/* Both panels always mounted; CSS controls visibility */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className={mobileActivePlayer === 'first' ? 'h-full' : 'hidden'}>
            <FactionColumn playerNum={firstPlayerNum} isAttacker={firstIsAttacker} isLeft={false} />
          </div>
          <div className={mobileActivePlayer === 'second' ? 'h-full' : 'hidden'}>
            <FactionColumn playerNum={secondPlayerNum} isAttacker={!firstIsAttacker} isLeft={false} />
          </div>
        </div>
      </div>
    </>
  );
}
