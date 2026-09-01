import fs from 'node:fs';

const API_URL = 'https://krdict.korean.go.kr/api/search';
const args = process.argv.slice(2);
const arg = (name, fallback = null) => {
  const prefix = `--${name}=`;
  const hit = args.find(item => item.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : fallback;
};

const key = arg('key', process.env.KRDICT_API_KEY);
const outPath = arg('out', 'artifacts/krdict-headword-candidates.txt');
const reportPath = arg('report', 'artifacts/krdict-headword-candidates-report.json');
const limit = Number(arg('limit', '800'));
const delayMs = Number(arg('delay-ms', '40'));
const grades = new Set(arg('grades', '중급,고급').split(',').map(item => item.trim()).filter(Boolean));
const prefixes = arg('prefixes', '가,거,고,구,기,나,내,다,대,도,동,마,문,바,방,보,사,상,생,서,성,시,신,아,안,어,여,연,영,오,우,원,유,이,인,자,전,정,제,조,주,지,차,최,통,하,해,현,화')
  .split(',')
  .map(item => item.trim())
  .filter(Boolean);

if (!key) {
  console.error('Missing KRDict key. Use --key=... or KRDICT_API_KEY=...');
  process.exit(2);
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const decodeXml = (value = '') => value
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .trim();
const tags = (xml, tag) => {
  const out = [];
  const pattern = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'g');
  for (const match of xml.matchAll(pattern)) out.push(decodeXml(match[1]));
  return out;
};
const tag = (xml, name) => tags(xml, name)[0] || '';

function parseItems(xml) {
  return tags(xml, 'item').map(item => ({
    word: tag(item, 'word').replace(/\^/g, ' '),
    wordGrade: tag(item, 'word_grade'),
    pos: tag(item, 'pos'),
    translations: tags(item, 'translation').map(translation => ({
      word: tag(translation, 'trans_word'),
      definition: tag(translation, 'trans_dfn')
    })).filter(translation => translation.word || translation.definition)
  }));
}

async function searchPrefix(prefix, start = 1) {
  const url = new URL(API_URL);
  url.searchParams.set('key', key);
  url.searchParams.set('q', prefix);
  url.searchParams.set('start', String(start));
  url.searchParams.set('num', '100');
  url.searchParams.set('translated', 'y');
  url.searchParams.set('trans_lang', '11');
  const response = await fetch(url);
  const xml = await response.text();
  const apiError = tag(xml, 'error_code');
  if (!response.ok || apiError) return { error: apiError || `HTTP_${response.status}`, items: [] };
  return { total: Number(tag(xml, 'total')) || 0, items: parseItems(xml) };
}

const seen = new Set();
const rows = [];
const prefixReports = [];

for (const prefix of prefixes) {
  for (const start of [1, 101, 201]) {
    if (rows.length >= limit) break;
    const result = await searchPrefix(prefix, start);
    prefixReports.push({ prefix, start, total: result.total || 0, items: result.items?.length || 0, error: result.error || '' });
    for (const item of result.items || []) {
      if (rows.length >= limit) break;
      if (!item.word || item.word.includes(' ') || item.word.includes('-')) continue;
      if (item.word.length < 2) continue;
      if (!grades.has(item.wordGrade)) continue;
      if (!item.pos || !item.translations.length) continue;
      if (seen.has(item.word)) continue;
      seen.add(item.word);
      rows.push(item.word);
    }
    if (delayMs > 0) await sleep(delayMs);
  }
}

fs.mkdirSync(outPath.replace(/[\\/][^\\/]+$/, ''), { recursive: true });
fs.writeFileSync(outPath, `${rows.join('\n')}\n`);
fs.writeFileSync(reportPath, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  source: 'KRDict Open API search candidates',
  rules: {
    translated: true,
    transLang: 'Chinese',
    grades: [...grades],
    wordOnly: true,
    noSpaces: true,
    requiresPartOfSpeech: true,
    requiresChineseTranslation: true
  },
  requestedLimit: limit,
  candidateCount: rows.length,
  prefixes: prefixReports
}, null, 2)}\n`);

console.log(JSON.stringify({ candidates: rows.length, outPath, reportPath }, null, 2));
