import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)('playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
try{for(const width of [1440,390]){
 const page=await browser.newPage({viewport:{width,height:950}});
 await page.goto(process.env.REVIEW_URL||'http://127.0.0.1:4174/',{waitUntil:'networkidle'});
 assert.match(await page.locator('#counter').innerText(),/^1 \/ /);
 assert.equal(await page.locator('#accept').count(),0);
 await page.locator('#type').selectOption('polysemy');
 assert.equal(await page.locator('#counter').innerText(),'1 / 50');
 await page.locator('#state').selectOption('auto_verified');
 assert.equal(await page.locator('#counter').innerText(),'0 / 0');
 await page.locator('#state').selectOption('quarantine');
 await page.locator('h1').click();await page.keyboard.press('ArrowRight');
 assert.match(await page.locator('#counter').innerText(),/^2 \/ /);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.equal(await page.evaluate(()=>localStorage.length),0);
 const download=page.waitForEvent('download');await page.locator('#export').click();
 assert.equal((await download).suggestedFilename(),'data-inspector.json');
 await page.screenshot({path:'artifacts/data-inspector-'+width+'.png',fullPage:true});
 console.log(JSON.stringify({width,readOnly:true,filters:true,keyboard:true,export:true,overflow:false}));await page.close();
}}finally{await browser.close();}
