export function parseWahapediaCsv(rawString) {
  const cleaned = rawString.replace(/^﻿/, '');
  const lines = cleaned.split('\n').filter(l => l.trim() !== '');
  if (lines.length < 2) return [];

  const headers = lines[0].split('|').map(h => h.trim()).filter(h => h !== '');

  return lines.slice(1).map(line => {
    const fields = line.split('|');
    const row = {};
    headers.forEach((h, i) => {
      row[h] = (fields[i] ?? '').trim();
    });
    return row;
  });
}

export function sanitiseHtml(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n')
    .replace(/<\/?span[^>]*>/gi, '')
    .replace(/<(?!\/?b>)[^>]+>/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
