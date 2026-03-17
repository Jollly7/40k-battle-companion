export default {
  label: "Tau Colosseum",
  faction: "T'au Empire",
  units: [
    {
      name: "Cadre Fireblade",
      stats: { M: "6\"", T: 3, SV: "4+", invuln: null, W: 3, LD: "7+", OC: 1 },
      ranged: [
        { name: "Fireblade pulse rifle", A: 1, BS: "3+", S: 5, AP: 0, D: 2, keywords: "Rapid Fire 1" },
        { name: "Twin pulse carbine", A: 2, BS: "5+", S: 5, AP: 0, D: 1, keywords: "Assault, Twin-linked", count: 2 },
      ],
      melee: [
        { name: "Close combat weapon", A: 3, WS: "4+", S: 3, AP: 0, D: 1, keywords: "-" },
      ],
      abilities: [
        { name: "Volley Fire", description: "While this model is leading a unit, add 1 to the Attacks characteristic of ranged weapons equipped by models in that unit." },
        { name: "Crack Shot", description: "Each time this model makes a ranged attack, on a Critical Wound, that attack has an Armour Penetration characteristic of -3." },
        { name: "Leader", description: "This model can be attached to the following units:\n- **^^Breacher Team^^**\n- **^^Strike Team^^**" },
      ],
      keywords: ["Cadre Fireblade", "Character", "Faction: T'au Empire", "Grenades", "Infantry", "Non-Kroot"],
    },
    {
      name: "Commander in Enforcer Battlesuit",
      stats: { M: "8\"", T: 5, SV: "2+", invuln: null, W: 8, LD: "7+", OC: 2 },
      ranged: [
        { name: "➤ Cyclic ion blaster - standard", A: 3, BS: "3+", S: 7, AP: -1, D: 1, keywords: "-" },
        { name: "➤ Cyclic ion blaster - overcharge", A: 3, BS: "3+", S: 8, AP: -2, D: 2, keywords: "Hazardous" },
        { name: "Plasma rifle", A: 1, BS: "3+", S: 8, AP: -3, D: 3, keywords: "-", count: 3 },
      ],
      melee: [
        { name: "Battlesuit fists", A: 3, WS: "4+", S: 5, AP: 0, D: 1, keywords: "-" },
      ],
      abilities: [
        { name: "Enforcer Commander", description: "While this model is leading a unit, each time a ranged attack targets that unit, worsen the Armour Penetration characteristic of that attack by 1." },
        { name: "Leader", description: "This model can be attached to the following units:\n- **^^Crisis Sunforge Battlesuits^^**\n- **^^Crisis Fireknife Battlesuits^^**\n- **^^Crisis Starscythe Battlesuits^^**" },
        { name: "Shield Drone", description: "Add 1 to the bearer’s Wounds characteristic." },
      ],
      keywords: ["Battlesuit", "Character", "Commander in Enforcer Battlesuit", "Faction: T'au Empire", "Fly", "Non-Kroot", "Vehicle", "Walker"],
    },
    {
      name: "Breacher Team",
      stats: { M: "6\"", T: 3, SV: "4+", invuln: null, W: 1, LD: "7+", OC: 2 },
      ranged: [
        { name: "Pulse blaster", A: 2, BS: "3+", S: 6, AP: -1, D: 1, keywords: "Assault", count: 10 },
        { name: "Pulse pistol", A: 1, BS: "4+", S: 5, AP: 0, D: 1, keywords: "Pistol", count: 10 },
        { name: "Support turret", A: 2, BS: "5+", S: 5, AP: 0, D: 1, keywords: "Indirect Fire, Twin-linked" },
        { name: "Twin pulse carbine", A: 2, BS: "5+", S: 5, AP: 0, D: 1, keywords: "Assault, Twin-linked" },
      ],
      melee: [
        { name: "Close combat weapon", A: 1, WS: "5+", S: 3, AP: 0, D: 1, keywords: "-", count: 10 },
      ],
      abilities: [
        { name: "Breach and Clear", description: "Each time a model in this unit makes a ranged attack that targets an enemy unit within range of an objective marker, you can re-roll the Wound roll." },
        { name: "DS8 Support Turret", description: "In your Movement phase, if this unit Remains Stationary, until the start of your next turn, its Shas’ui model is equipped with the support turret weapon.\n\nDesigner’s Note: Place a Support Turret token next to this unit to remind you." },
        { name: "Guardian Drone", description: "Each time a model makes a ranged attack that targets the bearer’s unit, subtract 1 from the Wound roll." },
      ],
      keywords: ["Battleline", "Breacher Team", "Faction: T'au Empire", "Fire Warrior", "Grenades", "Infantry", "Markerlight", "Non-Kroot"],
    },
    {
      name: "Strike Team",
      stats: { M: "6\"", T: 3, SV: "4+", invuln: null, W: 1, LD: "7+", OC: 2 },
      ranged: [
        { name: "Pulse pistol", A: 1, BS: "4+", S: 5, AP: 0, D: 1, keywords: "Pistol", count: 10 },
        { name: "Pulse rifle", A: 1, BS: "4+", S: 5, AP: 0, D: 1, keywords: "Rapid Fire 1", count: 10 },
        { name: "Support turret", A: 2, BS: "5+", S: 5, AP: 0, D: 1, keywords: "Indirect Fire, Twin-linked" },
        { name: "Twin pulse carbine", A: 2, BS: "5+", S: 5, AP: 0, D: 1, keywords: "Assault, Twin-linked" },
      ],
      melee: [
        { name: "Close combat weapon", A: 1, WS: "5+", S: 3, AP: 0, D: 1, keywords: "-", count: 10 },
      ],
      abilities: [
        { name: "Suppression Volley", description: "In your Shooting phase, after this unit has shot, select one enemy INFANTRY unit hit by one or more of those attacks. Until the start of your next turn, while unit is on the battlefield, that enemy unit is suppressed. While a unit is suppressed, each time a model in that unit makes an attack, subtract 1 from the Hit roll." },
        { name: "DS8 Support Turret", description: "In your Movement phase, if this unit Remains Stationary, until the start of your next turn, its Shas’ui model is equipped with the support turret weapon.\n\nDesigner’s Note: Place a Support Turret token next to this unit to remind you." },
        { name: "Guardian Drone", description: "Each time a model makes a ranged attack that targets the bearer’s unit, subtract 1 from the Wound roll." },
      ],
      keywords: ["Battleline", "Faction: T'au Empire", "Fire Warrior", "Grenades", "Infantry", "Markerlight", "Non-Kroot", "Strike Team"],
    },
    {
      name: "Crisis Fireknife Battlesuits",
      stats: { M: "10\"", T: 5, SV: "3+", invuln: null, W: 5, LD: "7+", OC: 2 },
      ranged: [
        { name: "Plasma rifle", A: 1, BS: "4+", S: 8, AP: -3, D: 3, keywords: "-", count: 6 },
        { name: "Twin pulse carbine", A: 2, BS: "5+", S: 5, AP: 0, D: 1, keywords: "Assault, Twin-linked", count: 2 },
      ],
      melee: [
        { name: "Battlesuit fists", A: 3, WS: "5+", S: 5, AP: 0, D: 1, keywords: "-", count: 3 },
      ],
      abilities: [
        { name: "Fireknife", description: "Each time a model in this unit makes a ranged attack, re-roll a Hit roll of 1. If that attack targets a unit that is at its Starting Strength, you can re-roll the Hit roll instead." },
        { name: "Weapon Support System", description: "Each time a model in this unit makes a ranged attack, you can ignore any or all modifiers to the Hit roll." },
        { name: "Marker Drone", description: "The bearer’s unit has the **^^Markerlight^^** keyword and can act as an Observer unit for another unit even if it Advanced this turn." },
        { name: "Shield Drone", description: "Add 1 to the bearer’s Wounds characteristic." },
      ],
      keywords: ["Battlesuit", "Crisis", "Faction: T'au Empire", "Fireknife", "Fly", "Non-Kroot", "Vehicle", "Walker"],
    },
    {
      name: "Devilfish",
      stats: { M: "12\"", T: 9, SV: "3+", invuln: null, W: 13, LD: "7+", OC: 2 },
      ranged: [
        { name: "Accelerator burst cannon", A: 4, BS: "4+", S: 6, AP: -1, D: 1, keywords: "-" },
        { name: "Seeker missile", A: 1, BS: "4+", S: 14, AP: -3, D: "D6+1", keywords: "One Shot", count: 2 },
        { name: "Twin pulse carbine", A: 2, BS: "4+", S: 5, AP: 0, D: 1, keywords: "Twin-linked, Assault", count: 2 },
      ],
      melee: [
        { name: "Armoured hull", A: 3, WS: "5+", S: 6, AP: 0, D: 1, keywords: "-" },
      ],
      abilities: [
        { name: "Rapid Deployment", description: "Units can disembark from this TRANSPORT after it has Advanced. Units that do so count as having made a Normal move that phase, and cannot declare a charge in the same turn, but can otherwise act normally in the remainder of the turn." },
      ],
      keywords: ["Dedicated Transport", "Devilfish", "Faction: T'au Empire", "Fly", "Non-Kroot", "Transport", "Vehicle"],
    }
  ]
}
