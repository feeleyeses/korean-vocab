import fs from 'node:fs';

const path = process.argv[2] || 'data/lexical-entries.draft.json';
const entries = JSON.parse(fs.readFileSync(path, 'utf8'));
const failures = [];
const ids = new Set();
const senseIds = new Set();

for (const entry of entries) {
  const id = entry.lexicalEntryId;
  if (!id || ids.has(id)) failures.push(`duplicate or missing lexicalEntryId: ${id || '(missing)'}`);
  ids.add(id);
  if (!entry.headword) failures.push(`${id}: missing headword`);
  if (!entry.pronunciation?.hangul || !entry.pronunciation?.romanization) failures.push(`${id}: missing pronunciation or romanization`);
  if (!Array.isArray(entry.senses) || entry.senses.length === 0) failures.push(`${id}: missing senses`);
  for (const sense of entry.senses || []) {
    if (!sense.senseId || senseIds.has(sense.senseId)) failures.push(`${id}: duplicate or missing senseId ${sense.senseId || '(missing)'}`);
    senseIds.add(sense.senseId);
    if (!sense.glossZh) failures.push(`${id}/${sense.senseId}: missing glossZh`);
    if (!Array.isArray(sense.examples)) failures.push(`${id}/${sense.senseId}: examples must be an array`);
    if (!Array.isArray(sense.collocations)) failures.push(`${id}/${sense.senseId}: collocations must be an array`);
  }
  const q = entry.qualityScore;
  if (!q || typeof q.score !== 'number' || q.score < 0 || q.score > 100) failures.push(`${id}: invalid quality score`);
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
