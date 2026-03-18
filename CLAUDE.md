# CLAUDE.md — Warhammer 40k Battle Round Tracker

## Project Overview

A **Progressive Web App (PWA)** built for personal use on a Samsung tablet.
Tracks a 1v1 Warhammer 40k 10th Edition game in real time: Command Points,
Victory Points, Objectives, turn phases, and faction reminders.

No server, no login, no app store. Runs entirely in the browser, works offline.

Deployed via GitHub Pages: https://jollly7.github.io/wh40k-tracker-app-test/
Repo: `wh40k-battle-tracker` under username `Jollly7` — CI/CD via GitHub Actions.

---

## Stack

| Concern | Choice |
|---|---|
| Framework | React + Vite |
| Styling | Tailwind CSS |
| State | Zustand |
| Persistence | localStorage (`zustand/middleware` persist, key `wh40k-game-state` v1) |
| PWA | vite-plugin-pwa |
| Icons/UI | Lucide React |
| Charting | Recharts (added v1.5 — end-of-game summary line chart) |

> Do not introduce additional libraries without explaining why and getting confirmation.

---

## How to Operate

- **Explain reasoning before writing code** — especially for architectural or structural decisions.
- **Ask before making structural changes** — state shape, new libraries, splitting/merging components.
- **Build the smallest working version first**, then layer complexity.
- **Name both options briefly** when uncertain, and recommend one with a reason.
- **Flag any conflict with this file** before proceeding.

---

## App Structure

```
src/
  components/
    layout/        # App shell, header, tab navigation
    cp/            # Command Point tracker
    vp/            # Victory Point tracker + scoring breakdown
    objectives/    # Objective map
    phases/        # Turn phase checklist
    timer/         # Round timer (lives in header)
    factions/      # Faction/detachment reminder panels
  store/
    gameStore.js   # Zustand store — single source of truth
  data/
    factions.js    # Faction + detachment lists
    phases.js      # 10th Edition phase definitions (5 phases)
    missions.js    # Mission card names (primary, secondary, twists, challenger)
    missionImages.js  # name → URL maps for all 4 mission decks
    reminders.js   # Phase reminder text, keyed by faction||detachment
  utils/
    parseRosterJson.js  # Transforms NewRecruit .json export into internal roster shape
  App.jsx
  main.jsx
```

---

## Game Rules Context (10th Edition)

Keep these rules in mind — build them into logic, don't make the user configure them.

### Command Points
- Each player starts with 0 CP
- Each player gains +1 CP at the start of **both** Command Phases each turn
- CP minimum is 0 — cannot go negative
- CP is spent on Stratagems (tracked, not enforced)

### Victory Points
- Primary VP: scored at the end of each player's Command Phase
- Secondary VP: scored per mission rules, entered manually
- Max 5 Battle Rounds

### Battle Round Structure
Each round has two Player Turns (Player 1 then Player 2), each with 5 phases:
1. **Command Phase** — Gain CP, score Primary, Battle-shock tests
2. **Movement Phase**
3. **Shooting Phase**
4. **Charge Phase**
5. **Fight Phase**

### Objectives
- 5 objectives on a symmetrical grid
- Each cycles: Unclaimed → Player 1 → Player 2 → Unclaimed

### Challenger Cards
- Triggers when a player is 6+ VP behind at battle round start
- Player draws one card, chooses either the Stratagem (free) or Mission — not both
- Card discarded at end of turn; max 12VP from Challenger cards total

---

## UI & UX Requirements

- **Target device**: Samsung Galaxy Tab S8 — 1280×800px landscape
- **Touch first**: all interactive elements minimum 48×48px tap targets
- **No horizontal scrolling** — everything fits within the viewport
- **High contrast**: readable at arm's length
- **Theme**: "Tactical Readout" — off-white/paper base, cold blue accent, Barlow Condensed + DM Sans; tokens in `tailwind.config.js`
- **Accent colours are role-based**: Attacker = red, Defender = green
- No decorative Warhammer imagery — keep it functional
- Tab-based layout: Tracker · Phases · Factions, one tap from anywhere

---

## What NOT to Do

- No backend, database, or authentication — local only
- Do not enforce game rules strictly — track and remind, never block
- Do not auto-install npm packages without explaining the tradeoff
- Do not create deeply nested component trees
- Do not use `px` for font sizes — use `rem`

