/**
 * parseRosterJson.js
 * Transforms a NewRecruit JSON export into the internal roster shape.
 *
 * Handles two JSON shapes produced by different XML→JSON converters:
 *   - Array style:  roster.forces = [{ catalogueName, selections: [...] }]
 *   - Wrapped style: roster.forces = { force: { catalogueName, selections: { selection: [...] } } }
 */

/**
 * Recursively collect all rule entries from the JSON tree into a flat name→description map.
 * Dedupes by name (first occurrence wins).
 */
function collectRules(obj, acc = {}) {
  if (!obj || typeof obj !== 'object') return acc;
  if (Array.isArray(obj)) {
    for (const item of obj) collectRules(item, acc);
    return acc;
  }
  if (Array.isArray(obj.rules)) {
    for (const rule of obj.rules) {
      const name = rule.name?.trim();
      const desc = rule.description ?? '';
      if (name && !acc[name]) acc[name] = desc;
    }
  }
  for (const val of Object.values(obj)) {
    if (val && typeof val === 'object') collectRules(val, acc);
  }
  return acc;
}

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

/** Case-insensitive characteristic lookup — covers stat name casing drift between editions. */
function getStat(characteristics, name) {
  const chars = Array.isArray(characteristics)
    ? characteristics
    : toArray(characteristics?.characteristic);
  const lower = name.toLowerCase();
  return chars.find(c => c.name?.toLowerCase() === lower)?.$text ?? null;
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

/** Extract the invuln save string from a selection (e.g. "5+").
 *  Primary (11th Ed): reads InSv characteristic from the Unit profile chars when provided.
 *  Fallback (10th Ed): profile name "Invulnerable Save (5+)" → returns "5+"; bare "5++" → "5++". */
function extractInvuln(sel, chars = null) {
  if (chars != null) {
    const inSv = getStat(chars, 'InSv');
    if (inSv && inSv !== '-') return inSv;
  }
  for (const { profile: ap } of collectAbilityProfilesWithFlags(sel)) {
    const name = (ap.name ?? '').trim();
    const m = name.match(/^Invulnerable Save \((\d+\+)\)$/i);
    if (m) return m[1];
    if (/^\d+\+\+$/.test(name)) return name;
  }
  return null;
}

/** Extract Feel No Pain value (e.g. "6+") from rule/ability names in a selection tree. */
function extractFnp(sel) {
  const rules = collectRules(sel);
  for (const name of Object.keys(rules)) {
    const m = name.match(/Feel No Pain (\d+\+)/i);
    if (m) return m[1];
  }
  for (const { profile: ap } of collectAbilityProfilesWithFlags(sel)) {
    const m = (ap.name ?? '').match(/Feel No Pain (\d+\+)/i);
    if (m) return m[1];
  }
  return null;
}

/**
 * Recursively find all nodes in a unit selection's subtree that directly own
 * a Unit-typeName profile. Once a node is identified as an anchor, its children
 * are not searched further — they belong to that model type's weapons/wargear,
 * not to a sibling model group.
 *
 * Handles units where model-type nodes are nested inside an intermediate
 * upgrade wrapper rather than sitting as direct children of the unit selection
 * (confirmed case: Ork Squighog Boyz).
 *
 * Returns [] when no anchors are found — callers treat this as the single-model
 * case and use the unit selection itself as the implicit anchor.
 */
function findUnitProfileAnchors(unitSel) {
  const anchors = [];
  function walk(node) {
    if (getProfiles(node).find(p => p.typeName === 'Unit')) {
      anchors.push(node);
      return; // stopping condition: don't recurse into this anchor's children
    }
    for (const child of getSelections(node)) {
      walk(child);
    }
  }
  for (const child of getSelections(unitSel)) {
    walk(child);
  }
  return anchors;
}

/**
 * Build a modelProfiles array for a unit selection.
 * Each entry represents a distinct model type with its own stats, invuln, and FNP.
 * For single-model units (no model-typed children) returns one entry using the unit itself.
 */
function getModelProfiles(unitSel) {
  const unitFnp = extractFnp(unitSel);
  const anchors = findUnitProfileAnchors(unitSel);
  if (anchors.length === 0) {
    const unitProfile =
      getProfiles(unitSel).find(p => p.typeName === 'Unit') ??
      collectProfiles(unitSel, 'Unit')[0];
    if (!unitProfile) return [];
    const chars = unitProfile.characteristics;
    return [{
      id: unitSel.name ?? 'unit',
      name: unitSel.name ?? 'Unit',
      count: parseInt(unitSel.number ?? '1', 10) || 1,
      stats: {
        M: getStat(chars, 'M') ?? '-',
        T: coerce(getStat(chars, 'T') ?? '-'),
        SV: getStat(chars, 'SV') ?? '-',
        W: coerce(getStat(chars, 'W') ?? '-'),
        LD: getStat(chars, 'LD') ?? '-',
        OC: coerce(getStat(chars, 'OC') ?? '-'),
      },
      invuln: extractInvuln(unitSel, chars),
      fnp: unitFnp,
    }];
  }
  const unitInvuln = extractInvuln(unitSel);
  return anchors.map(anchor => {
    const unitProfile =
      getProfiles(anchor).find(p => p.typeName === 'Unit') ??
      collectProfiles(anchor, 'Unit')[0];
    if (!unitProfile) return null;
    const chars = unitProfile.characteristics;
    const count = parseInt(anchor.number ?? '1', 10) || 1;
    return {
      id: anchor.name ?? 'model',
      name: anchor.name ?? 'Model',
      count,
      stats: {
        M: getStat(chars, 'M') ?? '-',
        T: coerce(getStat(chars, 'T') ?? '-'),
        SV: getStat(chars, 'SV') ?? '-',
        W: coerce(getStat(chars, 'W') ?? '-'),
        LD: getStat(chars, 'LD') ?? '-',
        OC: coerce(getStat(chars, 'OC') ?? '-'),
      },
      invuln: extractInvuln(anchor, chars) ?? unitInvuln,
      fnp: extractFnp(anchor) ?? unitFnp,
    };
  }).filter(Boolean);
}

/**
 * Collect all Abilities profiles from a selection tree, tagging each with
 * `isEnhancement: true` when the profile lives inside an Enhancement selection.
 * Detection: child selection has a `group` field starting with "Enhancements".
 */
function collectAbilityProfilesWithFlags(selection, parentIsEnhancement = false) {
  const results = [];
  const isEnhancement = parentIsEnhancement || (typeof selection.group === 'string' && selection.group.startsWith('Enhancements'));
  for (const p of getProfiles(selection)) {
    if (p.typeName === 'Abilities') results.push({ profile: p, isEnhancement });
  }
  for (const child of getSelections(selection)) {
    results.push(...collectAbilityProfilesWithFlags(child, isEnhancement));
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
          entry.range = getChar(chars, 'Range') ?? '-';
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
 * Build ranged and melee weapon arrays for a unit, attributing each weapon entry
 * to the model group(s) that carry it via a `sources` array.
 * `sources: [{ profileId, qty }]` where profileId matches modelProfiles[].id
 * and qty is the number of models in that group carrying the weapon.
 * The total `count` on each entry equals the sum of its sources' qty values.
 */
function collectWeaponsWithSources(unitSel) {
  const anchors = findUnitProfileAnchors(unitSel);
  const rangedMap = new Map();
  const meleeMap  = new Map();

  function mergeGroup(container, profileId, qty) {
    for (const [name, entry] of collectWeapons(container, 'Ranged Weapons')) {
      if (rangedMap.has(name)) {
        const e = rangedMap.get(name);
        e.count += qty;
        e.sources.push({ profileId, qty });
      } else {
        rangedMap.set(name, { ...entry, count: qty, sources: [{ profileId, qty }] });
      }
    }
    for (const [name, entry] of collectWeapons(container, 'Melee Weapons')) {
      if (meleeMap.has(name)) {
        const e = meleeMap.get(name);
        e.count += qty;
        e.sources.push({ profileId, qty });
      } else {
        meleeMap.set(name, { ...entry, count: qty, sources: [{ profileId, qty }] });
      }
    }
  }

  if (anchors.length === 0) {
    mergeGroup(unitSel, unitSel.name ?? 'unit', parseInt(unitSel.number ?? '1', 10) || 1);
  } else {
    for (const anchor of anchors) {
      mergeGroup(anchor, anchor.name ?? 'model', parseInt(anchor.number ?? '1', 10) || 1);
    }
  }

  return { ranged: [...rangedMap.values()], melee: [...meleeMap.values()] };
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
  const anchors = findUnitProfileAnchors(unitSel);
  if (anchors.length > 0) {
    return anchors.map(anchor => {
      const count = parseInt(anchor.number ?? '1', 10);
      return { name: anchor.name, count, equipment: getModelEquipment(anchor, count) };
    });
  }
  // Single-model unit — the selection itself is the model
  const equipment = getModelEquipment(unitSel, 1);
  if (equipment.length === 0) return null;
  return [{ name: unitSel.name, count: 1, equipment }];
}

/** Recursively sum pts costs across a selection and all its descendants. */
function sumPts(selection) {
  const costsArr = Array.isArray(selection.costs) ? selection.costs : toArray(selection.costs?.cost);
  const own = costsArr.find(c => c.name === 'pts')?.value ?? 0;
  const children = getSelections(selection).reduce((acc, child) => acc + sumPts(child), 0);
  return own + children;
}

/**
 * Mutates modelProfile names in-place to disambiguate same-name rows that carry
 * different weapons (e.g. two "w/ Heavy Weapon ×2" groups — one with Seismic cannon,
 * one with Mining laser — that are otherwise visually identical in the Defender table).
 *
 * Algorithm:
 *  1. Collect a weapon-name Set per model selection, positionally matched to modelProfiles
 *     (applying the same null-profile filter that getModelProfiles uses).
 *  2. Compute the intersection = weapons shared by every profile (shared/default loadout).
 *  3. For each profile: distinguishing = own_weapons − common_weapons, then exclude any
 *     weapon whose name is a case-insensitive substring of the profile's base name
 *     (avoids redundant labels like "w/ Hybrid Firearm (Hybrid firearm)").
 *  4. If distinguishing weapons remain, append "(Weapon A, Weapon B)" to the name.
 *
 * Only `name` is mutated; `id`, `count`, `stats`, `invuln`, `fnp`, and `sources` are untouched.
 */
function disambiguateModelProfileNames(unitSel, modelProfiles) {
  if (modelProfiles.length <= 1) return;

  const anchors = findUnitProfileAnchors(unitSel);
  if (anchors.length === 0) return; // single-model unit — nothing to do

  // Build a weapon-name Set per anchor, skipping anchors that lack a Unit profile
  // (mirrors the null-filter in getModelProfiles to keep positional alignment).
  const weaponSets = [];
  for (const anchor of anchors) {
    const hasProfile =
      getProfiles(anchor).find(p => p.typeName === 'Unit') ??
      collectProfiles(anchor, 'Unit')[0];
    if (!hasProfile) continue;
    const ranged = collectWeapons(anchor, 'Ranged Weapons');
    const melee  = collectWeapons(anchor, 'Melee Weapons');
    weaponSets.push(new Set([...ranged.keys(), ...melee.keys()]));
  }

  // If filtering produced a different count the shapes are mismatched — skip safely.
  if (weaponSets.length !== modelProfiles.length) return;

  // Common weapons = intersection across all profiles (shared/default loadout).
  const commonWeapons = weaponSets.reduce(
    (acc, set) => new Set([...acc].filter(w => set.has(w))),
    new Set(weaponSets[0])
  );

  for (let i = 0; i < modelProfiles.length; i++) {
    const mp = modelProfiles[i];
    const baseName = mp.name.toLowerCase();
    const distinguishing = [...weaponSets[i]]
      .filter(w => !commonWeapons.has(w))
      .filter(w => !baseName.includes(w.toLowerCase()))
      .sort();
    if (distinguishing.length > 0) {
      mp.name = `${mp.name} (${distinguishing.join(', ')})`;
    }
  }
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
    M: getStat(chars, 'M') ?? '-',
    T: coerce(getStat(chars, 'T') ?? '-'),
    SV: getStat(chars, 'SV') ?? '-',
    invuln: null,
    W: coerce(getStat(chars, 'W') ?? '-'),
    LD: getStat(chars, 'LD') ?? '-',
    OC: coerce(getStat(chars, 'OC') ?? '-'),
  };

  const allAbilityEntries = collectAbilityProfilesWithFlags(sel);
  stats.invuln = extractInvuln(sel, chars);

  // Weapons (with per-model-group source attribution for casualty-aware display)
  const { ranged, melee } = collectWeaponsWithSources(sel);

  // Abilities (deduped, excluding invuln saves)
  const seen = new Set();
  const abilities = [];
  for (const { profile: ap, isEnhancement } of allAbilityEntries) {
    const n = (ap.name ?? '').trim();
    if (/^\d+\+\+$/.test(n) || /^Invulnerable Save \(\d+\+\)$/i.test(n)) continue;
    if (seen.has(n)) continue;
    seen.add(n);
    const desc = getChar(ap.characteristics, 'Description') ?? '';
    const entry = { name: n, description: desc };
    if (isEnhancement) entry._isEnhancement = true;
    abilities.push(entry);
  }

  // Unit-level rules from selection.rules[] (e.g. "Deadly Demise D3", "For The Greater Good")
  const seenRuleNames = new Set();
  const unitRules = [];
  for (const rule of toArray(sel.rules)) {
    const n = (rule.name ?? '').trim();
    const desc = (rule.description ?? '').trim();
    if (n && !seenRuleNames.has(n)) {
      seenRuleNames.add(n);
      unitRules.push({ name: n, description: desc });
    }
  }

  // Keywords: from the unit's own categories, sorted alphabetically
  const keywords = getCategories(sel)
    .map(c => c.name ?? '')
    .filter(Boolean)
    .sort();

  const composition = getComposition(sel);
  const modelProfiles = getModelProfiles(sel);
  disambiguateModelProfileNames(sel, modelProfiles);

  // Points: recursive sum across unit and all descendants (includes enhancement upgrades)
  const pts = Math.round(sumPts(sel)) || 0;

  // isCharacter: true if "Character" appears in the unit's categories
  const isCharacter = keywords.includes('Character');

  // leaderOf: extract bodyguard unit names from the Leader ability description.
  // Handles three NewRecruit export formats:
  //   ^^name^^  — T'au style (caret markers)
  //   ■ Name    — Grey Knights style (solid-square bullet, line-start)
  //   - NAME    — GSC style (dash bullet, line-start, may be ALL CAPS)
  const leaderAbility = abilities.find(a => a.name === 'Leader');
  let leaderOf = [];
  if (leaderAbility) {
    const desc = leaderAbility.description;
    const caretMatches = [...desc.matchAll(/\^\^(.*?)\^\^/g)];
    if (caretMatches.length > 0) {
      const names = caretMatches.map(m => m[1].replace(/\*/g, '').trim()).filter(Boolean);
      leaderOf = [...new Set(names)].sort();
    } else {
      // Fall back to line-start bullet formats: ■ Name  or  - Name
      const lineMatches = [...desc.matchAll(/^[■\-]\s+(.+)$/gm)];
      const names = lineMatches.map(m => m[1].trim()).filter(Boolean);
      leaderOf = [...new Set(names)].sort();
    }
  }

  return { name, stats, ranged, melee, abilities, unitRules, keywords, composition, modelProfiles, isCharacter, leaderOf, pts };
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

  const rules = collectRules(json);

  return { label, faction, detachment, units, rules };
}
