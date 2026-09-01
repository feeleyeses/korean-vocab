import fs from 'node:fs';

const inputPath = process.argv[2] || 'data/vocabulary.json';
const outPath = process.argv[3] || 'artifacts/example-verification-backlog.json';
const mdPath = process.argv[4] || 'docs/example-verification-backlog.md';

const payload = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const entries = Array.isArray(payload) ? payload : payload.entries || [];

const levelOf = entry => entry.levels?.[0] || 'unknown';
const hasKrdict = entry => String(entry.source || '').includes('KRDICT') || Boolean(entry.legacyId?.startsWith('exp-'));
const rows = [];

for (const entry of entries) {
  for (const sense of entry.senses || []) {
    const verified = (sense.examples || []).some(example => example.ko && example.zh && example.source && example.verified);
    if (verified) continue;
    rows.push({
      level: sense.level || levelOf(entry),
      lexicalEntryId: entry.lexicalEntryId,
      headword: entry.headword,
      partOfSpeech: entry.partOfSpeech,
      senseId: sense.senseId,
      glossZh: sense.glossZh,
      source: entry.source || '',
      hasKrdictExampleCandidate: hasKrdict(entry),
      reason: hasKrdict(entry)
        ? 'KRDict exact-headword entry; Korean example candidates can be pulled from KRDict view API, Chinese translation still needs verification.'
        : 'No KRDict example candidate source recorded yet.'
    });
  }
}

const summary = rows.reduce((acc, row) => {
  acc.byLevel[row.level] ||= { total: 0, krdictCandidate: 0, noCandidate: 0 };
  acc.byLevel[row.level].total += 1;
  if (row.hasKrdictExampleCandidate) acc.byLevel[row.level].krdictCandidate += 1;
  else acc.byLevel[row.level].noCandidate += 1;
  acc.total += 1;
  if (row.hasKrdictExampleCandidate) acc.krdictCandidate += 1;
  else acc.noCandidate += 1;
  return acc;
}, { total: 0, krdictCandidate: 0, noCandidate: 0, byLevel: {} });

fs.writeFileSync(outPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), source: inputPath, summary, rows }, null, 2)}\n`);

const lines = [
  '# Example Verification Backlog',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  `- Total missing verified examples: ${summary.total}`,
  `- With KRDict example candidate entry point: ${summary.krdictCandidate}`,
  `- Without candidate source: ${summary.noCandidate}`,
  '',
  '| TOPIK | Total | KRDict candidate | No candidate |',
  '|---|---:|---:|---:|',
  ...Object.entries(summary.byLevel)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([level, item]) => `| ${level} | ${item.total} | ${item.krdictCandidate} | ${item.noCandidate} |`),
  '',
  '## Review Rows',
  '',
  '| TOPIK | Headword | POS | Gloss | Candidate | Reason |',
  '|---|---|---|---|---|---|',
  ...rows.map(row => `| ${row.level} | ${row.headword} | ${row.partOfSpeech} | ${row.glossZh} | ${row.hasKrdictExampleCandidate ? 'yes' : 'no'} | ${row.reason} |`)
];

fs.writeFileSync(mdPath, `${lines.join('\n')}\n`);
console.log(JSON.stringify({ rows: rows.length, outPath, mdPath, summary }, null, 2));
