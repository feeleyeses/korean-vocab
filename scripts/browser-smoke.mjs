import { chromium } from 'playwright';

const url = process.env.KWF_URL || 'https://feeleyeses.github.io/korean-vocab/';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', err => errors.push(`pageerror: ${err.message}`));
page.on('console', msg => {
  if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
});

await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(1000);

async function assertClickChanges(label, locator, snapshot) {
  const before = await snapshot();
  await locator.click({ timeout: 10000 });
  await page.waitForTimeout(300);
  const after = await snapshot();
  if (before === after) {
    throw new Error(`${label}: click produced no observable DOM/state change`);
  }
  console.log(`PASS ${label}: ${before} -> ${after}`);
}

await assertClickChanges(
  '怎么学',
  page.getByRole('button', { name: '怎么学' }),
  async () => String(await page.getByRole('button', { name: '怎么学' }).getAttribute('aria-expanded')),
);

await assertClickChanges(
  '直接看答案',
  page.getByRole('button', { name: '直接看答案' }),
  async () => `${await page.locator('#study-card').innerText()}|shortcut:${await page.getByRole('button', { name: '直接看答案' }).count()}`,
);

// Reload to test the learned-library entry from a clean page state.
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(500);
const learnedButton = page.getByRole('button', { name: '查看已学词库' }).first();
await learnedButton.click({ timeout: 10000 });
await page.waitForTimeout(300);
const panel = page.locator('#learned-library-section');
if ((await panel.count()) === 0) {
  throw new Error('查看已学词库: drawer did not appear');
}
console.log('PASS 查看已学词库: drawer appeared');

if (errors.length) {
  console.error('Browser errors detected:\n' + errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log('PASS no pageerror/console error');
}

await browser.close();
