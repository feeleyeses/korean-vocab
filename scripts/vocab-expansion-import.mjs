import fs from 'node:fs';
import path from 'node:path';

const API_URL = 'https://krdict.korean.go.kr/api/search';
const CHINESE_TRANSLATION_LANG = '11';
const TOPIK_I_SOURCE_URL = 'https://learning-korean.com/DL/TOPIK-I-1671.pdf';
const BATCH_ID = '2026-09-01-topik12-expansion-bulk';

const args = process.argv.slice(2);
const arg = (name, fallback = null) => {
  const prefix = `--${name}=`;
  const hit = args.find(item => item.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : fallback;
};

const key = arg('key', process.env.KRDICT_API_KEY);
const rawPath = arg('raw', 'data/vocabulary.raw.json');
const outPath = arg('out', 'artifacts/vocabulary-expansion-import-report.json');
const candidatePath = arg('candidates', '');
const status = arg('status', 'draft');
const limit = Number(arg('limit', '120'));
const delayMs = Number(arg('delay-ms', '80'));
const timeoutMs = Number(arg('timeout-ms', '12000'));

if (!key) {
  console.error('Missing KRDict key. Use --key=... or KRDICT_API_KEY=...');
  process.exit(2);
}

const fallbackCandidates = `결과 결정 결정하다 결혼 결혼식 결혼하다 경기 경기장 경복궁 경주 경찰 경찰관 경찰서 경치 경험 계단 계란 계산하다 계시다 계절 계획 고기 고등학교 고등학생 고르다 고마웠습니다 고맙습니다 고모 고모부 고속버스 고양이 고장 고추 고추장 고치다 고프다 고향 곧 골목 골프 곱다 곳 공 공간 공기 공무원 공부하다 공연 공중전화 공짜 공책 공휴일 과 과거 과자 과학 관계 관광하다 관심 광고 괜찮습니다 교과서 교수 교체 교통 교통사고 교회 구 구경하다 구십 구월 구하다 국 국내 국립 국수 국어 국적 국제 군인 굽다 권 귀 규칙 그 그거 그것 그곳 그날 그냥 그동안 그들 그때 그래 그래서 그램 그러나 그러니까 그러면 그런 그런데 그럼 그렇게 그렇구나 그렇다 그렇습니다 그렇지만 그리고 그리다 그만 그분 그저께 그중 그쪽 그치다 극장 근처 글 글쎄요 금방 금연 금요일 금주 급 급하다 기간 기르다 기름 기분 기뻐하다 기사 기숙사 기억하다 기온 기자 기침 기타 긴장되다 길다 김 김밥 김치찌개 김포공항 까만색 까맣다 깎다 깜짝 깨다 깨지다 꺼내다 껌 꼭 꽃 꽃집 꾸다 꿈 끄다 끓이다 끝 끝내다 끼다 나 나가다 나누다 나다 나빠지다 나오다 나타나다 나흘 낚시 날 남 남기다 남녀 남대문시장 남동생 남미 남북 남쪽 남편 남학생 낮 낮다 내 내가 내과 내년 내다 내려가다 내려오다 내리다 내용 냄비 냄새 냉면 냉장고 너 너무 넓다 넘다 넘어지다 넣다 네 넥타이 넷 넷째 년 노란색 노랗다 노래 노래방 노래하다 노력하다 노트 녹색 녹차 놀다 놀라다 농구 높다 놓다 누가 누구 누나 누르다 눈 눈물 눕다 뉴스 느끼다 느낌 느리다 늘 늘다 능력 늦다 다 다녀오다 다니다 다르다 다른 다리 다섯 다섯째 다시 다음 다음달 다음주 다음해 다이어트 다치다 닦다 단어 단점 닫다 닫히다 달 달걀 달다 달러 달력 담배 담배꽁초 답 답장하다 당근 당신 대 대구 대답 대답하다 대로 대사관 대부분 대학교 대학생 대학원 대한항공 대한민국 대화 댁 더 덕분 덥다 덮다 데리다 데이트 도로 도서관 도시 도와주다`.split(/\s+/);

const candidates = candidatePath
  ? fs.readFileSync(candidatePath, 'utf8').split(/\s+/).filter(Boolean)
  : fallbackCandidates;

const initial = ['g','kk','n','d','tt','r','m','b','pp','s','ss','','j','jj','ch','k','t','p','h'];
const vowel = ['a','ae','ya','yae','eo','e','yeo','ye','o','wa','wae','oe','yo','u','wo','we','wi','yu','eu','ui','i'];
const final = ['', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k', 'm', 'p', 'l', 'l', 'p', 'l', 'm', 'p', 'p', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 't'];

function romanize(value = '') {
  return [...value].map(char => {
    const code = char.charCodeAt(0);
    if (code < 0xac00 || code > 0xd7a3) return char;
    const offset = code - 0xac00;
    const l = Math.floor(offset / 588);
    const v = Math.floor((offset % 588) / 28);
    const t = offset % 28;
    return `${initial[l]}${vowel[v]}${final[t]}`;
  }).join('-').replace(/-+/g, '-').replace(/^-|-$/g, '');
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

const tag = (xml, name) => tags(xml, name)[0] || '';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function parseItems(xml) {
  return tags(xml, 'item').map(item => ({
    targetCode: tag(item, 'target_code'),
    word: tag(item, 'word').replace(/\^/g, ' '),
    pronunciation: tag(item, 'pronunciation').replace(/\^/g, ' '),
    wordGrade: tag(item, 'word_grade'),
    pos: tag(item, 'pos'),
    link: tag(item, 'link'),
    translations: tags(item, 'translation').map(translation => ({
      word: tag(translation, 'trans_word'),
      definition: tag(translation, 'trans_dfn')
    })).filter(translation => translation.word || translation.definition)
  }));
}

async function queryKrdict(q) {
  const url = new URL(API_URL);
  url.searchParams.set('key', key);
  url.searchParams.set('q', q);
  url.searchParams.set('num', '10');
  url.searchParams.set('translated', 'y');
  url.searchParams.set('trans_lang', CHINESE_TRANSLATION_LANG);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    const text = await response.text();
    const apiError = tag(text, 'error_code');
    if (!response.ok || apiError) return { error: apiError || `HTTP_${response.status}`, items: [] };
    return { items: parseItems(text) };
  } catch (error) {
    return { error: error.name || 'FetchError', items: [] };
  } finally {
    clearTimeout(timer);
  }
}

function makeEntry(row, idSequence, batchOrdinal) {
  const level = batchOrdinal <= Math.ceil(limit * 0.67) ? 1 : 2;
  const id = `exp-ti-${String(idSequence).padStart(3, '0')}`;
  const translation = row.translations[0];
  return {
    id,
    headword: row.word,
    pronunciation: row.pronunciation || row.word,
    romanization: romanize(row.pronunciation || row.word),
    pos: row.pos || 'unknown',
    levels: [level],
    tracks: ['TOPIK', 'expansion'],
    register: '中性',
    source: status === 'approved' ? 'TOPIK_I_1671 + KRDICT_EXACT_HEADWORD + AUTO_APPROVED' : 'TOPIK_I_1671 + KRDICT_EXACT_HEADWORD',
    sourceUrl: TOPIK_I_SOURCE_URL,
    krdictTargetCode: row.targetCode,
    krdictLink: row.link,
    expansionBatch: BATCH_ID,
    levelAssignment: 'TOPIK_I_ORDER_HEURISTIC_NEEDS_REVIEW',
    verificationStatus: status,
    verifiedAt: status === 'approved' ? new Date().toISOString() : null,
    senses: [{
      id: `${id}-s1`,
      gloss: translation.word || translation.definition,
      glossZh: translation.word || translation.definition,
      definitionZh: translation.definition || translation.word || '',
      exampleKo: '',
      exampleZh: '',
      collocation: '',
      level,
      primary: true
    }]
  };
}

const rawPayload = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
const rawEntries = Array.isArray(rawPayload) ? rawPayload : rawPayload.entries;
const existingHeadwords = new Set(rawEntries.map(entry => entry.headword));
const existingIds = new Set(rawEntries.map(entry => entry.id).filter(Boolean));
const nextExpansionNumber = rawEntries.reduce((max, entry) => {
  const match = /^exp-ti-(\d+)$/u.exec(entry.id || '');
  return match ? Math.max(max, Number(match[1])) : max;
}, 0) + 1;
const uniqueCandidates = [...new Set(candidates)].filter(word => !existingHeadwords.has(word));
const imported = [];
const skipped = [];

for (const word of uniqueCandidates) {
  if (imported.length >= limit) break;
  const result = await queryKrdict(word);
  if (result.error) {
    skipped.push({ word, reason: result.error });
  } else {
    const exact = result.items.filter(item => item.word === word && item.translations.length);
    if (exact.length === 1) {
      const entry = makeEntry(exact[0], nextExpansionNumber + imported.length, imported.length + 1);
      if (!existingIds.has(entry.id)) {
        rawEntries.push(entry);
        existingIds.add(entry.id);
        existingHeadwords.add(entry.headword);
        imported.push({ id: entry.id, headword: entry.headword, level: `TOPIK-${entry.levels[0]}`, glossZh: entry.senses[0].gloss, source: entry.source });
      } else {
        skipped.push({ word, reason: `duplicate generated id ${entry.id}` });
      }
    } else {
      skipped.push({ word, reason: exact.length ? 'ambiguous exact KRDict matches' : 'no exact KRDict Chinese translation' });
    }
  }
  if (delayMs > 0) await sleep(delayMs);
}

fs.writeFileSync(rawPath, `${JSON.stringify(rawPayload, null, 2)}\n`);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
const report = {
  generatedAt: new Date().toISOString(),
  batchId: BATCH_ID,
  sourceUrl: TOPIK_I_SOURCE_URL,
  requestedLimit: limit,
  importedCount: imported.length,
  skippedCount: skipped.length,
  imported,
  skipped
};
fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ imported: imported.length, skipped: skipped.length, outPath }, null, 2));