---

## Key Implementation Notes

These capture decisions and deviations from original spec — read before touching any of these areas.

- **Space Marine chapters** (Black Templars, Blood Angels, etc.) are hidden from faction picker via `HIDDEN_FACTIONS` in `SetupScreen.jsx`; data retained in `factions.js`
- **Begin Battle** requires Attacker/Defender and First Turn roll-offs to be set
- **Secondary deck** is shuffled on `startGame()` in the store
- **Player layout**: left panel = player who goes first (set by roll-off); right = second; applies across all three tabs
- **`firstPlayer`** stored in Zustand (type: `1 | 2`); captured from `activePlayer` inside `beginBattle()`; `advancePhase` uses `activePlayer === firstPlayer` to detect end of first player's turn
- **Accent colours** are role-based (not player-number): applied via `ROLE_ACCENT` in `TrackerTab`, `PhasesTab`, `FactionsTab`; VP name labels in `ObjectivesSidebar` also use role colours
- **`PlayerTrackerPanel`** accepts `isAttacker` boolean prop for accent colour
- **`GameScreen`** derives `attackerNum`, `defenderNum`, `firstPlayerNum`, `secondPlayerNum` and passes as props to all tabs
- **`vp.byRound`** is an array of `{ primary, sec1, sec2 }` objects; `vp.total/primary/secondary` always recomputed from scratch in `adjustVP`
- **`adjustVP(player, round, column, delta)`** is the single VP mutation; **`adjustCP(player, delta)`** for CP — both log and snapshot automatically
- **Auto +1 CP** fires inside `advancePhase` (store) when landing on phase 0; grants +1 to both players at each Command Phase transition
- **VP table column headers** are conditional: active/expanded shows full names; inactive shows abbreviated
- **CP and VP buttons** use `onPointerDown` + `e.preventDefault()` to prevent browser double-fire
- **Per-player timers** are timestamp-based: `timers.p1/p2` hold banked elapsed seconds; `timerStartedAt` is a `Date.now()` anchor set on resume, cleared on pause; displayed time = `banked + (Date.now() - timerStartedAt) / 1000`; `setInterval` in Header only triggers re-renders, never mutates store
- **Timer initial state**: `timerPaused: true` — timers don't start until user resumes; `toggleTimerPause()` banks elapsed and clears/sets anchor
- **`advancePhase`**: same-player phases re-anchor; player-switch transitions bank outgoing player's timer then set new anchor
- **localStorage persistence**: `history`, `timerPaused`, and `timerStartedAt` excluded from persistence; `timerPaused` forced to `true` and `timerStartedAt` to `null` on rehydration via `onRehydrateStorage`
- **Game over**: `gameOver: true` set in store when advancing past Round 5 second-player Fight Phase; blocks `advancePhase`; Next Phase button labelled "Game Over" and disabled; inline banner beneath header
- **Log timestamps** use combined elapsed (`timers.p1 + timers.p2 + live`) as total game time
- **Header layout**: left (`shrink-0`): Round X/5 · Phase Name · Next Phase · Pause; center (`flex-1 justify-center`): P1 timer · P1 name · P1 stat block · vs · P2 stat block · P2 name · P2 timer; right (`shrink-0`): Undo · Log · Setup
- **Header stat block** (`Header.jsx`, center section): `flex-col` with CP on top and VP below, separated by `<hr className="border-border-subtle">`; values are `text-base font-semibold tabular-nums`; suffix labels ("cp", "vp") are `text-[10px] font-normal text-text-secondary` inline after the number
- **Pause button**: single button freezes/resumes both timers; green when paused (▶), gray when running (⏸)
- **Secondary cards**: `hand: { p1: [null, null], p2: [null, null] }` top-level store state; `drawCard` / `discardCard` both snapshot for undo; UI lives in `TrackerTab.jsx` as `SecondaryCardSlot` and `DrawModal`
- **Card lightbox** (mission sidebar + secondary cards): `getBoundingClientRect()` on click, compute dx/dy to viewport centre, inject into `@keyframes` via `<style>` tag, spring easing `cubic-bezier(0.34, 1.56, 0.64, 1)`; tap backdrop to close
- **DrawModal** does NOT close on backdrop tap — user must tap cancel or select a card
- **`onClick` / animation origin**: `getBoundingClientRect()` must be captured in `onPointerDown` and stored in a `useRef` (not state) to avoid stale values
- **Tracker tab expand/collapse** is local `useState` in `TrackerTab`; resets on turn advance via `useEffect`; nothing written to store
- **Reminders lookup**: keys are `faction||detachment` exact strings from `factions.js`; no string normalisation
- **`reminders.js`** structure: `general_reminders` (all armies), `faction_reminders` (per faction), `detachment_reminders` (per detachment); `PhaseReminders` component colocated in `TrackerTab.jsx`; returns null when no reminders match
- **Inactive sliver −1 CP button** (`TrackerTab.jsx`, inside `isCollapsedInactive || isShrunk` branch): uses `onPointerDown` + `e.stopPropagation()` to spend CP without triggering panel expand; `w-12 h-12` (48px) tap target; `disabled` at CP 0 for visual feedback; inserted between stats badge and `MiniVPTable`
- **Roster import**: Players import army lists as .json files exported directly from NewRecruit. Parsed client-side by `src/utils/parseRosterJson.js`. Stored in localStorage under `wh40k-imported-rosters` as an array of `{ label, faction, detachment, units }`. Player selections persisted under `wh40k-army-selection` as `{ p1: label | null, p2: label | null }`. Re-importing a file with the same label replaces the existing entry. No committed roster files exist in the codebase.

