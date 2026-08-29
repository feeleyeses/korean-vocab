const playwrightModule = await import(process.env.PLAYWRIGHT_MODULE || 'playwright').catch(() => import('playwright'));
const { chromium } = playwrightModule.default || playwrightModule;
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const url = process.env.KWF_URL || 'https://feeleyeses.github.io/korean-vocab/';

const browser = await chromium.launch({
  headless: true,
  ...(executablePath ? { executablePath } : {})
});

const failures = [];
const check = (name, ok, detail) => ok ? console.log(`PASS ${name}: ${detail}`) : failures.push(`${name}: ${detail}`);
const rect = r => ({ left: Math.round(r.left * 10) / 10, top: Math.round(r.top * 10) / 10, width: Math.round(r.width * 10) / 10, height: Math.round(r.height * 10) / 10 });
const sameRect = (a, b) => ['left', 'top', 'width', 'height'].every(k => Math.abs(a[k] - b[k]) <= 1);

async function visibleControls(page) {
  return page.locator('button, summary, a.mobile-tab').evaluateAll(els => {
    let visibleIndex = 0;
    return els.filter(el => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
    })
    .map((el) => {
      const id = `control-${visibleIndex++}`;
      el.dataset.kwfAuditId = id;
      return {
      id,
      text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
      tag: el.tagName.toLowerCase(),
      className: el.className || '',
      role: el.getAttribute('role') || '',
      width: el.getBoundingClientRect().width,
      height: el.getBoundingClientRect().height,
      transitionProperty: getComputedStyle(el).transitionProperty
    };
    });
  });
}

async function auditViewport(viewport) {
  const page = await browser.newPage({ viewport });
  await page.goto(`${url}?consistency=${Date.now()}-${viewport.width}`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(() => window.__KWF_LAYOUT_SYSTEM_READY__ === true, { timeout: 10000 });
  await page.waitForTimeout(500);

  const label = `${viewport.width}x${viewport.height}`;
  const beforeControls = await visibleControls(page);
  for (const control of beforeControls) {
    check(`${label} control has fixed box ${control.text || control.tag}`, control.width >= 28 && control.height >= 28, JSON.stringify(control));
    check(`${label} control avoids transition all ${control.text || control.tag}`, !control.transitionProperty.split(',').map(x => x.trim()).includes('all'), control.transitionProperty);
  }

  for (const control of beforeControls.slice(0, 28)) {
    const locator = page.locator(`[data-kwf-audit-id="${control.id}"]`);
    if (!await locator.count()) continue;
    await locator.evaluate(el => el.scrollIntoView({ block: 'center', inline: 'center' }));
    await page.waitForTimeout(80);
    const stillVisible = await locator.evaluate(el => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
    });
    if (!stillVisible) continue;
    const before = await locator.evaluate(el => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return {
        rect: { left: r.left + scrollX, top: r.top + scrollY, width: r.width, height: r.height },
        style: { padding: s.padding, margin: s.margin, borderWidth: s.borderWidth, fontWeight: s.fontWeight, transform: s.transform }
      };
    });
    try {
      await locator.hover({ force: true, timeout: 5000 });
    } catch (error) {
      failures.push(`${label} hover reachable ${control.text || control.tag}: ${error.message}`);
      continue;
    }
    await page.waitForTimeout(220);
    const after = await locator.evaluate(el => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return {
        rect: { left: r.left + scrollX, top: r.top + scrollY, width: r.width, height: r.height },
        style: { padding: s.padding, margin: s.margin, borderWidth: s.borderWidth, fontWeight: s.fontWeight, transform: s.transform }
      };
    });
    check(`${label} hover geometry stable ${control.text || control.tag}`, sameRect(rect(before.rect), rect(after.rect)), JSON.stringify({ before: rect(before.rect), after: rect(after.rect) }));
    for (const key of Object.keys(before.style)) {
      check(`${label} hover keeps ${key} ${control.text || control.tag}`, before.style[key] === after.style[key], JSON.stringify({ before: before.style[key], after: after.style[key] }));
    }
  }

  const layoutShift = await page.evaluate(async () => {
    let total = 0;
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) total += entry.value;
      }
    });
    observer.observe({ type: 'layout-shift', buffered: true });
    await new Promise(resolve => setTimeout(resolve, 800));
    observer.disconnect();
    return total;
  });
  check(`${label} cumulative layout shift stable`, layoutShift <= 0.001, String(layoutShift));

  await page.close();
}

await auditViewport({ width: 1920, height: 1080 });
await auditViewport({ width: 390, height: 844 });

await browser.close();

if (failures.length) {
  console.error('FAILURES\n' + failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log('PASS UI consistency audit: desktop 1920 and mobile 390');
}
