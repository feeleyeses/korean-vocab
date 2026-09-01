import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const inputPath = args.find(arg => arg.startsWith('--input='))?.split('=')[1] || 'data/vocabulary.json';
const coveragePath = args.find(arg => arg.startsWith('--coverage='))?.split('=')[1] || '';
const jsonOutPath = args.find(arg => arg.startsWith('--json='))?.split('=')[1] || 'artifacts/collocation-manual-review-queue.json';
const markdownOutPath = args.find(arg => arg.startsWith('--md='))?.split('=')[1] || 'docs/collocation-manual-review-queue.md';

const vocabulary = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
let coverage = null;

if (coveragePath && fs.existsSync(coveragePath)) {
  coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
}

const reasonByKey = new Map();
if (coverage?.rows) {
  for (const row of coverage.rows) {
    const key = `${row.lexicalEntryId}|${row.senseId}|${row.collocationId}`;
    let reason = row.reason || row.category || 'Needs manual phrase translation review';
    if (row.category === 'unavailable') {
      reason = 'KRDict exact collocation not found';
    }
    if (row.category === 'manual') {
      reason = 'KRDict result ambiguous or missing Chinese phrase meaning';
    }
    reasonByKey.set(key, reason);
  }
}

const rows = [];

for (const entry of vocabulary.entries || []) {
  for (const sense of entry.senses || []) {
    const level = sense.level || entry.levels?.[0] || 'TOPIK-?';
    for (const collocation of sense.collocations || []) {
      if (collocation.zh) continue;
      const key = `${entry.id}|${sense.id}|${collocation.id}`;
      rows.push({
        level,
        headword: entry.headword,
        collocation: collocation.ko,
        gloss: sense.glossZh || sense.gloss || '',
        reason: reasonByKey.get(key) || 'Needs manual phrase translation review'
      });
    }
  }
}

rows.sort((a, b) => (
  a.level.localeCompare(b.level, 'en', { numeric: true }) ||
  a.headword.localeCompare(b.headword, 'ko') ||
  a.collocation.localeCompare(b.collocation, 'ko')
));

const byLevel = {};
for (const row of rows) {
  byLevel[row.level] = (byLevel[row.level] || 0) + 1;
}

fs.mkdirSync(path.dirname(jsonOutPath), { recursive: true });
fs.writeFileSync(jsonOutPath, JSON.stringify({
  generatedAt: new Date().toISOString(),
  source: inputPath,
  total: rows.length,
  byLevel,
  rows
}, null, 2) + '\n');

const escapeCell = value => String(value).replace(/\|/g, '\\|');
const lines = [
  '# Collocation Manual Review Queue',
  '',
  'Generated from the current published vocabulary after applying KRDict exact matches and the TOPIK-1/2 editorial batch.',
  '',
  'Rows here should not be auto-filled. They need human review or a separate corpus-backed phrase translation pass.',
  '',
  '## Summary',
  '',
  `- Total manual/unavailable rows: ${rows.length}`,
  ...Object.entries(byLevel).map(([level, count]) => `- ${level}: ${count}`),
  '',
  '## Queue by TOPIK Level',
  ''
];

for (const level of Object.keys(byLevel)) {
  lines.push(`### ${level}`, '');
  lines.push('| Headword | Collocation | Current sense.gloss | Reason |');
  lines.push('|---|---|---|---|');
  for (const row of rows.filter(item => item.level === level)) {
    lines.push(`| ${escapeCell(row.headword)} | ${escapeCell(row.collocation)} | ${escapeCell(row.gloss)} | ${escapeCell(row.reason)} |`);
  }
  lines.push('');
}

fs.mkdirSync(path.dirname(markdownOutPath), { recursive: true });
fs.writeFileSync(markdownOutPath, lines.join('\n'));

console.log(JSON.stringify({ total: rows.length, byLevel, jsonOutPath, markdownOutPath }, null, 2));
