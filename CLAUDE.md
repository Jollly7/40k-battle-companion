# CLAUDE.md — Warhammer 40k Battle Tracker

## Project Overview

A **Progressive Web App (PWA)** built for personal use on a Samsung Galaxy Tab S8 (1280×800px landscape).
Tracks a 1v1 Warhammer 40k 10th Edition game in real time: Command Points, Victory Points, Objectives, turn phases, army lists, and faction reminders.

No server, no login, no app store. Runs entirely in the browser, works offline.

- **Live app:** https://40k-battle-companion.pages.dev
- **Repo:** `40k-battle-companion` (GitHub username: `Jollly7`)
- **CI/CD:** Cloudflare Pages (connected to GitHub repo; auto-deploys on push to `main`)

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
| Charting | Recharts (end-of-game summary line chart) |
| Backend | Cloudflare Pages Functions (`functions/api/rosters.js`) |
| Storage | Cloudflare KV (namespace: `40K_ROSTERS`, bound as `ROSTERS`) |

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
    tracker/       # TrackerTab.jsx — CP/VP controls, objectives, phase reminders
    objectives/    # Objective map
    phases/        # Turn phase checklist
    army/          # Army list tab (ArmyTab.jsx, ArmyPanel.jsx, UnitAccordion.jsx)
                   # Modals: ArmyRuleModal.jsx, StratagemsModal.jsx, StratagemCard.jsx, RulesAccordion.jsx
  store/
    gameStore.js   # Zustand store — single source of truth
  hooks/
    useArmyRuleData.js # Fetches and filters Wahapedia rules & stratagems for the active roster
  data/
    csv/           # Wahapedia CSV exports (Factions, Stratagems, Abilities, etc.) — loaded via Vite `?raw`
    factions.js    # Faction + detachment lists
    phases.js      # 10th Edition phase definitions (5 phases)
    missions.js    # Mission card names (primary, secondary, twists, challenger)
    missionImages.js  # name → URL maps for all 4 mission decks
    reminders.js   # Phase reminder text, keyed by faction||detachment
  utils/
    parseRosterJson.js     # Transforms NewRecruit .json export into internal roster shape
    parseWahapediaCsv.js   # CSV parser + `sanitiseHtml` (plain-text strip, kept for legacy use)
    renderWahapediaHtml.js # `renderWahapediaHtml` — sanitises Wahapedia HTML for safe innerHTML use
    deduplicateByName.js   # Deduplication helper — retains only the highest-ID row per stratagem name
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

---

## UI & UX Requirements

- **Target device**: Samsung Galaxy Tab S8 — 1280×800px landscape
- **Touch first**: all interactive elements minimum 48×48px tap targets
- **No horizontal scrolling** — everything fits within the viewport
- **High contrast**: readable at arm's length
- **Theme**: "Tactical Readout" — dark charcoal base (`#131210`), off-white text (`#F0EDE8`), cold blue accent, Barlow Condensed + DM Sans; tokens in `tailwind.config.js`
- **Accent colours are role-based**: Attacker = red, Defender = green
- No decorative Warhammer imagery — keep it functional
- Tab-based layout: Tracker · Phases · Factions · Army, one tap from anywhere

### Touch Event Handling

All interactions are discrete taps. Four patterns are used depending on context:

| Pattern | When to use | Example |
|---|---|---|
| `onPointerDown` + `e.preventDefault()` | Standard buttons with no scroll risk and no layout change | CP/VP buttons, phase buttons |
| Split: `onPointerDown` captures rect, `onClick` opens popup | Tappable elements that compete with scroll | Card thumbnails, keyword/ability chips |
| `onClick` only | Buttons that open modals, cause layout shifts, or **close/dismiss overlays** | Faction picker, detachment picker, mission pickers, dead unit toggle, **all close/✕ buttons** |
| `onClick` + `e.stopPropagation()` | Buttons inside a clickable container | Nested action buttons |

