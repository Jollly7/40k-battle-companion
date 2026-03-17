export default {
  label: "GSC Colosseum",
  faction: "Genestealer Cults",
  units: [
    {
      name: "Biophagus",
      stats: { M: "6\"", T: 3, SV: "5+", invuln: null, W: 3, LD: "7+", OC: 1 },
      ranged: [
        { name: "Autopistol", A: 1, BS: "3+", S: 3, AP: 0, D: 1, keywords: "Pistol" },
        { name: "Chemical vials", A: 1, BS: "3+", S: 1, AP: -1, D: 2, keywords: "Anti-Infantry 2+" },
      ],
      melee: [
        { name: "Injector goad", A: 1, WS: "3+", S: 2, AP: 0, D: "D3", keywords: "Anti-infantry 2+" },
      ],
      abilities: [
        { name: "Twisted Science", description: "While this model is leading a unit, melee weapons equipped by models in that unit have the [LETHAL HITS] ability." },
        { name: "Biological Warfare", description: "Once per battle, when this model’s unit is selected to fight, this model can use this ability. If it does, until the end of the phase, improve the Attacks and Damage characteristics of its injector goad by 3." },
        { name: "Leader", description: "This model can be attached to the following units:\n- ABERRANTS\n\n- ACOLYTE HYBRIDS WITH AUTOPISTOLS\n- ACOLYTE HYBRIDS WITH HANDFLAMERS\n- HYBRID METAMORPHS\n- NEOPHYTE HYBRIDS\n\nYou can attach this model to an ACOLYTE HYBRIDS or NEOPHYTE HYBRID unit, even if a PRIMUS, MAGUS, or ACOLYTE ICONWARD model has already been attached to it. If you do, and that Bodyguard unit is destroyed, the Leader units attached to it become separate units, with their original Starting Strengths." },
        { name: "Alchemicus Familiar", description: "Once per battle, when the bearer’s unit is selected to fight, the bearer can use its alchemicus familiar. If it does, until the end of the phase, each time a model in the bearer's unit makes an attack that targets an INFANTRY unit, add 1 to the Wound roll" },
      ],
      keywords: ["Biophagus", "Character", "Faction: Genestealer Cults", "Great Devourer", "Infantry"],
    },
    {
      name: "Acolyte Hybrids with Hand Flamers",
      stats: { M: "6\"", T: 4, SV: "5+", invuln: null, W: 1, LD: "7+", OC: 2 },
      ranged: [
        { name: "Hand flamer", A: "D6", BS: "N/A", S: 3, AP: 0, D: 1, keywords: "Ignores Cover, Pistol, Torrent", count: 5 },
      ],
      melee: [
        { name: "Cult claws and knife", A: 3, WS: "3+", S: 4, AP: -1, D: 1, keywords: "-", count: 5 },
      ],
      abilities: [
        { name: "Industrialised Destruction", description: "Each time a model in this unit makes an attack, re-roll a Wound Roll of 1. If the target of that attack is an enemy unit within range of an objective marker, you can re-roll the wound roll." },
      ],
      keywords: ["Acolyte Hybrids", "Acolyte Hybrids with Hand Flamers", "Battleline", "Faction: Genestealer Cults", "Great Devourer", "Grenades", "Infantry"],
    },
    {
      name: "Acolyte Hybrids with Hand Flamers",
      stats: { M: "6\"", T: 4, SV: "5+", invuln: null, W: 1, LD: "7+", OC: 2 },
      ranged: [
        { name: "Hand flamer", A: "D6", BS: "N/A", S: 3, AP: 0, D: 1, keywords: "Ignores Cover, Pistol, Torrent", count: 5 },
      ],
      melee: [
        { name: "Cult claws and knife", A: 3, WS: "3+", S: 4, AP: -1, D: 1, keywords: "-", count: 5 },
      ],
      abilities: [
        { name: "Industrialised Destruction", description: "Each time a model in this unit makes an attack, re-roll a Wound Roll of 1. If the target of that attack is an enemy unit within range of an objective marker, you can re-roll the wound roll." },
      ],
      keywords: ["Acolyte Hybrids", "Acolyte Hybrids with Hand Flamers", "Battleline", "Faction: Genestealer Cults", "Great Devourer", "Grenades", "Infantry"],
    },
    {
      name: "Neophyte Hybrids",
      stats: { M: "6\"", T: 3, SV: "5+", invuln: null, W: 1, LD: "7+", OC: 2 },
      ranged: [
        { name: "Autopistol", A: 1, BS: "3+", S: 3, AP: 0, D: 1, keywords: "Pistol", count: 10 },
        { name: "Hybrid firearm", A: 1, BS: "4+", S: 3, AP: 0, D: 1, keywords: "Rapid Fire 1", count: 10 },
      ],
      melee: [
        { name: "Close combat weapon", A: 1, WS: "4+", S: 3, AP: 0, D: 1, keywords: "-", count: 10 },
      ],
      abilities: [
        { name: "A Plan Generations in the Making", description: "At the end of your Command phase, if this unit is within range of an objective marker you control, that objective marker remains under your control, even if you have no models within range of it, until your opponent controls it at the start or end of any turn." },
      ],
      keywords: ["Battleline", "Faction: Genestealer Cults", "Great Devourer", "Grenades", "Infantry", "Neophyte Hybrids"],
    },
    {
      name: "Aberrants",
      stats: { M: "6\"", T: 6, SV: "5+", invuln: null, W: 3, LD: "7+", OC: 1 },
      ranged: [],
      melee: [
        { name: "Aberrant weapons", A: 3, WS: "3+", S: 7, AP: -2, D: 2, keywords: "-", count: 5 },
      ],
      abilities: [
        { name: "Feel No Pain 5+", description: "This unit has a 5+ Feel No Pain" },
        { name: "Hulking Bodyguards", description: "While a CHARACTER is leading this unit, each time an attack targets this unit, if the Strength characteristic of that attack is greater than the Toughness characteristic of this unit, subtract 1 from the Wound roll." },
      ],
      keywords: ["Aberrants", "Faction: Genestealer Cults", "Great Devourer", "Infantry"],
    },
    {
      name: "Purestrain Genestealers",
      stats: { M: "8\"", T: 4, SV: "5+", invuln: null, W: 2, LD: "7+", OC: 1 },
      ranged: [],
      melee: [
        { name: "Cult claws and talons", A: 4, WS: "2+", S: 4, AP: -2, D: 1, keywords: "-", count: 5 },
      ],
      abilities: [
        { name: "Swift and Deadly", description: "This unit is eligible to declare a charge in a turn in which it Advanced." },
        { name: "Invulnerable Save (5+)", description: "This model has a 5+ invulnerable save." },
      ],
      keywords: ["Faction: Genestealer Cults", "Great Devourer", "Infantry", "Purestrain Genestealers"],
    }
  ]
}
