import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { PRIMARY_MISSIONS, TWISTS } from '../../data/missions';
import { PRIMARY_MISSION_IMAGES, TWIST_IMAGES } from '../../data/missionImages';
import { PickerModal } from './PickerModal';

const MISSION_ITEMS = PRIMARY_MISSIONS.map((m) => ({ label: m, imageUrl: PRIMARY_MISSION_IMAGES[m] }));
const TWIST_ITEMS = [
  { label: 'No Twist' },
  ...TWISTS.map((t) => ({ label: t, imageUrl: TWIST_IMAGES[t] })),
];

// ── Shared card wrapper ────────────────────────────────────────────────────────

function StepCard({ num, title, description, complete, children }) {
  return (
    <div className="bg-surface-panel rounded-panel border border-border-subtle shadow-panel p-2 flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className={`text-sm font-bold w-5 shrink-0 ${complete ? 'text-success' : 'text-text-muted'}`}>
          {complete ? '✓' : `${num}.`}
        </span>
        <div>
          <span className="font-semibold text-text-primary text-sm">{title}</span>
          {description && <span className="text-text-muted text-xs ml-2">{description}</span>}
        </div>
      </div>
      <div className="ml-7">{children}</div>
    </div>
  );
}

// ── Checkbox row ───────────────────────────────────────────────────────────────

