import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SECONDARY_MISSIONS } from '../data/missions';
import { PHASES } from '../data/phases';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const initialPlayerState = (name) => ({
  name,
  faction: null,
  detachment: null,
  role: null,           // 'attacker' | 'defender' | null
  cp: 0,
  vp: {
    total: 0,
    primary: 0,
    secondary: 0,
    byRound: [
      { primary: 0, sec1: 0, sec2: 0 },
      { primary: 0, sec1: 0, sec2: 0 },
      { primary: 0, sec1: 0, sec2: 0 },
      { primary: 0, sec1: 0, sec2: 0 },
      { primary: 0, sec1: 0, sec2: 0 },
    ],
  },
  customReminders: [],
  secondaryDeck: [],
});

const initialState = {
  round: 1,
  activePlayer: 1,
  currentPhase: 0,
  gameStarted: false,
  battleBegun: false,
  gameOver: false,
  primaryMission: null,
  twist: null,
  secondaryMode: 'tactical',
  firstPlayer: 1,       // player number who goes first; captured in beginBattle
  timers: { p1: 0, p2: 0 },
  timerPaused: true,
  timerStartedAt: null,
  players: {
    1: initialPlayerState('Player 1'),
    2: initialPlayerState('Player 2'),
  },
  objectives: [
    { id: 1, owner: null },
    { id: 2, owner: null },
    { id: 3, owner: null },
    { id: 4, owner: null },
    { id: 5, owner: null },
  ],
  hand: { p1: [null, null], p2: [null, null] }, // secondary card hand per player
  history: [], // array of game-state snapshots for undo
  log: [],     // array of { message, timestamp } action log entries
  attackerUnit: null, // { rosterLabel, unitIndex, leaderUnitIndex, displayName, leaderDisplayName } | null
  defenderUnit: null, // { rosterLabel, unitIndex, leaderUnitIndex, displayName, leaderDisplayName } | null
  player1RosterLabel: null,
  player2RosterLabel: null,
};

