const { chromium } = require('playwright');
const fs = require('fs');

const url = process.argv[2] || 'http://127.0.0.1:4173/';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const vocabulary = JSON.parse(fs.readFileSync('data/vocabulary.json', 'utf8')).entries;

const idVariants = entry => [entry?.legacyId, entry?.lexicalEntryId].filter(Boolean);
const primaryId = entry => entry?.legacyId || entry?.lexicalEntryId;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function entriesForLevel(level) {
  return vocabulary.filter(entry => (entry.levels || []).some(v => String(v).includes(String(level))));
}

function learnedIdsBefore(headword) {
  const entry = vocabulary.find(e => e.headword === headword);
  const level = Number(String(entry?.levels?.[0] || '1').replace(/\D/g, '')) || 1;
  const list = entriesForLevel(level);
  const index = list.findIndex(e => e.headword === headword);
  return {
    level,
    ids: index > 0 ? list.slice(0, index).flatMap(idVariants) : []
  };
}

function seedPolyRecords() {
  const now = new Date(Date.now() - 86400000).toISOString();
  const due = new Date(Date.now() - 3600000).toISOString();
  const targets = ['같다', '잡다', '보다', '마음', '먹다', '쓰다', '가다', '걸다', '나오다', '넣다'];
  const records = [];
  for (const headword of targets) {
    const entry = vocabulary.find(e => e.headword === headword);
    if (!entry) continue;
    for (const sense of (entry.senses || []).slice(0, 2)) {
      records.push({
        wordId: primaryId(entry),
        senseId: sense.legacyId || sense.senseId,
        rating: records.length % 3 === 0 ? 'forgot' : 'fuzzy',
        reviewedAt: now,
        dueAt: due,
        stability: 1,
        difficulty: 5,
        lapses: 1
      });
    }
  }
  return records;
}

async function newPage(browser, init, initArg) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on('pageerror', error => {
    const msg = error.message || String(error);
    if (!msg.includes('Minified React error #418')) console.error('pageerror', msg);
  });
  await page.addInitScript(init || (() => localStorage.clear()), initArg);
  await page.goto(`${url}?specific=${Date.now()}-${Math.random()}`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(() => window.__KWF_LAYOUT_SYSTEM_READY__ === true, null, { timeout: 15000 });
  return page;
}

