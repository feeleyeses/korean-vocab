import { chromium } from 'playwright';
const url = process.env.KWF_URL || 'https://feeleyeses.github.io/korean-vocab/';
const browser = await chromium.launch({headless:true});
const page = await browser.newPage({viewport:{width:1440,height:900}});
await page.goto(url,{waitUntil:'networkidle',timeout:60000});
await page.waitForTimeout(700);
const fail=[]; const pass=(n,d)=>console.log('PASS',n,d); const check=(n,ok,d)=>ok?pass(n,d):fail.push(`${n}: ${d}`);

check('UI v3 runtime',await page.evaluate(()=>window.__KWF_UI_V3_READY__===true),'runtime not ready');
let g=await page.locator('#study-card').evaluate(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {h:r.height,p:s.paddingLeft,pr:s.paddingRight,pb:s.paddingBottom}});
const initialH=g.h; check('学习卡固定高度',initialH>=620&&initialH<=705,JSON.stringify(g));
const actions=await page.locator('#study-card .pre-answer > div').evaluate(el=>{const er=el.getBoundingClientRect(),cr=el.closest('#study-card').getBoundingClientRect();return {left:Math.round(er.left-cr.left),right:Math.round(cr.right-er.right),cols:getComputedStyle(el).gridTemplateColumns.split(' ').length}});
check('学习按钮保留左右边距',actions.left>=16&&actions.right>=16,JSON.stringify(actions));
check('学习初始页三按钮单行',actions.cols===3,JSON.stringify(actions));
await page.getByRole('button',{name:'直接看答案'}).click(); await page.waitForTimeout(250);
const reveal=await page.locator('#study-card').evaluate(el=>{const r=el.getBoundingClientRect(); const texts=[...el.querySelectorAll('.answer-scroll > *')].filter(x=>x.getBoundingClientRect().width>0).map(x=>getComputedStyle(x).textAlign); return {h:r.height,texts}});
check('学习揭晓页与初始页等高',Math.abs(reveal.h-initialH)<=2,JSON.stringify({initialH,revealH:reveal.h}));
check('学习揭晓文字水平居中',reveal.texts.every(x=>x==='center'),JSON.stringify(reveal.texts));

// learned row check only when present in current profile
const open=page.getByRole('button',{name:/打开已学词库|查看已学词库/}).first(); if(await open.count()){try{await open.click();await page.waitForTimeout(200)}catch{}}
const rows=page.locator('#learned-library-section .kwf-learned-row');
if(await rows.count()){
 const d=await rows.first().evaluate(row=>{const rr=row.getBoundingClientRect();const sels=['.select-word','.learned-word-main','.learned-word-meaning','.learned-word-status'];let worst=0;for(const s of sels){const e=row.querySelector(s);if(!e)continue;const r=e.getBoundingClientRect();worst=Math.max(worst,Math.abs((r.top+r.height/2)-(rr.top+rr.height/2)));}return {h:rr.height,worst};});
 check('词库词条紧凑高度',d.h<=125,JSON.stringify(d)); check('词库词条垂直居中',d.worst<=12,JSON.stringify(d));
}else pass('词库词条几何','fresh profile: no learned rows');

// verify CSS contract for review 2x2 even if no review items in fresh profile
const reviewContract=await page.evaluate(()=>{const s=[...document.styleSheets].flatMap(ss=>{try{return [...ss.cssRules]}catch{return[]}}).map(r=>r.cssText).join('\n');return s.includes('#study #study-card .review-question > div')&&s.includes('repeat(2, minmax(0, 1fr))')});
check('复习选项 2×2 合同',reviewContract,'missing 2x2 rule');

if(fail.length){console.error('FAILURES\n'+fail.join('\n'));process.exitCode=1}else console.log('PASS UI v3 strict geometry regression');
await browser.close();
