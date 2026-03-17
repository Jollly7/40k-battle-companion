export default {
  label: "Ork Colosseum",
  faction: "Orks",
  units: [
    {
      name: "Beastboss",
      stats: { M: "6\"", T: 5, SV: "4+", invuln: null, W: 6, LD: "6+", OC: 1 },
      ranged: [
        { name: "Shoota", A: 2, BS: "4+", S: 4, AP: 0, D: 1, keywords: "Rapid Fire 1" },
      ],
      melee: [
        { name: "Beast Snagga klaw", A: 4, WS: "3+", S: 10, AP: -2, D: 2, keywords: "Anti-Monster 4+, Anti-Vehicle 4+" },
        { name: "Beastchoppa", A: 6, WS: "2+", S: 6, AP: -1, D: 2, keywords: "Anti-Monster 4+, Anti-Vehicle 4+" },
      ],
      abilities: [
        { name: "Beastboss", description: "While this model is leading a unit, each time a model in that unit makes a melee attack, add 1 to the Hit roll." },
        { name: "Ferocious Rage", description: "Each time this model makes a Charge move, until the end of the turn, melee weapons it is equipped with have the **[DEVASTATING WOUNDS]** ability." },
        { name: "Leader", description: "This model can be attached to the following unit:\n- **^^Beast Snagga Boyz^^**" },
        { name: "Invulnerable Save (5+)", description: "This model has a 5+ invulnerable save." },
      ],
      keywords: ["Beast Snagga", "Beastboss", "Character", "Faction: Orks", "Infantry", "Warboss"],
    },
    {
      name: "Warboss in Mega Armour",
      stats: { M: "5\"", T: 6, SV: "2+", invuln: null, W: 7, LD: "6+", OC: 1 },
      ranged: [
        { name: "Big shoota", A: 3, BS: "4+", S: 5, AP: 0, D: 1, keywords: "Rapid Fire 2" },
      ],
      melee: [
        { name: "’Uge choppa", A: 4, WS: "2+", S: 12, AP: -2, D: 2, keywords: "-" },
      ],
      abilities: [
        { name: "Might is Right", description: "While this model is leading a unit, each time a model in that unit makes a melee attack, add 1 to the Hit roll." },
        { name: "Dead Brutal", description: "While the Waaagh! is active for your army, this model's 'uge choppa has a Damage characteristic of 3." },
        { name: "Invulnerable Save (5+)", description: "This model has a 5+ invulnerable save." },
        { name: "Leader", description: "This model can be attached to the following unit:\n- MEGANOBZ" },
      ],
      keywords: ["Character", "Faction: Orks", "Infantry", "Mega Armour", "Warboss", "Warboss in Mega Armour"],
    },
    {
      name: "Beast Snagga Boyz",
      stats: { M: "6\"", T: 5, SV: "5+", invuln: null, W: 2, LD: "7+", OC: 2 },
      ranged: [
        { name: "Slugga", A: 1, BS: "5+", S: 4, AP: 0, D: 1, keywords: "Pistol", count: 10 },
      ],
      melee: [
        { name: "Power snappa", A: 4, WS: "3+", S: 7, AP: -1, D: 2, keywords: "-" },
        { name: "Choppa", A: 3, WS: "3+", S: 5, AP: -1, D: 1, keywords: "-", count: 9 },
      ],
      abilities: [
        { name: "Monster Hunters", description: "Each time a model in this unit makes an attack that targets a MONSTER or VEHICLE unit, you can re-roll the Hit roll." },
      ],
      keywords: ["Battleline", "Beast Snagga", "Beast Snagga Boyz", "Faction: Orks", "Infantry", "Mob"],
    },
    {
      name: "Beast Snagga Boyz",
      stats: { M: "6\"", T: 5, SV: "5+", invuln: null, W: 2, LD: "7+", OC: 2 },
      ranged: [
        { name: "Slugga", A: 1, BS: "5+", S: 4, AP: 0, D: 1, keywords: "Pistol", count: 10 },
      ],
      melee: [
        { name: "Power snappa", A: 4, WS: "3+", S: 7, AP: -1, D: 2, keywords: "-" },
        { name: "Choppa", A: 3, WS: "3+", S: 5, AP: -1, D: 1, keywords: "-", count: 9 },
      ],
      abilities: [
        { name: "Monster Hunters", description: "Each time a model in this unit makes an attack that targets a MONSTER or VEHICLE unit, you can re-roll the Hit roll." },
      ],
      keywords: ["Battleline", "Beast Snagga", "Beast Snagga Boyz", "Faction: Orks", "Infantry", "Mob"],
    },
    {
      name: "Squighog Boyz",
      stats: { M: "10\"", T: 7, SV: "4+", invuln: null, W: 4, LD: "7+", OC: 2 },
      ranged: [
        { name: "Slugga", A: 1, BS: "5+", S: 4, AP: 0, D: 1, keywords: "Pistol" },
        { name: "Saddlegit weapons", A: 1, BS: "4+", S: 3, AP: 0, D: 1, keywords: "Assault", count: 3 },
        { name: "Stikka (ranged)", A: 1, BS: "5+", S: 5, AP: -1, D: 2, keywords: "Assault, Anti-Monster 4+, Anti-Vehicle 4+", count: 3 },
      ],
      melee: [
        { name: "Big choppa", A: 4, WS: "3+", S: 6, AP: -1, D: 2, keywords: "Anti-Monster 4+, Anti-Vehicle 4+" },
        { name: "Squig jaws", A: 3, WS: "4+", S: 6, AP: -1, D: 2, keywords: "Extra Attacks", count: 4 },
        { name: "Stikka (melee)", A: 3, WS: "3+", S: 5, AP: -1, D: 2, keywords: "Anti-Monster 4+, Anti-Vehicle 4+, Lance", count: 3 },
      ],
      abilities: [
        { name: "Wild Ride", description: "You can ignore any or all modifiers to this unit’s Move characteristic and to Advance and Charge rolls made for this unit." },
      ],
      keywords: ["Beast Snagga", "Faction: Orks", "Grenades", "Mounted", "Squighog Boyz"],
    }
  ]
}