export const useGameStore = create(
  persist(
    (set, get) => {
  // Saves a snapshot of meaningful game state before a mutation.
  // Timers and setup fields are excluded — they don't need to be undone.
  const addLog = (message) => {
    const s = get();
    const live = s.timerStartedAt !== null && !s.timerPaused
      ? (Date.now() - s.timerStartedAt) / 1000 : 0;
    const elapsed = s.timers.p1 + s.timers.p2 + live;
    set((st) => ({ log: [{ message, timestamp: elapsed }, ...st.log].slice(0, 20) }));
  };

  const saveSnapshot = () => {
    const s = get();
    const snapshot = {
      round: s.round,
      activePlayer: s.activePlayer,
      currentPhase: s.currentPhase,
      gameOver: s.gameOver,
      players: JSON.parse(JSON.stringify(s.players)),
      objectives: JSON.parse(JSON.stringify(s.objectives)),
      hand: JSON.parse(JSON.stringify(s.hand)),
    };
    set((state) => ({ history: [...state.history.slice(-19), snapshot] }));
  };

  return {
  ...initialState,
  rosters: [],
  rostersLoaded: false,

  // --- Setup ---
  setPlayerName: (player, name) =>
    set((s) => ({ players: { ...s.players, [player]: { ...s.players[player], name } } })),

  setPlayerFaction: (player, faction) =>
    set((s) => ({ players: { ...s.players, [player]: { ...s.players[player], faction, detachment: null } } })),

  setPlayerDetachment: (player, detachment) =>
    set((s) => ({ players: { ...s.players, [player]: { ...s.players[player], detachment } } })),

  setPrimaryMission: (mission) => set({ primaryMission: mission }),

  setTwist: (twist) => set({ twist }),

  // Shuffles a fresh secondary deck for each player, then marks the game started.
  startGame: () =>
    set((s) => ({
      gameStarted: true,
      players: {
        1: { ...s.players[1], secondaryDeck: shuffle(SECONDARY_MISSIONS) },
        2: { ...s.players[2], secondaryDeck: shuffle(SECONDARY_MISSIONS) },
      },
    })),

  beginBattle: () => {
    addLog('Game started');
    addLog('Command Phase: both players gain +1 CP');
    set((s) => ({
      battleBegun: true,
      firstPlayer: s.activePlayer,  // capture who won the first-turn roll-off
      players: {
        1: { ...s.players[1], cp: s.players[1].cp + 1 },
        2: { ...s.players[2], cp: s.players[2].cp + 1 },
      },
    }));
  },

  logAction: (message) => addLog(message),

  setPlayerRole: (player, role) =>
    set((s) => ({ players: { ...s.players, [player]: { ...s.players[player], role } } })),

  resetGame: () => set((s) => ({ ...initialState, attackerUnit: null, defenderUnit: null, rosters: s.rosters, rostersLoaded: s.rostersLoaded })),

  // --- Roster management ---
  fetchRosters: async () => {
    try {
      const res = await fetch('/api/rosters');
      if (!res.ok) throw new Error('non-200');
      const { rosters: kvRosters } = await res.json();
      localStorage.setItem('wh40k-imported-rosters', JSON.stringify(kvRosters));
      set({ rosters: kvRosters, rostersLoaded: true });
    } catch {
      const fallback = (() => {
        try { return JSON.parse(localStorage.getItem('wh40k-imported-rosters') ?? '[]'); } catch { return []; }
      })();
      set({ rosters: fallback, rostersLoaded: true });
    }
  },

  setRosters: (rosters) => set({ rosters }),

  selectRoster: (player, roster) => set((s) => ({
    ...(player === 1 ? { player1RosterLabel: roster.label } : { player2RosterLabel: roster.label }),
    players: {
      ...s.players,
      [player]: { ...s.players[player], faction: roster.faction, detachment: roster.detachment },
    },
  })),

  // --- Command Points ---
  adjustCP: (player, delta) => {
    saveSnapshot();
    const s = get();
    const next = Math.max(0, s.players[player].cp + delta);
    addLog(`${s.players[player].name}: CP ${delta > 0 ? '+' : ''}${delta} → ${next}`);
    set({ players: { ...s.players, [player]: { ...s.players[player], cp: next } } });
  },

  // --- Victory Points ---
  adjustVP: (player, round, column, delta) => {
    saveSnapshot();
    const s = get();
    const p = s.players[player];
    const idx = round - 1;
    const newByRound = p.vp.byRound.map((r, i) =>
      i !== idx ? r : { ...r, [column]: Math.max(0, r[column] + delta) }
    );
    const primary   = newByRound.reduce((sum, r) => sum + r.primary, 0);
    const secondary = newByRound.reduce((sum, r) => sum + r.sec1 + r.sec2, 0);
    const total     = primary + secondary;
    addLog(`${p.name}: ${column} VP ${delta > 0 ? '+' : ''}${delta} (R${round})`);
    set({
      players: {
        ...s.players,
        [player]: { ...p, vp: { total, primary, secondary, byRound: newByRound } },
      },
    });
  },

  // --- Objectives ---
  cycleObjective: (id) => {
    saveSnapshot();
    const s = get();
    const obj = s.objectives.find((o) => o.id === id);
    const next = obj.owner === null ? 1 : obj.owner === 1 ? 2 : null;
    const ownerLabel = next === null ? 'Unclaimed' : s.players[next].name;
    addLog(`Objective ${id}: ${ownerLabel}`);
    set((st) => ({
      objectives: st.objectives.map((o) => o.id !== id ? o : { ...o, owner: next }),
    }));
  },

  // --- Phases ---
  advancePhase: () => {
    saveSnapshot();
    const s = get();
    if (s.gameOver) return;
    const { firstPlayer } = s;
    const secondPlayer = firstPlayer === 1 ? 2 : 1;
    const nextPhase = s.currentPhase + 1;
    if (nextPhase < 5) {
      addLog(PHASES[nextPhase].name);
      set((s) => ({
        currentPhase: nextPhase,
        timerPaused: false,
        timerStartedAt: s.timerStartedAt ?? Date.now(),
      }));
    } else if (s.activePlayer === firstPlayer) {
      // First player's Fight Phase ends → second player's Command Phase begins
      addLog(`${s.players[secondPlayer].name}'s turn — ${PHASES[0].name}`);
      addLog('Command Phase: both players gain +1 CP');
      set((st) => {
        const banked = st.timerStartedAt !== null
          ? st.timers[`p${st.activePlayer}`] + (Date.now() - st.timerStartedAt) / 1000
          : st.timers[`p${st.activePlayer}`];
        return {
          currentPhase: 0,
          activePlayer: secondPlayer,
          timerPaused: false,
          timerStartedAt: Date.now(),
          timers: { ...st.timers, [`p${st.activePlayer}`]: banked },
          players: {
            1: { ...st.players[1], cp: st.players[1].cp + 1 },
            2: { ...st.players[2], cp: st.players[2].cp + 1 },
          },
        };
      });
    } else if (s.round === 5) {
      // End of Round 5 — game over
      addLog('Battle ended — Round 5 complete');
      set({ gameOver: true });
    } else {
      // Second player's Fight Phase ends → new round, first player goes again
      const newRound = s.round + 1;
      addLog(`Round ${newRound} — ${PHASES[0].name}`);
      addLog('Command Phase: both players gain +1 CP');
      set((st) => {
        const banked = st.timerStartedAt !== null
          ? st.timers[`p${st.activePlayer}`] + (Date.now() - st.timerStartedAt) / 1000
          : st.timers[`p${st.activePlayer}`];
        return {
          currentPhase: 0,
          activePlayer: firstPlayer,
          round: newRound,
          timerPaused: false,
          timerStartedAt: Date.now(),
          timers: { ...st.timers, [`p${st.activePlayer}`]: banked },
          players: {
            1: { ...st.players[1], cp: st.players[1].cp + 1 },
            2: { ...st.players[2], cp: st.players[2].cp + 1 },
          },
        };
      });
    }
  },

  // --- Round / Player ---
  setActivePlayer: (player) => { saveSnapshot(); set({ activePlayer: player }); },

  // --- Per-player timers ---
  // Timers use a timestamp anchor: banked seconds in timers.p1/p2, live elapsed computed in Header.
  toggleTimerPause: () => set((s) => {
    if (!s.timerPaused) {
      // Pausing: bank live elapsed for active player, clear anchor
      const banked = s.timerStartedAt !== null
        ? s.timers[`p${s.activePlayer}`] + (Date.now() - s.timerStartedAt) / 1000
        : s.timers[`p${s.activePlayer}`];
      return {
        timerPaused: true,
        timerStartedAt: null,
        timers: { ...s.timers, [`p${s.activePlayer}`]: banked },
      };
    } else {
      // Resuming: set anchor to now
      return { timerPaused: false, timerStartedAt: Date.now() };
    }
  }),

  // --- Secondary card hand ---
  drawCard: (player, slot, cardName) => {
    saveSnapshot();
    const s = get();
    const pKey = `p${player}`;
    const newDeck = s.players[player].secondaryDeck.filter((c) => c !== cardName);
    const newSlots = s.hand[pKey].map((c, i) => (i === slot ? cardName : c));
    addLog(`${s.players[player].name}: Drew "${cardName}"`);
    set({
      hand: { ...s.hand, [pKey]: newSlots },
      players: { ...s.players, [player]: { ...s.players[player], secondaryDeck: newDeck } },
    });
  },

  discardCard: (player, slot) => {
    saveSnapshot();
    const s = get();
    const pKey = `p${player}`;
    const cardName = s.hand[pKey][slot];
    if (!cardName) return;
    const newSlots = s.hand[pKey].map((c, i) => (i === slot ? null : c));
    const newDeck = [...s.players[player].secondaryDeck, cardName];
    addLog(`${s.players[player].name}: Discarded "${cardName}"`);
    set({
      hand: { ...s.hand, [pKey]: newSlots },
      players: { ...s.players, [player]: { ...s.players[player], secondaryDeck: newDeck } },
    });
  },

  // --- Custom reminders ---
  addReminder: (player, text) => {
    saveSnapshot();
    set((s) => ({
      players: {
        ...s.players,
        [player]: {
          ...s.players[player],
          customReminders: [...s.players[player].customReminders, text],
        },
      },
    }));
  },

  removeReminder: (player, index) => {
    saveSnapshot();
    set((s) => ({
      players: {
        ...s.players,
        [player]: {
          ...s.players[player],
          customReminders: s.players[player].customReminders.filter((_, i) => i !== index),
        },
      },
    }));
  },

  // --- Combat unit designation (attacker/defender pop-out) ---
  setAttackerUnit: (payload) => set({ attackerUnit: payload }),
  setDefenderUnit: (payload) => set({ defenderUnit: payload }),
  clearCombatUnits: () => set({ attackerUnit: null, defenderUnit: null }),

  // --- Undo ---
  undo: () => {
    const { history } = get();
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    set({ ...prev, history: history.slice(0, -1) });
  },
  };
    },
    {
      name: 'wh40k-game-state',
      version: 1,
      // Exclude undo history (ephemeral) from persistence.
      // timerPaused is also excluded so it always rehydrates as true (see onRehydrateStorage).
      partialize: ({ history, timerPaused, timerStartedAt, ...rest }) => rest,
      // After rehydration, force timers paused and clear any stale anchor.
      onRehydrateStorage: () => (state) => {
        if (state) { state.timerPaused = true; state.timerStartedAt = null; }
      },
    }
  )
);
