export function renderWahapediaHtml(html) {
  if (!html) return '';
  return html
    .replace(/<span\s+class="kwb">/gi, '<span class="wh-kwb">')
    .replace(/\sstyle="[^"]*"/gi, '')
    .replace(/\sclass="(?!wh-kwb")[^"]*"/gi, '');
}
