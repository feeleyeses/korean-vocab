const { chromium } = require('playwright');

const url = process.argv[2] || 'http://127.0.0.1:4173/';
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

async function main() {
  const browser = await chromium.launch({ headless: true, executablePath: chrome });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  const data = await page.evaluate(() => {
    const text = el => (el?.textContent || '').replace(/\s+/g, ' ').trim();
    const rect = el => {
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    };
    const navItems = [...document.querySelectorAll('.mobile-tabbar > *')].sort((a, b) => a.getBoundingClientRect().x - b.getBoundingClientRect().x).map(text);
    const heroVisible = text(document.querySelector('#top h1')).includes('不只记住意思');
    const levels = [...document.querySelectorAll('.level-selector button')].filter(button => /TOPIK\s*[1-6]/.test(text(button))).map(button => ({
      label: text(button),
      disabled: button.disabled,
      box: rect(button)
    }));
    const verticalText = [...document.querySelectorAll('#learned-library-section button,.learned-card-actions button,.archive-actions button')].some(el => {
      const r = el.getBoundingClientRect();
      return r.height > r.width * 1.6 && text(el).length > 3;
    });
    const internalScroll = [...document.querySelectorAll('#study-card *')].filter(el => {
      const s = getComputedStyle(el);
      return /(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 2;
    }).map(el => el.className || el.tagName);
    return { navItems, heroVisible, levels, verticalText, internalScroll, y: window.scrollY };
  });

  await page.locator('.mobile-tabbar button').filter({ hasText: '复习' }).click();
  await page.waitForTimeout(300);
  const menuAfterSingle = await page.locator('.kwf-mobile-review-menu:not([hidden])').count();
  const hashAfterSingle = await page.evaluate(() => location.hash);
  await page.locator('.kwf-mobile-review-menu button').filter({ hasText: '进入复习页' }).click();
  await page.waitForTimeout(300);
  const hashAfterEnter = await page.evaluate(() => location.hash);

  await page.evaluate(() => {
    window.__ttsCalls = 0;
    const original = window.speechSynthesis?.speak?.bind(window.speechSynthesis);
    if (window.speechSynthesis) window.speechSynthesis.speak = utterance => { window.__ttsCalls += 1; window.__ttsText = utterance.text; if (original) return undefined; };
  });
  await page.getByRole('button', { name: /播放韩语发音|听/ }).first().click();
  await page.waitForTimeout(150);
  const tts = await page.evaluate(() => ({ calls: window.__ttsCalls || 0, text: window.__ttsText || '' }));

  const topikEnabled = data.levels.length === 6 && data.levels.every(item => !item.disabled);
  const sameLevelHeight = new Set(data.levels.map(item => item.box.h)).size === 1;
  const blockingErrors = errors.filter(message => !message.includes('Minified React error #418'));
  const pass = {
    mobileLanding: data.heroVisible && data.y < 40,
    mobileNavOrder: data.navItems.join('|') === '学习|多义|词库|复习',
    reviewSingleClickOpensMenu: menuAfterSingle === 1 && hashAfterSingle !== '#review',
    reviewExplicitEnter: hashAfterEnter === '#review',
    topikAllEnabled: topikEnabled,
    topikSameHeight: sameLevelHeight,
    ttsBound: tts.calls === 1 && /[\u3131-\u318e\uac00-\ud7a3]/u.test(tts.text),
    noStudyCardInternalScroll: data.internalScroll.length === 0,
    noVerticalLearnedButtons: !data.verticalText,
    noBlockingPageErrors: blockingErrors.length === 0
  };

  await browser.close();
  console.log(JSON.stringify({ url, pass, details: { ...data, menuAfterSingle, hashAfterSingle, hashAfterEnter, tts, errors, blockingErrors } }, null, 2));
  if (Object.values(pass).some(value => !value)) process.exit(1);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
