import fs from 'node:fs';

const inputPath = process.argv[2] || 'data/vocabulary.json';
const outPath = process.argv[3] || 'artifacts/duplicate-headword-report.json';
const mdPath = process.argv[4] || 'docs/duplicate-headword-report.md';

const payload = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const entries = Array.isArray(payload) ? payload : payload.entries || [];

function primaryGloss(entry) {
  return (entry.senses || []).map(sense => sense.glossZh).filter(Boolean).join(' / ');
}

function classify(group) {
  const pos = new Set(group.map(entry => entry.partOfSpeech || 'unknown'));
  const gloss = new Set(group.map(primaryGloss));
  const ids = new Set(group.map(entry => entry.lexicalEntryId));
  if (ids.size !== group.length) return '完全重复';
  if (pos.size > 1) return '同词不同词性';
  if (gloss.size > 1) return '同词多义';
  if (group.some(entry => String(entry.source || '').includes('KRDICT')) && group.some(entry => !String(entry.source || '').includes('KRDICT'))) return '疑似应合并';
  return '疑似应保留';
}

const grouped = new Map();
for (const entry of entries) {
  grouped.set(entry.headword, [...(grouped.get(entry.headword) || []), entry]);
}

const rows = [...grouped.entries()]
  .filter(([, group]) => group.length > 1)
  .map(([headword, group]) => ({
    headword,
    count: group.length,
    classification: classify(group),
    entries: group.map(entry => ({
      lexicalEntryId: entry.lexicalEntryId,
      partOfSpeech: entry.partOfSpeech,
      levels: entry.levels,
      glossZh: primaryGloss(entry),
      source: entry.source || ''
    }))
  }))
  .sort((a, b) => a.classification.localeCompare(b.classification, 'zh-CN') || a.headword.localeCompare(b.headword, 'ko'));

const summary = rows.reduce((acc, row) => {
  acc.totalGroups += 1;
  acc.byClassification[row.classification] = (acc.byClassification[row.classification] || 0) + 1;
  return acc;
}, { totalGroups: 0, byClassification: {} });

fs.writeFileSync(outPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), source: inputPath, summary, rows }, null, 2)}\n`);

const lines = [
  '# Duplicate Headword Report',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  `- Duplicate headword groups: ${summary.totalGroups}`,
  ...Object.entries(summary.byClassification).map(([key, value]) => `- ${key}: ${value}`),
  '',
  '| Headword | Count | Classification | Entries |',
  '|---|---:|---|---|',
  ...rows.map(row => `| ${row.headword} | ${row.count} | ${row.classification} | ${row.entries.map(entry => `${entry.lexicalEntryId} / ${entry.partOfSpeech} / ${entry.levels.join(', ')} / ${entry.glossZh}`).join('<br>')} |`)
];

fs.writeFileSync(mdPath, `${lines.join('\n')}\n`);
console.log(JSON.stringify({ groups: rows.length, outPath, mdPath, summary }, null, 2));
