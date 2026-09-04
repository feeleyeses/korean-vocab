import { pathToFileURL } from 'node:url';

const playwrightImportTarget = process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
  : 'playwright';
const playwrightModule = await import(playwrightImportTarget).catch(() => import('playwright'));
const { chromium } = playwrightModule.default || playwrightModule;
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

const url = process.env.KWF_URL || 'https://feeleyeses.github.io/korean-vocab/';
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const failures = [];
const diagnostics = [];

function wireDiagnostics(page, label) {
  page.on('pageerror', err => diagnostics.push(`${label} pageerror: ${err.message}`));
  page.on('console', msg => { if (msg.type() === 'error') diagnostics.push(`${label} console: ${msg.text()}`); });
  page.on('requestfailed', req => diagnostics.push(`${label} requestfailed: ${req.url()} :: ${req.failure()?.errorText || 'unknown'}`));
  page.on('response', res => { if (res.status() >= 400) diagnostics.push(`${label} http ${res.status()}: ${res.url()}`); });
}

async function waitForUi(page) {
  await page.waitForFunction(() => Boolean(window.__KWF_LAYOUT_SYSTEM_READY__) && document.documentElement.dataset.kwfLayoutAuthority === 'layout-system', { timeout: 10000 });
}
async function checkChange(page, label, locator, snapshot) {
  try {
    const before = await snapshot();
    await locator.click({ timeout: 10000 });
    await page.waitForTimeout(400);
    const after = await snapshot();
    if (before === after) failures.push(`${label}: no state change (${before})`);
    else console.log(`PASS ${label}: ${before} -> ${after}`);
  } catch (err) { failures.push(`${label}: ${err.message}`); }
}
async function expect(label, fn) {
  try { const result = await fn(); if (!result.ok) failures.push(`${label}: ${result.detail}`); else console.log(`PASS ${label}: ${result.detail}`); }
  catch (err) { failures.push(`${label}: ${err.message}`); }
}

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
wireDiagnostics(mobile, 'mobile');
await mobile.goto(`${url}?smoke=${Date.now()}`, { waitUntil: 'networkidle', timeout: 60000 });
await waitForUi(mobile);
await mobile.waitForTimeout(500);
await expect('Layout System runtime ready', async () => {
  const value = await mobile.evaluate(() => ({ ready: Boolean(window.__KWF_LAYOUT_SYSTEM_READY__), ui: document.documentElement.dataset.kwfLayoutSystem || '' }));
  return { ok: value.ready && value.ui === 'layout-v1', detail: JSON.stringify(value) };
});
await expect('legacy layout markers removed', async () => {
  const count = await mobile.evaluate(() => document.querySelectorAll('[class*="kwf-v2"],[class*="kwf-v3"]').length);
  return { ok: count === 0, detail: `legacy=${count}` };
});
await expect('学习规则入口已移除', async () => {
  const count = await mobile.getByRole('button', { name: '怎么学' }).count();
  const helperText = await mobile.getByText(/点击查看学习规则/).evaluateAll(nodes => nodes.filter(node => {
    const style = getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
  }).length);
  return { ok: count === 0 && helperText === 0, detail: `button=${count}, visibleHelper=${helperText}` };
});
await checkChange(mobile, '直接看答案', mobile.getByRole('button', { name: '直接看答案' }), async () => `${(await mobile.locator('#study-card').innerText()).slice(-240)}|shortcut:${await mobile.getByRole('button', { name: '直接看答案' }).count()}`);
await expect('学习卡无内部滚条', async () => {
  const data = await mobile.locator('#study-card').evaluate(card => {
    const targets = [card, ...card.querySelectorAll('.answer, .answer-scroll, .review-question')];
    const bad = targets.filter(el => ['auto', 'scroll'].includes(getComputedStyle(el).overflowY));
    return { bad: bad.length, cardScroll: card.scrollHeight, cardClient: card.clientHeight };
  });
  return { ok: data.bad === 0, detail: JSON.stringify(data) };
});
await expect('学习卡内容不漂出边界', async () => {
  const result = await mobile.locator('#study-card').evaluate(card => {
    const outer = card.getBoundingClientRect(); const selectors = ['.word', '.answer', '.answer-scroll', '.pre-answer', '.review-question', '.sentence']; const offenders = [];
    for (const el of card.querySelectorAll(selectors.join(','))) { const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue; if (r.left < outer.left - 2 || r.right > outer.right + 2) offenders.push(`${el.className}: horizontal`); }
    return offenders;
  });
  return { ok: result.length === 0, detail: result.length ? result.join('; ') : 'contained' };
});
await expect('备考起点不在当前词库学习区', async () => {
  const visible = await mobile.getByText('选择备考起点', { exact: true }).evaluateAll(nodes => nodes.filter(n => { const s = getComputedStyle(n), r = n.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0; }).length);
  return { ok: visible === 0, detail: `visible=${visible}` };
});