> **Exceptions — leave as `onClick`, do not modify:** `<input type="file">` triggers and `<a>` tags — these rely on browser-native behaviour.

**Why `onClick` for modals:** The modal mounts while the finger is still down; a subsequent synthetic `click` lands inside the freshly-mounted overlay, triggering an unintended selection. `onClick` fires on lift, before the modal exists.

**Why `onClick` for layout shifts:** If the action fires on `pointerDown`, the layout shifts before the finger lifts and the `click` lands on whatever element is now at those coordinates.

**Why `onClick` for close/dismiss buttons:** Closing an overlay unmounts it while the finger is still down. The `pointerUp` + synthetic `click` then fires on whatever element is now visible at those coordinates, triggering an unintended action. Always use `onClick` for any button whose job is to remove, hide, or dismiss UI.

---

## What NOT to Do

- No authentication — app is personal/local-first
- Do not enforce game rules strictly — track and remind, never block
- Do not auto-install npm packages without explaining the tradeoff
- Do not create deeply nested component trees
- Do not use `px` for font sizes — use `rem`

---

## Key Implementation Notes

Read this section before touching any of these areas.

### General

- **Space Marine chapters** (Black Templars, Blood Angels, etc.) are hidden from faction picker via `HIDDEN_FACTIONS` in `SetupScreen.jsx`; data retained in `factions.js`

### Game Flow

- **Begin Battle** requires Attacker/Defender and First Turn roll-offs to be set
- **Secondary deck** is shuffled on `startGame()` in the store
- **Player layout**: left panel = player who goes first (set by roll-off); right = second; applies across all tabs
- **`firstPlayer`** stored in Zustand (`1 | 2`); captured from `activePlayer` inside `beginBattle()`; `advancePhase` uses `activePlayer === firstPlayer` to detect end of first player's turn
- **Accent colours** are role-based (not player-number): applied via `ROLE_ACCENT` in `TrackerTab`, `PhasesTab`, `FactionsTab`; VP name labels in `ObjectivesSidebar` also use role colours
- **`PlayerTrackerPanel`** accepts `isAttacker` boolean prop for accent colour
- **`GameScreen`** derives `attackerNum`, `defenderNum`, `firstPlayerNum`, `secondPlayerNum` and passes as props to all tabs

### Command Points & Victory Points

- **`vp.byRound`** is an array of `{ primary, sec1, sec2 }` objects; `vp.total/primary/secondary` always recomputed from scratch in `adjustVP`
- **`adjustVP(player, round, column, delta)`** is the single VP mutation; **`adjustCP(player, delta)`** for CP — both log and snapshot automatically
- **Auto +1 CP** fires inside `advancePhase` (store) when landing on phase 0; grants +1 to both players at each Command Phase transition
- **VP table column headers** are conditional: active/expanded shows full names; inactive shows abbreviated

### Timers

- **Per-player timers** are timestamp-based: `timers.p1/p2` hold banked elapsed seconds; `timerStartedAt` is a `Date.now()` anchor set on resume, cleared on pause
- **Timer initial state**: `timerPaused: true` — timers don't start until user resumes
- **`advancePhase`**: same-player phases re-anchor; player-switch transitions bank outgoing player's timer then set new anchor
- **localStorage persistence**: `history`, `timerPaused`, and `timerStartedAt` excluded from persistence; `timerPaused` forced to `true` on rehydration

### Header & Layout

- **Header layout**: left: Round · Phase · Next Phase · Pause; center: P1 timer · P1 name · P1 stats · vs · P2 stats · P2 name · P2 timer; right: Undo · Log · Setup
- **Header stat block**: `flex-col` with CP on top and VP below; values `text-base font-semibold tabular-nums`; suffix labels `text-[10px]`
- **Pause button**: single button freezes/resumes both timers; green when paused (▶), gray when running (⏸)
- **Game over**: `gameOver: true` set when advancing past Round 5 second-player Fight Phase; blocks `advancePhase`

