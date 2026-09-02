const { chromium } = require('playwright');
const fs = require('fs');

const url = process.argv[2] || 'http://127.0.0.1:4173/';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const vocabulary = JSON.parse(fs.readFileSync('data/vocabulary.json', 'utf8')).entries;

function idsBeforeHeadword(level, headword) {
  const entries = vocabulary
    .filter(entry => (entry.levels || []).map(String).some(v => v.includes(String(level))));
  const index = entries.findIndex(entry => entry.headword === headword);
  return index > 0
    ? entries
      .slice(0, index)
      .flatMap(entry => [entry.legacyId, entry.lexicalEntryId].filter(Boolean))
    : [];
}

(async () => {
const browser = await chromium.launch({ headless: true, executablePath });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const failures = [];
const pass = {};
const check = (name, ok, detail = '') => {
  pass[name] = Boolean(ok);
  if (!ok) failures.push(`${name}: ${detail}`);
};
const text = locator => locator.textContent().then(s => (s || '').replace(/\s+/g, ' ').trim()).catch(() => '');

await page.addInitScript(() => {
  if (localStorage.getItem('kwf:testPrepared')) return;
  localStorage.clear();
  localStorage.setItem('kwf:testPrepared', '1');
  const now = new Date(Date.now() - 86400000).toISOString();
  const due = new Date(Date.now() - 3600000).toISOString();
  const records = [
    ['ko-같다-013-s1', 'ko-같다-013', 'fuzzy'],
    ['ko-잡다-607-s1', 'ko-잡다-607', 'forgot'],
    ['ko-보다-059-s1', 'ko-보다-059', 'fuzzy'],
    ['ko-마음-049-s1', 'ko-마음-049', 'remember']
  ];
  for (const [senseId, wordId, rating] of records) {
    localStorage.setItem(`memory:${senseId}`, JSON.stringify({
      wordId,
      senseId,
      rating,
      reviewedAt: now,
      dueAt: due,
      stability: 1,
      difficulty: 5,
      lapses: rating === 'forgot' ? 1 : 0
    }));
  }
  localStorage.setItem('kwf:profile', JSON.stringify({ unlockedLevel: 6, learnedIds: records.map(r => r[1]), stats: { learned: 4, newCount: 0, reviewCount: 0, streak: 1, lastStudyDate: '' } }));
});

page.on('pageerror', error => {
  const msg = error.message || String(error);
  if (!msg.includes('Minified React error #418')) failures.push(`pageerror: ${msg}`);
});

await page.goto(`${url}?poly=${Date.now()}`, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForFunction(() => window.__KWF_LAYOUT_SYSTEM_READY__ === true, null, { timeout: 15000 });

async function selectTopik(level) {
  await page.locator('.level-selector button').filter({ hasText: `TOPIK ${level}` }).first().click();
  await page.waitForTimeout(250);
}

async function revealCurrent() {
  const direct = page.getByRole('button', { name: '直接看答案', exact: true }).first();
  await direct.click();
  await page.waitForTimeout(450);
}

async function measureReveal(expectedWord) {
  const card = page.locator('#study-card');
  const body = await text(card);
  const metrics = await card.evaluate(card => {
    const knowledge = card.querySelector('.kwf-card-v3-knowledge');
    const cont = card.querySelector('.kwf-card-v3-continue');
    const coll = [...card.querySelectorAll('.kwf-card-v3-block')].find(el => el.textContent.includes('固定搭配'));
    const example = [...card.querySelectorAll('.kwf-card-v3-block')].find(el => el.textContent.includes('例句'));
    const krSentence = example ? [...example.querySelectorAll('p')].map(p => p.textContent.trim()).find(v => /[\uac00-\ud7a3]/u.test(v)) || '' : '';
    return {
      knowledgeOverflowY: knowledge ? getComputedStyle(knowledge).overflowY : '',
      knowledgeHasScrollableOverflow: knowledge ? knowledge.scrollHeight > knowledge.clientHeight + 2 : false,
      collocationVisible: !!coll && !!coll.getBoundingClientRect().height,
      collocationNotBehindContinue: !!coll && !!cont && coll.getBoundingClientRect().bottom <= cont.getBoundingClientRect().top,
      continueVisible: !!cont && cont.getBoundingClientRect().height > 30,
      exampleKo: krSentence
    };
  });
  return { body, metrics, expectedWord };
}

for (const target of ['고등학교', '교통사고']) {
  const entry = vocabulary.find(entry => entry.headword === target);
  const firstExample = entry?.senses?.[0]?.examples?.[0]?.ko || '';
  check(`${target}-raw-definition-example-detected`, /또는|기관|시설|직위|사람|학교|사고/u.test(firstExample), JSON.stringify({ target, firstExample }));
}
await selectTopik(1);
await page.evaluate(() => document.querySelector('#study')?.scrollIntoView({ block: 'start' }));
await page.waitForTimeout(500);
await revealCurrent();
const currentReveal = await measureReveal('current');
check('reveal-no-fake-example', !currentReveal.metrics.exampleKo || !/또는|기관|시설|직위|사람/u.test(currentReveal.metrics.exampleKo), JSON.stringify(currentReveal.metrics));
check('reveal-collocation-safe', currentReveal.metrics.collocationVisible && currentReveal.metrics.collocationNotBehindContinue && currentReveal.metrics.continueVisible, JSON.stringify(currentReveal.metrics));

await page.evaluate(() => {
  const now = new Date(Date.now() - 86400000).toISOString();
  const due = new Date(Date.now() - 3600000).toISOString();
  const records = [
    ['ko-같다-013-s1', 'ko-같다-013', 'fuzzy'],
    ['ko-잡다-607-s1', 'ko-잡다-607', 'forgot'],
    ['ko-보다-059-s1', 'ko-보다-059', 'fuzzy'],
    ['ko-마음-049-s1', 'ko-마음-049', 'remember']
  ];
  for (const [senseId, wordId, rating] of records) {
    localStorage.setItem(`memory:${senseId}`, JSON.stringify({
      wordId,
      senseId,
      rating,
      reviewedAt: now,
      dueAt: due,
      stability: 1,
      difficulty: 5,
      lapses: rating === 'forgot' ? 1 : 0
    }));
  }
  localStorage.setItem('kwf:profile', JSON.stringify({ unlockedLevel: 6, learnedIds: records.map(r => r[1]), stats: { learned: 4, newCount: 0, reviewCount: 0, streak: 1, lastStudyDate: '' } }));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__KWF_LAYOUT_SYSTEM_READY__ === true, null, { timeout: 15000 });

await page.locator('.mobile-tabbar').getByText('复习', { exact: true }).click();
await page.waitForTimeout(200);
const menuItems = await page.locator('.kwf-mobile-review-menu button').allTextContents();
check('review-menu-six', ['复习·今日到期','复习·全量库','复习·急救包','复习·单个释义','复习·整词多选','复习·音变专项'].every(item => menuItems.includes(item)), menuItems.join('|'));
const close = page.locator('.kwf-mobile-review-close');
const closeRect = await close.boundingBox();
check('review-menu-close-centered', !!closeRect && Math.abs((closeRect.x + closeRect.width / 2) - 195) < 12, JSON.stringify(closeRect));

async function polyWordsVia(buttonName, count) {
  if (/复习/.test(buttonName)) {
    await page.locator('.mobile-tabbar').getByText('复习', { exact: true }).click();
    await page.waitForTimeout(180);
    const menuLabel = buttonName.includes('单') ? '复习·单个释义' : buttonName.includes('整词') ? '复习·整词多选' : buttonName.replace('复习', '复习·');
    await page.locator('.kwf-mobile-review-menu button').filter({ hasText: menuLabel }).first().click();
  } else {
    await page.locator('.mobile-tabbar').getByText('多义', { exact: true }).click();
    await page.waitForTimeout(250);
    const button = page.getByRole('button', { name: new RegExp(buttonName) }).first();
    await button.click();
  }
  await page.waitForTimeout(400);
  const words = [];
  const submittedStates = [];
  for (let i = 0; i < count; i += 1) {
    const word = await text(page.locator('#poly-trainer h3').first());
    words.push(word);
    submittedStates.push(await page.getByText('本词释义结果').isVisible().catch(() => false));
    const choices = await page.locator('#poly-trainer .poly-choices button').all();
    if (!choices.length) break;
    await choices[0].click();
    await page.waitForTimeout(80);
    await page.getByRole('button', { name: /提交所选释义|已记录到复习档案/ }).first().click();
    await page.waitForTimeout(200);
    const next = page.getByRole('button', { name: /下一题/ }).first();
    if (await next.isVisible().catch(() => false)) {
      await next.click();
      await page.waitForTimeout(300);
    } else {
      break;
    }
  }
  return { words, submittedStates };
}

const learnPoly = await polyWordsVia('学习新多义', 3);
check('poly-learn-three-distinct', new Set(learnPoly.words).size >= 3 && !learnPoly.words.every(w => w === '잡다'), JSON.stringify(learnPoly));
check('poly-learn-state-reset', learnPoly.submittedStates.slice(1).every(v => v === false), JSON.stringify(learnPoly));

const singlePoly = await polyWordsVia('复习单释义', 3);
check('poly-single-not-fixed', new Set(singlePoly.words).size >= 2 && !singlePoly.words.every(w => w === '같다' || w === '잡다'), JSON.stringify(singlePoly));
check('poly-single-state-reset', singlePoly.submittedStates.slice(1).every(v => v === false), JSON.stringify(singlePoly));

const multiPoly = await polyWordsVia('复习整词', 3);
check('poly-multi-not-fixed', new Set(multiPoly.words).size >= 2 && !multiPoly.words.every(w => w === '같다' || w === '잡다'), JSON.stringify(multiPoly));
check('poly-multi-state-reset', multiPoly.submittedStates.slice(1).every(v => v === false), JSON.stringify(multiPoly));

await page.evaluate(() => {
  const reference = document.querySelector('#poly-reference');
  if (reference && !reference.open) reference.querySelector('summary')?.click();
});
await page.waitForTimeout(200);
const mobileMetrics = await page.evaluate(() => {
  const reviewActions = [...document.querySelectorAll('#study-card .kwf-card-v3-review-actions button')].map(el => el.getBoundingClientRect());
  const polyReviewButtons = [...document.querySelectorAll('#poly-reference .kwf-poly-ref-bottom button')]
    .filter(el => /复习单释义|复习整词/.test(el.textContent || ''))
    .map(el => el.getBoundingClientRect());
  return {
    reviewButtonSafe: reviewActions.every(r => r.left >= 30 && r.right <= innerWidth - 30),
    polyButtonsSameRow: polyReviewButtons.length >= 2 && Math.abs(polyReviewButtons[0].top - polyReviewButtons[1].top) < 4,
    bodyOverflowX: document.documentElement.scrollWidth - innerWidth
  };
});
check('mobile-review-options-safe', mobileMetrics.reviewButtonSafe, JSON.stringify(mobileMetrics));
check('mobile-poly-actions-same-row', mobileMetrics.polyButtonsSameRow, JSON.stringify(mobileMetrics));
check('mobile-no-x-overflow', mobileMetrics.bodyOverflowX <= 1, JSON.stringify(mobileMetrics));

const data = await page.evaluate(async () => {
  const json = await fetch('data/vocabulary.json', { cache: 'no-store' }).then(r => r.json());
  return { count: json.entries.length, badStatus: json.entries.some(e => e.status && e.status !== 'approved') };
});
check('published-only-approved', data.count > 0 && !data.badStatus, JSON.stringify(data));

console.log(JSON.stringify({ pass, failures }, null, 2));
await browser.close();
if (failures.length) process.exit(1);
})().catch(error => {
  console.error(error);
  process.exit(1);
});
