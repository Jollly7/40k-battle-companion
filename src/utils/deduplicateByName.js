export function deduplicateByName(rows) {
  const map = new Map();
  for (const row of rows) {
    const existing = map.get(row.name);
    if (!existing || row.id > existing.id) {
      map.set(row.name, row);
    }
  }
  return Array.from(map.values());
}
