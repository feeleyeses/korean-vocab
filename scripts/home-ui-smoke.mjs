import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)('playwright');
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
try {
  for(const width of [1440,390]) {
    const page=await browser.newPage({viewport:{width,height:950}});
    await page.goto(process.env.KWF_URL||'http://127.0.0.1:4173/',{waitUntil:'networkidle'});
    const card=page.locator('.home-study-card');
    assert.equal(await card.getByRole('button',{name:'开始学习',exact:true}).count(),1);
    assert.equal(await card.getByRole('button',{name:'查看已学词库',exact:true}).count(),1);
    const main=await card.boundingBox(), progress=await page.locator('.progress-section').boundingBox(), overview=await page.locator('.home-overview').boundingBox();
    assert.ok(main.y+main.height<=progress.y && progress.y+progress.height<=overview.y);
    const levels=await page.locator('.level-progress').evaluateAll(es=>es.map(e=>({y:e.getBoundingClientRect().y,width:e.getBoundingClientRect().width})));
    assert.equal(levels.length,6);
    assert.equal(new Set(levels.map(e=>e.y)).size,width===390?2:1);
    assert.equal(await page.locator('.home-overview dd').count(),3);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    assert.equal(await page.locator(width===390?'.mobile-nav button':'.topbar nav button').count(),width===390?4:5);
    await page.screenshot({path:`artifacts/home-${width}.png`,fullPage:true});
    if(width===390){
      await page.locator('.home-overview').scrollIntoViewIfNeeded();
      await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
      const summary=await page.locator('.home-overview').boundingBox(),nav=await page.locator('.mobile-nav').boundingBox();
      assert.ok(summary.y+summary.height<=nav.y,'overview remains accessible above bottom navigation');
      await page.screenshot({path:'artifacts/home-mobile-bottom.png'});
    }
    await card.getByRole('button',{name:'开始学习',exact:true}).click();
    assert.equal(await page.locator('.judgment-buttons').count(),1);
    console.log(JSON.stringify({width,ctaInsideCard:true,ordered:true,progressRows:new Set(levels.map(e=>e.y)).size,overflow:false}));
    await page.close();
  }
} finally { await browser.close(); }
