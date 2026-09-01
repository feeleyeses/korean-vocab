import fs from 'node:fs';
import path from 'node:path';

const rawPath = process.argv[2] || 'data/vocabulary.raw.json';
const reportJsonPath = process.argv[3] || 'artifacts/suspect-headword-report.json';
const reportMdPath = process.argv[4] || 'docs/suspect-headword-report.md';

const particleSuffixes = [
  '에서', '에게', '한테', '부터', '까지',
  '으로', '로', '은', '는', '이', '가', '을', '를', '에', '도', '만'
];

const knownLexicalEndings = new Set([
  '가을', '마을', '아이', '나이', '차이', '같이', '없이', '깊이', '높이',
  '많이', '빨리', '멀리', '달리', '다리', '소리', '자리', '거리', '머리',
  '우리', '요리', '고기', '여기', '저기', '거기', '공기', '인기', '쓰기',
  '읽기', '듣기', '말하기', '되기', '보기', '크기', '시기'
]);

const knownParticlePollution = new Set([
  '꽃이', '밭이', '옷이', '책을', '끝이', '밥을'
]);

const payload = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
const entries = Array.isArray(payload) ? payload : payload.entries || [];
const headwords = new Set(entries.map(entry => entry.headword).filter(Boolean));

function stripParticle(headword) {
  for (const particle of particleSuffixes) {
    if (headword.length <= particle.length) continue;
    if (!headword.endsWith(particle)) continue;
    const base = headword.slice(0, -particle.length);
    if (base && headwords.has(base)) return { particle, base };
  }
  return null;
}

function classify(entry) {
  const headword = String(entry.headword || '').trim();
  const reasons = [];
  let action = 'report_only';
  let suggestedBase = null;

  if (!headword) {
    return { reasons: ['missing_headword'], action: 'needs_review' };
  }

  if (/\s/u.test(headword)) {
    reasons.push('contains_space_or_phrase');
    action = 'needs_review';
  }

  if (!knownLexicalEndings.has(headword)) {
    const particle = stripParticle(headword);
    if (particle) {
      reasons.push(`particle_suffix_${particle.particle}`);
      suggestedBase = particle.base;
      if (knownParticlePollution.has(headword)) action = 'needs_review';
    }
  }

  if (/[~·,，/]/u.test(headword)) {
    reasons.push('contains_non_lexical_separator');
    action = 'needs_review';
  }

  return { reasons, action, suggestedBase };
}

const suspects = [];
let changed = 0;

entries.forEach((entry, index) => {
  const status = entry.verificationStatus || (entry.needsReview ? 'needs_review' : 'approved');
  const result = classify(entry);
  if (!result.reasons.length) return;

  const nextStatus = status === 'approved' && result.action === 'needs_review' ? 'needs_review' : status;
  if (nextStatus !== status) {
    entry.verificationStatus = nextStatus;
    entry.verifiedAt = null;
    changed += 1;
  }

  suspects.push({
    rawIndex: index,
    id: entry.id || entry.lexicalEntryId || null,
    headword: entry.headword || null,
    levels: entry.levels || [entry.level].filter(Boolean),
    partOfSpeech: entry.pos || entry.partOfSpeech || null,
    previousStatus: status,
    status: nextStatus,
    reasons: result.reasons,
    suggestedBase: result.suggestedBase,
    source: entry.source || null
  });
});

const byReason = {};
const byStatus = {};
for (const item of suspects) {
  byStatus[item.status] = (byStatus[item.status] || 0) + 1;
  for (const reason of item.reasons) byReason[reason] = (byReason[reason] || 0) + 1;
}

const report = {
  generatedAt: new Date().toISOString(),
  rawPath,
  totalRawEntries: entries.length,
  suspectCount: suspects.length,
  changedApprovedToNeedsReview: changed,
  currentNeedsReviewSuspects: suspects.filter(item => item.status === 'needs_review').length,
  byReason,
  byStatus,
  suspects
};

fs.mkdirSync(path.dirname(reportJsonPath), { recursive: true });
fs.mkdirSync(path.dirname(reportMdPath), { recursive: true });
fs.writeFileSync(reportJsonPath, `${JSON.stringify(report, null, 2)}\n`);

const mdRows = suspects
  .map(item => `| ${item.headword || ''} | ${(item.levels || []).join(', ')} | ${item.partOfSpeech || ''} | ${item.previousStatus} -> ${item.status} | ${item.reasons.join(', ')} | ${item.suggestedBase || ''} |`)
  .join('\n');

fs.writeFileSync(reportMdPath, `# Suspect Headword Report

- Generated at: ${report.generatedAt}
- Raw entries scanned: ${report.totalRawEntries}
- Suspect headwords: ${report.suspectCount}
- Approved entries moved to needs_review in this run: ${report.changedApprovedToNeedsReview}
- Current suspect headwords in needs_review: ${report.currentNeedsReviewSuspects}

## Reason Summary

${Object.entries(byReason).map(([key, value]) => `- ${key}: ${value}`).join('\n') || '- None'}

## Suspects

| Headword | TOPIK | POS | Status | Reason | Suggested base |
| --- | --- | --- | --- | --- | --- |
${mdRows || '| None |  |  |  |  |  |'}
`);

if (!Array.isArray(payload)) {
  fs.writeFileSync(rawPath, `${JSON.stringify({ ...payload, entries }, null, 2)}\n`);
} else {
  fs.writeFileSync(rawPath, `${JSON.stringify(entries, null, 2)}\n`);
}

console.log(`WROTE ${reportJsonPath}`);
console.log(`WROTE ${reportMdPath}`);
console.log(`PASS suspect headword scan: ${suspects.length} suspects, ${changed} approved entries moved to needs_review`);