---

## Build History

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Game Setup Screen | ✅ Done |
| 1.5 | Pre-Battle Setup Screen | ✅ Done |
| 2 | Core Layout Shell | ✅ Done |
| 2.5 | Main Content Area Layout | ✅ Done |
| 3 | CP & VP Tracker | ✅ Done |
| 4 | Battle Round Counter + Active Player | ✅ Done |
| 5 | Phase Checklist | ✅ Done |
| 6 | Secondary Mission Tracker | ✅ Done |
| 7 | Round Timer | ✅ Done |
| 8 | Faction Reminder Panel | ✅ Done |
| 9 | Polish Pass | ✅ Done |
| v1.3 | Phase Reminders (faction/detachment, per phase) | ✅ Done |
| v1.4 | Timer persistence fix (timestamp-based) | ✅ Done |
| v1.5 | End-of-game modal, CP/VP legibility, reminders reorder, inactive −1 CP | ✅ Done |
| v1.6 | Army list reference tab (UnitAccordion, weapon tables, abilities) | ✅ Done |
| v1.7 | .json roster import (NewRecruit, client-side parse, localStorage) | ✅ Done |

**Cross-cutting features shipped:** undo (20-snapshot stack), action log, mission card images + lightbox, localStorage persistence, secondary card draw/discard/lightbox.

**Deferred to v2:** custom ability editing, match history export, Asymmetric War mode, Challenger card tracker.

---

## Current Progress

**Last updated:** 18/03/2026

**Status:** v1.7 shipped — NewRecruit .json roster import, committed rosters removed.

---

## v1.5 Project Plan

| Phase | Feature | Status |
|-------|---------|--------|
| v1.5-1 | Quick −1 CP button on inactive player sliver | ✅ Done |
| v1.5-2 | Header CP/VP legibility improvements | ✅ Done |
| v1.5-3 | Reminders reorder + separators + content expansion | ✅ Done |
| v1.5-4 | Challenger card alert banner | ⬜ Not Started (deferred to 1.7) |
| v1.5-5 | End-of-game summary modal | ✅ Done |

**added to to v1.6:** army list import (New Recruit .ros text parsing, unit stats/abilities).

---

### v1.5 Phase Detail

#### v1.5-1 — Quick −1 CP on inactive player sliver

**What:** A single `−1 CP` button on the collapsed/inactive player panel so the defending player can spend a stratagem CP without expanding their panel.

**Scope:** Small change to the inactive sliver layout in `TrackerTab.jsx`. Reuses `adjustCP` from the store. Must use `e.stopPropagation()` to avoid triggering panel expand.

**Acceptance criteria:**
- [x] Inactive sliver shows a `−1 CP` button at all times during the game
- [x] Tapping it decrements that player's CP (min 0), logs the action, and snapshots for undo
- [x] Does not expand the inactive panel (had to add e.stopPropagation)
- [x] Button meets 48×48px tap target minimum

