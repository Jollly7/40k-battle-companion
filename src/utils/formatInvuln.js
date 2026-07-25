/**
 * Format a stored invuln save value in standard 40k notation ("4++").
 *
 * Stored values arrive in two shapes: "4+" (from the 11th Ed `InSv` characteristic
 * and the "Invulnerable Save (4+)" ability-name match) and "4++" (from the bare
 * ability-name fallback). Normalising on read means rosters already synced to
 * Cloudflare KV / localStorage display correctly with no re-import.
 *
 * Returns null for absent or unparseable values so callers can gate on it.
 */
export function formatInvuln(value) {
  if (typeof value !== 'string') return null;
  const m = value.trim().match(/^(\d+)\+*$/);
  return m ? `${m[1]}++` : null;
}