### Secondary Cards & Missions

- **Secondary cards**: `hand: { p1: [null, null], p2: [null, null] }` top-level store state; `drawCard` / `discardCard` both snapshot for undo
- **Card lightbox**: `getBoundingClientRect()` on `onPointerDown` stored in `useRef`, spring easing `cubic-bezier(0.34, 1.56, 0.64, 1)`; tap backdrop to close
- **DrawModal** does NOT close on backdrop tap — user must tap cancel or select a card

### Phase Reminders

- **Reminders lookup**: `reminders.js` uses a hierarchical object — faction name as top-level key, detachment as nested key. `ArmyPanel.jsx` contains a `normalizeName` helper (lowercase + strip whitespace) used for leader/bodyguard fuzzy matching — this does **not** apply to phase reminder lookups, which use exact string keys.
- **`reminders.js`** structure: `general_reminders`, `faction_reminders`, `detachment_reminders`; `PhaseReminders` colocated in `TrackerTab.jsx`

### Roster Import

- Players export `.json` from NewRecruit and load it in the Army tab
- Parsed client-side by `src/utils/parseRosterJson.js`
- Synced to Cloudflare KV (`POST /api/rosters`); localStorage (`wh40k-imported-rosters`) retained as offline fallback
- Army tab fetches from `GET /api/rosters` on mount and merges with localStorage
- Player selections persisted under `wh40k-army-selection` as `{ p1: label | null, p2: label | null }`
- Re-importing a file with the same label replaces the existing entry

### Army Tab — UnitAccordion

**Collapsed row** (min 48px):
```
▶  Unit Name          6"  T3  4+  W3  7+  OC1
```
- T value gets a subtle role-coloured highlight
- Invuln shown as `4+ (5++)` when present

**Expanded** — stats row, then:
- Ranged weapons table (omitted if none): A · BS · S · AP · D · Keywords
- Melee weapons table (omitted if none): A · WS · S · AP · D · Keywords
- Abilities / Rules section: merged `unit.abilities` + `unit.unitRules`; chip colours by flag priority: `_isEnhancement` → fuchsia-500; `_isLeader && _isRule` → orange-500; `_isLeader` → amber-400; `_isRule` → muted border; plain ability → teal-500; `AbilityPopup` handles all
- Composition accordion (collapsed by default): model breakdown with equipment

**Dead units:**
- State in localStorage `wh40k-dead-units`: `{ [rosterLabel]: number[] }`; loaded as `Set<number>` on mount; managed in `ArmyPanel.jsx`
- Dead units render `opacity-50` on collapsed row; sorted to bottom of list
- Toggle uses `onClick` (not `onPointerDown`) — list re-sorts on state update, tap-through risk

**Inactive sliver −1 CP button** (`TrackerTab.jsx`): `onPointerDown` + `e.stopPropagation()`; 48px tap target; disabled at CP 0

### Unit Pop-out System (v1.8.5)

Three card states, all rendered as `fixed` overlays above all panels:

**Browse mode** (`UnitPopOut.jsx`):
- Triggered by tapping a unit row in `UnitAccordion`; state (`selectedUnitIndex`) lives in `ArmyPanel`
- `fixed inset-0 z-50` scrim + `fixed z-[60]` centred card (max-w 480px, max-h 85vh, scrollable)
- Enlarged stat block (all 6 stats); all stats neutral styling — no highlights
- Footer: "Mark as Destroyed", "⚔ Set as Attacker", "🛡 Set as Defender"
- Close button: `onClick`; scrim and designation buttons: `onClick`
- Ability/keyword popups: `AbilityPopup` at `z-[70]`
- `CompositionAccordion` exported from `UnitPopOut.jsx` for reuse in `CombatOverlay.jsx`