function CheckRow({ label, checked, onToggle }) {
  return (
    <button
      onPointerDown={(e) => { e.preventDefault(); onToggle(); }}
      className="flex items-center gap-3 min-h-[48px] w-full text-left select-none"
    >
      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors
        ${checked ? 'bg-success border-success' : 'border-border-strong'}`}
      >
        {checked && <span className="text-text-inverse text-xs leading-none">✓</span>}
      </div>
      <span className={`text-sm ${checked ? 'text-text-muted line-through' : 'text-text-secondary'}`}>{label}</span>
    </button>
  );
}

// ── Roll-off buttons ───────────────────────────────────────────────────────────

function RollOffButtons({ p1Name, p2Name, onSelect }) {
  return (
    <div className="flex gap-2">
      <button
        onPointerDown={(e) => { e.preventDefault(); onSelect(1); }}
        className="flex-1 h-12 rounded-panel bg-accent-muted border border-accent hover:bg-accent/10 text-accent text-sm font-medium transition-colors"
      >
        {p1Name} won
      </button>
      <button
        onPointerDown={(e) => { e.preventDefault(); onSelect(2); }}
        className="flex-1 h-12 rounded-panel bg-danger-muted border border-danger hover:bg-danger/10 text-danger text-sm font-medium transition-colors"
      >
        {p2Name} won
      </button>
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function PreBattleScreen() {
  const p1Name           = useGameStore((s) => s.players[1].name);
  const p2Name           = useGameStore((s) => s.players[2].name);
  const p1Role           = useGameStore((s) => s.players[1].role);
  const p2Role           = useGameStore((s) => s.players[2].role);
  const activePlayer     = useGameStore((s) => s.activePlayer);
  const primaryMission   = useGameStore((s) => s.primaryMission);
  const twist            = useGameStore((s) => s.twist);
  const setPlayerRole    = useGameStore((s) => s.setPlayerRole);
  const setActivePlayer  = useGameStore((s) => s.setActivePlayer);
  const setPrimaryMission = useGameStore((s) => s.setPrimaryMission);
  const setTwist         = useGameStore((s) => s.setTwist);
  const beginBattle      = useGameStore((s) => s.beginBattle);
  const resetGame        = useGameStore((s) => s.resetGame);

  const playerName = (num) => (num === 1 ? p1Name : p2Name);

  // Step 1 — Mission
  const [showMissionPicker, setShowMissionPicker] = useState(false);
  const [showTwistPicker,   setShowTwistPicker]   = useState(false);
  const step1MissionComplete = primaryMission !== null;

  function handleMissionSelect(name) {
    setPrimaryMission(name);
    setShowMissionPicker(false);
  }
  function handleTwistSelect(name) {
    setTwist(name === 'No Twist' ? null : name);
    setShowTwistPicker(false);
  }

  // Step 2 — Attacker/Defender
  const [step1Winner, setStep1Winner] = useState(null);
  const step1Complete = p1Role !== null;

  function handleRoleChoice(choice) {
    const other = step1Winner === 1 ? 2 : 1;
    setPlayerRole(step1Winner, choice);
    setPlayerRole(other, choice === 'attacker' ? 'defender' : 'attacker');
  }
  function resetStep1() {
    setPlayerRole(1, null);
    setPlayerRole(2, null);
    setStep1Winner(null);
  }

  // Step 2 — Declare formations
  const [formationChecks, setFormationChecks] = useState([false, false, false]);
  const step2Complete = formationChecks.every(Boolean);
  function toggleFormation(i) {
    setFormationChecks((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  }

  // Step 3 — Deploy
  const [deployDone, setDeployDone] = useState(false);

  // Step 4 — Redeploy
  const [redeployDone, setRedeployDone] = useState(false);

  // Step 5 — First Turn (winner always goes first — no secondary choice)
  const [step5Winner, setStep5Winner] = useState(null);

  function handleFirstTurnWinner(winner) {
    setStep5Winner(winner);
    setActivePlayer(winner);
  }
  function resetStep5() {
    setStep5Winner(null);
  }

  // Step 6 — Pre-battle rules acknowledgement
  const [preBattleDone, setPreBattleDone] = useState(false);

  const canBegin = step1MissionComplete && step1Complete && step5Winner !== null;

  return (
    <div className="h-screen bg-surface-base text-text-primary flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-2 pb-2 flex items-center justify-between border-b border-border-subtle bg-surface-panel shrink-0">
        <h1 className="font-display text-lg font-semibold text-text-primary">Pre-Battle Setup</h1>
        <button onPointerDown={(e) => { e.preventDefault(); resetGame(); }} className="text-xs text-text-muted hover:text-text-secondary px-3 h-12 rounded-panel transition-colors">
          ↩ Setup
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto py-2 flex justify-center">
        <div className="w-full max-w-[640px] px-2 flex flex-col gap-2">

          {/* ── Step 1: Mission ──────────────────────────────────────────── */}
          <StepCard num={1} title="Mission" description="Select primary mission and optional twist." complete={step1MissionComplete}>
            <div className="flex flex-col gap-2 pb-1">
              <div className="flex gap-2 flex-wrap">
                <div className="flex flex-col gap-1 flex-1 min-w-40">
                  <span className="text-xs text-text-muted">Primary Mission</span>
                  <button
                    onClick={() => setShowMissionPicker(true)}
                    className={`h-12 px-3 rounded-panel border text-left text-sm transition-colors
                      ${primaryMission
                        ? 'bg-accent-muted border-accent text-accent font-medium'
                        : 'bg-surface-inset border-border-subtle text-text-muted hover:border-border-strong'
                      }`}
                  >
                    {primaryMission ?? '— Select mission —'}
                  </button>
                </div>
                <div className="flex flex-col gap-1 flex-1 min-w-40">
                  <span className="text-xs text-text-muted">Twist Card <span className="text-text-muted">(optional)</span></span>
                  <button
                    onClick={() => setShowTwistPicker(true)}
                    className={`h-12 px-3 rounded-panel border text-left text-sm transition-colors
                      ${twist
                        ? 'bg-accent-muted border-accent text-accent font-medium'
                        : 'bg-surface-inset border-border-subtle text-text-secondary hover:border-border-strong'
                      }`}
                  >
                    {twist ?? 'No Twist'}
                  </button>
                </div>
              </div>
            </div>
          </StepCard>

          {/* ── Step 2: Attacker & Defender ──────────────────────────────── */}
          <StepCard num={2} title="Attacker & Defender" description="Roll off — winner chooses role." complete={step1Complete}>
            {step1Complete ? (
              <button
                onPointerDown={(e) => { e.preventDefault(); resetStep1(); }}
                className="w-full text-left text-sm text-text-secondary bg-surface-inset rounded-panel px-3 py-2 min-h-[48px] hover:bg-surface-panel border border-border-subtle transition-colors"
              >
                <span className="text-accent font-medium">{p1Name}</span>
                <span className="text-text-muted mx-1">·</span>
                <span className="capitalize text-text-secondary">{p1Role}</span>
                <span className="text-text-muted mx-2">/</span>
                <span className="text-danger font-medium">{p2Name}</span>
                <span className="text-text-muted mx-1">·</span>
                <span className="capitalize text-text-secondary">{p2Role}</span>
                <span className="ml-3 text-xs text-text-muted">↩ redo</span>
              </button>
            ) : step1Winner === null ? (
              <RollOffButtons p1Name={p1Name} p2Name={p2Name} onSelect={setStep1Winner} />
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-text-secondary">
                  <span className={step1Winner === 1 ? 'text-accent' : 'text-danger'}>{playerName(step1Winner)}</span> won — choose role:
                </p>
                <div className="flex gap-2">
                  <button onPointerDown={(e) => { e.preventDefault(); handleRoleChoice('attacker'); }} className="flex-1 h-12 rounded-panel bg-surface-inset hover:bg-surface-panel border border-border-subtle text-text-primary text-sm font-medium transition-colors">Attack</button>
                  <button onPointerDown={(e) => { e.preventDefault(); handleRoleChoice('defender'); }} className="flex-1 h-12 rounded-panel bg-surface-inset hover:bg-surface-panel border border-border-subtle text-text-primary text-sm font-medium transition-colors">Defend</button>
                </div>
              </div>
            )}
          </StepCard>

          {/* ── Step 3: Battle Formations ────────────────────────────────── */}
          <StepCard num={3} title="Declare Battle Formations" description="Secretly note, then reveal:" complete={step2Complete}>
            <div className="flex flex-col">
              <CheckRow label="Leader/Bodyguard attachments" checked={formationChecks[0]} onToggle={() => toggleFormation(0)} />
              <CheckRow label="Units in Transports"          checked={formationChecks[1]} onToggle={() => toggleFormation(1)} />
              <CheckRow label="Units in Reserves"            checked={formationChecks[2]} onToggle={() => toggleFormation(2)} />
            </div>
          </StepCard>

          {/* ── Step 4: Deploy Armies ────────────────────────────────────── */}
          <StepCard num={4} title="Deploy Armies" description="Defender first, alternate. TITANIC costs an extra turn." complete={deployDone}>
            <CheckRow label="Deployment complete" checked={deployDone} onToggle={() => setDeployDone((v) => !v)} />
          </StepCard>

          {/* ── Step 5: Redeploy ─────────────────────────────────────────── */}
          <StepCard num={5} title="Redeploy" description="Resolve redeploy rules. Alternate starting with Attacker." complete={redeployDone}>
            <CheckRow label="Redeploy complete" checked={redeployDone} onToggle={() => setRedeployDone((v) => !v)} />
          </StepCard>

          {/* ── Step 6: First Turn ───────────────────────────────────────── */}
          <StepCard num={6} title="First Turn" description="Roll off — winner goes first." complete={step5Winner !== null}>
            {step5Winner !== null ? (
              <button
                onPointerDown={(e) => { e.preventDefault(); resetStep5(); }}
                className="w-full text-left text-sm text-text-secondary bg-surface-inset rounded-panel px-3 py-2 min-h-[48px] hover:bg-surface-panel border border-border-subtle transition-colors"
              >
                <span className={activePlayer === 1 ? 'text-accent font-medium' : 'text-danger font-medium'}>
                  {playerName(activePlayer)}
                </span>{' '}
                takes the first turn
                <span className="ml-3 text-xs text-text-muted">↩ redo</span>
              </button>
            ) : (
              <RollOffButtons p1Name={p1Name} p2Name={p2Name} onSelect={handleFirstTurnWinner} />
            )}
          </StepCard>

          {/* ── Step 7: Pre-Battle Rules ─────────────────────────────────── */}
          <StepCard num={7} title="Pre-Battle Rules" description="Scouts, Infiltrators, etc." complete={preBattleDone}>
            <CheckRow label='Pre-battle rules resolved (e.g. Scout moves, Infiltrators)' checked={preBattleDone} onToggle={() => setPreBattleDone((v) => !v)} />
          </StepCard>

        </div>
      </div>

      {/* Mission picker modals */}
      {showMissionPicker && (
        <PickerModal
          title="Select Primary Mission"
          items={MISSION_ITEMS}
          onSelect={handleMissionSelect}
          onClose={() => setShowMissionPicker(false)}
          selectedLabel={primaryMission}
          cardAspect="620/1063"
        />
      )}
      {showTwistPicker && (
        <PickerModal
          title="Select Twist Card"
          items={TWIST_ITEMS}
          onSelect={handleTwistSelect}
          onClose={() => setShowTwistPicker(false)}
          selectedLabel={twist ?? 'No Twist'}
          cardAspect="620/1063"
        />
      )}

      {/* Begin Battle button */}
      <div className="shrink-0 py-2 border-t border-border-subtle bg-surface-panel flex justify-center">
        <div className="w-full max-w-[640px] px-2">
          <button
            onPointerDown={(e) => { e.preventDefault(); if (canBegin) beginBattle(); }}
            disabled={!canBegin}
            className={`w-full h-12 rounded-panel font-semibold text-base transition-colors
              ${canBegin
                ? 'bg-accent hover:bg-accent-hover text-accent-foreground cursor-pointer'
                : 'bg-surface-inset text-text-muted cursor-not-allowed'
              }`}
          >
            Begin Battle
          </button>
        </div>
      </div>
    </div>
  );
}
