import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {mapVocabulary,scopeWords} from '../src/domain.js';
const {chromium}=createRequire(import.meta.url)('playwright');
const base=process.env.KWF_URL||'http://127.0.0.1:4173/';
const words=mapVocabulary(await (await fetch(base+'data/vocabulary.json')).json());
const counts=[1,2,3,4,5,6].map(l=>scopeWords(words,{levels:[l],route:'sprint',tags:[]}).length);
console.log(JSON.stringify({sprint:counts,full:[1,2,3,4,5,6].map(l=>words.filter(w=>w.levels.includes(l)).length)}));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
try{for(const width of [1440,390]){
const page=await browser.newPage({viewport:{width,height:950}});
await page.goto(base,{waitUntil:'networkidle'});
await page.getByRole('button',{name:'考前急救包',exact:true}).click();
for(let i=0;i<6;i++){const b=page.locator('.settings-section .levels button').nth(i);assert.equal(await b.isDisabled(),counts[i]===0);assert.ok((await b.innerText()).includes(String(counts[i])));}
assert.equal(await page.locator('.home-overview .number-highlight.zero').first().evaluate(e=>getComputedStyle(e).color),'rgb(152, 162, 179)');
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await page.screenshot({path:'artifacts/refinement-home-'+width+'.png',fullPage:true});
await page.locator(width===390?'.mobile-nav':'.topbar nav').getByRole('button',{name:'复习',exact:true}).click();
await page.screenshot({path:'artifacts/refinement-review-'+width+'.png',fullPage:true});
await page.close();
console.log(JSON.stringify({width,availability:true,zeroColor:true,overflow:false}));
}}finally{await browser.close();}