**Attacker / Defender cards** (`CombatOverlay.jsx`):
- Mounted in `ArmyTab` above both panels; reads `attackerUnit` / `defenderUnit` from Zustand
- **Single card active**: `CombatOverlay` renders `fixed inset-0 z-50 bg-black/75 backdrop-blur-sm` (same scrim as other overlays); both source and target panels are elevated to `z-[60]` via `(elevated || chipData)` on the panel root; source panel has an inner `absolute inset-0 bg-black/75 backdrop-blur-sm z-10` overlay to visually match the scrim (panel content behind the chip appears covered); chip sits at `z-20` above the inner overlay; target panel has no inner overlay — fully visible and tappable; `chipData` prop (`{ displayName, role }`) passed from `ArmyTab` to the source panel; target panel shows its `pendingRole` prompt bar
- **Both cards active**: `z-50` scrim (`onClick → clearCombatUnits()`); cards in `fixed inset-0 z-[60] flex py-12 px-3 gap-3 pointer-events-none` container; each card wrapper `w-1/2 pointer-events-auto`; `attackerIsLeft` determined by comparing `attackerUnit.rosterLabel` with `attackerRosterLabel`
- Attacker card: red left border; full content — neutral stat row (all 6), ranged + melee weapon tables, Abilities/Rules section, Composition accordion
- Defender card: green left border; giant T + Sv + W boxes (`text-5xl`, in that order); M/Ld/OC smaller below in `grid-cols-3`; attached leader secondary stats row in amber (`— [Leader Name]` + compact M/T/Sv/W/Ld/OC); abilities section
- Cards use `max-h-[calc(100vh-6rem)]` (matches `py-12` container padding)
- Each card's × button: `onClick`; clears only that designation (layout shift on close → `onClick` prevents tap-through)

**Zustand state** (`gameStore.js`):
- `attackerUnit` / `defenderUnit`: `{ rosterLabel, unitIndex, leaderUnitIndex, displayName, leaderDisplayName } | null`
- Persisted via `partialize` (included in `...rest`); excluded from `saveSnapshot` (not in snapshot object)
- Actions: `setAttackerUnit(payload)`, `setDefenderUnit(payload)`, `clearCombatUnits()`
- `resetGame` spreads `initialState` then explicitly sets both to `null`

### Leader Attachment (v1.7.2)

- A unit is a **leader** if it has `[Character]` keyword AND an ability with `typeName === "Abilities"` and `name === "Leader"`
- Valid bodyguard names encoded between `^^` markers in the Leader ability description → extracted to `unit.leaderOf: string[]`
- **Fuzzy matching**: a leader's `leaderOf` entry matches a roster unit if the unit name **contains** the bodyguard string (case-insensitive)
- Attachment state: localStorage `wh40k-leader-attachments` — `{ [rosterLabel]: { [leaderUnitIndex]: bodyguardUnitIndex | null } }`
- When attached: leader and bodyguard accordions visually merge into a combined entry
- Accent colour: amber (`amber-400` unattached / `amber-500` attached)

### Mobile Layout (v1.8.2–v1.8.3)

- All three main tabs (Tracker, Factions, Army) have responsive layouts at the `md:` (768px) breakpoint
- Desktop: `hidden md:flex` two-column layout; Mobile: `flex flex-col md:hidden` single-column with player toggle bar
- Toggle bar: two `flex-1 h-12` buttons; active uses role accent with `border-b-2`; inactive is `text-chrome`
- Both panels always mounted on mobile; CSS (`h-full` / `hidden`) controls visibility — no state loss on toggle
- **DeviceModeModal**: `wh40k-device-mode` localStorage key; `'army'` mode bypasses game flow and renders Army tab directly; `'game'` mode = normal flow
- Mode switcher: `SlidersHorizontal` icon in TabBar, re-shows modal without clearing game state

### Parser — `src/utils/parseRosterJson.js`

Pure transform: `parseRosterJson(json)` → `{ label, faction, detachment, units }`. No React, no I/O.

