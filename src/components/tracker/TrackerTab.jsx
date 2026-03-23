import { useEffect, useRef, useState } from 'react';
import { Lock, X } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { SECONDARY_MISSION_IMAGES } from '../../data/missionImages';
import { GENERAL_REMINDERS, FACTION_REMINDERS, DETACHMENT_REMINDERS } from '../../data/reminders';

const PHASE_KEYS = ['command', 'movement', 'shooting', 'charge', 'fight'];

const ROLE_ACCENT = {
  attacker: {
    border:  'border-l-4 border-danger',
    bg:      'bg-danger-muted/20',
    text:    'text-danger',
  },
  defender: {
    border:  'border-l-4 border-success',
    bg:      'bg-success-muted/20',
    text:    'text-success',
  },
};

const VP_COLUMNS = [
  { key: 'primary', label: 'Primary',     longLabel: 'Primary'     },
  { key: 'sec1',    label: 'Sec 1',       longLabel: 'Secondary 1' },
  { key: 'sec2',    label: 'Sec 2',       longLabel: 'Secondary 2' },
];

function VPCell({ playerNum, round, column, value, isCurrentRound, showControls }) {
  const adjustVP = useGameStore((s) => s.adjustVP);

  if (!isCurrentRound) {
    return (
      <span className={`font-display font-medium ${value > 0 ? 'text-text-primary' : 'text-text-muted'}`}>
        {value > 0 ? value : '—'}
      </span>
    );
  }

  if (!showControls) {
    return <span className="font-display font-medium text-text-primary tabular-nums">{value}</span>;
  }

  return (
    <div className="flex items-center justify-center gap-0.5">
      <button
        onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); adjustVP(playerNum, round, column, -1); }}
        disabled={value === 0}
        className="w-10 h-10 rounded-chip bg-surface-inset border border-border-subtle hover:border-border-strong
          disabled:opacity-25 disabled:cursor-not-allowed text-text-primary font-bold flex items-center justify-center
          transition-colors shrink-0 text-sm leading-none"
        aria-label={`Decrease ${column} VP round ${round}`}
      >
        −
      </button>
      <span className="w-6 text-center tabular-nums text-text-primary font-display font-medium text-sm">{value}</span>
      <button
        onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); adjustVP(playerNum, round, column, +1); }}
        className="w-10 h-10 rounded-chip bg-surface-inset border border-border-subtle hover:border-border-strong
          text-text-primary font-bold flex items-center justify-center transition-colors shrink-0 text-sm leading-none"
        aria-label={`Increase ${column} VP round ${round}`}
      >
        +
      </button>
    </div>
  );
}

function VPTable({ playerNum, showControls, currentRound }) {
  const byRound = useGameStore((s) => s.players[playerNum].vp.byRound);

  return (
    <table className="w-full border-collapse bg-surface-raised rounded-panel shadow-panel text-sm">
      <thead>
        <tr className="bg-surface-inset border-b border-border-subtle">
          <th className="text-left pb-1 pt-1 pl-2 font-normal text-text-muted whitespace-nowrap pr-2 w-px uppercase tracking-wider text-xs" />
          {VP_COLUMNS.map((c) => (
            <th key={c.key} className="px-3 pb-1 pt-1 font-normal text-text-secondary text-center text-xs uppercase tracking-wider">
              {showControls ? c.longLabel : c.label}
            </th>
          ))}
          <th className="px-3 pb-1 pt-1 font-normal text-center">
            <span className="flex items-center justify-center gap-0.5 text-text-muted text-xs uppercase tracking-wider">
              <Lock size={9} />{showControls ? 'Challenger' : 'Chall'}
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        {[1, 2, 3, 4, 5].map((r) => {
          const isCurrentRound = r === currentRound;
          const isFutureRound  = r > currentRound;
          const isPastRound    = r < currentRound;
          const rowData        = byRound[r - 1];
          return (
            <tr
              key={r}
              className={`border-b border-border-subtle last:border-0
                ${isCurrentRound ? 'bg-accent-muted' : isPastRound ? 'bg-surface-base' : 'bg-surface-raised'}`}
            >
              <td className={`whitespace-nowrap pr-2 pl-2 font-display font-semibold
                ${isCurrentRound ? 'py-1.5 text-text-primary' : 'py-1 text-text-muted'}`}>
                Round {r}
              </td>
              {VP_COLUMNS.map((c) => (
                <td key={c.key} className="py-1 text-center px-3">
                  {isFutureRound ? (
                    <span className="text-text-muted">—</span>
                  ) : (
                    <VPCell
                      playerNum={playerNum}
                      round={r}
                      column={c.key}
                      value={rowData[c.key]}
                      isCurrentRound={isCurrentRound}
                      showControls={showControls}
                    />
                  )}
                </td>
              ))}
              <td className={`text-center bg-surface-inset px-3 ${isCurrentRound ? 'py-1.5' : 'py-1'}`}>
                <span className="text-text-muted">—</span>
              </td>
            </tr>
          );
        })}
        {/* Total row */}
        <tr className="border-t border-border-strong">
          <td className="pl-2 py-1.5 font-display font-bold text-text-primary text-xs uppercase tracking-wide">Total</td>
          {VP_COLUMNS.map((c) => {
            const total = byRound.reduce((sum, r) => sum + (r[c.key] || 0), 0);
            return (
              <td key={c.key} className="py-1.5 text-center font-display font-bold text-accent px-3">
                {total}
              </td>
            );
          })}
          <td className="py-1.5 text-center font-display font-bold text-text-muted bg-surface-inset px-3">—</td>
        </tr>
      </tbody>
    </table>
  );
}

