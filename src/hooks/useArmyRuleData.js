import { useMemo } from 'react';
import { parseWahapediaCsv } from '../utils/parseWahapediaCsv';
import { deduplicateByName } from '../utils/deduplicateByName';
import { normalizeDetachment } from '../utils/normalizeDetachment';

import factionsRaw from '../data/csv/Factions.csv?raw';
import detachmentsRaw from '../data/csv/Detachments.csv?raw';
import stratagemsRaw from '../data/csv/Stratagems.csv?raw';
import detachmentAbilitiesRaw from '../data/csv/Detachment_abilities.csv?raw';
import abilitiesRaw from '../data/csv/Abilities.csv?raw';

const factions = parseWahapediaCsv(factionsRaw);
const detachments = parseWahapediaCsv(detachmentsRaw);
const stratagems = deduplicateByName(parseWahapediaCsv(stratagemsRaw));
const detachmentAbilitiesAll = parseWahapediaCsv(detachmentAbilitiesRaw);
const abilitiesAll = parseWahapediaCsv(abilitiesRaw);

const normName = s => (s ?? '').toLowerCase().trim().replace(/[‘’]/g, "'");

export function useArmyRuleData({ factionName, detachmentName }) {
  // `detachmentName` may be a string[] (v1.13.0+), a legacy string, or null.
  // The memo must depend on a stable primitive — a fresh array identity every
  // render would defeat memoisation entirely.
  const detachmentKey = normalizeDetachment(detachmentName).map(normName).join('|');

  return useMemo(() => {
    const factionRow = factions.find(f => normName(f.name) === normName(factionName));
    const factionId = factionRow?.id ?? null;

    // First declared detachment that matches a Wahapedia row wins. No match
    // behaves exactly as an unknown detachment did before: no stratagems, no
    // detachment ability.
    const candidates = detachmentKey === '' ? [] : detachmentKey.split('|');
    let detachmentRow = null;
    for (const candidate of candidates) {
      detachmentRow = detachments.find(d => normName(d.name) === candidate) ?? null;
      if (detachmentRow) break;
    }
    const detachmentId = detachmentRow?.id ?? null;

    const coreStratagems = stratagems.filter(s => !s.faction_id && !s.detachment && !/boarding|challenger/i.test(s.type ?? ''));

    const detachmentStratagems = detachmentId
      ? stratagems.filter(s => s.detachment_id === detachmentId)
      : [];

    const sharedAbilityIds = factionId
      ? new Set(
          abilitiesAll
            .filter(a => a.faction_id !== factionId)
            .map(a => a.id)
        )
      : new Set();

    const factionAbilities = factionId
      ? abilitiesAll.filter(a => a.faction_id === factionId && !sharedAbilityIds.has(a.id))
      : [];

    const detachmentAbility = detachmentId
      ? (detachmentAbilitiesAll.find(a => a.detachment_id === detachmentId) ?? null)
      : null;

    return { coreStratagems, detachmentStratagems, factionAbilities, detachmentAbility };
  }, [factionName, detachmentKey]);
}
