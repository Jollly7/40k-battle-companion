/**
 * parseRosterJson.js
 * Transforms a NewRecruit JSON export into the internal roster shape.
 *
 * Handles two JSON shapes produced by different XML→JSON converters:
 *   - Array style:  roster.forces = [{ catalogueName, selections: [...] }]
 *   - Wrapped style: roster.forces = { force: { catalogueName, selections: { selection: [...] } } }
 */

/** Coerce a string to int if it looks like a plain integer, otherwise return as-is. */
function coerce(val) {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  if (/^-?\d+$/.test(s)) return parseInt(s, 10);
  return s;
}

/** Ensure a value is always an array, handling null/undefined, objects, and arrays. */
function toArray(val) {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

/**
 * Get child selections from a node that may use either shape:
 *   array style:   node.selections = [...]
 *   wrapped style: node.selections = { selection: [...] }
 */
function getSelections(node) {
  if (!node?.selections) return [];
  if (Array.isArray(node.selections)) return node.selections;
  return toArray(node.selections.selection);
}

/**
 * Get profiles from a node that may use either shape:
 *   array style:   node.profiles = [...]
 *   wrapped style: node.profiles = { profile: [...] }
 */
function getProfiles(node) {
  if (!node?.profiles) return [];
  if (Array.isArray(node.profiles)) return node.profiles;
  return toArray(node.profiles.profile);
}

/**
 * Get categories from a node that may use either shape:
 *   array style:   node.categories = [...]
 *   wrapped style: node.categories = { category: [...] }
 */
function getCategories(node) {
  if (!node?.categories) return [];
  if (Array.isArray(node.categories)) return node.categories;
  return toArray(node.categories.category);
}

/** Look up a characteristic value by name. Handles both array and wrapped shapes. */
function getChar(characteristics, name) {
  // Array style: characteristics = [{ name, $text }]
  // Wrapped style: characteristics = { characteristic: [{ name, $text }] }
  const chars = Array.isArray(characteristics)
    ? characteristics
    : toArray(characteristics?.characteristic);
  const found = chars.find(c => c.name === name);
  return found?.$text ?? null;
}

/** Collect all profiles of a given typeName from a selection tree (recursive). */
function collectProfiles(selection, typeName) {
  const results = [];
  for (const p of getProfiles(selection)) {
    if (p.typeName === typeName) results.push(p);
  }
  for (const child of getSelections(selection)) {
    results.push(...collectProfiles(child, typeName));
  }
  return results;
}

/**
 * Recursively collect weapons of a given typeName from nested selections.
 * Returns a Map<name, weaponEntry> — de-duplicated by name.
 */
function collectWeapons(selection, typeName, acc = new Map()) {
  for (const child of getSelections(selection)) {
    const count = parseInt(child.number ?? '1', 10) || 1;
    for (const p of getProfiles(child)) {
      if (p.typeName !== typeName) continue;
      const name = p.name;
      if (acc.has(name)) {
        acc.get(name).count += count;
      } else {
        const chars = p.characteristics;
        const isRanged = typeName === 'Ranged Weapons';
        const entry = {
          name,
          count,
          A: coerce(getChar(chars, 'A') ?? '-'),
          S: coerce(getChar(chars, 'S') ?? '-'),
          AP: coerce(getChar(chars, 'AP') ?? '-'),
          D: coerce(getChar(chars, 'D') ?? '-'),
          keywords: getChar(chars, 'Keywords') ?? '-',
        };
        if (isRanged) {
          entry.BS = getChar(chars, 'BS') ?? '-';
        } else {
          entry.WS = getChar(chars, 'WS') ?? '-';
        }
        acc.set(name, entry);
      }
    }
    collectWeapons(child, typeName, acc);
  }
  return acc;
}

/**
 * Build the per-model equipment list for a model selection.
 * perModelCount = Math.round(upgrade.number / modelCount)
 * Sub-weapons (one level deep) are shown in parens: "Gun Drone (Twin pulse carbine)"
 */
function getModelEquipment(modelSel, modelCount) {
  const equipment = [];
  for (const child of getSelections(modelSel)) {
    const raw = parseInt(child.number ?? '1', 10);
    const perModel = Math.round(raw / modelCount);
    const prefix = perModel > 1 ? `${perModel}x ` : '';

    // Sub-weapon names from direct grandchildren that have weapon profiles
    const subWeapons = [];
    for (const grandchild of getSelections(child)) {
      for (const p of getProfiles(grandchild)) {
        if (p.typeName === 'Ranged Weapons' || p.typeName === 'Melee Weapons') {
          subWeapons.push(p.name);
        }
      }
    }

    equipment.push(
      subWeapons.length > 0
        ? `${prefix}${child.name} (${subWeapons.join(', ')})`
        : `${prefix}${child.name}`
    );
  }
  return equipment;
}

/**
 * Extract unit composition from a unit selection's model children.
 * Returns null for single-model units (type="model" at top level).
 */
function getComposition(unitSel) {
  const models = getSelections(unitSel).filter(s => s.type === 'model');
  if (models.length > 0) {
    return models.map(model => {
      const count = parseInt(model.number ?? '1', 10);
      return { name: model.name, count, equipment: getModelEquipment(model, count) };
    });
  }
  // Single-model unit — the selection itself is the model
  const equipment = getModelEquipment(unitSel, 1);
  if (equipment.length === 0) return null;
  return [{ name: unitSel.name, count: 1, equipment }];
}

/** Parse a single unit selection into the internal unit shape. */
function parseUnit(sel) {
  const name = sel.name ?? 'Unknown Unit';

  // Unit stats: check direct profiles first, then recurse into child selections
  // (multi-model units like Breacher Team have the Unit profile inside a child model selection)
  const unitProfile =
    getProfiles(sel).find(p => p.typeName === 'Unit') ??
    collectProfiles(sel, 'Unit')[0];
  if (!unitProfile) return null;

  const chars = unitProfile.characteristics;
  const stats = {
    M: getChar(chars, 'M') ?? '-',
    T: coerce(getChar(chars, 'T') ?? '-'),
    SV: getChar(chars, 'SV') ?? '-',
    invuln: null,
    W: coerce(getChar(chars, 'W') ?? '-'),
    LD: getChar(chars, 'LD') ?? '-',
    OC: coerce(getChar(chars, 'OC') ?? '-'),
  };

  // Invuln save: Abilities profile whose name matches /^\d+\+\+$/
  const allAbilityProfiles = collectProfiles(sel, 'Abilities');
  for (const ap of allAbilityProfiles) {
    if (/^\d+\+\+$/.test((ap.name ?? '').trim())) {
      stats.invuln = ap.name.trim();
      break;
    }
  }

  // Weapons
  const ranged = [...collectWeapons(sel, 'Ranged Weapons').values()];
  const melee = [...collectWeapons(sel, 'Melee Weapons').values()];

  // Abilities (deduped, excluding invuln saves)
  const seen = new Set();
  const abilities = [];
  for (const ap of allAbilityProfiles) {
    const n = (ap.name ?? '').trim();
    if (/^\d+\+\+$/.test(n)) continue;
    if (seen.has(n)) continue;
    seen.add(n);
    const desc = getChar(ap.characteristics, 'Description') ?? '';
    abilities.push({ name: n, description: desc });
  }

  // Keywords: from the unit's own categories, sorted alphabetically
  const keywords = getCategories(sel)
    .map(c => c.name ?? '')
    .filter(Boolean)
    .sort();

  const composition = getComposition(sel);
  return { name, stats, ranged, melee, abilities, keywords, composition };
}

/**
 * Parse a NewRecruit JSON export into the internal roster shape.
 * @param {object} json - Parsed JSON from a .json NewRecruit export
 * @returns {{ label, faction, detachment, units }}
 */
export function parseRosterJson(json) {
  const roster = json?.roster;
  if (!roster) throw new Error('Invalid roster file: missing "roster" root key');

  const label = roster.name ?? 'Unknown Roster';

  // forces can be:
  //   array style:   roster.forces = [{ catalogueName, selections: [...] }]
  //   wrapped style: roster.forces = { force: { ... } | [{ ... }] }
  const forcesRaw = roster.forces;
  if (!forcesRaw) throw new Error('Invalid roster file: missing forces');
  const force = Array.isArray(forcesRaw)
    ? forcesRaw[0]
    : toArray(forcesRaw.force)[0] ?? forcesRaw;
  if (!force || typeof force !== 'object') throw new Error('Invalid roster file: no force found');

  // Faction — strip alignment prefix
  const rawFaction = force.catalogueName ?? '';
  const faction = rawFaction.replace(/^(Xenos|Imperium|Chaos|Unaligned)\s*-\s*/i, '').trim();

  // Detachment: find top-level selection named "Detachment", read its first child's name
  const topSelections = getSelections(force);
  const detachmentSel = topSelections.find(s => s.name === 'Detachment');
  const detachment = detachmentSel
    ? (getSelections(detachmentSel)[0]?.name ?? null)
    : null;

  // Units: top-level selections of type "model" or "unit"
  const units = topSelections
    .filter(s => s.type === 'model' || s.type === 'unit')
    .map(parseUnit)
    .filter(Boolean);

  return { label, faction, detachment, units };
}
