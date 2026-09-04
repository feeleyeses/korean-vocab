import { pathToFileURL } from 'node:url';

const playwrightImportTarget = process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
  : 'playwright';
const playwrightModule = await import(playwrightImportTarget).catch(() => import('playwright'));
const { chromium } = playwrightModule.default || playwrightModule;
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

const url = process.env.KWF_URL || 'https://feeleyeses.github.io/korean-vocab/';
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(1000);

const clean = s => (s || '').replace(/\s+/g, ' ').trim();
async function dump(label, locator) {
  if (await locator.count() === 0) { console.log(`AUDIT ${label}: MISSING`); return; }
  const data = await locator.first().evaluate(el => {
    const cs = getComputedStyle(el), r = el.getBoundingClientRect();
    const pick = node => {
      if (!node) return null;
      const s = getComputedStyle(node), b = node.getBoundingClientRect();
      return { tag:node.tagName, id:node.id, cls:node.className, w:Math.round(b.width), h:Math.round(b.height), display:s.display, position:s.position, overflow:s.overflow, align:s.alignItems, justify:s.justifyContent, grid:s.gridTemplateColumns, padding:s.padding, margin:s.margin };
    };
    return {
      self: pick(el), parent: pick(el.parentElement), children:[...el.children].map(pick),
      html: el.outerHTML.slice(0,18000)
    };
  });
  console.log(`AUDIT ${label}\n${JSON.stringify(data)}`);
}

await dump('study-initial', page.locator('#study-card'));
const answer = page.getByRole('button', { name: '直接看答案' });
if (await answer.count()) { await answer.first().click(); await page.waitForTimeout(300); }
await dump('study-revealed', page.locator('#study-card'));

const reviewRoot = page.locator('#review');
await dump('review-root', reviewRoot);
const reviewButtons = await reviewRoot.getByRole('button').allTextContents().catch(() => []);
console.log('AUDIT review-buttons', JSON.stringify(reviewButtons.map(clean)));

// Try to open the first real review module, avoiding learned-library controls.
const candidates = reviewRoot.getByRole('button');
for (let i=0;i<await candidates.count();i++) {
  const b = candidates.nth(i); const t = clean(await b.innerText().catch(()=>''));
  if (!t || /已学|词库|查看|收起|上一页|下一页/.test(t)) continue;
  try { await b.click({timeout:1200}); await page.waitForTimeout(250); break; } catch {}
}
await dump('review-after-open-study-card', page.locator('#study-card'));
const reviewChoiceButtons = await page.locator('#study-card button').allTextContents().catch(()=>[]);
console.log('AUDIT study-card-buttons-after-review-open', JSON.stringify(reviewChoiceButtons.map(clean)));

// Open learned library and dump a real row if the current browser profile can produce one.
const learned = page.getByRole('button', { name: '查看已学词库' }).first();
if (await learned.count()) { try { await learned.click(); await page.waitForTimeout(300); } catch {} }
await dump('learned-library', page.locator('#learned-library-section'));
await dump('learned-row', page.locator('#learned-library-section .kwf-learned-row'));

console.log('AUDIT localStorage', await page.evaluate(() => Object.fromEntries(Object.entries(localStorage))));
await browser.close();