const text = locator => locator.textContent().then(s => (s || '').replace(/\s+/g, ' ').trim()).catch(() => '');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath });
  const pass = {};
  const details = {};
  const failures = [];
  const check = (name, ok, detail = '') => {
    pass[name] = Boolean(ok);
    if (!ok) failures.push(`${name}: ${detail}`);
  };

  for (const target of ['교통사고', '고등학교', '같다']) {
    const seed = learnedIdsBefore(target);
    const page = await newPage(browser, ({ ids }) => {
      localStorage.clear();
      localStorage.setItem('kwf:profile', JSON.stringify({
        unlockedLevel: 6,
        learnedIds: ids,
        stats: { learned: ids.length, newCount: 0, reviewCount: 0, streak: 1, lastStudyDate: '' }
      }));
    }, { ids: seed.ids });
    await page.locator('.level-selector button').filter({ hasText: `TOPIK ${seed.level}` }).first().click();
    await page.waitForTimeout(300);
    await page.evaluate(() => document.querySelector('#study')?.scrollIntoView({ block: 'start' }));
    await page.waitForTimeout(300);
    const opened = await text(page.locator('#study-card .kwf-card-v3-word').first());
    await page.getByRole('button', { name: '直接看答案', exact: true }).first().click();
    await page.waitForTimeout(500);
    const metrics = await page.locator('#study-card').evaluate(card => {
      const knowledge = card.querySelector('.kwf-card-v3-knowledge');
      const footer = card.querySelector('.kwf-card-v3-footer');
      const cont = card.querySelector('.kwf-card-v3-continue');
      const coll = [...card.querySelectorAll('.kwf-card-v3-block')].find(el => el.textContent.includes('固定搭配'));
      const example = [...card.querySelectorAll('.kwf-card-v3-block')].find(el => el.textContent.includes('例句'));
      const krExample = example ? [...example.querySelectorAll('p')].map(p => p.textContent.trim()).find(v => /[\uac00-\ud7a3]/u.test(v)) || '' : '';
      const style = knowledge ? getComputedStyle(knowledge) : null;
      const rect = el => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { top: r.top, right: r.right, bottom: r.bottom, left: r.left, width: r.width, height: r.height };
      };
      const cardRect = rect(card);
      const kRect = rect(knowledge);
      const fRect = rect(footer);
      const btnRect = rect(cont);
      const cRect = rect(coll);
      const bottomSafeGap = cardRect && btnRect ? cardRect.bottom - btnRect.bottom : null;
      return {
        structure: [...card.querySelector('.kwf-card-v3')?.children || []].map(el => el.className || el.tagName),
        openedText: card.textContent,
        knowledgeOverflowY: style?.overflowY || '',
        knowledgeClientHeight: knowledge?.clientHeight || 0,
        knowledgeScrollHeight: knowledge?.scrollHeight || 0,
        knowledgeScrollable: !!knowledge && knowledge.scrollHeight > knowledge.clientHeight + 2 && /auto|scroll/.test(style.overflowY),
        noOverflowNoScrollbar: !!knowledge && knowledge.scrollHeight <= knowledge.clientHeight + 2 && !/scroll/.test(style.overflowY),
        collocationPresent: !!coll,
        collocationFullyInsideKnowledge: !!(kRect && cRect) && cRect.bottom <= kRect.bottom + 1,
        cardRect,
        knowledgeRect: kRect,
        footerRect: fRect,
        continueRect: btnRect,
        bottomSafeGap,
        footerFixedBottom: !!(cardRect && fRect && btnRect) && fRect.bottom <= cardRect.bottom + 1 && fRect.bottom >= cardRect.bottom - 28 && btnRect.top >= fRect.top && btnRect.bottom <= fRect.bottom + 1 && bottomSafeGap >= 14 && bottomSafeGap <= 48,
        continueVisible: !!btnRect && btnRect.height > 40,
        exampleText: krExample,
        bodyOverflowX: document.documentElement.scrollWidth - innerWidth
      };
    });
    details[`reveal-${target}`] = { seedLevel: seed.level, opened, metrics };
    check(`reveal-${target}-opened`, opened === target, JSON.stringify({ opened, target, seed }));
    check(`reveal-${target}-collocation-not-clipped`, metrics.collocationPresent && (metrics.collocationFullyInsideKnowledge || metrics.knowledgeScrollable), JSON.stringify(metrics));
    check(`reveal-${target}-knowledge-overflow-controlled`, metrics.knowledgeScrollable || metrics.noOverflowNoScrollbar, JSON.stringify(metrics));
    check(`reveal-${target}-continue-fixed`, metrics.footerFixedBottom && metrics.continueVisible, JSON.stringify(metrics));
    check(`reveal-${target}-example-real`, !metrics.exampleText || !/또는|기관|시설|직위|사람|학교|사고|수준|학력/u.test(metrics.exampleText), JSON.stringify(metrics));
    await page.close();
  }

  const page = await newPage(browser, ({ records }) => {
    localStorage.clear();
    for (const record of records) localStorage.setItem(`memory:${record.senseId}`, JSON.stringify(record));
    localStorage.setItem('kwf:profile', JSON.stringify({
      unlockedLevel: 6,
      learnedIds: [...new Set(records.map(r => r.wordId))],
      stats: { learned: records.length, newCount: 0, reviewCount: 0, streak: 1, lastStudyDate: '' }
    }));
  }, { records: seedPolyRecords() });

  async function polyPath(label, count) {
    if (label === '学习新多义') {
      await page.locator('.mobile-tabbar').getByText('多义', { exact: true }).click();
      await page.waitForTimeout(250);
      await page.getByRole('button', { name: /学习新多义/ }).first().click();
    } else {
      await page.locator('.mobile-tabbar').getByText('复习', { exact: true }).click();
      await page.waitForTimeout(180);
      await page.locator('.kwf-mobile-review-menu button').filter({ hasText: label === '复习单个释义' ? '复习·单个释义' : '复习·整词多选' }).first().click();
    }
    await page.waitForTimeout(500);
    const words = [];
    const statesBefore = [];
    const autoSelectedBefore = [];
    for (let i = 0; i < count; i += 1) {
      const word = await text(page.locator('#poly-trainer h3').first());
      const resultVisible = await page.getByText('本词释义结果').isVisible().catch(() => false);
      const selectedCount = await page.locator('#poly-trainer .poly-choices button.selected').count().catch(() => 0);
      words.push(word);
      statesBefore.push(resultVisible);
      autoSelectedBefore.push(selectedCount);
      const choices = await page.locator('#poly-trainer .poly-choices button').all();
      if (!choices.length) break;
      await choices[0].click();
      await page.waitForTimeout(80);
      await page.getByRole('button', { name: /提交所选释义|已记录到复习档案/ }).first().click();
      await page.waitForTimeout(250);
      const next = page.getByRole('button', { name: /下一题/ }).first();
      if (await next.isVisible().catch(() => false)) {
        await next.click();
        await page.waitForTimeout(300);
      } else {
        break;
      }
    }
    return { words, statesBefore, autoSelectedBefore };
  }

  for (const [key, label] of [['learn', '学习新多义'], ['single', '复习单个释义'], ['multi', '复习整词多选']]) {
    const result = await polyPath(label, 5);
    details[`poly-${key}`] = result;
    check(`poly-${key}-five`, result.words.length >= 5, JSON.stringify(result));
    check(`poly-${key}-advances`, new Set(result.words).size >= Math.min(5, result.words.length), JSON.stringify(result));
    check(`poly-${key}-state-reset`, result.statesBefore.every(v => v === false), JSON.stringify(result));
    check(`poly-${key}-no-auto-selected`, result.autoSelectedBefore.every(v => v === 0), JSON.stringify(result));
  }

  const layout = await page.evaluate(() => {
    const headerBrand = document.querySelector('header .brand');
    const minis = [...document.querySelectorAll('header .nav-actions .mini')].map(el => {
      const rect = el.getBoundingClientRect();
      const textRects = [...el.childNodes].flatMap(node => node.nodeType === Node.TEXT_NODE ? [] : [...(node.getClientRects?.() || [])]);
      return { text: el.textContent.trim(), rect, whiteSpace: getComputedStyle(el).whiteSpace, height: rect.height, scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, textRects: textRects.length };
    });
    const help = document.querySelector('#study-help');
    const reviewButtons = [...document.querySelectorAll('#review .review-module-grid article button')].map(el => {
      const rect = el.getBoundingClientRect();
      return { text: el.textContent.trim(), rect, overflow: el.scrollWidth > el.clientWidth + 1 };
    });
    const reviewOptions = [...document.querySelectorAll('#study-card .kwf-card-v3-review-actions button')].map(el => el.getBoundingClientRect());
    const polyRef = document.querySelector('#poly-reference');
    const polyActionButtons = [...document.querySelectorAll('#polysemy .poly-action-buttons button')].map(el => {
      const rect = el.getBoundingClientRect();
      return { text: el.textContent.trim(), rect };
    });
    return {
      brandFont: headerBrand ? getComputedStyle(headerBrand).fontSize : '',
      miniNoWrap: minis.every(m => m.whiteSpace === 'nowrap' && m.scrollWidth <= m.clientWidth + 1 && m.height <= 38),
      minis,
      helpRemoved: !help || getComputedStyle(help).display === 'none' || !/怎么学|点击查看学习规则/.test(help.textContent),
      reviewSecondaryWrapSafe: reviewButtons.every(b => b.rect.left >= 16 && b.rect.right <= innerWidth - 16 && !b.overflow),
      reviewButtons,
      reviewOptionsSafe: reviewOptions.length === 4 && reviewOptions.every(r => r.left >= 38 && r.right <= innerWidth - 38) && Math.abs(reviewOptions[0].top - reviewOptions[1].top) < 4 && Math.abs(reviewOptions[2].top - reviewOptions[3].top) < 4,
      reviewOptions: reviewOptions.map(r => ({ left: r.left, right: r.right, width: r.width, top: r.top })),
      polyRefRadiusClosed: polyRef ? getComputedStyle(polyRef).borderRadius : '',
      polyActionSameRow: polyActionButtons.filter(b => /单个释义|整词多选/.test(b.text)).length === 2 && Math.abs(polyActionButtons.filter(b => /单个释义|整词多选/.test(b.text))[0].rect.top - polyActionButtons.filter(b => /单个释义|整词多选/.test(b.text))[1].rect.top) < 4,
      bodyOverflowX: document.documentElement.scrollWidth - innerWidth
    };
  });
  details.mobileLayout = layout;
  check('mobile-header-compact', parseFloat(layout.brandFont) <= 18 && layout.miniNoWrap, JSON.stringify(layout));
  check('study-help-removed', layout.helpRemoved, JSON.stringify(layout));
  check('main-review-secondary-safe', layout.reviewSecondaryWrapSafe, JSON.stringify(layout));
  check('review-options-safe', layout.reviewOptionsSafe, JSON.stringify(layout));
  check('poly-reference-radius-closed', /18px|20px|22px/.test(layout.polyRefRadiusClosed), JSON.stringify(layout));
  check('poly-review-buttons-same-row', layout.polyActionSameRow, JSON.stringify(layout));
  check('mobile-no-x-overflow', layout.bodyOverflowX <= 1, JSON.stringify(layout));

  console.log(JSON.stringify({ pass, failures, details }, null, 2));
  await browser.close();
  if (failures.length) process.exit(1);
})().catch(error => {
  console.error(error);
  process.exit(1);
});
