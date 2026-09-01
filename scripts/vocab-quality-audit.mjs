import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const inputPath = args.find(arg => !arg.startsWith('--')) || 'data/vocabulary.json';
const reportFlag = args.find(arg => arg.startsWith('--report='));
const reportPath = reportFlag?.split('=')[1] || null;
const rawFlag = args.find(arg => arg.startsWith('--raw='));
const rawPath = rawFlag?.split('=')[1] || null;
const strict = args.includes('--strict');

const payload = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const entries = Array.isArray(payload) ? payload : payload.entries;
const failures = [];
const warnings = [];
const ids = new Set();
const senseIds = new Set();
const reviewQueue = [];
const coverage = {
  entries: 0,
  senses: 0,
  examples: 0,
  collocations: 0,
  pronunciation: 0,
  romanization: 0,
  soundRules: 0,
  sources: 0,
  humanReviewed: 0
};
const collocationZhStats = {
  total: 0,
  withZh: 0,
  missingZh: 0,
  fallbackToGloss: 0,
  byLevel: {}
};

const hasHangul = value => /[\u3131-\u318e\uac00-\ud7a3]/u.test(String(value || ''));
const hasLatin = value => /[a-z]/i.test(String(value || ''));
const isNumberInRange = value => typeof value === 'number' && value >= 0 && value <= 100;

function addReview(entry, reason, severity = 'warning') {
  reviewQueue.push({
    lexicalEntryId: entry.lexicalEntryId || null,
    headword: entry.headword || null,
    source: entry.source || null,
    levels: entry.levels || [],
    reason,
    severity
  });
}