---

#### v1.5-2 — Header CP/VP legibility

**What:** Make both players' CP and VP numbers larger and easier to read at a glance in the header.

**Scope:** Layout/typography tweak to `Header.jsx` only. No store changes. Test at 1280×800 in Chrome DevTools.

**Acceptance criteria:**
- [x] CP and VP values are visibly larger than surrounding header text
- [x] Player identity is unambiguous at arm's length (role colour preserved)
- [x] Header still fits within 1280px without wrapping or overflow

---

#### v1.5-3 — Reminders reorder + separators + content expansion

**What:** Reorder reminder display to faction → detachment → general (currently general-first). Add a visual separator between non-empty groups. Expand reminder content for priority factions.

**Surfaces:** Both `PhaseReminders` in `TrackerTab` (current phase only) and `FactionsTab` (all phases grouped). The reorder and separators apply to both.

**Scope:** Reorder is a small change in `PhaseReminders` and `FactionsTab`. Separators are minor layout additions. Content expansion is pure data work in `reminders.js` — no component changes.

**Priority factions for content:** Genestealer Cults, Orks, Grey Knights, T'au Empire.

**Acceptance criteria:**
- [x] Reminder groups render in order: faction → detachment → general on both surfaces
- [x] A visual separator (horizontal rule or equivalent) appears between each non-empty group
- [x] Empty groups are skipped — no orphan separators
- [x] At least 4 faction/detachment combinations have meaningfully populated reminders

---

#### v1.5-4 — Challenger card alert (deferred to v1.7)

**What:** A banner that appears on a player's panel when they are 6+ VP behind at the start of a battle round, reminding them they may draw a Challenger card.

**Scope:** Derived value only — no new store state. Computed from `vp.total` diff at render time. Banner rendered in `PlayerTrackerPanel`. Only shown at Command Phase (phase index 0) and only when the game is not over.

**Acceptance criteria:**
- [ ] Banner appears on the trailing player's panel when VP deficit ≥ 6
- [ ] Only visible during Command Phase (phase index 0)
- [ ] Disappears automatically if deficit drops below 6
- [ ] Does not appear when `gameOver: true`
- [ ] Copy is clear, e.g. "6+ VP behind — you may draw a Challenger card"

---

#### v1.5-5 — End-of-game summary modal

**What:** When `gameOver: true`, a modal overlays the game screen with: winner banner, VP breakdown table by round, a line chart of cumulative VP per round, total game time, and per-player time.

**New dependency:** `recharts` — install with `npm install recharts`. Used only in this modal.

**Scope:** New `GameSummaryModal` component. All data from existing store state — no new store fields required. Triggered by `gameOver` flag. Dismissible so the player can still review the tracker underneath. Re-openable after dismissal.

**Chart:** Line chart (Recharts `LineChart`) showing cumulative VP total per round for both players. Lines coloured by role (Attacker = red, Defender = green), consistent with `ROLE_ACCENT`.

**Acceptance criteria:**
- [x] Modal appears automatically when `gameOver` becomes `true`
- [x] Winner banner shows player name, role, and final VP totals; role accent colour applied
- [x] VP table shows Primary / Sec 1 / Sec 2 per round for both players, with a totals row
- [x] Line chart shows cumulative VP per round (rounds 1–5 on x-axis), both players, role colours
- [x] Shows total game time and per-player elapsed time (formatted MM:SS)
- [x] Dismiss button closes the modal (local `useState` in modal or parent)
- [x] A "View Summary" button appears in the header after game over to re-open the modal
- [x] Modal fits within 1280×800 viewport without internal scrolling


### v1.6 — Army List Reference Tab

**Scope:** Larger release. New 4th "Army" tab displaying both players' parsed army lists side-by-side.

---

