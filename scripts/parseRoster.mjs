#!/usr/bin/env node
/**
 * parseRoster.mjs
 * Parses a BattleScribe/NewRecruit .ros file and prints a JS object
 * ready to paste into src/data/armyLists.js as a p1 or p2 value.
 *
 * Usage:
 *   node scripts/parseRoster.mjs path/to/YourArmy.ros
 */

import { readFileSync, writeFileSync, mkdirSync, globSync } from 'node:fs';
import { resolve, basename, dirname } from 'node:path';

// ---------------------------------------------------------------------------
// CLI arg validation
// ---------------------------------------------------------------------------

const rawArgs = process.argv.slice(2);
if (rawArgs.length === 0) {
  console.error('Usage: node scripts/parseRoster.mjs <file.ros> [file2.ros ...]');
  process.exit(1);
}
// Expand glob patterns (Windows shells don't do this automatically)
const filePaths = rawArgs.flatMap(arg =>
  /[*?]/.test(arg) ? globSync(arg) : [arg]
);
if (filePaths.length === 0) {
  console.error(`Error: no files matched the given pattern(s)`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Minimal XML helpers
// ---------------------------------------------------------------------------

/**
 * Returns the value of an attribute from a tag string.
 * e.g. getAttr('<selection name="Foo" type="model">', 'name') → 'Foo'
 */
function getAttr(tag, attr) {
  const re = new RegExp(`\\b${attr}="([^"]*)"`, 'i');
  const m = tag.match(re);
  return m ? m[1] : null;
}

/**
 * Returns the opening tag string (everything up to and including '>') for all
 * occurrences of <tagName ...> in the source.
 */
function findOpenTags(src, tagName) {
  const re = new RegExp(`<${tagName}\\b[^>]*>`, 'gi');
  return [...src.matchAll(re)].map(m => ({ tag: m[0], index: m.index }));
}

/**
 * Extracts the substring from src starting just after startIndex that
 * represents the complete inner content of a <tagName> element.
 * Handles nesting by counting open/close pairs.
 */
function extractInner(src, tagName, openTagIndex, openTagLength) {
  const closeTag = `</${tagName}>`;
  const openTag  = `<${tagName}`;
  let depth = 1;
  let pos   = openTagIndex + openTagLength;
  const start = pos;

  // Find next true opening tag — must be followed by whitespace, '>', or '/'
  // to avoid matching tag name prefixes (e.g. '<selection' matching '<selections>').
  function nextTrueOpen(from) {
    let idx = src.indexOf(openTag, from);
    while (idx !== -1) {
      const ch = src[idx + openTag.length];
      if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === '>' || ch === '/') return idx;
      idx = src.indexOf(openTag, idx + 1);
    }
    return -1;
  }

  while (depth > 0 && pos < src.length) {
    const nextOpen  = nextTrueOpen(pos);
    const nextClose = src.indexOf(closeTag, pos);

    if (nextClose === -1) break; // malformed XML

    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      pos = nextOpen + openTag.length;
    } else {
      depth--;
      if (depth === 0) return src.slice(start, nextClose);
      pos = nextClose + closeTag.length;
    }
  }
  return src.slice(start, pos);
}

/**
 * Find all direct-child <selection> elements within a block of XML.
 * Returns array of { tag, inner } where inner is the element's contents.
 *
 * "Direct child" is approximated by finding <selection> tags and
 * extracting their full subtrees — we then check if the resulting subtree
 * belongs to a nested <selections> wrapper by tracking depth.
 */
function getDirectChildSelections(src) {
  const openTag  = '<selection';
  const closeTag = '</selection>';
  const results  = [];
  let pos = 0;

  while (pos < src.length) {
    const openIdx = src.indexOf(openTag, pos);
    if (openIdx === -1) break;

    // Find end of opening tag
    const tagEnd = src.indexOf('>', openIdx);
    if (tagEnd === -1) break;
    const isSelfClosing = src[tagEnd - 1] === '/';
    const openFull = src.slice(openIdx, tagEnd + 1);

    if (isSelfClosing) {
      results.push({ tag: openFull, inner: '' });
      pos = tagEnd + 1;
      continue;
    }

    const inner = extractInner(src, 'selection', openIdx, openFull.length);
    results.push({ tag: openFull, inner });
    pos = openIdx + openFull.length + inner.length + closeTag.length;
  }

  return results;
}

