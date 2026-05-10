import { useMemo } from 'react';
import { parseWahapediaCsv } from '../utils/parseWahapediaCsv';
import { deduplicateByName } from '../utils/deduplicateByName';

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

export function useArmyRuleData({ factionName, detachmentName }) {
  return useMemo(() => {
    const normName = s => (s ?? '').toLowerCase().trim().replace(/[‘’]/g, "'");

    const factionRow = factions.find(f => normName(f.name) === normName(factionName));
    const factionId = factionRow?.id ?? null;

    const detachmentRow = detachments.find(d => normName(d.name) === normName(detachmentName));
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
  }, [factionName, detachmentName]);
}