#### Data shape — `src/data/armyLists.js`
```js
export const ARMY_LISTS = {
  p1: {
    label: "Colosseum",       // roster name from <roster name="...">
    faction: "T'au Empire",
    units: [
      {
        name: "Cadre Fireblade",
        stats: { M: "6\"", T: 3, SV: "4+", invuln: null, W: 3, LD: "7+", OC: 1 },
        ranged: [
          { name: "Fireblade pulse rifle", A: 1, BS: "4+", S: 5, AP: 0, D: 2, keywords: "Rapid Fire 1" },
        ],
        melee: [
          { name: "Close combat weapon", A: 3, WS: "5+", S: 3, AP: 0, D: 1, keywords: "-" },
        ],
      },
    ]
  },
  p2: { /* same shape */ }
}
```

---

#### New files

- `src/data/armyLists.js` — static output, manually populated pre-game
- `src/components/army/ArmyTab.jsx` — tab root, side-by-side layout
- `src/components/army/ArmyPanel.jsx` — one player's unit list
- `src/components/army/UnitAccordion.jsx` — single unit row, expand/collapse

---

#### Layout

Mirrors the existing tab layout pattern. Two panels, `attackerNum` left / `defenderNum` right, role accent colours applied via `ROLE_ACCENT` (same pattern as `TrackerTab`, `PhasesTab`, `FactionsTab`). Receives `attackerNum`/`defenderNum` props from `GameScreen`.

If `ARMY_LISTS[pKey]` is undefined or empty, `ArmyPanel` shows a muted placeholder: "No army list loaded".

---

#### UnitAccordion

**Collapsed** — single row, min 48px tap target:
```
▶  Cadre Fireblade          6"  T3  4+  W3  7+  OC1
```

- Unit name left-aligned, stat pills right-aligned
- Invuln shown in brackets next to SV when present, e.g. `4+ (5++)`
- T value gets a subtle role-coloured highlight (key value when opponent is shooting at this unit)

**Expanded** — two sub-tables beneath the stat line:

| Ranged Weapons | A | BS | S | AP | D | Keywords |
|---|---|---|---|---|---|---|

| Melee Weapons | A | WS | S | AP | D | Keywords |
|---|---|---|---|---|---|---|

- S value highlighted (key value when this unit is shooting)
- Table omitted entirely if unit has no weapons of that type
- Keywords truncate with ellipsis on overflow (v1 — no tap-to-expand needed)

---

#### Tab bar

Add "Army" as 4th tab. Use `Swords` or `Shield` from Lucide React.

---

#### Acceptance criteria

- [x] Army tab appears as 4th tab, accessible from anywhere in the game
- [x] Both players' armies shown side-by-side, attacker left / defender right, role accent colours applied
- [x] Each unit row shows M, T, SV, W, LD, OC collapsed; invuln in brackets next to SV when present
- [x] Tapping a unit expands to show ranged and melee weapon tables (A, BS/WS, S, AP, D, Keywords)
- [x] T and S values visually highlighted for quick scanning
- [x] Duplicate weapons de-duped within a unit
- [x] "No army list loaded" placeholder shown when data absent
- [x] Layout fits 1280×800 without overflow; unit lists scroll independently
- [x] No new npm dependencies

---

#### Deferred to v2/v3

- File upload in setup screen (`.ros` drag-and-drop → auto-parse on device)
- Wound roll matrix (S vs T pre-computed)
- Filtering by phase (e.g. show only melee weapons in Fight Phase)

#### v1.6-2 — Roster dropdown + parser improvements

**What:** Each player panel in the Army tab now has a dropdown to select their army list at game time. *(Superseded by v1.7 — dropdown replaced with "Import .json" button; committed roster files removed.)*

**Army tab changes:**
- `ArmyTab.jsx` — dropdown per player; selection persisted to `localStorage` (`wh40k-army-selection`) so it survives tab switches and refresh
- `ArmyPanel.jsx` — faction line now shows detachment from the Zustand store alongside the roster faction, e.g. `T'au Empire — Mont'ka`; no store changes required

**Acceptance criteria:**
- [x] Each player panel has a dropdown listing all available rosters
- [x] Selecting a roster loads it into that panel immediately; blank option reverts to placeholder
- [x] ~~Selection persists across tab switches and page refresh~~ (superseded by v1.7 — localStorage shape changed)
- [x] Faction and detachment shown beneath player name when a roster is loaded

---

### v1.7 — NewRecruit .json Roster Import

**What:** Replace the committed-file roster system with client-side JSON import. Players export a `.json` file from NewRecruit and load it directly in the Army tab. Rosters persist to localStorage; no files are committed to the codebase.

