import { chromium } from 'playwright';

const url = process.env.KWF_URL || 'https://feeleyeses.github.io/korean-vocab/';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const diagnostics = [];
page.on('pageerror', err => diagnostics.push(`pageerror: ${err.message}`));
page.on('console', msg => {
  if (msg.type() === 'error') diagnostics.push(`console: ${msg.text()}`);
});
page.on('requestfailed', req => diagnostics.push(`requestfailed: ${req.url()} :: ${req.failure()?.errorText || 'unknown'}`));
page.on('response', res => {
  if (res.status() >= 400) diagnostics.push(`http ${res.status()}: ${res.url()}`);
});

await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(1200);
console.log('DIAGNOSTICS AFTER LOAD');
console.log(diagnostics.length ? diagnostics.join('\n') : '(none)');
console.log('window.next:', await page.evaluate(() => JSON.stringify(window.next ?? null)));
console.log('pathname:', await page.evaluate(() => location.pathname));

const failures = [];
async function checkChange(label, locator, snapshot) {
  try {
    const before = await snapshot();
    await locator.click({ timeout: 10000 });
    await page.waitForTimeout(350);
    const after = await snapshot();
    if (before === after) failures.push(`${label}: no state change (${before})`);
    else console.log(`PASS ${label}: ${before} -> ${after}`);
  } catch (err) {
    failures.push(`${label}: ${err.message}`);
  }
}

await checkChange('怎么学', page.getByRole('button', { name: '怎么学' }), async () => String(await page.getByRole('button', { name: '怎么学' }).getAttribute('aria-expanded')));
await checkChange('直接看答案', page.getByRole('button', { name: '直接看答案' }), async () => `${(await page.locator('#study-card').innerText()).slice(-240)}|shortcut:${await page.getByRole('button', { name: '直接看答案' }).count()}`);

await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(500);
await checkChange('查看已学词库', page.getByRole('button', { name: '查看已学词库' }).first(), async () => `${await page.locator('#learned-library-section').count()}|${await page.getByRole('button', { name: '查看已学词库' }).first().getAttribute('aria-expanded')}`);

console.log('DIAGNOSTICS FINAL');
console.log(diagnostics.length ? diagnostics.join('\n') : '(none)');
if (failures.length || diagnostics.some(x => x.startsWith('pageerror:'))) {
  console.error('FAILURES:\n' + failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log('PASS browser interaction smoke');
}

await browser.close();
