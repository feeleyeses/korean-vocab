const { chromium } = require('playwright');

const url = process.argv[2] || 'http://127.0.0.1:4173/';
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const knownHydration = 'Minified React error #418';

async function main() {
  const browser = await chromium.launch({ headless: true, executablePath: chrome });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1600);

  const evalState = async () => page.evaluate(() => {
    const text = el => (el?.textContent || '').replace(/\s+/g, ' ').trim();
    const rect = el => {
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), bottom: Math.round(r.bottom) };
    };
    const navItems = [...document.querySelectorAll('.mobile-tabbar > *')]
      .sort((a, b) => a.getBoundingClientRect().x - b.getBoundingClientRect().x)
      .map(text);
    const heroButtons = [...document.querySelectorAll('.hero-actions button')].map(rect);
    const topik = [...document.querySelectorAll('.level-selector button')]
      .filter(button => /TOPIK\s*[1-6]/.test(text(button)))
      .map(button => ({ label: text(button), disabled: button.disabled, rect: rect(button), overflow: button.scrollWidth > button.clientWidth + 1 || button.scrollHeight > button.clientHeight + 1 }));
    const reviewMenu = document.querySelector('.kwf-mobile-review-menu');
    const studyCard = document.querySelector('#study-card');
    const actionButtons = [...document.querySelectorAll('.kwf-card-v3-actions button,.kwf-card-v3-continue,.kwf-card-v3-review-actions button')].map(rect);
    const cardRect = studyCard ? rect(studyCard) : null;
    const learned = document.querySelector('#learned-panel');
    const learnedRect = learned ? rect(learned) : null;
    const verticalButtons = [...document.querySelectorAll('#learned-panel button,#learned-library-section button,.archive-actions button')].filter(el => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > r.width * 1.6 && text(el).length > 3;
    }).map(text);
    return {
      hash: location.hash,
      y: Math.round(scrollY),
      scrollHeight: document.documentElement.scrollHeight,
      viewportHeight: innerHeight,
      navItems,
      heroVisible: text(document.querySelector('#top h1')).includes('不只记住意思'),
      heroButtonsSameRow: heroButtons.length === 2 && Math.abs(heroButtons[0].y - heroButtons[1].y) <= 2,
      reviewMenuHidden: reviewMenu?.hidden ?? null,
      reviewMenuItems: [...document.querySelectorAll('.kwf-mobile-review-menu button')].map(text),
      topik,
      topikUniform: new Set(topik.map(item => `${item.rect.w}x${item.rect.h}`)).size === 1,
      topikNoOverflow: topik.every(item => !item.overflow),
      cardRect,
      actionButtons,
      cardButtonSafe: !cardRect || actionButtons.every(button => button.x >= cardRect.x + 12 && button.bottom <= cardRect.bottom - 12),
      verticalButtons,
      learnedNoOverlap: !learnedRect || [...learned.children].every(child => {
        const r = child.getBoundingClientRect();
        return r.width === 0 || (r.top >= learnedRect.y - 1 && r.bottom <= learnedRect.bottom + 1);
      })
    };
  });

  const start = await evalState();
  await page.evaluate(() => {
    window.__ttsCalls = 0;
    if (window.speechSynthesis) window.speechSynthesis.speak = utterance => { window.__ttsCalls += 1; window.__ttsText = utterance.text; };
  });
  await page.getByRole('button', { name: /播放韩语发音|听/ }).first().click();
  await page.waitForTimeout(150);
  const tts = await page.evaluate(() => ({ calls: window.__ttsCalls || 0, text: window.__ttsText || '' }));

  await page.locator('.mobile-tabbar').getByText('多义').click();
  await page.waitForTimeout(500);
  const poly = await evalState();
  await page.mouse.wheel(0, 520);
  await page.waitForTimeout(200);
  const polyScrolled = await evalState();
  await page.locator('.mobile-tabbar').getByText('学习').click();
  await page.waitForTimeout(500);
  const study = await evalState();
  await page.locator('.mobile-tabbar').getByText('词库').click();
  await page.waitForTimeout(700);
  const learned = await evalState();
  await page.locator('.mobile-tabbar').getByText('复习').click();
  await page.waitForTimeout(250);
  const reviewOpen = await evalState();
  await page.locator('.mobile-tabbar').getByText('复习').click();
  await page.waitForTimeout(250);
  const reviewClosed = await evalState();
  await page.locator('.mobile-tabbar').getByText('复习').dblclick();
  await page.waitForTimeout(500);
  const reviewEntered = await evalState();

  const published = await page.evaluate(async () => {
    const json = await fetch('data/vocabulary.json', { cache: 'no-store' }).then(response => response.json());
    return {
      count: json.entries.length,
      onlyApproved: json.entries.every(entry => entry.verificationStatus === 'approved')
    };
  });

  const requiredMenu = ['复习·今日到期', '复习·全量库', '复习·急救包', '复习·单个释义', '复习·整词多选', '复习·音变专项'];
  const blockingErrors = errors.filter(message => !message.includes(knownHydration));
  const pass = {
    firstScreenLanding: start.heroVisible && start.y < 40,
    heroButtonsSameRow: start.heroButtonsSameRow,
    tabsOrder: start.navItems.join('|') === '学习|多义|词库|复习',
    polyTabScrolls: poly.hash === '#polysemy' && poly.y > 0,
    polyPageScrollable: polyScrolled.y > poly.y,
    studyTabLeavesPoly: study.hash === '#study' && study.y < poly.y,
    learnedTabLeavesPoly: learned.hash === '#review',
    reviewSingleClickOpens: reviewOpen.reviewMenuHidden === false,
    reviewSecondClickCloses: reviewClosed.reviewMenuHidden === true,
    reviewDoubleClickEnters: reviewEntered.hash === '#review',
    reviewMenuHasSixItems: requiredMenu.every(item => reviewOpen.reviewMenuItems.includes(item)),
    topikEnabledUniformNoOverflow: start.topik.length === 6 && start.topik.every(item => !item.disabled) && start.topikUniform && start.topikNoOverflow,
    cardButtonSafe: start.cardButtonSafe,
    learnedNoVerticalOrOverlap: learned.verticalButtons.length === 0 && learned.learnedNoOverlap,
    ttsWorks: tts.calls === 1 && /[\u3131-\u318e\uac00-\ud7a3]/u.test(tts.text),
    publishedOnlyApproved: published.onlyApproved,
    noBlockingErrors: blockingErrors.length === 0
  };

  await browser.close();
  const result = { url, pass, details: { start, poly, polyScrolled, study, learned, reviewOpen, reviewClosed, reviewEntered, tts, published, errors, blockingErrors } };
  console.log(JSON.stringify(result, null, 2));
  if (Object.values(pass).some(value => !value)) process.exit(1);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