function MiniVPTable({ playerNum, currentRound }) {
  const byRound = useGameStore((s) => s.players[playerNum].vp.byRound);
  return (
    <table className="w-full border-collapse text-xs bg-surface-raised rounded-panel shadow-panel">
      <thead>
        <tr className="bg-surface-inset border-b border-border-subtle">
          <th className="text-left px-1.5 py-1 font-normal text-text-muted w-px" />
          <th className="px-1.5 py-1 font-normal text-text-secondary text-center uppercase tracking-wider">VP</th>
        </tr>
      </thead>
      <tbody>
        {[1, 2, 3, 4, 5].map((r) => {
          const rowData = byRound[r - 1];
          const total   = (rowData.primary || 0) + (rowData.sec1 || 0) + (rowData.sec2 || 0);
          const isFuture  = r > currentRound;
          const isCurrent = r === currentRound;
          return (
            <tr key={r} className={`border-b border-border-subtle last:border-0
              ${isCurrent ? 'bg-accent-muted' : r < currentRound ? 'bg-surface-base' : 'bg-surface-raised'}`}>
              <td className={`px-1.5 py-1 font-display font-semibold whitespace-nowrap
                ${isCurrent ? 'text-text-primary' : 'text-text-muted'}`}>R{r}</td>
              <td className="px-1.5 py-1 text-center font-display font-medium tabular-nums">
                {isFuture
                  ? <span className="text-text-muted">—</span>
                  : <span className="text-text-primary">{total}</span>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// Individual card in the draw modal grid
function DrawModalCard({ cardName, onSelect }) {
  const [imgError, setImgError] = useState(false);
  const imgSrc = SECONDARY_MISSION_IMAGES[cardName];
  const hasImage = imgSrc && !imgError;

  return (
    <button
      onClick={() => onSelect(cardName)}
      className="flex flex-col items-center gap-1.5 p-1.5 rounded-panel border border-border-subtle
        bg-surface-panel hover:border-border-strong hover:bg-surface-inset transition-colors group"
    >
      {hasImage ? (
        <img
          src={imgSrc}
          alt={cardName}
          onError={() => setImgError(true)}
          className="w-32 aspect-[7/10] object-cover rounded-chip shrink-0
            group-hover:opacity-90 transition-opacity"
        />
      ) : (
        <div className="w-32 aspect-[7/10] flex items-center justify-center rounded-chip
          bg-surface-inset text-xs text-text-muted text-center p-2 leading-tight shrink-0">
          {cardName}
        </div>
      )}
      <span className="text-xs text-text-secondary text-center leading-tight px-0.5 w-full line-clamp-2">
        {cardName}
      </span>
    </button>
  );
}

// Draw modal — no backdrop-click-to-close per spec
function DrawModal({ deck, onSelect, onCancel }) {
  const sorted = [...deck].sort();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3">
      <div className="bg-surface-raised border border-border-subtle rounded-panel shadow-raised
        w-full h-full flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border-subtle shrink-0">
          <span className="text-sm font-semibold text-text-primary">Draw Secondary Card</span>
          <button
            onClick={onCancel}
            className="w-12 h-12 flex items-center justify-center rounded-panel text-chrome
              hover:text-chrome-hover hover:bg-surface-inset transition-colors"
            aria-label="Cancel"
          >
            <X size={16} />
          </button>
        </div>
        {sorted.length === 0 ? (
          <p className="text-xs text-text-muted p-4 text-center">Deck is empty.</p>
        ) : (
          <div className="overflow-y-auto flex-1 p-3">
            <div className="grid grid-cols-9 gap-2">
              {sorted.map((card) => (
                <DrawModalCard key={card} cardName={card} onSelect={onSelect} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// A single secondary card slot — empty shows Draw button, filled shows image + Discard
function SecondaryCardSlot({ cardName, onDraw, onDiscard }) {
  const [imgError, setImgError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [cardRect, setCardRect] = useState(null);
  const imgRef = useRef(null);

  const imgSrc = cardName ? SECONDARY_MISSION_IMAGES[cardName] : null;
  const hasImage = imgSrc && !imgError;

  const openLightbox = (e) => {
    e.stopPropagation();
    if (imgRef.current) setCardRect(imgRef.current.getBoundingClientRect());
    setLightboxOpen(true);
  };

  if (!cardName) {
    return (
      <div className="w-[196px] flex flex-col rounded-panel border border-dashed border-border-subtle p-1.5">
        <button
          onClick={(e) => { e.stopPropagation(); onDraw(); }}
          className="flex-1 w-full min-h-[48px] flex items-center justify-center text-xs text-text-muted
            hover:text-text-primary hover:bg-surface-inset transition-colors rounded-panel"
        >
          Draw
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="w-[196px] flex flex-col rounded-panel border border-border-subtle
        bg-surface-panel p-1.5">
        {hasImage ? (
          <img
            ref={imgRef}
            src={imgSrc}
            alt={cardName}
            onError={() => setImgError(true)}
            onClick={openLightbox}
            className="w-full h-14 object-cover object-top rounded-chip cursor-pointer shrink-0
              hover:opacity-90 active:opacity-75 transition-opacity"
          />
        ) : (
          <div className="w-full h-7 flex items-center justify-center rounded-chip bg-surface-inset shrink-0
            text-xs text-text-muted text-center p-1 leading-tight overflow-hidden">
            {cardName}
          </div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDiscard(); }}
          className="w-full min-h-[48px] rounded-panel bg-surface-inset border border-border-subtle
            hover:border-border-strong text-xs text-text-muted hover:text-text-primary transition-colors mt-2 shrink-0"
        >
          Discard
        </button>
      </div>

      {lightboxOpen && hasImage && (() => {
        const dx = cardRect
          ? Math.round(cardRect.left + cardRect.width / 2 - window.innerWidth / 2) : 0;
        const dy = cardRect
          ? Math.round(cardRect.top + cardRect.height / 2 - window.innerHeight / 2) : 0;
        const scale = cardRect
          ? (cardRect.height / window.innerHeight).toFixed(3) : '0.12';
        return (
          <>
            <style>{`
              @keyframes secCardPopOut {
                from { transform: translate(${dx}px, ${dy}px) scale(${scale}); opacity: 0.6; }
                to   { transform: translate(0, 0) scale(1); opacity: 1; }
              }
            `}</style>
            <div
              className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-8"
              onClick={() => setLightboxOpen(false)}
            >
              <img
                src={imgSrc}
                alt={cardName}
                className="max-h-full max-w-full object-contain rounded-2xl shadow-raised"
                style={{ animation: 'secCardPopOut 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
              />
            </div>
          </>
        );
      })()}
    </>
  );
}

function PlayerTrackerPanel({ playerNum, isAttacker, isActive, isExpanded, isShrunk, onExpand, onCollapse, onActiveClick }) {
  const player      = useGameStore((s) => s.players[playerNum]);
  const round       = useGameStore((s) => s.round);
  const currentPhase = useGameStore((s) => s.currentPhase);
  const adjustCP    = useGameStore((s) => s.adjustCP);
  const hand        = useGameStore((s) => s.hand[`p${playerNum}`]);
  const drawCard    = useGameStore((s) => s.drawCard);
  const discardCard = useGameStore((s) => s.discardCard);
  const accent      = ROLE_ACCENT[isAttacker ? 'attacker' : 'defender'];
  const showControls        = isActive || isExpanded;
  const isCollapsedInactive = !isActive && !isExpanded;

  const [drawModal, setDrawModal] = useState(null); // null | { slot: 0|1 }

  return (
    <>
      {drawModal !== null && (
        <DrawModal
          deck={player.secondaryDeck}
          onSelect={(cardName) => { drawCard(playerNum, drawModal.slot, cardName); setDrawModal(null); }}
          onCancel={() => setDrawModal(null)}
        />
      )}

      <div
        className={`relative h-full w-full flex flex-col overflow-hidden select-none bg-surface-panel
          ${isActive ? `${accent.border} ${accent.bg}` : 'border-l border-border-subtle'}
          ${isCollapsedInactive ? 'cursor-pointer' : ''}`}
        onClick={isCollapsedInactive ? onExpand : (isActive && onActiveClick ? onActiveClick : undefined)}
      >
        {/* Collapse button — expanded inactive only */}
        {isExpanded && (
          <button
            onClick={(e) => { e.stopPropagation(); onCollapse(); }}
            className="absolute top-2 right-2 z-10 w-12 h-12 flex items-center justify-center
              rounded-panel text-text-muted hover:text-text-primary hover:bg-surface-inset transition-colors"
            title="Collapse"
          >
            <X size={18} />
          </button>
        )}

        {/* Player name strip */}
        <div className={`px-3 py-2 border-b border-border-subtle shrink-0 ${accent.text}`}>
          <div className="flex items-center gap-2">
            <span className="font-display text-lg font-semibold truncate">{player.name}</span>
            {isActive && <span className="text-xs font-normal opacity-60 shrink-0">active</span>}
          </div>
          {(player.faction || player.detachment) && (
            <div className="text-xs text-text-muted mt-0.5 truncate">
              {[player.faction, player.detachment].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto min-h-0 p-3 flex flex-col gap-4">

          {(isCollapsedInactive || isShrunk) ? (
            <>
              <div className="flex items-center justify-around px-1 py-1.5 bg-surface-raised rounded-panel border border-border-subtle text-sm shrink-0">
                <div className="flex flex-col items-center gap-0.5 min-w-0">
                  <span className="text-xs text-text-muted uppercase tracking-wider leading-none">CP</span>
                  <span className="font-display font-bold text-text-primary tabular-nums leading-none">{player.cp}</span>
                </div>
                <div className="w-px h-6 bg-border-subtle shrink-0" />
                <div className="flex flex-col items-center gap-0.5 min-w-0">
                  <span className="text-xs text-text-muted uppercase tracking-wider leading-none">VP</span>
                  <span className="font-display font-bold text-text-primary tabular-nums leading-none">{player.vp.total}</span>
                </div>
              </div>
              <button
                onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); adjustCP(playerNum, -1); }}
                onClick={(e) => e.stopPropagation()}
                disabled={player.cp === 0}
                className="w-12 h-12 self-center rounded-panel bg-surface-inset border border-border-subtle
                  hover:bg-surface-panel hover:border-border-strong disabled:opacity-25
                  disabled:cursor-not-allowed text-lg font-bold text-text-primary flex items-center
                  justify-center transition-colors shrink-0"
                aria-label="Spend CP"
              >
                −
              </button>
              <MiniVPTable playerNum={playerNum} currentRound={round} />
            </>
          ) : (
            <>
              {/* Upper row: CP + VP totals (left) | Secondary cards (right) */}
              <div className="flex gap-3 items-start">
                {/* Left column: CP + VP totals */}
                <div className="flex flex-col gap-4 flex-1 min-w-0">
                  {/* CP section */}
                  <div className="flex items-center gap-3 py-1">
                    <div className="flex items-end gap-2">
                      <span className="text-base font-semibold text-text-secondary uppercase tracking-wider shrink-0">CP</span>
                      <span className="font-display text-6xl font-bold text-text-primary tabular-nums leading-none w-14">{player.cp}</span>
                    </div>
                    {showControls && (
                      <div className="flex gap-2 ml-1">
                        <button
                          onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); adjustCP(playerNum, -1); }}
                          disabled={player.cp === 0}
                          className="w-14 h-14 rounded-panel bg-surface-inset border border-border-subtle
                            hover:bg-surface-panel hover:border-border-strong disabled:opacity-25
                            disabled:cursor-not-allowed text-xl font-bold text-text-primary flex items-center
                            justify-center transition-colors shrink-0"
                          aria-label="Spend CP"
                        >
                          −
                        </button>
                        <button
                          onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); adjustCP(playerNum, +1); }}
                          className="w-14 h-14 rounded-panel bg-surface-inset border border-border-subtle
                            hover:bg-surface-panel hover:border-border-strong text-xl font-bold
                            text-text-primary flex items-center justify-center transition-colors shrink-0"
                          aria-label="Gain CP"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>

                  {/* VP total */}
                  <div className="flex items-center gap-2 py-1">
                    <div className="flex items-end gap-2">
                      <span className="text-base font-semibold text-text-secondary uppercase tracking-wider">VP</span>
                      <span className="font-display text-6xl font-bold text-text-primary tabular-nums leading-none">{player.vp.total}</span>
                    </div>
                    <div className="flex flex-col items-start text-sm text-text-muted tabular-nums leading-tight">
                      <span>{player.vp.primary} Pri</span>
                      <div className="border-t border-border-subtle w-full my-0.5" />
                      <span>{player.vp.secondary} Sec</span>
                    </div>
                  </div>
                </div>

                {/* Right column: secondary cards */}
                <div className="flex flex-col gap-2 shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted uppercase tracking-wide">Secondary</span>
                    <span className="text-xs text-text-muted ml-2">{player.secondaryDeck.length} left</span>
                  </div>
                  <div className="flex gap-2">
                    {[0, 1].map((slot) => (
                      <SecondaryCardSlot
                        key={slot}
                        cardName={hand[slot]}
                        onDraw={() => setDrawModal({ slot })}
                        onDiscard={() => discardCard(playerNum, slot)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* VP table — full width below */}
              <VPTable playerNum={playerNum} showControls={showControls} currentRound={round} />

              {/* Phase reminders — active player only */}
              {isActive && (
                <PhaseReminders
                  faction={player.faction}
                  detachment={player.detachment}
                  phaseIndex={currentPhase}
                />
              )}
            </>
          )}

        </div>
      </div>
    </>
  );
}

function ReminderList({ items }) {
  return (
    <ul className="flex flex-col gap-1">
      {items.map((r, i) => (
        <li key={i} className="flex items-start gap-1.5 text-sm text-text-secondary leading-snug">
          <span className="shrink-0 mt-1.5 w-1 h-1 rounded-full bg-text-muted" />
          {r.text}
        </li>
      ))}
    </ul>
  );
}

function PhaseReminders({ faction, detachment, phaseIndex }) {
  const phaseKey = PHASE_KEYS[phaseIndex];

  const groups = [
    { label: 'Faction',    items: FACTION_REMINDERS[faction]?.[phaseKey] ?? [] },
    { label: 'Detachment', items: DETACHMENT_REMINDERS[faction]?.[detachment]?.[phaseKey] ?? [] },
    { label: 'General',    items: GENERAL_REMINDERS[phaseKey] ?? [] },
  ].filter((g) => g.items.length > 0);

  if (groups.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-text-muted uppercase tracking-wide">Phase Reminders</span>
      {groups.map((group, gi) => (
        <div key={group.label}>
          {groups.length > 1 && (
            <span className="text-[10px] text-text-muted uppercase tracking-wide">{group.label}</span>
          )}
          <ReminderList items={group.items.map((text) => ({ text }))} />
          {gi < groups.length - 1 && <hr className="border-border-subtle mt-1.5" />}
        </div>
      ))}
    </div>
  );
}

export function TrackerTab({ attackerNum, firstPlayerNum, secondPlayerNum }) {
  const activePlayer = useGameStore((s) => s.activePlayer);
  const firstName    = useGameStore((s) => s.players[firstPlayerNum].name);
  const secondName   = useGameStore((s) => s.players[secondPlayerNum].name);
  const [expandedInactive, setExpandedInactive] = useState(false);
  const [mobileActivePlayer, setMobileActivePlayer] = useState(
    () => activePlayer === firstPlayerNum ? 'first' : 'second'
  );

  // Reset expanded state when the active player changes (turn advances)
  useEffect(() => { setExpandedInactive(false); }, [activePlayer]);
  // Sync mobile active panel with store's active player
  useEffect(() => {
    setMobileActivePlayer(activePlayer === firstPlayerNum ? 'first' : 'second');
  }, [activePlayer, firstPlayerNum]);

  const leftIsActive    = activePlayer === firstPlayerNum;
  const leftIsExpanded  = expandedInactive && !leftIsActive;
  const rightIsExpanded = expandedInactive && leftIsActive;

  // Default: active = 90%, inactive = 10%. Expanded: inactive = 90%, active = 10%.
  const leftFlex  = leftIsExpanded  ? 'flex-[9]' : leftIsActive && !expandedInactive  ? 'flex-[9]' : 'flex-[1]';
  const rightFlex = rightIsExpanded ? 'flex-[9]' : !leftIsActive && !expandedInactive ? 'flex-[9]' : 'flex-[1]';

  const firstIsAttacker  = firstPlayerNum === attackerNum;
  const firstAccentText  = firstIsAttacker ? 'text-danger' : 'text-success';
  const secondAccentText = firstIsAttacker ? 'text-success' : 'text-danger';

  return (
    <>
      {/* Desktop layout */}
      <div className="hidden md:flex h-full overflow-hidden">
        {/* Left: player who goes first */}
        <div className={`flex overflow-hidden transition-[flex] duration-200 ${leftFlex}`}>
          <PlayerTrackerPanel
            playerNum={firstPlayerNum}
            isAttacker={firstIsAttacker}
            isActive={leftIsActive}
            isExpanded={leftIsExpanded}
            isShrunk={leftIsActive && expandedInactive}
            onExpand={() => setExpandedInactive(true)}
            onCollapse={() => setExpandedInactive(false)}
            onActiveClick={expandedInactive ? () => setExpandedInactive(false) : undefined}
          />
        </div>

        {/* Right: player who goes second */}
        <div className={`flex overflow-hidden transition-[flex] duration-200 ${rightFlex}`}>
          <PlayerTrackerPanel
            playerNum={secondPlayerNum}
            isAttacker={!firstIsAttacker}
            isActive={!leftIsActive}
            isExpanded={rightIsExpanded}
            isShrunk={!leftIsActive && expandedInactive}
            onExpand={() => setExpandedInactive(true)}
            onCollapse={() => setExpandedInactive(false)}
            onActiveClick={expandedInactive ? () => setExpandedInactive(false) : undefined}
          />
        </div>
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
            P{firstPlayerNum} · {firstName}
          </button>
          <button
            onPointerDown={(e) => { e.preventDefault(); setMobileActivePlayer('second'); }}
            className={`flex-1 h-12 text-sm font-medium transition-colors
              ${mobileActivePlayer === 'second'
                ? `${secondAccentText} border-b-2 border-current`
                : 'text-chrome'}`}
          >
            P{secondPlayerNum} · {secondName}
          </button>
        </div>

        {/* Both panels always mounted; CSS controls visibility */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className={mobileActivePlayer === 'first' ? 'h-full' : 'hidden'}>
            <PlayerTrackerPanel
              playerNum={firstPlayerNum}
              isAttacker={firstIsAttacker}
              isActive={true}
              isExpanded={false}
              isShrunk={false}
            />
          </div>
          <div className={mobileActivePlayer === 'second' ? 'h-full' : 'hidden'}>
            <PlayerTrackerPanel
              playerNum={secondPlayerNum}
              isAttacker={!firstIsAttacker}
              isActive={true}
              isExpanded={false}
              isShrunk={false}
            />
          </div>
        </div>
      </div>
    </>
  );
}
