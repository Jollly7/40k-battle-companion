// Each entry is an array of { phase: number, text: string }

// General reminders shown to all players regardless of faction
export const GENERAL_REMINDERS = [
  { phase: 0, text: "Check for Battle-Shock." },
  { phase: 0, text: "Score Primary VP at end of the Command Phase." },
  { phase: 4, text: "Remember to score Secondary VP at end of Turn." },
];

// Faction reminders keyed by `${faction}||${detachment}` using exact strings from factions.js
export const FACTION_REMINDERS = {
  "Genestealer Cults||Biosanctic Broodsurge": [
    { phase: 3, text: "+1 to Charge rolls for ABERRANTS, BIOPHAGUS, and PURESTRAIN GENESTEALERS." },
    { phase: 4, text: "ABERRANTS, BIOPHAGUS, and PURESTRAIN GENESTEALERS that charged this turn: +1 Attack to all their melee weapons." },
  ],
  "Orks||War Horde": [
    { phase: 0, text: "WAAGH?"},
    { phase: 4, text: "All ORKS melee weapons have [SUSTAINED HITS 1]." },
  ],
};


