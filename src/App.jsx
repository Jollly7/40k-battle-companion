import { useState } from 'react';
import { useGameStore } from './store/gameStore';
import { SetupScreen } from './components/layout/SetupScreen';
import { PreBattleScreen } from './components/layout/PreBattleScreen';
import { GameScreen } from './components/layout/GameScreen';

const LS_MODE_KEY = 'wh40k-device-mode';

function DeviceModeModal({ onSelect }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-surface-panel border border-border-subtle rounded-panel p-8 flex flex-col gap-6 max-w-sm w-full mx-4">
        <h2 className="text-xl font-semibold text-text-primary text-center">
          How are you using this device?
        </h2>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => onSelect('army')}
            className="flex flex-col items-start gap-1.5 py-3 px-4 rounded-panel border border-border-subtle bg-surface-inset hover:border-accent text-left transition-colors min-h-[48px]"
          >
            <span className="font-semibold text-text-primary">Army Tracker</span>
            <span className="text-sm text-chrome">Track unit stats and reminders</span>
          </button>
          <button
            onClick={() => onSelect('game')}
            className="flex flex-col items-start gap-1.5 py-3 px-4 rounded-panel border border-border-subtle bg-surface-inset hover:border-accent text-left transition-colors min-h-[48px]"
          >
            <span className="font-semibold text-text-primary">Battle Tracker</span>
            <span className="text-sm text-chrome">Track CP/VP and missions</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const gameStarted = useGameStore((s) => s.gameStarted);
  const battleBegun = useGameStore((s) => s.battleBegun);

  const [deviceMode, setDeviceMode] = useState(
    () => localStorage.getItem(LS_MODE_KEY)
  );
  const [showModeModal, setShowModeModal] = useState(!deviceMode);

  function handleModeSelect(mode) {
    localStorage.setItem(LS_MODE_KEY, mode);
    setDeviceMode(mode);
    setShowModeModal(false);
  }

  const openModeModal = () => setShowModeModal(true);

  function renderScreen() {
    // Army mode: always go straight to GameScreen with Army tab active,
    // bypassing Setup and PreBattle screens
    if (deviceMode === 'army') {
      return <GameScreen initialTab="army" onShowModeModal={openModeModal} />;
    }
    // Game mode: normal flow
    if (!gameStarted) return <SetupScreen onShowModeModal={openModeModal} />;
    if (!battleBegun) return <PreBattleScreen />;
    return <GameScreen onShowModeModal={openModeModal} />;
  }

  return (
    <>
      {renderScreen()}
      {showModeModal && <DeviceModeModal onSelect={handleModeSelect} />}
    </>
  );
}

export default App;