// ---------------------------------------------------------------------------
// Per-file processing
// ---------------------------------------------------------------------------

function processFile(filePath) {
  const absPath = resolve(filePath);
  let xml;
  try {
    xml = readFileSync(absPath, 'utf8');
  } catch {
    throw new Error(`could not read file "${absPath}"`);
  }

// ---------------------------------------------------------------------------
// Roster-level extraction
// ---------------------------------------------------------------------------

const rosterTagMatch = xml.match(/<roster\b[^>]*>/i);
if (!rosterTagMatch) {
  console.error('Error: no <roster> element found in file.');
  process.exit(1);
}
const rosterName = getAttr(rosterTagMatch[0], 'name') ?? 'Unknown';

// Faction from <force catalogueName="...">
const forceTagMatch = xml.match(/<force\b[^>]*>/i);
let faction = getAttr(forceTagMatch?.[0] ?? '', 'catalogueName') ?? 'Unknown';
// Strip leading "Xenos - ", "Imperium - ", etc.
faction = faction.replace(/^(Xenos|Imperium|Chaos|Unaligned)\s*-\s*/i, '').trim();

// ---------------------------------------------------------------------------
// Find the <force> inner content to scope unit search
// ---------------------------------------------------------------------------

const forceOpenIdx    = xml.indexOf(forceTagMatch?.[0] ?? '');
const forceOpenLen    = forceTagMatch?.[0]?.length ?? 0;
const forceInner      = extractInner(xml, 'force', forceOpenIdx, forceOpenLen);

// The top-level <selections> inside force
const topSelectionsMatch = forceInner.match(/<selections\b[^>]*>/i);
let topSelectionsInner = '';
if (topSelectionsMatch) {
  const tsIdx = forceInner.indexOf(topSelectionsMatch[0]);
  topSelectionsInner = extractInner(forceInner, 'selections', tsIdx, topSelectionsMatch[0].length);
}

// ---------------------------------------------------------------------------
// Parse numeric or string value
// ---------------------------------------------------------------------------

function coerce(val) {
  if (val === null || val === undefined) return null;
  const trimmed = val.trim();
  if (/^-?\d+$/.test(trimmed)) return parseInt(trimmed, 10);
  return trimmed;
}

// ---------------------------------------------------------------------------
// Extract characteristics from a <profile> block
// ---------------------------------------------------------------------------

function decodeEntities(s) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g,  '"')
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>');
}

