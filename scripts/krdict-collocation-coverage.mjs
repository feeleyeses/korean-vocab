import fs from 'node:fs';
import path from 'node:path';

const API_URL = 'https://krdict.korean.go.kr/api/search';
const CHINESE_TRANSLATION_LANG = '11';
const MIN_NUM = 10;

function arg(name, fallback = null) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((item) => item.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : fallback;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function decodeXml(value = '') {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function tags(xml, tag) {
  const out = [];
  const pattern = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'g');
  for (const match of xml.matchAll(pattern)) out.push(decodeXml(match[1]));
  return out;
}

function tag(xml, name) {
  return tags(xml, name)[0] || '';
}

function parseItems(xml) {
  return tags(xml, 'item').map((item) => ({
    targetCode: tag(item, 'target_code'),
    word: tag(item, 'word'),
    link: tag(item, 'link'),
    translations: tags(item, 'translation').map((translation) => ({
      lang: tag(translation, 'trans_lang').replace(/\s+/g, ''),
      word: tag(translation, 'trans_word'),
      definition: tag(translation, 'trans_dfn')
    })).filter((translation) => translation.word || translation.definition)
  }));
}

function normalizeKo(value = '') {
  return value.replace(/\s+/g, ' ').trim();
}

function collectCollocations(vocabulary) {
  const rows = [];
  for (const entry of vocabulary.entries || []) {
    for (const sense of entry.senses || []) {
      for (const collocation of sense.collocations || []) {
        if (!collocation.ko) continue;
        rows.push({
          lexicalEntryId: entry.lexicalEntryId,
          legacyId: entry.legacyId,
          headword: entry.headword,
          levels: entry.levels || [],
          senseId: sense.senseId,
          senseGlossZh: sense.glossZh,
          collocationId: collocation.collocationId,
          ko: normalizeKo(collocation.ko),
          currentZh: collocation.zh || '',
          source: collocation.source || '',
          verified: Boolean(collocation.verified)
        });
      }
    }
  }
  return rows;
}

function seededShuffle(items, seed) {
  let state = seed >>> 0;
  const next = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
  return [...items].sort(() => next() - 0.5);
}

function classify(row, result) {
  if (result.error) return 'manual';
  if (!result.items.length) return 'unavailable';

  const exact = result.items.filter((item) => normalizeKo(item.word) === row.ko);
  if (!exact.length) return 'manual';

  const zhExact = exact.filter((item) => item.translations.some((translation) => translation.word || translation.definition));
  if (zhExact.length === 1) return 'auto';
  return 'manual';
}

function suggestedZh(result, ko) {
  const exact = result.items.find((item) => normalizeKo(item.word) === ko);
  const translation = exact?.translations.find((item) => item.word || item.definition);
  return translation?.word || translation?.definition || '';
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function queryKrdict(key, q, timeoutMs) {
  const url = new URL(API_URL);
  url.searchParams.set('key', key);
  url.searchParams.set('q', q);
  url.searchParams.set('num', String(MIN_NUM));
  url.searchParams.set('translated', 'y');
  url.searchParams.set('trans_lang', CHINESE_TRANSLATION_LANG);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    const text = await response.text();
    const apiError = tag(text, 'error_code');
    if (!response.ok || apiError) {
      return {
        ok: false,
        status: response.status,
        error: apiError || `HTTP_${response.status}`,
        message: tag(text, 'message'),
        items: []
      };
    }
    return {
      ok: true,
      status: response.status,
      total: Number(tag(text, 'total') || 0),
      items: parseItems(text)
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.name || 'FetchError',
      message: error.message,
      items: []
    };
  } finally {
    clearTimeout(timer);
  }
}

function summarize(results) {
  const byClass = { auto: 0, unavailable: 0, manual: 0 };
  const byTopik = {};
  for (const row of results) {
    byClass[row.classification] += 1;
    const level = row.levels?.[0] ?? 'unknown';
    byTopik[level] ||= { total: 0, auto: 0, unavailable: 0, manual: 0 };
    byTopik[level].total += 1;
    byTopik[level][row.classification] += 1;
  }
  return { total: results.length, ...byClass, byTopik };
}

function pct(count, total) {
  return total ? `${((count / total) * 100).toFixed(1)}%` : '0.0%';
}

function markdown(report) {
  const lines = [];
  lines.push('# KRDict Collocation Coverage Report');
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Mode: ${report.mode}`);
  lines.push(`Source: ${report.source}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Total checked: ${report.summary.total}`);
  lines.push(`- Auto-completable: ${report.summary.auto} (${pct(report.summary.auto, report.summary.total)})`);
  lines.push(`- Not found / unavailable: ${report.summary.unavailable} (${pct(report.summary.unavailable, report.summary.total)})`);
  lines.push(`- Needs manual completion: ${report.summary.manual} (${pct(report.summary.manual, report.summary.total)})`);
  lines.push('');
  lines.push('## By TOPIK Level');
  lines.push('');
  lines.push('| TOPIK | Total | Auto | Unavailable | Manual |');
  lines.push('|---|---:|---:|---:|---:|');
  for (const [level, row] of Object.entries(report.summary.byTopik).sort((a, b) => Number(a[0]) - Number(b[0]))) {
    lines.push(`| ${level} | ${row.total} | ${row.auto} | ${row.unavailable} | ${row.manual} |`);
  }
  lines.push('');
  lines.push('## Random Samples');
  lines.push('');
  lines.push('| Class | Headword | Collocation | Current zh | KRDict zh | KRDict word |');
  lines.push('|---|---|---|---|---|---|');
  for (const row of report.samples) {
    lines.push(`| ${row.classification} | ${row.headword} | ${row.ko} | ${row.currentZh || ''} | ${row.krdictZh || ''} | ${row.krdictWord || ''} |`);
  }
  lines.push('');
  lines.push('## Notes');
  lines.push('');
  lines.push('- Auto-completable means exactly one KRDict result matched the full collocation text and included a Chinese translation.');
  lines.push('- Needs manual completion means KRDict returned an API error, ambiguous candidates, a non-exact match, or no Chinese translation on the exact match.');
  lines.push('- This script is read-only and does not modify vocabulary data.');
  return `${lines.join('\n')}\n`;
}

async function main() {
  const key = arg('key', process.env.KRDICT_API_KEY);
  if (!key) {
    console.error('Missing KRDict key. Use --key=... or KRDICT_API_KEY=...');
    process.exit(2);
  }

  const input = arg('input', 'data/vocabulary.json');
  const outDir = arg('out-dir', 'artifacts');
  const sampleSize = Number(arg('sample', '0'));
  const seed = Number(arg('seed', '20260830'));
  const delayMs = Number(arg('delay-ms', '120'));
  const timeoutMs = Number(arg('timeout-ms', '12000'));
  const limit = Number(arg('limit', '0'));

  const vocabulary = JSON.parse(fs.readFileSync(input, 'utf8'));
  let rows = collectCollocations(vocabulary);
  const allCount = rows.length;
  let mode = 'full';
  if (sampleSize > 0) {
    rows = seededShuffle(rows, seed).slice(0, sampleSize);
    mode = `sample:${sampleSize}`;
  }
  if (limit > 0) {
    rows = rows.slice(0, limit);
    mode = `${mode}:limit:${limit}`;
  }

  fs.mkdirSync(outDir, { recursive: true });
  const results = [];
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const result = await queryKrdict(key, row.ko, timeoutMs);
    const classification = classify(row, result);
    const exact = result.items.find((item) => normalizeKo(item.word) === row.ko);
    results.push({
      ...row,
      classification,
      krdictTotal: result.total || result.items.length,
      krdictWord: exact?.word || result.items[0]?.word || '',
      krdictZh: suggestedZh(result, row.ko),
      krdictLink: exact?.link || result.items[0]?.link || '',
      apiError: result.error || '',
      apiMessage: result.message || ''
    });
    if (!hasFlag('quiet') && ((index + 1) % 25 === 0 || index + 1 === rows.length)) {
      console.log(`Checked ${index + 1}/${rows.length}`);
    }
    if (delayMs > 0 && index + 1 < rows.length) await sleep(delayMs);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    source: input,
    mode,
    totalCollocationsInSource: allCount,
    checked: rows.length,
    summary: summarize(results),
    samples: seededShuffle(results, seed + 1).slice(0, 12),
    results
  };

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(outDir, `krdict-collocation-coverage-${stamp}.json`);
  const mdPath = path.join(outDir, `krdict-collocation-coverage-${stamp}.md`);
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(mdPath, markdown(report));
  console.log(`WROTE ${jsonPath}`);
  console.log(`WROTE ${mdPath}`);
  console.log(JSON.stringify(report.summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
