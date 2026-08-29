const playwrightModule = await import(process.env.PLAYWRIGHT_MODULE || 'playwright').catch(() => import('playwright'));
const { chromium } = playwrightModule.default || playwrightModule;

const url = process.env.KWF_URL || 'https://feeleyeses.github.io/korean-vocab/';
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
});

const failures = [];
const check = (name, ok, detail) => ok ? console.log(`PASS ${name}: ${detail}`) : failures.push(`${name}: ${detail}`);
const roundRect = r => ({ left: Math.round(r.left * 10) / 10, top: Math.round(r.top * 10) / 10, width: Math.round(r.width * 10) / 10, height: Math.round(r.height * 10) / 10 });
const sameRect = (a, b) => ['left', 'top', 'width', 'height'].every(k => Math.abs(a[k] - b[k]) <= 1);

async function auditHoverGeometry(page, locator, label) {
  await locator.evaluate(el => el.scrollIntoView({ block: 'center', inline: 'center' }));
  await page.waitForTimeout(120);
  const before = await locator.evaluate(el => {
    const rect = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return {
      rect: { left: rect.left + scrollX, top: rect.top + scrollY, width: rect.width, height: rect.height },
      styles: {
        width: s.width, height: s.height, padding: s.padding, margin: s.margin, borderWidth: s.borderWidth,
        fontWeight: s.fontWeight, transform: s.transform, transitionProperty: s.transitionProperty
      }
    };
  });
  await locator.hover();
  await page.waitForTimeout(220);
  const after = await locator.evaluate(el => {
    const rect = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return {
      rect: { left: rect.left + scrollX, top: rect.top + scrollY, width: rect.width, height: rect.height },
      styles: {
        width: s.width, height: s.height, padding: s.padding, margin: s.margin, borderWidth: s.borderWidth,
        fontWeight: s.fontWeight, transform: s.transform, transitionProperty: s.transitionProperty
      }
    };
  });
  check(`${label} hover geometry stable`, sameRect(roundRect(before.rect), roundRect(after.rect)), JSON.stringify({ before: roundRect(before.rect), after: roundRect(after.rect) }));
  for (const prop of ['width', 'height', 'padding', 'margin', 'borderWidth', 'fontWeight', 'transform']) {
    check(`${label} hover keeps ${prop}`, before.styles[prop] === after.styles[prop], JSON.stringify({ before: before.styles[prop], after: after.styles[prop] }));
  }
  check(`${label} no transition all`, !after.styles.transitionProperty.split(',').map(x => x.trim()).includes('all'), after.styles.transitionProperty);
}

async function runViewport(viewport) {
  const page = await browser.newPage({ viewport });
  await page.goto(`${url}?ui=${Date.now()}-${viewport.width}`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(() => window.__KWF_LAYOUT_SYSTEM_READY__ === true && document.documentElement.dataset.kwfLayoutAuthority === 'layout-system', { timeout: 10000 });
  await page.waitForTimeout(500);

  const label = `${viewport.width}x${viewport.height}`;
  const initial = await page.locator('#study-card').evaluate(card => {
    const cardRect = card.getBoundingClientRect();
    const group = card.querySelector('.pre-answer > div');
    const groupRect = group.getBoundingClientRect();
    const buttons = [...group.querySelectorAll('button')].map(button => button.getBoundingClientRect());
    return {
      card: { width: cardRect.width, height: cardRect.height, center: (cardRect.left + cardRect.right) / 2 },
      group: { width: groupRect.width, height: groupRect.height, center: (groupRect.left + groupRect.right) / 2, bottom: cardRect.bottom - groupRect.bottom },
      buttons: buttons.map(rect => ({ width: rect.width, height: rect.height }))
    };
  });
  check(`${label} initial card height`, Math.abs(initial.card.height - 500) <= 1, JSON.stringify(initial.card));
  check(`${label} initial button group centered`, Math.abs(initial.group.center - initial.card.center) <= 1, JSON.stringify(initial.group));
  check(`${label} initial buttons equal`, initial.buttons.every(button => Math.abs(button.height - initial.buttons[0].height) <= 0.5 && Math.abs(button.width - initial.buttons[0].width) <= 0.5), JSON.stringify(initial.buttons));

  for (const button of await page.locator('#study-card .pre-answer > div > button').all()) {
    await auditHoverGeometry(page, button, `${label} learn button`);
  }
  await auditHoverGeometry(page, page.locator('#study-card .pre-answer > .show-shortcut'), `${label} reveal shortcut`);

  await page.locator('#study-card .pre-answer').getByRole('button', { name: '不认识', exact: true }).click();
  await page.waitForTimeout(350);
  const reveal = await page.locator('#study-card').evaluate(card => {
    const cardRect = card.getBoundingClientRect();
    const button = card.querySelector('.continue').getBoundingClientRect();
    return { width: button.width, height: button.height, center: (button.left + button.right) / 2, bottom: cardRect.bottom - button.bottom };
  });
  check(`${label} continue fixed width`, Math.abs(reveal.width - 180) <= 1, JSON.stringify(reveal));
  check(`${label} continue same centerline`, Math.abs(reveal.center - initial.group.center) <= 1, JSON.stringify({ initial: initial.group, reveal }));
  check(`${label} continue height stable`, Math.abs(reveal.height - initial.buttons[0].height) <= 2, JSON.stringify(reveal));
  await auditHoverGeometry(page, page.locator('#study-card .continue'), `${label} continue button`);

  const openLearned = page.getByRole('button', { name: /打开已学词库|查看已学词库/ }).first();
  await openLearned.evaluate(el => el.click());
  await page.waitForTimeout(300);
  const full = page.locator('#review .review-module-grid article').filter({ hasText: '全量库' }).first().locator('button');
  if (await full.count() && !(await full.isDisabled())) {
    await full.evaluate(el => el.click());
    await page.waitForTimeout(350);
    for (const button of await page.locator('#study-card .review-question > div > button').all()) {
      await auditHoverGeometry(page, button, `${label} review button`);
    }
    const firstReviewButton = page.locator('#study-card .review-question > div > button').first();
    await firstReviewButton.evaluate(el => el.click());
    await page.waitForTimeout(350);
    const summary = page.locator('#study-card details.answer-map > summary');
    if (await summary.count()) {
      await auditHoverGeometry(page, summary, `${label} answer map summary`);
    }
  } else {
    failures.push(`${label}: full vocabulary review entry unavailable`);
  }

  const scroll = await page.evaluate(() => ({
    bodyOverflow: document.body.scrollHeight - window.innerHeight,
    internal: [...document.querySelectorAll('#study-card *')].filter(el => el.scrollHeight > el.clientHeight + 2 && getComputedStyle(el).overflowY !== 'visible').map(el => el.className || el.tagName)
  }));
  check(`${label} no internal scrollbars`, scroll.internal.length === 0, JSON.stringify(scroll));
  await page.close();
}

await runViewport({ width: 1920, height: 1080 });
await runViewport({ width: 390, height: 844 });

if (failures.length) {
  console.error('FAILURES\n' + failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log('PASS UI regression: desktop 1920 and mobile 390');
}

await browser.close();