---

#### Parser — `src/utils/parseRosterJson.js`

Pure transform function: `parseRosterJson(json)` → internal roster shape. No React, no I/O.

**Input shape handled:** NewRecruit JSON (array-style `forces`/`selections`/`profiles` arrays, `$text` on characteristics). Also handles the older xml2js wrapped style (`{ force: [...] }`, `{ selection: [...] }`) for robustness.

**Extraction logic:**
- `roster.name` → `label`
- `force.catalogueName` → `faction` (strips `"Xenos - "`, `"Imperium - "` etc. prefixes)
- Top-level selection `name === "Detachment"` → first child name → `detachment`
- Top-level selections `type === "model" || type === "unit"` → `units`
- Unit stats from `profiles` entry with `typeName === "Unit"`, characteristics by name, `$text` values; T/W/OC coerced to int
- Invuln: `Abilities` profile whose `name` matches `/^\d+\+\+$/`
- Ranged/melee weapons: recursive walk of `selections`, collect profiles by `typeName`, de-dupe by name, sum `count` across duplicates
- Abilities: all `Abilities` profiles (recursive), deduped, excluding invuln saves; `Description` characteristic stored
- Keywords: unit's own `categories`, names sorted alphabetically
- Unit composition (see below)

**Multi-model unit fix:** units like Breacher Team have no Unit profile at the top level — it lives inside `type="model"` child selections. Parser falls back to `collectProfiles(sel, 'Unit')[0]` when not found at top level.

**`composition` field:** array of `{ name, count, equipment: string[] }` per model type.
- Multi-model units (`type="unit"`): iterate `type="model"` children
- Single-model units (`type="model"` at top level): unit selection itself is the single model entry
- Equipment per model: direct child upgrade selections; per-model count = `Math.round(upgrade.number / model.number)`; sub-weapons one level deep shown in parens: `"Gun Drone (Twin pulse carbine)"`; count > 1 prefixed: `"3x Plasma rifle"`
- Returns `null` only if no equipment found (omits section in UI)

---

#### Army tab changes

**`ArmyTab.jsx`:**
- Removed `ROSTERS` import entirely
- `wh40k-imported-rosters` localStorage key — array of full roster objects `{ label, faction, detachment, units }`
- `wh40k-army-selection` localStorage key — `{ attacker: label | null, defender: label | null }`
- `RosterControls` component per player: hidden `<input type="file" accept=".json">` triggered via `useRef`; reads file with `FileReader`, parses JSON, calls `parseRosterJson`; on success auto-selects the imported roster; inline error on failure
- Dropdown alongside Import button: lists all imported rosters by label; hidden when no rosters imported yet; both panels share the same pool, independent selections
- Re-importing a file with the same `label` replaces the existing entry

**`ArmyPanel.jsx`:**
- `faction` and `detachment` read from roster object directly (not Zustand store)
- Falls back to store detachment if roster field absent

**`UnitAccordion.jsx`:**
- `CompositionAccordion` sub-component: nested accordion (collapsed by default) rendered after Keywords
- Shows each model type as `Nx ModelName: equip1, 2x equip2, Parent (sub-weapon), ...`
- Only rendered when `unit.composition` is non-null and non-empty

---

#### Acceptance criteria

- [x] "Import .json" button appears in each player's panel
- [x] Tapping it opens the device file picker filtered to `.json`
- [x] A valid NewRecruit `.json` loads, parses, and displays immediately; auto-selected in dropdown
- [x] Dropdown lists all previously imported rosters; selecting switches the panel immediately
- [x] Imported rosters and selections persist across page refresh and PWA restart
- [x] Re-importing a file with the same label replaces the existing entry
- [x] Faction and detachment shown from roster data (not store)
- [x] Multi-model units (Breacher Team, Crisis Battlesuits) parse all 6 units correctly
- [x] Unit Composition section shows per-model equipment with correct per-model counts
- [x] Single-model units also show composition (wargear visible)
- [x] If parsing fails, inline error shown — app does not crash
- [x] No committed roster files remain in codebase
- [x] No new npm dependencies

---

#### Deleted
- `scripts/parseRoster.mjs`
- `src/data/rosters/` (all `.js` roster files + `index.js`)