const desktop = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
wireDiagnostics(desktop, 'desktop');
await desktop.goto(`${url}?smokeDesktop=${Date.now()}`, { waitUntil: 'networkidle', timeout: 60000 });
await waitForUi(desktop);
await desktop.waitForTimeout(400);
await checkChange(desktop, '查看已学词库', desktop.getByRole('button', { name: '查看已学词库' }).first(), async () => `${await desktop.locator('#learned-library-section').count()}|${await desktop.getByRole('button', { name: '查看已学词库' }).first().getAttribute('aria-expanded')}`);
await desktop.waitForTimeout(600);
await expect('已学概览保持全宽', async () => {
  const data = await desktop.evaluate(() => { const board = document.querySelector('#review .review-board'), summary = document.querySelector('#review .review-stat.learned-stat'); if (!board || !summary) return null; const b = board.getBoundingClientRect(), s = summary.getBoundingClientRect(); return { ratio: s.width / b.width, height: s.height, parent: summary.parentElement?.className || '' }; });
  return { ok: Boolean(data && data.ratio > 0.94 && data.height >= 130), detail: JSON.stringify(data) };
});
await expect('间隔复习保持全宽且不乱位', async () => {
  const data = await desktop.evaluate(() => { const board = document.querySelector('#review .review-board'), note = document.querySelector('#review .memory-note'); if (!board || !note) return null; const b = board.getBoundingClientRect(), n = note.getBoundingClientRect(); return { ratio: n.width / b.width, overflowY: getComputedStyle(note).overflowY, parent: note.parentElement?.className || '' }; });
  return { ok: Boolean(data && data.ratio > 0.94 && !['auto', 'scroll'].includes(data.overflowY)), detail: JSON.stringify(data) };
});
await expect('已学词库列表无内部滚动', async () => {
  const list = desktop.locator('#learned-library-section .kwf-learned-list'); if (await list.count() === 0) return { ok: true, detail: 'N/A: fresh CI profile has no learned list' };
  const data = await list.evaluate(el => ({ overflowY: getComputedStyle(el).overflowY, maxHeight: getComputedStyle(el).maxHeight })); return { ok: !['auto', 'scroll'].includes(data.overflowY), detail: JSON.stringify(data) };
});
console.log('DIAGNOSTICS FINAL');
console.log(diagnostics.length ? diagnostics.join('\n') : '(none)');
const hardDiagnostics = diagnostics.filter(x =>
  (x.includes('pageerror:') && !x.includes('Minified React error #418')) ||
  x.includes('requestfailed:') ||
  x.includes('http 4') ||
  x.includes('http 5')
);
if (failures.length || hardDiagnostics.length) { console.error('FAILURES:\n' + [...failures, ...hardDiagnostics].join('\n')); process.exitCode = 1; }
else console.log('PASS Layout System browser interaction and layout smoke');
await browser.close();
