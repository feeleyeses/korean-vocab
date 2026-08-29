const playwrightModule = await import(process.env.PLAYWRIGHT_MODULE || 'playwright').catch(() => import('playwright'));
const { chromium } = playwrightModule.default || playwrightModule;
const url=process.env.KWF_URL||'https://feeleyeses.github.io/korean-vocab/';
const browser=await chromium.launch({headless:true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const page=await browser.newPage({viewport:{width:1440,height:900}});
await page.goto(`${url}?review38=${Date.now()}`,{waitUntil:'networkidle',timeout:60000});
await page.evaluate(()=>{
  const now=new Date();
  const past=new Date(now.getTime()-3600000).toISOString();
  localStorage.setItem('kwf:profile',JSON.stringify({stats:{newCount:0,reviewCount:0,streak:1,lastStudyDate:'',learned:1},learnedIds:['w001'],unlockedLevel:2,startPanelOpen:false}));
  localStorage.setItem('memory:w001-s1',JSON.stringify({wordId:'w001',senseId:'w001-s1',rating:'remember',reviewedAt:past,dueAt:past,stability:1,difficulty:5,lapses:0,mode:'new',objectiveCorrect:true}));
});
await page.reload({waitUntil:'networkidle'});
await page.waitForFunction(()=>window.__KWF_LAYOUT_SYSTEM_READY__===true&&document.documentElement.dataset.kwfLayoutAuthority==='layout-system',{timeout:10000});
const click=async loc=>loc.evaluate(el=>el.click());
const openLearned=page.getByRole('button',{name:/打开已学词库|查看已学词库/}).first();
await click(openLearned); await page.waitForTimeout(200);
const full=page.locator('#review .review-module-grid article').filter({hasText:'全量库'}).first().locator('button');
if(!await full.count()||await full.isDisabled())throw new Error('全量库复习入口不可用');
await click(full); await page.waitForTimeout(300);
await page.waitForSelector('#study-card.review-mode .review-question');
await page.waitForFunction(() => { const card=document.querySelector('#study-card'); const grid=card?.querySelector('.review-question > div'); if(!card||!grid||card.dataset.kwfLayoutAuthority!=='layout-system') return false; const cr=card.getBoundingClientRect(), gr=grid.getBoundingClientRect(); return gr.width / cr.width > 0.84; }, { timeout: 10000 });
const initial=await page.locator('#study-card').evaluate(card=>{
 const cr=card.getBoundingClientRect(),q=card.querySelector('.review-question'),qr=q.getBoundingClientRect(),g=q.querySelector(':scope>div'),gr=g.getBoundingClientRect(),bs=[...g.querySelectorAll(':scope>button')].map(b=>b.getBoundingClientRect());
 return {cardW:cr.width,qW:qr.width,gridW:gr.width,gridRatio:gr.width/cr.width,left:gr.left-cr.left,right:cr.right-gr.right,count:bs.length,widths:bs.map(x=>x.width),heights:bs.map(x=>x.height)};
});
if(initial.count!==4)throw new Error(`复习选项不是4个: ${JSON.stringify(initial)}`);
if(initial.gridRatio<0.84)throw new Error(`按钮组没有明显沿X轴拉长: ${JSON.stringify(initial)}`);
if(Math.max(...initial.widths)-Math.min(...initial.widths)>2)throw new Error(`复习选项宽度不固定统一: ${JSON.stringify(initial)}`);
if(Math.max(...initial.heights)-Math.min(...initial.heights)>2)throw new Error(`复习选项高度不固定统一: ${JSON.stringify(initial)}`);
await click(page.locator('#study-card .review-question>div>button').first()); await page.waitForTimeout(300);
const collapsed=await page.locator('#study-card').evaluate(card=>{
 const map=card.querySelector('details.answer-map'),mr=map.getBoundingClientRect(),scroll=card.querySelector('.answer-scroll'),sr=scroll.getBoundingClientRect(),cont=card.querySelector('.continue').getBoundingClientRect();
 return {mapTop:mr.top,mapBottom:mr.bottom,answerTop:sr.top,answerBottom:sr.bottom,continueTop:cont.top,overlapContinue:mr.bottom>cont.top,summaryOverAnswer:mr.top<sr.bottom-42};
});
if(collapsed.overlapContinue)throw new Error(`收起态对应韩文遮挡继续按钮: ${JSON.stringify(collapsed)}`);
const details=page.locator('#study-card details.answer-map');
await details.locator('summary').click(); await page.waitForTimeout(250);
const reveal=await page.locator('#study-card').evaluate(card=>{
 const cr=card.getBoundingClientRect(),c=card.querySelector('.continue').getBoundingClientRect(),map=card.querySelector('details.answer-map[open]'),mr=map.getBoundingClientRect(),list=map.querySelector('.option-map-list'),arts=[...list.querySelectorAll(':scope>article')];
 return {continueW:c.width,continueRatio:c.width/cr.width,continueLeft:c.left-cr.left,continueRight:cr.right-c.right,mapCount:arts.length,mapRows:new Set(arts.map(a=>Math.round(a.getBoundingClientRect().top))).size,mapVisible:arts.map(a=>{const r=a.getBoundingClientRect();return r.width>70&&r.height>45&&r.top>=mr.top&&r.bottom<=mr.bottom&&r.left>=mr.left&&r.right<=mr.right}),articleRects:arts.map(a=>{const r=a.getBoundingClientRect();return {w:r.width,h:r.height,top:r.top,left:r.left}}),scroll:list.scrollHeight,client:list.clientHeight,mapBottom:mr.bottom,continueTop:c.top};
});
if(reveal.continueRatio<0.84)throw new Error(`继续按钮没有明显沿X轴拉长: ${JSON.stringify(reveal)}`);
if(reveal.mapCount!==4||reveal.mapRows!==2||!reveal.mapVisible.every(Boolean))throw new Error(`对应韩文未完整显示4项: ${JSON.stringify(reveal)}`);
if(reveal.scroll>reveal.client+2)throw new Error(`对应韩文发生内部滚动: ${JSON.stringify(reveal)}`);
if(reveal.mapBottom>reveal.continueTop)throw new Error(`对应韩文遮挡继续按钮: ${JSON.stringify(reveal)}`);
console.log('PASS Layout System review fixed wide controls + four visible mappings',JSON.stringify({initial,collapsed,reveal}));
await browser.close();