- Handles both NewRecruit array-style and older xml2js-wrapped formats
- `roster.name` → `label`; `force.catalogueName` → `faction` (strips `"Xenos - "` etc. prefixes)
- Detachment: top-level selection `name === "Detachment"` → first child name
- Unit stats from `profiles` entry with `typeName === "Unit"`; T/W/OC coerced to int
- Invuln: `Abilities` profile whose `name` matches `/^\d+\+\+$/`
- Weapons: recursive walk of `selections`, collect by `typeName`, de-dupe by name, sum `count`
- Points: recursive sum of `costs` (name === "pts") across unit and all descendants
- Multi-model fallback: if no Unit profile at top level, falls back to `collectProfiles(sel, 'Unit')[0]`

### Wahapedia HTML Rendering

- **`renderWahapediaHtml(html)`** in `src/utils/renderWahapediaHtml.js` — use this instead of `sanitiseHtml` whenever HTML structure must be preserved for display
- Renames `<span class="kwb">` → `<span class="wh-kwb">`; strips all `style` and `class` attributes except `wh-kwb`; leaves all structural tags intact (`<b>`, `<ul>`, `<li>`, `<br>`, `<table>`, etc.)
- Output is passed to `dangerouslySetInnerHTML` inside a `<div className="wh-content">` wrapper
- `.wh-content` and `.wh-kwb` styles live in `src/index.css`; `.wh-kwb` renders keywords in blue (`#60a5fa`)
- `sanitiseHtml` in `parseWahapediaCsv.js` is kept for any plain-text contexts; do not delete it

### Army Tab — Rules & Stratagems (v1.9)

- **Data source**: Wahapedia CSVs in `src/data/csv/`. Loaded via Vite `?raw` imports and parsed by `parseWahapediaCsv.js`.
- **Hook `useArmyRuleData.js`**: Cross-references roster faction/detachment names with Wahapedia IDs. Normalises strings (lowercase, trim, smart-quote handling) for fuzzy matching. Returns `coreStratagems`, `detachmentStratagems`, `factionAbilities` (Army Rules), and `detachmentAbility`.
- **HTML rendering**: All Wahapedia-sourced descriptions must use `renderWahapediaHtml(html)` wrapped in a `div.wh-content` — do not use `sanitiseHtml` for display contexts.
- **Deduplication**: `deduplicateByName.js` retains only the highest-ID row per stratagem name when multiple CSV entries exist.
- **UI**:
  - "Army Rule" and "Stratagems" buttons in `ArmyPanel` header open fixed overlays.
  - `RulesAccordion.jsx`: `grid-cols-2` stratagem layout for tablet landscape.
  - `StratagemCard.jsx`: displays CP cost, type, phase/turn restrictions, and formatted description.
- **Modal state**: `stratagemsOpen` and `armyRuleOpen` are local state in `ArmyPanel.jsx` — transient UI, no persistence needed.

### Cloudflare KV API (v1.8.1)

- `GET /api/rosters` → `{ rosters: [...] }`
- `POST /api/rosters` → body `{ roster: { label, faction, detachment, units } }` → upserts by label → `{ ok: true }`
- KV key: `"all_rosters"` — single JSON array
- CORS headers: `Access-Control-Allow-Origin: *`
- If KV fetch fails: fall back silently to localStorage; show `● offline` badge in Army tab controls

---

## Build History