function countBy(items, keyFn) {
  return items.reduce((acc, item) => {
    const key = keyFn(item) || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function countByLevel(items) {
  return items.reduce((acc, item) => {
    const levels = item.levels?.length ? item.levels : ['unknown'];
    for (const level of levels) acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {});
}

function addCollocationLevel(level, key) {
  const normalized = level || 'unknown';
  collocationZhStats.byLevel[normalized] ||= { total: 0, withZh: 0, missingZh: 0, fallbackToGloss: 0 };
  collocationZhStats.byLevel[normalized][key] += 1;
}

function normalizeRawLevel(value) {
  return `TOPIK-${Number(String(value || 1).replace(/[^0-9]/g, '')) || 1}`;
}

function auditRawExpansion(rawInputPath, publishedEntries) {
  if (!rawInputPath) return null;
  const rawPayload = JSON.parse(fs.readFileSync(rawInputPath, 'utf8'));
  const rawEntries = Array.isArray(rawPayload) ? rawPayload : rawPayload.entries || [];
  const publishedHeadwords = new Set(publishedEntries.map(entry => entry.headword));
  const seenIds = new Set();
  const seenHeadwords = new Set();
  const duplicateLexicalIds = [];
  const duplicateHeadwords = [];
  const missingTopikLevel = [];
  const missingRomanization = [];
  const missingGlossZh = [];
  const byStatus = {};
  const byLevel = {};
  const rows = [];

  for (const [index, entry] of rawEntries.entries()) {
    const status = entry.verificationStatus || (entry.needsReview ? 'needs_review' : 'approved');
    const rawId = entry.id || entry.lexicalEntryId || `raw-${index + 1}`;
    const levels = entry.levels?.length ? entry.levels : [entry.level];
    const normalizedLevels = levels.map(normalizeRawLevel);
    byStatus[status] = (byStatus[status] || 0) + 1;
    for (const level of normalizedLevels) byLevel[level] = (byLevel[level] || 0) + 1;

    const lexicalKey = entry.lexicalEntryId || entry.id || '';
    if (lexicalKey) {
      if (seenIds.has(lexicalKey)) duplicateLexicalIds.push(lexicalKey);
      seenIds.add(lexicalKey);
    }
    if (entry.headword) {
      if (seenHeadwords.has(entry.headword)) duplicateHeadwords.push(entry.headword);
      seenHeadwords.add(entry.headword);
    }
    if (!levels.length || !levels[0]) missingTopikLevel.push(rawId);
    if (!entry.romanization && !entry.pronunciation?.romanization) missingRomanization.push(rawId);
    const hasGloss = (entry.senses || []).some(sense => sense.gloss || sense.glossZh);
    if (!hasGloss) missingGlossZh.push(rawId);
    if (status !== 'approved') {
      rows.push({
        id: rawId,
        headword: entry.headword || null,
        status,
        levels: normalizedLevels,
        source: entry.source || null,
        reasons: [
          status === 'draft' ? 'draft entry is not published to learning queue' : '',
          status === 'needs_review' ? 'entry needs human review before publishing' : '',
          !levels.length || !levels[0] ? 'missing TOPIK level' : '',
          !entry.romanization && !entry.pronunciation?.romanization ? 'missing romanization' : '',
          !hasGloss ? 'missing glossZh' : ''
        ].filter(Boolean)
      });
    }
  }

  return {
    rawPath: rawInputPath,
    totalRawEntries: rawEntries.length,
    publishedEntries: publishedEntries.length,
    newRawOnlyEntries: rawEntries.filter(entry => !publishedHeadwords.has(entry.headword)).length,
    publishableApprovedEntries: byStatus.approved || 0,
    pendingReviewEntries: (byStatus.needs_review || 0) + (byStatus.draft || 0),
    byStatus,
    byLevel,
    duplicateLexicalIds,
    duplicateHeadwords,
    missingTopikLevel,
    missingRomanization,
    missingGlossZh,
    reviewQueue: rows
  };
}

function checkQualityScore(entry) {
  const q = entry.qualityScore;
  if (!q) {
    failures.push(`${entry.lexicalEntryId}: missing qualityScore`);
    addReview(entry, 'missing qualityScore', 'failure');
    return;
  }
  for (const key of ['score', 'completeness', 'accuracy', 'sourceReliability']) {
    if (!isNumberInRange(q[key])) {
      failures.push(`${entry.lexicalEntryId}: invalid qualityScore.${key}`);
      addReview(entry, `invalid qualityScore.${key}`, 'failure');
    }
  }
  if (typeof q.humanReviewed !== 'boolean') {
    failures.push(`${entry.lexicalEntryId}: qualityScore.humanReviewed must be boolean`);
  }
  if (!Array.isArray(q.issues)) {
    failures.push(`${entry.lexicalEntryId}: qualityScore.issues must be an array`);
  }
  if (!q.humanReviewed) addReview(entry, 'pending human review');
  if (q.issues?.length) addReview(entry, `open quality issues: ${q.issues.join('; ')}`);
}

for (const entry of entries || []) {
  coverage.entries += 1;
  const id = entry.lexicalEntryId;
  if (!id || ids.has(id)) failures.push(`duplicate or missing lexicalEntryId: ${id || '(missing)'}`);
  ids.add(id);

  if (!entry.headword || !hasHangul(entry.headword)) {
    failures.push(`${id}: missing Korean headword`);
    addReview(entry, 'missing Korean headword', 'failure');
  }
  if (!entry.levels?.length) {
    failures.push(`${id}: missing TOPIK level`);
    addReview(entry, 'missing TOPIK level', 'failure');
  }
  if (entry.source) coverage.sources += 1;
  else {
    failures.push(`${id}: missing data source`);
    addReview(entry, 'missing data source', 'failure');
  }

  const pronunciation = entry.pronunciation;
  if (pronunciation?.hangul) coverage.pronunciation += 1;
  if (pronunciation?.romanization) coverage.romanization += 1;
  if (pronunciation?.soundRules?.length) coverage.soundRules += 1;
  if (!pronunciation?.hangul || !pronunciation?.romanization) {
    failures.push(`${id}: missing pronunciation or romanization`);
    addReview(entry, 'missing pronunciation or romanization', 'failure');
  }
  if (!Array.isArray(pronunciation?.soundRules)) failures.push(`${id}: soundRules must be an array`);
  if (pronunciation?.romanization && !hasLatin(pronunciation.romanization)) {
    warnings.push(`${id}: romanization does not contain Latin characters`);
    addReview(entry, 'romanization needs human normalization');
  }
  if (pronunciation?.hangul && !hasHangul(pronunciation.hangul)) {
    warnings.push(`${id}: pronunciation.hangul does not contain Hangul`);
    addReview(entry, 'pronunciation needs human verification');
  }

  if (!Array.isArray(entry.senses) || entry.senses.length === 0) {
    failures.push(`${id}: missing senses`);
    addReview(entry, 'missing senses', 'failure');
  }
  for (const sense of entry.senses || []) {
    coverage.senses += 1;
    if (!sense.senseId || senseIds.has(sense.senseId)) failures.push(`${id}: duplicate or missing senseId ${sense.senseId || '(missing)'}`);
    senseIds.add(sense.senseId);
    if (!sense.glossZh) {
      failures.push(`${id}/${sense.senseId}: missing Chinese gloss`);
      addReview(entry, `${sense.senseId}: missing Chinese gloss`, 'failure');
    }
    if (!Array.isArray(sense.examples)) failures.push(`${id}/${sense.senseId}: examples must be an array`);
    const verifiedExample = sense.examples?.some(example => example.ko && example.zh && example.source && example.verified);
    if (verifiedExample) coverage.examples += 1;
    else {
      warnings.push(`${id}/${sense.senseId}: missing verified Korean/Chinese example pair`);
      addReview(entry, `${sense.senseId}: example needs source and verification`);
    }
    if (!Array.isArray(sense.collocations)) failures.push(`${id}/${sense.senseId}: collocations must be an array`);
    for (const collocation of sense.collocations || []) {
      const level = sense.level || entry.levels?.[0] || 'unknown';
      collocationZhStats.total += 1;
      addCollocationLevel(level, 'total');
      if (collocation.zh) {
        collocationZhStats.withZh += 1;
        addCollocationLevel(level, 'withZh');
      } else {
        collocationZhStats.missingZh += 1;
        addCollocationLevel(level, 'missingZh');
        warnings.push(`${id}/${sense.senseId}/${collocation.collocationId}: missing collocation.zh`);
        addReview(entry, `${sense.senseId}: collocation.zh needs verified phrase meaning`);
      }
      if (collocation.zh && collocation.zh === sense.glossZh && collocation.source !== 'KRDICT_EXACT') {
        collocationZhStats.fallbackToGloss += 1;
        addCollocationLevel(level, 'fallbackToGloss');
        failures.push(`${id}/${sense.senseId}/${collocation.collocationId}: collocation.zh appears to fallback to sense.glossZh`);
        addReview(entry, `${sense.senseId}: collocation.zh fallback to sense.glossZh`, 'failure');
      }
    }
    const verifiedCollocation = sense.collocations?.some(item => item.ko && item.zh && item.source && item.verified);
    if (verifiedCollocation) coverage.collocations += 1;
    else {
      warnings.push(`${id}/${sense.senseId}: missing verified collocation pair`);
      addReview(entry, `${sense.senseId}: collocation needs source and verification`);
    }
  }

  checkQualityScore(entry);
  if (entry.qualityScore?.humanReviewed) coverage.humanReviewed += 1;
  if (entry.verificationStatus === 'approved') {
    if (!entry.qualityScore?.humanReviewed) failures.push(`${id}: approved entries require humanReviewed=true`);
    if (entry.qualityScore?.issues?.length) failures.push(`${id}: approved entries cannot have open quality issues`);
    if (!entry.verifiedAt) failures.push(`${id}: approved entries require verifiedAt`);
  }
}

const report = {
  auditedAt: new Date().toISOString(),
  inputPath,
  strict,
  totals: {
    lexicalEntries: coverage.entries,
    senses: coverage.senses,
    blockingFailures: failures.length,
    warnings: warnings.length,
    reviewQueue: reviewQueue.length
  },
  coverage,
  collocationZh: collocationZhStats,
  expansion: auditRawExpansion(rawPath, entries || []),
  qualityBands: {
    approved: entries.filter(entry => entry.verificationStatus === 'approved').length,
    reviewed: entries.filter(entry => entry.verificationStatus === 'reviewed').length,
    draft: entries.filter(entry => entry.verificationStatus === 'draft').length,
    below90: entries.filter(entry => (entry.qualityScore?.score ?? 0) < 90).length
  },
  reviewSummary: {
    bySeverity: countBy(reviewQueue, item => item.severity),
    byReason: countBy(reviewQueue, item => item.reason),
    bySource: countBy(reviewQueue, item => item.source),
    byLevel: countByLevel(reviewQueue)
  },
  reviewQueue
};

if (reportPath) {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
}

if (failures.length || (strict && warnings.length)) {
  console.error(`FAIL vocabulary quality audit (${inputPath})`);
  if (failures.length) console.error(failures.join('\n'));
  if (strict && warnings.length) console.error(warnings.join('\n'));
  process.exit(1);
}

console.log(`PASS vocabulary quality audit: ${coverage.entries} lexical entries, ${coverage.senses} senses`);
if (warnings.length) console.log(`WARN vocabulary quality audit: ${warnings.length} non-blocking review items`);
if (reportPath) console.log(`WROTE quality report: ${reportPath}`);
