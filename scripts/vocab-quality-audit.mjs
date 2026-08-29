import fs from 'node:fs';

const path = process.argv[2] || 'data/vocabulary.json';
const payload = JSON.parse(fs.readFileSync(path, 'utf8'));
const entries = Array.isArray(payload) ? payload : payload.entries;
const failures = [];
const ids = new Set();
const senseIds = new Set();

for (const entry of entries) {
  const id = entry.lexicalEntryId;
  if (!id || ids.has(id)) failures.push(`duplicate or missing lexicalEntryId: ${id || '(missing)'}`);
  ids.add(id);
  if (!entry.headword) failures.push(`${id}: missing headword`);
  if (!entry.levels?.length) failures.push(`${id}: missing TOPIK level`);
  if (!entry.source) failures.push(`${id}: missing data source`);
  if (!entry.pronunciation?.hangul || !entry.pronunciation?.romanization) failures.push(`${id}: missing pronunciation or romanization`);
  if (!Array.isArray(entry.pronunciation?.soundRules)) failures.push(`${id}: soundRules must be an array`);
  if (!Array.isArray(entry.senses) || entry.senses.length === 0) failures.push(`${id}: missing senses`);
  for (const sense of entry.senses || []) {
    if (!sense.senseId || senseIds.has(sense.senseId)) failures.push(`${id}: duplicate or missing senseId ${sense.senseId || '(missing)'}`);
    senseIds.add(sense.senseId);
    if (!sense.glossZh) failures.push(`${id}/${sense.senseId}: missing glossZh`);
    if (!Array.isArray(sense.examples)) failures.push(`${id}/${sense.senseId}: examples must be an array`);
    if (!sense.examples?.some(example => example.ko && example.zh)) failures.push(`${id}/${sense.senseId}: missing Korean/Chinese example pair`);
    if (!Array.isArray(sense.collocations)) failures.push(`${id}/${sense.senseId}: collocations must be an array`);
    if (!sense.collocations?.some(item => item.ko && item.zh)) failures.push(`${id}/${sense.senseId}: missing collocation pair`);
  }
  const q = entry.qualityScore;
  if (!q || typeof q.score !== 'number' || q.score < 0 || q.score > 100) failures.push(`${id}: invalid quality score`);
  if (typeof q?.completeness !== 'number' || typeof q?.accuracy !== 'number' || typeof q?.sourceReliability !== 'number') failures.push(`${id}: incomplete quality score dimensions`);
  if (entry.verificationStatus === 'approved') {
    if (!q.humanReviewed) failures.push(`${id}: approved entries require humanReviewed=true`);
    if (q.issues?.length) failures.push(`${id}: approved entries cannot have open quality issues`);
    if (!entry.verifiedAt) failures.push(`${id}: approved entries require verifiedAt`);
  }
}

if (failures.length) {
  console.error(`FAIL vocabulary quality audit (${path})`);
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`PASS vocabulary quality audit: ${entries.length} lexical entries, ${senseIds.size} senses`);
