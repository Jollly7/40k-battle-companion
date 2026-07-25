/**
 * Normalise a roster's `detachment` field to a `string[]`, whatever shape it
 * arrives in.
 *
 * As of v1.13.0 the parser emits `string[]`, but Cloudflare KV and localStorage
 * still hold rosters synced before that change with `detachment` as a plain
 * string — both shapes coexist in the same stored array. This is the single
 * place that shape detection lives; every consumer calls it rather than
 * re-implementing the check.
 *
 * Filter semantics mirror `parseRosterJson.js` (non-blank strings only) —
 * keep the two in step if either changes.
 *
 * @param {string[]|string|null|undefined} detachment
 * @returns {string[]} New array; empty when there is nothing to show.
 */
export function normalizeDetachment(detachment) {
  if (Array.isArray(detachment)) {
    return detachment.filter(n => typeof n === 'string' && n.trim() !== '');
  }
  if (typeof detachment === 'string') {
    return detachment.trim() !== '' ? [detachment] : [];
  }
  return [];
}