function extractCharacteristics(profileSrc) {
  const chars = {};
  const re = /<characteristic\b[^>]*name="([^"]+)"[^>]*>([^<]*)<\/characteristic>/gi;
  let m;
  while ((m = re.exec(profileSrc)) !== null) {
    chars[m[1].trim()] = decodeEntities(m[2].trim());
  }
  // Also handle self-closing with value attr (some schema versions)
  const re2 = /<characteristic\b[^>]*name="([^"]+)"[^>]*value="([^"]*)"[^>]*\/>/gi;
  while ((m = re2.exec(profileSrc)) !== null) {
    chars[m[1].trim()] = decodeEntities(m[2].trim());
  }
  return chars;
}

// ---------------------------------------------------------------------------
// Find all <profile typeName="..."> blocks within a subtree
// ---------------------------------------------------------------------------

function findProfiles(src, typeName) {
  const results = [];
  const re = new RegExp(`<profile\\b[^>]*typeName="${typeName}"[^>]*>`, 'gi');
  let m;
  while ((m = re.exec(src)) !== null) {
    const openTag  = m[0];
    const isSelf   = openTag.trimEnd().endsWith('/>');
    const name     = getAttr(openTag, 'name') ?? '';
    if (isSelf) {
      results.push({ name, src: openTag });
      continue;
    }
    const inner = extractInner(src, 'profile', m.index, openTag.length);
    results.push({ name, src: openTag + inner });
  }
  return results;
}

// ---------------------------------------------------------------------------
// Weapon count helpers
// ---------------------------------------------------------------------------

/**
 * Returns the content inside the first <selections> block directly within
 * a selection's inner XML, or null if none exists.
 */
function getSelectionsContent(inner) {
  const match = inner.match(/<selections\b[^>]*>/i);
  if (!match) return null;
  const idx = inner.indexOf(match[0]);
  return extractInner(inner, 'selections', idx, match[0].length);
}

/**
 * Returns the content of the <profiles> block that is a DIRECT child of this
 * selection's inner XML (i.e. appears before any <selections> block).
 * Returns null if there's no profiles block or if it comes after <selections>.
 */
function getDirectProfilesContent(inner) {
  const profilesMatch = inner.match(/<profiles\b[^>]*>/i);
  if (!profilesMatch) return null;
  const pIdx = inner.indexOf(profilesMatch[0]);
  const selectionsIdx = inner.search(/<selections\b/i);
  if (selectionsIdx !== -1 && pIdx > selectionsIdx) return null;
  return extractInner(inner, 'profiles', pIdx, profilesMatch[0].length);
}

/**
 * Recursively walks all child selections of a selection's inner XML,
 * collecting weapon profiles of the given typeName along with their counts.
 * The count for each weapon is the sum of the `number` attributes on the
 * <selection> elements that directly contain the weapon profile.
 */
function collectWeaponCounts(selectionInner, typeName, acc = new Map()) {
  const selectionsContent = getSelectionsContent(selectionInner);
  if (!selectionsContent) return acc;

  for (const { tag, inner } of getDirectChildSelections(selectionsContent)) {
    const selNum = parseInt(getAttr(tag, 'number') ?? '1', 10) || 1;
    const profilesContent = getDirectProfilesContent(inner);
    if (profilesContent) {
      for (const p of findProfiles(profilesContent, typeName)) {
        if (!acc.has(p.name)) {
          const c = extractCharacteristics(p.src);
          const entry = { name: p.name, count: selNum };
          if (typeName === 'Ranged Weapons') {
            Object.assign(entry, {
              A: coerce(c['A'] ?? '-'), BS: c['BS'] ?? '-',
              S: coerce(c['S'] ?? '-'), AP: coerce(c['AP'] ?? '-'),
              D: coerce(c['D'] ?? '-'), keywords: c['Keywords'] ?? '-',
            });
          } else {
            Object.assign(entry, {
              A: coerce(c['A'] ?? '-'), WS: c['WS'] ?? '-',
              S: coerce(c['S'] ?? '-'), AP: coerce(c['AP'] ?? '-'),
              D: coerce(c['D'] ?? '-'), keywords: c['Keywords'] ?? '-',
            });
          }
          acc.set(p.name, entry);
        } else {
          acc.get(p.name).count += selNum;
        }
      }
    }
    // Always recurse into child selections (handles nested upgrade selections)
    collectWeaponCounts(inner, typeName, acc);
  }
  return acc;
}

// ---------------------------------------------------------------------------
// Ability and keyword extraction
// ---------------------------------------------------------------------------

/**
 * Collects all Abilities profiles from a unit subtree, deduping by name.
 * Skips invuln-save profiles (e.g. "5++").
 */
function collectAbilities(combined) {
  const abilityProfiles = findProfiles(combined, 'Abilities');
  const seen = new Set();
  const abilities = [];
  for (const ap of abilityProfiles) {
    const name = ap.name.trim();
    if (/^\d+\+\+$/.test(name)) continue; // invuln save, not an ability
    if (seen.has(name)) continue;
    seen.add(name);
    const chars = extractCharacteristics(ap.src);
    const description = decodeEntities(chars['Description'] ?? '');
    abilities.push({ name, description });
  }
  return abilities;
}

/**
 * Extracts unit gameplay keywords from the unit selection's own <categories>
 * block (which appears after the last </selections> close tag), excluding
 * wargear/meta categories per EXCLUDED_KEYWORDS and "Faction:" prefixed names.
 */
function extractKeywords(inner) {
  // The unit's own <categories> block comes after the last </selections>
  const selectionsCloseIdx = inner.lastIndexOf('</selections>');
  const searchFrom = selectionsCloseIdx !== -1 ? selectionsCloseIdx : 0;
  const tail = inner.slice(searchFrom);
  const catMatch = tail.match(/<categories\b[^>]*>/i);
  if (!catMatch) return [];
  const catIdx = tail.indexOf(catMatch[0]);
  const catInner = extractInner(tail, 'categories', catIdx, catMatch[0].length);
  const keywords = [];
  const re = /<category\b[^>]*>/gi;
  let m;
  while ((m = re.exec(catInner)) !== null) {
    const name = getAttr(m[0], 'name') ?? '';
    if (!name) continue;
    keywords.push(name);
  }
  return keywords.sort();
}

// ---------------------------------------------------------------------------
// Parse a single unit selection
// ---------------------------------------------------------------------------

function parseUnit(tag, inner) {
  const unitName = getAttr(tag, 'name') ?? 'Unknown Unit';
  const combined = tag + inner;

  // Find the Unit profile
  const unitProfiles = findProfiles(combined, 'Unit');
  if (unitProfiles.length === 0) {
    process.stderr.write(`Warning: no Unit profile found for selection "${unitName}" — skipping\n`);
    return null;
  }

  const unitProfile = unitProfiles[0];
  const chars = extractCharacteristics(unitProfile.src);

  const stats = {
    M:      chars['M']  ?? '-',
    T:      coerce(chars['T']  ?? '-'),
    SV:     chars['SV'] ?? '-',
    invuln: null,
    W:      coerce(chars['W']  ?? '-'),
    LD:     chars['LD'] ?? '-',
    OC:     coerce(chars['OC'] ?? '-'),
  };

  // Invuln: Abilities profile whose name matches /^\d+\+\+$/
  const abilityProfiles = findProfiles(combined, 'Abilities');
  for (const ap of abilityProfiles) {
    if (/^\d+\+\+$/.test(ap.name.trim())) {
      stats.invuln = ap.name.trim();
      break;
    }
  }

  // Ranged weapons — sum `number` attributes from the <selection> nodes that
  // directly contain each weapon profile, recursing through nested upgrades.
  const ranged = [...collectWeaponCounts(inner, 'Ranged Weapons').values()];

  // Melee weapons
  const melee  = [...collectWeaponCounts(inner, 'Melee Weapons').values()];

  // Abilities (all, deduped, excluding invuln saves)
  const abilities = collectAbilities(combined);

  // Keywords (filtered, sorted)
  const keywords = extractKeywords(inner);

  return { name: unitName, stats, ranged, melee, abilities, keywords };
}

// ---------------------------------------------------------------------------
// Walk top-level selections and collect units
// ---------------------------------------------------------------------------

const topSelections = getDirectChildSelections(topSelectionsInner);
const units = [];

for (const { tag, inner } of topSelections) {
  const type = getAttr(tag, 'type') ?? '';
  if (type !== 'model' && type !== 'unit') continue;
  const unit = parseUnit(tag, inner);
  if (unit) units.push(unit);
}

// ---------------------------------------------------------------------------
// Serialise to JS object literal
// ---------------------------------------------------------------------------

function jsString(s) {
  return JSON.stringify(s); // handles escaping
}

function jsVal(v) {
  if (v === null) return 'null';
  if (typeof v === 'number') return String(v);
  return jsString(v);
}

function serializeWeapon(w, wsKey) {
  const ws = wsKey === 'BS'
    ? `BS: ${jsVal(w.BS)}`
    : `WS: ${jsVal(w.WS)}`;
  const countPart = w.count > 1 ? `, count: ${w.count}` : '';
  return (
    `{ name: ${jsString(w.name)}, A: ${jsVal(w.A)}, ${ws}, ` +
    `S: ${jsVal(w.S)}, AP: ${jsVal(w.AP)}, D: ${jsVal(w.D)}, keywords: ${jsString(w.keywords)}${countPart} }`
  );
}

function serializeAbility(a) {
  return `{ name: ${jsString(a.name)}, description: ${jsString(a.description)} }`;
}

function serializeUnit(u) {
  const { name, stats, ranged, melee, abilities, keywords } = u;
  const statsStr =
    `{ M: ${jsString(stats.M)}, T: ${jsVal(stats.T)}, SV: ${jsString(stats.SV)}, ` +
    `invuln: ${jsVal(stats.invuln)}, W: ${jsVal(stats.W)}, LD: ${jsString(stats.LD)}, OC: ${jsVal(stats.OC)} }`;

  const rangedStr = ranged.length === 0
    ? '[]'
    : '[\n' + ranged.map(w => `        ${serializeWeapon(w, 'BS')},`).join('\n') + '\n      ]';

  const meleeStr = melee.length === 0
    ? '[]'
    : '[\n' + melee.map(w => `        ${serializeWeapon(w, 'WS')},`).join('\n') + '\n      ]';

  const abilitiesStr = !abilities || abilities.length === 0
    ? '[]'
    : '[\n' + abilities.map(a => `        ${serializeAbility(a)},`).join('\n') + '\n      ]';

  const keywordsStr = !keywords || keywords.length === 0
    ? '[]'
    : '[' + keywords.map(k => jsString(k)).join(', ') + ']';

  return (
    `    {\n` +
    `      name: ${jsString(name)},\n` +
    `      stats: ${statsStr},\n` +
    `      ranged: ${rangedStr},\n` +
    `      melee: ${meleeStr},\n` +
    `      abilities: ${abilitiesStr},\n` +
    `      keywords: ${keywordsStr},\n` +
    `    }`
  );
}

const output = [
  `export default {`,
  `  label: ${jsString(rosterName)},`,
  `  faction: ${jsString(faction)},`,
  `  units: [`,
  units.map(serializeUnit).join(',\n'),
  `  ]`,
  `}`,
].join('\n');

// Derive output path: src/data/rosters/<name>.js
const inputBasename = basename(filePath);
const outputName = inputBasename.replace(/\s+/g, '-').replace(/\.ros$/i, '').toLowerCase();
const scriptDir = dirname(resolve(process.argv[1]));
const rostersDir = resolve(scriptDir, '..', 'src', 'data', 'rosters');
mkdirSync(rostersDir, { recursive: true });
const outPath = resolve(rostersDir, `${outputName}.js`);
writeFileSync(outPath, output + '\n', 'utf8');
console.log(`✓ Written to src/data/rosters/${outputName}.js`);

// ---------------------------------------------------------------------------
// Update src/data/rosters/index.js
// ---------------------------------------------------------------------------

const indexPath = resolve(rostersDir, 'index.js');
// camelCase key for valid JS identifier (e.g. 'gsc-colosseum' → 'gscColosseum')
const key = outputName.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

let indexSrc;
try {
  indexSrc = readFileSync(indexPath, 'utf8');
} catch {
  indexSrc = `// Add a new entry here each time you run the parser on a new .ros file\nexport const ROSTERS = {}\n`;
}

// Check if already registered
if (new RegExp(`\\b${key}\\b`).test(indexSrc)) {
  console.log(`✓ index.js already up to date`);
} else {
  // Insert import line before 'export const ROSTERS'
  const importLine = `import ${key} from './${outputName}.js'`;
  indexSrc = indexSrc.replace(
    /^(export const ROSTERS)/m,
    `${importLine}\n\n$1`
  );
  // Insert key into ROSTERS object — handles both empty ({}) and populated ({...})
  indexSrc = indexSrc.replace(
    /export const ROSTERS = \{([^}]*)\}/s,
    (_, inner) => {
      const trimmed = inner.trim();
      const entries = trimmed ? `\n  ${trimmed}\n  ${key},\n` : `\n  ${key},\n`;
      return `export const ROSTERS = {${entries}}`;
    }
  );
  writeFileSync(indexPath, indexSrc, 'utf8');
  console.log(`✓ Updated src/data/rosters/index.js`);
}
} // end processFile

// ---------------------------------------------------------------------------
// Run across all supplied files
// ---------------------------------------------------------------------------

let processed = 0;
for (const filePath of filePaths) {
  try {
    processFile(filePath);
    processed++;
  } catch (err) {
    console.error(`Error processing "${filePath}": ${err.message}`);
  }
}
console.log(`✓ Processed ${processed} file${processed === 1 ? '' : 's'}`);
