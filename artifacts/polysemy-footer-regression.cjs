const { pathToFileURL } = require('node:url');

(async () => {
  const mod = process.env.PLAYWRIGHT_MODULE
    ? await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href)
    : await import('playwright');
  const { chromium } = mod.default || mod;
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {})
  });
  const failures = [];
  const assert = (name, ok, detail = '') => {
    if (ok) console.log(`PASS ${name}: ${detail}`);
    else failures.push(`${name}: ${detail}`);
  };
  const url = process.env.KWF_URL || 'http://127.0.0.1:4173/';
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  async function boot(clear = true) {
    await page.goto(`${url}?regression=${Date.now()}`, { waitUntil: 'networkidle', timeout: 60000 });
    if (clear) {
      await page.evaluate(() => {
        for (const key of [...Object.keys(localStorage)]) {
          if (key.startsWith('memory:') || key.startsWith('kwf:')) localStorage.removeItem(key);
        }
        localStorage.setItem('kwf:profile', JSON.stringify({
          stats: { newCount: 0, reviewCount: 0, streak: 0, lastStudyDate: '', learned: 0 },
          learnedIds: [],
          unlockedLevel: 6,
          startPanelOpen: false
        }));
      });
      await page.reload({ waitUntil: 'networkidle' });
    }
    await page.waitForFunction(() => window.__KWF_LAYOUT_SYSTEM_READY__ === true, { timeout: 12000 });
    await page.waitForTimeout(500);
  }

  async function openPoly() {
    await page.locator('a[href$="#polysemy"],a[href="#polysemy"]').first().click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /学习新多义|回看多义词/ }).first().evaluate(el => el.click());
    await page.waitForTimeout(500);
  }

  const trainerState = async () => page.locator('#poly-trainer').evaluate(el => {
    const h3 = el.querySelector('h3');
    const buttons = [...el.querySelectorAll('.poly-choices button')].map(button => ({
      text: button.textContent.trim(),
      pressed: button.getAttribute('aria-pressed'),
      className: button.className
    }));
    return {
      headword: h3?.textContent.trim() || '',
      text: el.textContent.replace(/\s+/g, ' ').trim(),
      resultVisible: !!el.querySelector('.poly-result'),
      buttons
    };
  });

  await boot(true);
  await openPoly();
  let before = await trainerState();
  assert('polysemy opens on 같다 for regression path', before.headword === '같다', JSON.stringify(before));
  const like = page.locator('#poly-trainer .poly-choices button').filter({ hasText: '像；类似' }).first();
  await like.click();
  await page.getByRole('button', { name: /提交所选释义/ }).first().click();
  await page.waitForTimeout(500);
  const afterSubmit = await trainerState();
  assert('submit stays on current word', afterSubmit.headword === before.headword, JSON.stringify(afterSubmit));
  assert('submit shows result for current word only', afterSubmit.resultVisible && afterSubmit.text.includes('像；类似') && !afterSubmit.text.includes('계속'), afterSubmit.text);
  await page.getByRole('button', { name: /下一题/ }).first().click();
  await page.waitForTimeout(500);
  const afterNext = await trainerState();
  assert('next advances after explicit click', afterNext.headword && afterNext.headword !== before.headword, JSON.stringify(afterNext));
  assert('next question state is reset', !afterNext.resultVisible && afterNext.buttons.every(button => button.pressed === 'false' && !String(button.className).includes('selected')), JSON.stringify(afterNext));

  const seen = [before.headword, afterNext.headword];
  for (let i = 0; i < 4; i += 1) {
    const state = await trainerState();
    const target = page.locator('#poly-trainer .poly-choices button').first();
    await target.click();
    await page.getByRole('button', { name: /提交所选释义/ }).first().click();
    await page.waitForTimeout(300);
    const submitted = await trainerState();
    assert(`polysemy item ${i + 2} result remains on submitted word`, submitted.headword === state.headword && submitted.resultVisible, JSON.stringify({ state, submitted }));
    const next = page.getByRole('button', { name: /下一题/ }).first();
    if (await next.count()) {
      await next.click();
      await page.waitForTimeout(300);
      const clean = await trainerState();
      seen.push(clean.headword);
      assert(`polysemy item ${i + 3} enters clean`, !clean.resultVisible && clean.buttons.every(button => button.pressed === 'false' && !String(button.className).includes('selected')), JSON.stringify(clean));
    }
  }
  assert('polysemy advances through five attempts without state pollution', new Set(seen.filter(Boolean)).size >= 5, JSON.stringify(seen));

  await boot(true);
  const learnInitial = await page.locator('#study-card').evaluate(card => {
    const cardRect = card.getBoundingClientRect();
    const buttons = [...card.querySelectorAll('.kwf-card-v3-actions button')].map(el => el.getBoundingClientRect());
    const rail = {
      top: Math.min(...buttons.map(r => r.top)) - cardRect.top,
      bottom: cardRect.bottom - Math.max(...buttons.map(r => r.bottom)),
      height: buttons[0]?.height || 0,
      width: Math.max(...buttons.map(r => r.right)) - Math.min(...buttons.map(r => r.left))
    };
    return rail;
  });
  await page.getByRole('button', { name: '不认识', exact: true }).first().click();
  await page.waitForTimeout(500);
  const learnReveal = await page.locator('#study-card').evaluate(card => {
    const cardRect = card.getBoundingClientRect();
    const button = card.querySelector('.kwf-card-v3-continue').getBoundingClientRect();
    return { top: button.top - cardRect.top, bottom: cardRect.bottom - button.bottom, height: button.height, width: button.width };
  });
  assert('learning footer y-axis matches reveal continue', Math.abs(learnInitial.top - learnReveal.top) <= 1 && Math.abs(learnInitial.bottom - learnReveal.bottom) <= 1 && Math.abs(learnInitial.height - learnReveal.height) <= 1, JSON.stringify({ learnInitial, learnReveal }));
  assert('learning continue width equals three-button rail', Math.abs(learnInitial.width - learnReveal.width) <= 1, JSON.stringify({ learnInitial, learnReveal }));

  await boot(false);
  await page.evaluate(() => {
    const today = new Date().toISOString();
    const ids = [];
    const entries = window.__KWF_VOCABULARY__?.entries || [];
    for (const entry of entries.slice(0, 4)) {
      const sense = entry.senses?.[0];
      if (!sense) continue;
      ids.push(sense.lexicalEntryId || entry.id);
      localStorage.setItem(`memory:${sense.id}`, JSON.stringify({
        wordId: entry.id,
        senseId: sense.id,
        rating: 'remember',
        reviewedAt: today,
        dueAt: today,
        intervalDays: 0,
        ease: 2.5,
        mode: 'review'
      }));
    }
    localStorage.setItem('kwf:profile', JSON.stringify({
      stats: { newCount: 0, reviewCount: 0, streak: 0, lastStudyDate: '', learned: ids.length },
      learnedIds: ids,
      unlockedLevel: 6,
      startPanelOpen: false
    }));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__KWF_LAYOUT_SYSTEM_READY__ === true, { timeout: 12000 });
  await page.waitForTimeout(500);
  await page.locator('#review .review-module-grid article').filter({ hasText: '全量库' }).first().locator('button').click();
  await page.waitForTimeout(500);
  const reviewInitial = await page.locator('#study-card').evaluate(card => {
    const cardRect = card.getBoundingClientRect();
    const buttons = [...card.querySelectorAll('.kwf-card-v3-review-actions button')].map(el => el.getBoundingClientRect());
    buttons.sort((a, b) => a.top - b.top || a.left - b.left);
    const secondRow = buttons.slice(2);
    return {
      top: Math.min(...secondRow.map(r => r.top)) - cardRect.top,
      bottom: cardRect.bottom - Math.max(...secondRow.map(r => r.bottom)),
      height: secondRow[0]?.height || 0,
      count: buttons.length
    };
  });
  await page.locator('#study-card .kwf-card-v3-review-actions button').first().click();
  await page.waitForTimeout(500);
  const reviewReveal = await page.locator('#study-card').evaluate(card => {
    const cardRect = card.getBoundingClientRect();
    const button = card.querySelector('.kwf-card-v3-continue').getBoundingClientRect();
    return { top: button.top - cardRect.top, bottom: cardRect.bottom - button.bottom, height: button.height };
  });
  assert('review options render as 2x2', reviewInitial.count === 4, JSON.stringify(reviewInitial));
  assert('review second row y-axis matches reveal continue', Math.abs(reviewInitial.top - reviewReveal.top) <= 1 && Math.abs(reviewInitial.bottom - reviewReveal.bottom) <= 1 && Math.abs(reviewInitial.height - reviewReveal.height) <= 1, JSON.stringify({ reviewInitial, reviewReveal }));

  await page.close();
  await browser.close();
  if (failures.length) {
    console.error(`FAILURES\n${failures.join('\n')}`);
    process.exit(1);
  }
})();

