import { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { Header } from './Header';
import { TabBar } from './TabBar';
import { ObjectivesSidebar } from '../objectives/ObjectivesSidebar';
import { TrackerTab } from '../tracker/TrackerTab';
import { PhasesTab } from '../phases/PhasesTab';
import { FactionsTab } from '../factions/FactionsTab';
import { ArmyTab } from '../army/ArmyTab';
import { GameSummaryModal } from '../GameSummaryModal';

export function GameScreen({ initialTab, onShowModeModal }) {
  const resetGame = useGameStore((s) => s.resetGame);
  const gameOver  = useGameStore((s) => s.gameOver);
  const p1Role      = useGameStore((s) => s.players[1].role);
  const firstPlayer = useGameStore((s) => s.firstPlayer);

  const attackerNum     = p1Role === 'attacker' ? 1 : 2;
  const secondPlayerNum = firstPlayer === 1 ? 2 : 1;

  const [activeTab, setActiveTab]     = useState(initialTab ?? 'tracker');
  const [showSummary, setShowSummary] = useState(false);
  const isArmyMode = localStorage.getItem('wh40k-device-mode') === 'army';

  // Auto-open modal when game ends
  useEffect(() => {
    if (gameOver) setShowSummary(true);
  }, [gameOver]);

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-surface-base text-text-primary">
      <div className={isArmyMode ? 'hidden md:block' : undefined}>
        <Header onReset={resetGame} onViewSummary={() => setShowSummary(true)} />
      </div>

      {gameOver && (
        <div className="px-4 py-1.5 bg-danger-muted border-b border-danger/30 text-center
          text-xs text-danger tracking-wide shrink-0 font-medium">
          Battle ended — Round 5 complete
        </div>
      )}

      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* Main content area + tab bar */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">

          {/* Tab content */}
          <div className="flex-1 overflow-hidden min-h-0">
            {activeTab === 'tracker' && (
              <TrackerTab
                attackerNum={attackerNum}
                firstPlayerNum={firstPlayer}
                secondPlayerNum={secondPlayerNum} />
            )}
            {activeTab === 'phases' && (
              <PhasesTab
                attackerNum={attackerNum}
                firstPlayerNum={firstPlayer}
                secondPlayerNum={secondPlayerNum} />
            )}
            {activeTab === 'factions' && (
              <FactionsTab
                attackerNum={attackerNum}
                firstPlayerNum={firstPlayer}
                secondPlayerNum={secondPlayerNum} />
            )}
            {activeTab === 'army' && (
              <ArmyTab attackerNum={attackerNum} />
            )}
          </div>

          <TabBar activeTab={activeTab} setActiveTab={setActiveTab} onShowModeModal={onShowModeModal} />
        </div>

        <div className="hidden md:block"><ObjectivesSidebar /></div>
      </div>

      {showSummary && (
        <GameSummaryModal
          firstPlayerNum={firstPlayer}
          secondPlayerNum={secondPlayerNum}
          onClose={() => setShowSummary(false)}
        />
      )}
    </div>
  );
}
