const { chromium } = require('playwright');

const url = process.argv[2] || 'http://127.0.0.1:4173/';
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

async function main() {
  const browser = await chromium.launch({ headless: true, executablePath: chrome });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  for (const level of [2, 3, 4, 5, 6, 1]) {
    await page.locator('.level-selector button').filter({ hasText: `TOPIK ${level}` }).click();
    await page.waitForTimeout(280);
    const body = await page.locator('body').innerText();
    if (body.trim().length < 1000) throw new Error(`blank after TOPIK ${level}`);
  }

  await page.getByRole('button', { name: '直接看答案' }).click();
  await page.waitForTimeout(500);
  const revealed = await page.locator('#study-card').innerText();
  await page.getByRole('button', { name: '继续' }).click();
  await page.waitForTimeout(500);
  const afterContinue = await page.locator('#study-card').innerText();

  await page.locator('a[href$="#polysemy"],a[href="#polysemy"]').first().click();
  await page.waitForTimeout(500);
  const polyButtons = await page.locator('.poly-secondary').evaluateAll(buttons => buttons.map(button => ({
    text: button.textContent.trim(),
    disabled: button.disabled,
    kwf: button.dataset.kwfDisabledReview
  })));

  const published = await page.evaluate(async () => {
    const json = await fetch('data/vocabulary.json', { cache: 'no-store' }).then(response => response.json());
    return {
      count: json.entries.length,
      hasBabeul: json.entries.some(entry => entry.headword === '밥을'),
      badStatus: json.entries.some(entry => entry.verificationStatus !== 'approved')
    };
  });

  const blockingErrors = errors.filter(message => !message.includes('Minified React error #418'));
  const result = {
    pass: {
      topikSwitch: true,
      revealShowsContinue: revealed.includes('继续'),
      continueAdvances: afterContinue !== revealed,
      publishedOnlyApproved: !published.badStatus,
      noBabeul: !published.hasBabeul,
      polyReviewGuard: polyButtons.every(item => item.disabled || item.kwf === 'true'),
      noBlockingPageErrors: blockingErrors.length === 0
    },
    details: {
      published,
      polyButtons,
      errors,
      blockingErrors,
      revealed: revealed.slice(0, 180),
      afterContinue: afterContinue.slice(0, 120)
    }
  };
  await browser.close();
  console.log(JSON.stringify(result, null, 2));
  if (Object.values(result.pass).some(value => !value)) process.exit(1);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
