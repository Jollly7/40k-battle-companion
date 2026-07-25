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
    normalizeDetachment.js # `normalizeDetachment` — coerces detachment (string[] | string | null) to string[]
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

- **Reminders lookup**: `reminders.js` is **pure data, no logic** — a hierarchical object with faction name as top-level key, detachment as nested key. The lookups live in the two components that read it: `FactionsTab.getReminders` and `TrackerTab.PhaseReminders`, each via a local `resolveDetachmentReminders(faction, detachment)` helper that runs `normalizeDetachment` and takes the first name with data (v1.13.1). `ArmyPanel.jsx` contains a `normalizeName` helper (lowercase + strip whitespace) used for leader/bodyguard fuzzy matching — this does **not** apply to phase reminder lookups, which use exact string keys.
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
- Footer: "Mark as Destroyed", "⚔ Set as Attacking Unit", "🛡 Set as Target Unit"
- Close button: `onClick`; scrim and designation buttons: `onClick`
- Ability/keyword popups: `AbilityPopup` at `z-[70]`
- `CompositionAccordion` exported from `UnitPopOut.jsx` for reuse in `CombatOverlay.jsx`

**Attacker / Defender cards** (`CombatOverlay.jsx`):
- Mounted in `ArmyTab` above both panels; reads `attackerUnit` / `defenderUnit` from Zustand
- **Single card active**: `CombatOverlay` renders `fixed inset-0 z-50 bg-black/75 backdrop-blur-sm` (same scrim as other overlays); both source and target panels are elevated to `z-[60]` via `(elevated || chipData)` on the panel root; source panel has an inner `absolute inset-0 bg-black/75 backdrop-blur-sm z-10` overlay to visually match the scrim (panel content behind the chip appears covered); chip sits at `z-20` above the inner overlay; target panel has no inner overlay — fully visible and tappable; `chipData` prop (`{ displayName, role }`) passed from `ArmyTab` to the source panel; target panel shows its `pendingRole` prompt bar
- **Both cards active**: `z-50` scrim (`onClick → clearCombatUnits()`); cards in `fixed inset-0 z-[60] flex py-12 px-3 gap-3 pointer-events-none` container; each card wrapper `w-1/2 pointer-events-auto`; `attackerIsLeft` determined by comparing `attackerUnit.rosterLabel` with `attackerRosterLabel`
- Attacker card: red left border; full content — neutral stat row (all 6), ranged + melee weapon tables, Abilities/Rules section, Composition accordion
- Defender card (v1.12): green left border; fixed header shows a per-model-type table — columns: Name × remaining | M | T | Sv | W | Ld | OC | InvSv | FNP | +/✕; bodyguard rows first, leader rows appended (amber text); T column highlighted in success colour; InvSv in amber-400, FNP in blue-400 when present; ✕ calls `removeCasualty`; "+" calls `addCasualty` (disabled at 0 casualties, green); row goes `opacity-40 line-through` at 0 remaining; scrollable body has Abilities/Rules section. `resolveUnit()` returns `bodyguardKey` (`${rosterLabel}:${unitIndex}`) and `leaderKey`. `getEffectiveProfiles()` synthesises a single entry from `unit.stats` for legacy rosters lacking `modelProfiles`.
- Cards use `max-h-[calc(100vh-6rem)]` (matches `py-12` container padding)
- Each card's × button: `onClick`; clears only that designation (layout shift on close → `onClick` prevents tap-through)

**Zustand state** (`gameStore.js`):
- `attackerUnit` / `defenderUnit`: `{ rosterLabel, unitIndex, leaderUnitIndex, displayName, leaderDisplayName } | null`
- Persisted via `partialize` (included in `...rest`); excluded from `saveSnapshot` (not in snapshot object)
- Actions: `setAttackerUnit(payload)`, `setDefenderUnit(payload)`, `clearCombatUnits()`
- `resetGame` spreads `initialState` then explicitly sets both to `null`
- `casualties: {}` (v1.11): flat map keyed `${rosterLabel}:${unitIndex}:${profileId}` → removed count; resets with game (in `initialState`); persisted via `partialize`; mutated by `removeCasualty(unitKey, profileId, maxCount)` (increments, clamped at maxCount) and `addCasualty(unitKey, profileId)` (decrements, clamped at 0)