| Version | Feature | Status |
|---------|---------|--------|
| v1–v1.2 | Core game loop: setup, CP/VP, objectives, phases, timer, factions | ✅ Done |
| v1.3 | Phase reminders (faction/detachment, per phase) | ✅ Done |
| v1.4 | Timer persistence fix (timestamp-based) | ✅ Done |
| v1.5 | End-of-game modal, CP/VP legibility, reminders reorder, inactive −1 CP | ✅ Done |
| v1.6 | Army list reference tab (UnitAccordion, weapon tables, abilities) | ✅ Done |
| v1.7 | NewRecruit .json roster import (client-side parse, localStorage) | ✅ Done |
| v1.7.2 | Leader Attachment — character detection, bodyguard linking, merge UI | ✅ Done |
| v1.7.3 | Leader Attachment bug fix — fuzzy bodyguard matching | ✅ Done |
| v1.8.1 | Cloudflare Pages migration + KV roster sync | ✅ Done |
| v1.8.2 | Mobile layout — Army tab responsive, player toggle | ✅ Done |
| v1.8.3 | Mobile layout — Tracker, Factions, Setup screen | ✅ Done |
| v1.8.3.3 | Unit rules in Abilities/Rules section (UnitAccordion + parser) | ✅ Done |
| v1.8.3.4 | Log button tap-through fix + model count in UnitAccordion header | ✅ Done |
| v1.8.4 | UnitAccordion stacked header, pts per unit + army total, dead unit marker | ✅ Done |
| v1.8.5 | Unit card pop-outs — scrim-backed fixed overlay; Browse / Attacker / Defender states; enlarged stat block; side-by-side combat cards; persist across refresh | ✅ Done |
| v1.8.5.1 | Combat overlay bug fixes — attacker full content; browse stat neutral; defender T+W+Sv; leader stats row; no scrim on single card; half-screen positioning | ✅ Done |
| v1.8.5.2 | Pending chip repositioned — rendered inside source ArmyPanel as absolute overlay, centred within panel bounds only; scrim removed from single-chip state | ✅ Done |
| v1.8.5.3 | Full scrim on single-card state — global z-50 scrim covers all; target panel elevated z-[60] (clear); source panel elevated z-[60] with inner bg-black/75 overlay to appear covered; chip at z-20 above overlay | ✅ Done |
| v1.8.5.4 | Combat overlay ✕ close buttons switched from `onPointerDown` to `onClick` — prevents tap-through to elements beneath after card closes | ✅ Done |
| v1.8.5.5 | Browse card ✕ and pending chip ✕ switched to `onClick`; single-card scrim gains `onClick={clearCombatUnits}` — completes tap-through fix across all pop-out states | ✅ Done |
| v1.9.0 | Wahapedia integration — CSV data layer (`src/data/csv/`); `useArmyRuleData` hook for faction/detachment matching; Army Rule & Stratagems modals (`ArmyRuleModal`, `StratagemsModal`, `RulesAccordion`, `StratagemCard`); `deduplicateByName` utility; HTML formatting preserved via `renderWahapediaHtml` + `.wh-content` | ✅ Done |

**Cross-cutting features shipped:** undo (20-snapshot stack), action log, mission card images + lightbox, localStorage persistence, secondary card draw/discard/lightbox.

---

## Current Progress

**Last updated:** 27/04/2026

**Status:** v1.9.0 complete. Wahapedia CSV data layer added (`src/data/csv/`). `useArmyRuleData` hook cross-references roster faction/detachment names against Wahapedia IDs with fuzzy normalisation. Army Rule and Stratagems modals ship in the Army tab — `ArmyRuleModal`, `StratagemsModal`, `RulesAccordion`, `StratagemCard`. Stratagem deduplication via `deduplicateByName.js`. All Wahapedia descriptions rendered via `renderWahapediaHtml` + `.wh-content`. `sanitiseHtml` retained for plain-text contexts only.

---

## Roadmap

### v1.10 — Setup Screen Rework & Mission Switcher (planned)

1. **Setup screen rework** — player army/detachment selection driven by imported `.json` rosters rather than manual faction picker dropdowns
2. **Mission card switcher** — allow changing the active primary mission mid-game

---

### Deferred to v2+

- Custom ability editing
- Match history export
- Asymmetric War mode
- Challenger card tracker (rules documented but no trigger logic, draw logic, or scoring exists in the codebase yet)
- Wound roll matrix (S vs T pre-computed)
- Filtering units by phase (show only melee weapons in Fight Phase)