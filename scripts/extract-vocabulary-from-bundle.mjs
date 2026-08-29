import fs from 'node:fs';
import vm from 'node:vm';

const bundlePath = process.argv[2] || 'assets/page-BbjdI8N_.js';
let source = fs.readFileSync(bundlePath, 'utf8');
source = source.replace(/^import[^;]+;import[^;]+;var r=e\(t\(\),1\),/, 'var ');
source = source.slice(0, source.indexOf('function m('));
source += '\nthis.__out={entries:o};';

const context = { console };
vm.createContext(context);
vm.runInContext(source, context);

const legacyEntries = context.__out.entries;
const entries = legacyEntries.map(entry => ({
  lexicalEntryId: `le-${entry.id}`,
  legacyId: entry.id,
  headword: entry.headword,
  homographNo: null,
  partOfSpeech: entry.pos,
  levels: (entry.levels || []).map(level => `TOPIK ${level}`),
  tracks: entry.tracks || [],
  register: entry.register || null,
  pronunciation: {
    hangul: entry.pronunciation || entry.headword,
    romanization: entry.romanization || '',
    soundRules: entry.soundRule ? [entry.soundRule] : [],
    audio: null
  },
  senses: (entry.senses || []).map(sense => ({
    senseId: `se-${sense.id}`,
    legacyId: sense.id,
    glossZh: sense.gloss,
    definitionZh: null,
    usageNote: null,
    examples: sense.exampleKo || sense.exampleZh ? [{
      exampleId: `ex-${sense.id}-1`,
      ko: sense.exampleKo || '',
      zh: sense.exampleZh || '',
      source: entry.source || null,
      verified: Boolean(entry.verifiedAt)
    }] : [],
    collocations: sense.collocation ? [{
      collocationId: `co-${sense.id}-1`,
      ko: sense.collocation,
      zh: '',
      note: null
    }] : [],
    relations: {},
    level: `TOPIK ${sense.level || (entry.levels || [])[0] || ''}`.trim(),
    primary: Boolean(sense.primary)
  })),
  qualityScore: {
    completeness: 0,
    sourceReliability: entry.source === 'KRDICT' ? 0.9 : 0.65,
    humanReviewed: Boolean(entry.verifiedAt),
    issues: [],
    score: 0
  },
  source: entry.source || null,
  verifiedAt: entry.verifiedAt || null,
  verificationStatus: entry.verifiedAt ? 'approved' : 'reviewed'
}));

for (const entry of entries) {
  const fields = [
    entry.headword,
    entry.partOfSpeech,
    entry.levels.length,
    entry.pronunciation.hangul,
    entry.pronunciation.romanization || entry.pronunciation.hangul,
    entry.senses.length,
    entry.source
  ];
  const base = fields.filter(Boolean).length / fields.length;
  const example = entry.senses.filter(sense => sense.examples.length).length / entry.senses.length;
  const collocation = entry.senses.filter(sense => sense.collocations.length).length / entry.senses.length;
  entry.qualityScore.completeness = Number(((base + example + collocation) / 3).toFixed(2));
  entry.qualityScore.score = Math.round(
    (entry.qualityScore.completeness * 0.6
      + entry.qualityScore.sourceReliability * 0.25
      + (entry.qualityScore.humanReviewed ? 0.15 : 0)) * 100
  );
  if (!entry.pronunciation.romanization) entry.qualityScore.issues.push('Romanization needs review.');
}

fs.writeFileSync('data/vocabulary.json', JSON.stringify({
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  pipeline: 'Raw -> Normalize -> Split Sense -> Pronunciation -> Romanization -> Collocation -> Quality Check -> Publish',
  entries
}, null, 2));

fs.writeFileSync('data/vocabulary.raw.json', JSON.stringify({
  schemaVersion: 1,
  source: 'extracted-from-legacy-bundle',
  entries: legacyEntries
}, null, 2));

console.log(`wrote ${entries.length} lexical entries`);