### Leader Attachment (v1.7.2)

- A unit is a **leader** if it has `[Character]` keyword AND an ability with `typeName === "Abilities"` and `name === "Leader"`
- Valid bodyguard names are extracted from the Leader ability description into `unit.leaderOf: string[]`. **Two mutually exclusive formats** (v1.13.2) — caret markers (`^^Breacher Team^^`, used by Cadre Fireblade) take precedence; otherwise line-start bullets (`- NAME` / `■ Name`, used by T'au Commanders and GSC/Grey Knights). Both branches run the same `cleanName` helper, which strips `*` and `^`, because the bullet format also wraps names in markdown bold (`- **CRISIS STARSCYTHE BATTLESUITS**`). Do not let the two branches' cleaning diverge — that was the v1.13.2 bug.
- **Fuzzy matching**: `ArmyPanel.normalizeName` lowercases and strips **all non-alphanumerics**, then compares for **strict equality** (not containment). This absorbs ALL CAPS, missing spaces, leftover markdown markers in rosters imported before v1.13.2, and smart vs straight apostrophes. Single call site — the `validBodyguards` filter in `ArmyPanel.jsx`.
- **Failure mode to know**: if no `leaderOf` entry matches, `validBodyguards` is empty, `hasValidBodyguards` is false, and `UnitAccordion` renders **no "Attach ▾" button at all** — silently, with no error. A missing attach button always means a name-matching failure.
- Attachment state: localStorage `wh40k-leader-attachments` — `{ p1: { [leaderUnitIndex]: bodyguardUnitIndex }, p2: {...} }`, keyed by **panel slot** (`pKey`), not roster label. Because the keys are bare unit indices, `ArmyPanel` needs its explicit label-change `useEffect` reset to stop stale indices leaking onto a newly selected roster.
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

Pure transform: `parseRosterJson(json)` → `{ label, faction, detachment, forceDisposition, units, rules }`. No React, no I/O.

- Handles both NewRecruit array-style and older xml2js-wrapped formats
- `roster.name` → `label`; `force.catalogueName` → `faction` (strips `"Xenos - "` etc. prefixes)
- **`detachment`** (v1.13.0) is **`string[]`**, not a string — every child name under the top-level `Detachment` selection, in document order. Rosters can legitimately declare more than one (confirmed: T'au `["Advanced Acquisition Cadre", "Kauyon"]`); the previous first-child-only read silently dropped the rest. No filtering by category, cost, or "primary" — the parser reports what the export contains and leaves interpretation to consumers. A roster with no `Detachment` selection yields `[]` (never throws, never `null`). Nameless/blank children are dropped defensively.
- **`forceDisposition`** (v1.13.0): `string | null` — the name of the single child under a top-level `Force Disposition` selection (e.g. `"Priority Assets"`), else `null`. Present in 11th Ed exports, absent from 10th Ed ones. Note the value can coincide with a *category* name on a Detachment child; they are unrelated fields and are deliberately not correlated.
- Top-level selections still **not** read by the parser: `Battle Size`, `Show/Hide Options`
- Unit stats from `profiles` entry with `typeName === "Unit"`; T/W/OC coerced to int
- Invuln: `Abilities` profile whose `name` matches `/^\d+\+\+$/`
- Weapons: recursive walk of `selections`, collect by `typeName`, de-dupe by name, sum `count`
- Points: recursive sum of `costs` (name === "pts") across unit and all descendants
- Multi-model fallback: if no Unit profile at top level, falls back to `collectProfiles(sel, 'Unit')[0]`
- **`modelProfiles`** (v1.11): array of `{ id, name, count, stats, invuln, fnp }` — one entry per distinct model type (e.g. Beast Snagga Boy × 9, Beast Snagga Nob × 1); single-model units produce exactly one entry. `invuln` (v1.12) detected primarily from Abilities profile names matching `"Invulnerable Save (X+)"` → stored as `"5+"`; bare `^\d+\+\+$` kept as fallback. `fnp` detected from rule/ability names matching `/Feel No Pain (\d+\+)/i`. Both checked per-model then falling back to unit-level. Added by `getModelProfiles()`, `extractInvuln()`, `extractFnp()` helpers.
- **`sources`** (v1.12): each weapon entry in `unit.ranged` / `unit.melee` now has `sources: [{ profileId, qty }]` where `profileId` matches `modelProfiles[].id` and `qty` = model count in that group. Built by `collectWeaponsWithSources()`. `count` = sum of source `qty` values. Used by `AttackerCard` to recompute remaining weapon quantities as models are killed. Legacy rosters (imported before v1.12) lack `sources` and display original quantities unchanged.
- **Invuln display shape** (v1.13.3): the parser stores invuln in **two shapes** — `"4+"` (11th Ed `InSv` characteristic and the `"Invulnerable Save (4+)"` ability-name match) and `"4++"` (bare `^\d+\+\+$` ability-name fallback). This is deliberate: the parser reports what the export contains. **`src/utils/formatInvuln.js`** — `formatInvuln(value) → "4++" | null` — normalises both to standard `X++` notation **on read**, so rosters already in Cloudflare KV render correctly with no re-import (same principle as `normalizeDetachment` and `ArmyPanel.normalizeName`). Returns `null` for `"-"`, `null`, `""`, and non-strings, so callers gate on the helper's return, not on the raw field. Applied at all five display sites: `UnitAccordion` (`SV (X++)` collapsed row), `UnitPopOut` (browse stat block + merged-leader stats row), `CombatOverlay` (`AttackerCard` stat row + Defender table `InvSv` column). Do not format at parse time — that would strand every roster already synced to KV.
- **NewRecruit data quirk — nested model nodes** (v1.12.2): most units export their model-type child nodes (`type: "model"`) as direct children of the unit selection. Some units (confirmed: Ork Squighog Boyz) nest them one level deeper inside an intermediate `type: "upgrade"` wrapper (e.g. `"1 Nob on Smasha Squig and 3 Squighog Boyz"`). `findUnitProfileAnchors` handles both depths transparently — do not revert to a non-recursive `getSelections(unitSel).filter(s => s.type === 'model')` scan in any of the four model-group callers.

### Detachment Shape — `normalizeDetachment` (v1.13.1)

`detachment` is **`string[]` everywhere** — parser output, store state, and every consumer. Mixed legacy shapes are normalised transparently **on read**; there is no KV migration and no re-import requirement.

- **`src/utils/normalizeDetachment.js`** — `normalizeDetachment(value) → string[]`. Array → filtered copy (non-blank strings only, mirroring the parser's own filter); non-blank string → `[value]`; blank string / `null` / `undefined` / anything else → `[]`. **This is the only place shape detection lives** — never re-implement the check inline.
- **Why legacy shapes persist**: rosters synced to Cloudflare KV (`all_rosters`) before v1.13.0 store `detachment` as a plain string; anything imported since stores an array. **Both shapes coexist in the same stored array.** `functions/api/rosters.js` is shape-agnostic (blind upsert by label) and needs no change.
- **Three store choke points** normalise so downstream always sees an array: `fetchRosters` (both the KV-success and localStorage-fallback branches, via the module-level `normalizeRosters` helper), `setRosters` (optimistic local imports from `ArmyTab.handleImport` and `RosterPickerModal.handleFile`), and `selectRoster` (which copies into `players[n].detachment`).
- Every display and lookup site **also** calls `normalizeDetachment` defensively — persisted Zustand state from an older session can still hold a string or `null` in `players[n].detachment`. `null` remains the store's empty sentinel; the helper maps it to `[]`.
- **`[]` is truthy in JS** — this is what broke every display site in v1.13.0. Always gate on `.length`, never on raw truthiness, and always `.join(', ')` for display: React renders a string array as its elements concatenated **with no separator** (`"KauyonAdvanced Acquisition Cadre"`).
- **First-match-wins matching**: where a single detachment must be resolved (Wahapedia rows, reminder keys), iterate the normalised names and take the first that resolves. No match behaves exactly as an unknown detachment did before.

**Consumers (all 9 updated in v1.13.1):**

| Site | Behaviour |
|---|---|
| `useArmyRuleData.js` | First normalised name matching a Wahapedia detachment row wins. `normName` (smart-quote/case) is now module-level and applied per candidate — `normalizeDetachment` handles shape only, never text. The `useMemo` dep is a **joined string** (`detachmentKey`), not the raw array, or a fresh array identity each render would defeat memoisation. |
| `FactionsTab.jsx` (`resolveDetachmentReminders` → `getReminders`) | First name present in `DETACHMENT_REMINDERS[faction]` wins; `{}` otherwise. Keys stay **exact strings** — no fuzzy matching, so smart-quote variants still don't match (unchanged). |
| `TrackerTab.jsx` (`resolveDetachmentReminders` → `PhaseReminders`) | Same first-match-wins resolution, colocated in `TrackerTab.jsx`. |
| `RosterPickerModal.jsx` · `SetupScreen.jsx` | `faction — name, name`; segment omitted entirely when empty. |
| `ArmyPanel.jsx` | Roster names win; falls back to the store player's when the roster declares none. Army Rule / Stratagems buttons gate on `.length`. Passes the array to the hook. |
| `TrackerTab.jsx` name strip · `FactionsTab.jsx` header · `GameSummaryModal.jsx` | Joined for display (`·` / `,` separators); nothing rendered when empty — no bare separator, no empty element. |

**`forceDisposition` display**: shown only at the three sites that read the roster object directly — `RosterPickerModal`, `SetupScreen`, `ArmyPanel` — as a smaller muted line beneath the faction/detachment line. The store's `players[n]` shape carries `faction` and `detachment` only, so `TrackerTab`, `FactionsTab`, and `GameSummaryModal` have no access to it; adding it would be a store-shape change and was deliberately not done.

### Wahapedia HTML Rendering

- **`renderWahapediaHtml(html)`** in `src/utils/renderWahapediaHtml.js` — use this instead of `sanitiseHtml` whenever HTML structure must be preserved for display
- Renames `<span class="kwb">` → `<span class="wh-kwb">`; strips all `style` and `class` attributes except `wh-kwb`; leaves all structural tags intact (`<b>`, `<ul>`, `<li>`, `<br>`, `<table>`, etc.)
- Output is passed to `dangerouslySetInnerHTML` inside a `<div className="wh-content">` wrapper
- `.wh-content` and `.wh-kwb` styles live in `src/index.css`; `.wh-kwb` renders keywords in blue (`#60a5fa`)
- `sanitiseHtml` in `parseWahapediaCsv.js` is kept for any plain-text contexts; do not delete it

### Army Tab — Rules & Stratagems (v1.9)

- **Data source**: Wahapedia CSVs in `src/data/csv/`. Loaded via Vite `?raw` imports and parsed by `parseWahapediaCsv.js`.
- **Hook `useArmyRuleData.js`**: Cross-references roster faction/detachment names with Wahapedia IDs. Normalises strings (lowercase, trim, smart-quote handling) for fuzzy matching. Returns `coreStratagems`, `detachmentStratagems`, `factionAbilities` (Army Rules), and `detachmentAbility`. **Cross-faction deduplication**: after filtering abilities by `faction_id`, any ability whose `id` also appears under a *different* `faction_id` is excluded — prevents cross-tagged rows (e.g. Synapse, Shadow in the Warp tagged under both `TYR` and `GC`) from leaking into the wrong faction's Army Rule modal.
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
| v1.9.1 | Cross-faction ability bleed fix — `useArmyRuleData` excludes ability IDs that appear under any other faction, preventing cross-tagged rows (e.g. Synapse, Shadow in the Warp) from showing in the wrong Army Rule modal | ✅ Done |
| v1.10.0 | Setup screen rework — faction/detachment dropdowns replaced with per-player `RosterPickerModal`; `gameStore` gains `rosters`, `rostersLoaded`, `player1RosterLabel`, `player2RosterLabel`, `fetchRosters`, `selectRoster`, `setRosters`; roster list shared between Setup and Army tab via store; `ArmyTab` consumes store rosters with no-double-fetch guard | ✅ Done |
| v1.10.1 | Army tab weapon table fix — A/D column clipping in CombatOverlay Attacker card resolved; `WeaponTable` gains `compact` prop that widens stat columns (7–10%) and trims Name/Keywords for half-screen combat cards; panel ordering fix reverted pending further analysis | ✅ Done |
| v1.11.0 | Defender card: per-model-type defensive stat table (Name/M/T/Sv/W/Ld/OC/InvSv/FNP/✕) replaces single highlighted stat block; leader profiles appended as amber rows; casualty tracking via `removeCasualty` in store (`casualties: {}` resets with game); eliminated rows grey out and strike through. Parser extended with `modelProfiles`, `extractInvuln`, `extractFnp`, `getModelProfiles` — required real parser changes since per-model stats, invuln, and FNP were not previously captured. Legacy rosters (no `modelProfiles`) fall back to a single synthesised entry from `unit.stats`. Attacker card unchanged. | ✅ Done |
| v1.12.0 | **InvSv fix**: `extractInvuln` now primarily matches `"Invulnerable Save (5+)"` ability profile names (actual NewRecruit format) and returns e.g. `"5+"`; bare `^\d+\+\+$` kept as fallback. Inline invuln check in `parseUnit` updated to call `extractInvuln`; ability chip filter updated to exclude `Invulnerable Save (X+)` entries. **Add-model-back button**: `addCasualty` action in store decrements casualty count clamped at 0; Defender table gains a "+" button per row (disabled at 0 casualties) alongside the existing "✕". **Weapon-casualty sync**: parser gains `collectWeaponsWithSources` — each weapon entry now has `sources: [{ profileId, qty }]` attributing it to the model group(s) that carry it (profileId matches `modelProfiles[].id`); `count` = sum of source qty values. `AttackerCard` subscribes to `casualties` and recomputes each weapon's remaining quantity via `recomputeWeaponQuantities`; weapons at 0 remaining get `_depleted: true`. `WeaponTable` applies `opacity-40 line-through` to depleted rows. Legacy rosters (no `sources`) pass through unchanged. | ✅ Done |
| v1.12.1 | **Defender table row disambiguation**: parser gains `disambiguateModelProfileNames` — after `modelProfiles` is built for a unit, weapon-name sets are collected directly from each model selection (positionally matched, mirroring `getModelProfiles`'s null-filter), the intersection across all profiles is computed as the shared/default loadout, and each profile's distinguishing weapons (own − common, minus any that are already a case-insensitive substring of the profile's base name) are appended as a parenthetical suffix (e.g. "Neophyte Hybrid w/ Heavy Weapon (Seismic cannon)"). Fully data-driven — no hardcoded unit or weapon names. Only `name` is mutated; `id`, `count`, `stats`, `invuln`, `fnp`, and `sources` are untouched. Single-profile units degrade safely (no suffix). Re-import rosters to pick up the new names. | ✅ Done |
| v1.12.2 | **Recursive model-type anchoring**: parser gains `findUnitProfileAnchors(unitSel)` — recursively walks a unit's selection tree to locate every node that directly owns a `Unit`-typeName profile, stopping descent at each anchor (its subtree is weapons/wargear, not further model groups). Fixes Squighog Boyz (and any unit where model-type nodes are nested inside an intermediate `type: "upgrade"` wrapper) producing zero Defender card rows. `getModelProfiles`, `getComposition`, `collectWeaponsWithSources`, and `disambiguateModelProfileNames` all refactored to call the shared helper instead of the non-recursive `getSelections(unitSel).filter(s => s.type === 'model')` scan. No output-shape changes; single-model fallback and all existing unit types unaffected. Re-import rosters to pick up correct model profiles. | ✅ Done |
| v1.12.3 | **CombatOverlay portrait/landscape layout**: `bothActive` branch detects orientation via `window.innerWidth < window.innerHeight`; portrait renders a `flex-col` container with attacker card always on top (`flex-[3]`) and defender always below (`flex-[1]`), both full-width, independently scrollable; landscape retains the existing side-by-side `flex` row with `attackerIsLeft` ordering unchanged. Single-card scrim-only path untouched. | ✅ Done |
| v1.12.4 | **11th Edition parser compatibility**: `getStat()` helper introduced — all Unit profile characteristic lookups are now case-insensitive, fixing `Sv` vs `SV` casing change in 11th Ed exports. `extractInvuln()` updated to read native `InSv` characteristic from Unit profile as primary source (value `"-"` treated as absent); existing ability-text fallback (`"Invulnerable Save (X+)"` and bare `\d++` patterns) retained for 10th Ed roster compatibility. Both old and new format rosters work without re-import. | ✅ Done |
| v1.12.5 | **`rostersLoaded` persistence fix**: excluded `rostersLoaded` from Zustand `partialize`. Previously, rehydration set `rostersLoaded: true`, causing `SetupScreen`'s `useEffect` guard to block `fetchRosters()` forever — tablet always showed stale localStorage rosters. Principle: any boolean used as a fetch guard must not be persisted, or it permanently suppresses the fetch after the first session. | ✅ Done |
| v1.12.6 | **HTTP cache fix for roster API**: `GET /api/rosters` now sets `Cache-Control: no-store`. Previously, Cloudflare Pages Functions returned no caching headers, so browsers applied heuristic caching — devices served stale roster lists after a new upload until the user cleared site data. Principle: Pages Functions set no `Cache-Control` by default; any dynamic API endpoint must explicitly set `no-store` or browsers may cache and serve stale responses. | ✅ Done |

| v1.13.0 | **Multi-detachment parsing (parser only)**: `detachment` changes from `string` to **`string[]`** — every child under the top-level `Detachment` selection in document order, no filtering and no "primary" designation. Fixes rosters declaring two detachments (confirmed: T'au `["Advanced Acquisition Cadre", "Kauyon"]`) silently losing all but the first. New **`forceDisposition: string \| null`** field reads the single child of a top-level `Force Disposition` selection (11th Ed only). Missing `Detachment` selection yields `[]`, never throws. No other output shape changed — `modelProfiles`, `sources`, invuln/FNP extraction, `getStat()`, and `findUnitProfileAnchors()` untouched. Consumers updated in v1.13.1. | ✅ Done |
| v1.13.1 | **Detachment consumers made array-aware**: new `src/utils/normalizeDetachment.js` (`string[] \| string \| null → string[]`) is the single home for shape detection. **9 sites fixed** — (1) `useArmyRuleData.js` crash (`.toLowerCase()` on an array): first-match-wins across candidates, `normName` hoisted to module scope, `useMemo` dep switched from the raw array to a joined `detachmentKey` string; (2) `FactionsTab.getReminders` and (3) `TrackerTab.PhaseReminders` reminder lookups, each via a local `resolveDetachmentReminders` first-match-wins helper (`reminders.js` itself is pure data and unchanged); (4) `RosterPickerModal.jsx`, (5) `ArmyPanel.jsx` (display, `.length` button gating, hook prop), (6) `GameSummaryModal.jsx`, (7) `SetupScreen.jsx`, (8) `TrackerTab.jsx` name strip (dangling `" · "`), (9) `FactionsTab.jsx` header (React concatenating array children with no separator) — all now gate on `.length` and `.join(', ')`. **Three store choke points** (`fetchRosters`, `setRosters`, `selectRoster`) normalise on read via the module-level `normalizeRosters` helper, so mixed legacy string/array records in Cloudflare KV work with no migration and no re-import. `forceDisposition` now rendered as a muted secondary line at the three roster-object sites (`RosterPickerModal`, `SetupScreen`, `ArmyPanel`). `functions/api/rosters.js` unchanged (shape-agnostic). | ✅ Done |
| v1.13.2 | **Leader attach button missing for T'au Commanders**: the `leaderOf` bullet-format fallback in `parseRosterJson.js` did not strip markdown bold, so entries came out as `"**CRISIS STARSCYTHE BATTLESUITS**"` and never matched the roster's `"Crisis Starscythe Battlesuits"` — `validBodyguards` was empty and `UnitAccordion` rendered no "Attach ▾" button at all. The caret branch stripped `*`; the bullet branch did not. Both branches now share one `cleanName` helper (strips `*` and `^`). Separately, `ArmyPanel.normalizeName` widened from stripping whitespace to stripping all non-alphanumerics, so rosters **already** stored in Cloudflare KV / localStorage match without re-import (same normalise-on-read principle as `normalizeDetachment`) and smart vs straight apostrophes stop mattering. Affects every datasheet using the bullet format, not just T'au. | ✅ Done |

| v1.13.3 | **Invuln saves displayed in `X++` notation**: new `src/utils/formatInvuln.js` normalises the parser's two stored shapes (`"4+"` from the 11th Ed `InSv` characteristic / `"Invulnerable Save (4+)"` ability match, and `"4++"` from the bare-name fallback) to standard 40k `X++` notation on read. Applied at all five display sites — `UnitAccordion` collapsed row, `UnitPopOut` browse stat block and merged-leader stats row, `CombatOverlay` `AttackerCard` stat row and Defender table `InvSv` column. Parser unchanged, so rosters already in Cloudflare KV need no re-import. Riptide Battlesuit now reads `2+ (4++)` instead of `2+ (4+)`. | ✅ Done |

**Cross-cutting features shipped:** undo (20-snapshot stack), action log, mission card images + lightbox, localStorage persistence, secondary card draw/discard/lightbox.

---

## Current Progress

**Last updated:** 25/07/2026

**Status:** v1.13.3 complete — invulnerable saves now display in standard `X++` notation everywhere. The parser was left alone deliberately: it stores `"4+"` for 11th Ed `InSv` / `"Invulnerable Save (4+)"` and `"4++"` for the bare-name fallback, and `formatInvuln()` collapses both on read, so no roster in Cloudflare KV needs re-importing. Verified against `1k Doubles(1).json` — Riptide Battlesuit parses `InSv "4+"` at both unit and model-profile level and now renders `2+ (4++)`. Helper edge cases checked (`"4++"`, `" 6+ "`, `"-"`, `null`, `""`, non-string → `null` where appropriate). `npm run lint` shows no new errors (20 pre-existing) and `npm run build` succeeds.

**Previously:** v1.13.2 — leader attachment now works for datasheets whose Leader ability uses the markdown-bold bullet format (all T'au Commander variants; previously the "Attach ▾" button never appeared). Verified against `1k Doubles(1).json` (Commander in Enforcer Battlesuit → `Crisis Starscythe Battlesuits`) and `Tau 2k Kauyon AAC(2).json` (Farsight, Coldstar, Enforcer each offering the three Crisis units present); Cadre Fireblade's caret-format matching unchanged. Confirmed the widened `normalizeName` also matches the pre-fix `"**CRISIS STARSCYTHE BATTLESUITS**"` strings, so no re-import is needed. `npm run lint` shows no new errors (20 pre-existing) and `npm run build` succeeds.

**Previously:** v1.13.1 — multi-detachment support is shippable end to end. `detachment` is `string[]` from parser through store to every consumer, with legacy string/`null` records normalised transparently on read by `normalizeDetachment()`. `forceDisposition` renders at the three roster-object display sites.

Verified by rendering the real components (Vite SSR + `renderToStaticMarkup`) against three scenarios: `Tau 2k Kauyon AAC(2).json` (`["Advanced Acquisition Cadre", "Kauyon"]` + `"Priority Assets"`), `1 Million Bullets.json` (`["Mont'ka"]`, no disposition), and a hand-built legacy roster with `detachment` as a plain string. No crash in the Army Rule / Stratagems modals, no dangling separators, no unseparated concatenation, no `null`/`undefined` leaking into markup, and reminder lookups resolve for all three shapes. `npm run lint` shows no new errors (20 pre-existing) and `npm run build` succeeds.

---

## Roadmap

### v1.10.x — Mission Switcher (planned)

1. **Mission card switcher** — allow changing the active primary mission mid-game

2. **Army tab panel ordering** — left panel should be the first player (set by roll-off), right panel the second player, matching TrackerTab/PhasesTab/FactionsTab. A simple `firstPlayerNum`/`secondPlayerNum` swap was tried (v1.10.1) and reverted — the interaction with `attackerNum`-keyed selection state (`selection.attacker`/`selection.defender`), `pKey` (`p1`/`p2`), attachment storage, and the CombatOverlay `attackerRosterLabel` prop needs a more careful rework before re-applying.

---

### Deferred to v2+

- Match history export
- Challenger card tracker (rules documented but no trigger logic, draw logic, or scoring exists in the codebase yet)
- Wound roll matrix (S vs T pre-computed)
