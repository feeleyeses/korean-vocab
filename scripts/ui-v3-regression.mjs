import { chromium } from 'playwright';

const url = process.env.KWF_URL || 'https://feeleyeses.github.io/korean-vocab/';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(800);

const failures = [];
const pass = (name, detail) => console.log(`PASS ${name}: ${detail}`);
const check = (name, ok, detail) => ok ? pass(name, detail) : failures.push(`${name}: ${detail}`);
const domClick = async locator => locator.evaluate(el => el.click());

check('UI v3 runtime', await page.evaluate(() => window.__KWF_UI_V3_READY__ === true), 'runtime not ready');

const initial = await page.locator('#study-card').evaluate(card => {
  const r = card.getBoundingClientRect();
  const group = card.querySelector('.pre-answer > div');
  const gr = group.getBoundingClientRect();
  const cols = getComputedStyle(group).gridTemplateColumns.split(' ').filter(Boolean).length;
  const buttons = [...group.querySelectorAll('button')].map(b => b.getBoundingClientRect());
  const word = card.querySelector('.word').getBoundingClientRect();
  return {
    h: r.height, wordH: word.height,
    groupLeft: Math.round(gr.left-r.left), groupRight: Math.round(r.right-gr.right),
    firstButtonLeft: Math.round(buttons[0].left-r.left), lastButtonRight: Math.round(r.right-buttons.at(-1).right), cols
  };
});
check('学习卡固定高度', initial.h === 620, JSON.stringify(initial));
check('学习主词区固定高度', Math.abs(initial.wordH - 168) <= 2, JSON.stringify(initial));
check('学习按钮保留卡片边距', initial.firstButtonLeft >= 20 && initial.lastButtonRight >= 20, JSON.stringify(initial));
check('学习初始页三按钮单行', initial.cols === 3, JSON.stringify(initial));

await page.locator('#study-card .pre-answer').getByRole('button', { name: '不认识', exact: true }).click();
await page.waitForTimeout(300);
const learningReveal = await page.locator('#study-card').evaluate(card => {
  const r=card.getBoundingClientRect();
  const answer=card.querySelector('.answer,.compact-answer');
  const ar=answer?.getBoundingClientRect();
  const visible=[...card.querySelectorAll('.answer-scroll *')].filter(x=>{const b=x.getBoundingClientRect();return b.width&&b.height&&x.children.length===0&&(x.textContent||'').trim()});
  return {h:r.height, answerH:ar?.height||0, padding:answer?getComputedStyle(answer).padding:null, align:visible.map(x=>getComputedStyle(x).textAlign)};
});
check('学习揭晓页与初始页等高', Math.abs(learningReveal.h-initial.h)<=2, JSON.stringify(learningReveal));
check('学习揭晓无遗留大内边距', learningReveal.padding === '0px', JSON.stringify(learningReveal));
check('学习揭晓文字水平居中', learningReveal.align.length>0 && learningReveal.align.every(x=>x==='center'), JSON.stringify(learningReveal.align));

const openLearned=page.getByRole('button',{name:/打开已学词库|查看已学词库/}).first();
await domClick(openLearned); await page.waitForTimeout(350);
const control=await page.locator('#learned-library-section .kwf-learned-control').evaluate(el=>({h:el.getBoundingClientRect().height,display:getComputedStyle(el).display}));
check('已学筛选区压缩', control.h <= 230, JSON.stringify(control));
const rows=page.locator('#learned-library-section .kwf-learned-row');
check('真实已学词条已生成',await rows.count()>0,`rows=${await rows.count()}`);
if(await rows.count()){
  const learned=await rows.first().evaluate(row=>{const rr=row.getBoundingClientRect(),center=rr.top+rr.height/2,offsets={};for(const sel of ['.select-word','.learned-word-main','.learned-word-meaning','.learned-word-status']){const el=row.querySelector(sel);if(!el)continue;const r=el.getBoundingClientRect();offsets[sel]=Math.round(Math.abs((r.top+r.height/2)-center));}return {h:rr.height,offsets,worst:Math.max(0,...Object.values(offsets))}});
  check('词库词条紧凑高度',learned.h<=125,JSON.stringify(learned));
  check('词库词条垂直居中',learned.worst<=12,JSON.stringify(learned));
}

const fullReviewArticle=page.locator('#review .review-module-grid article').filter({hasText:'全量库'}).first();
const fullReviewButton=fullReviewArticle.locator('button');
check('全量库复习入口已启用',await fullReviewButton.count()>0&&!(await fullReviewButton.isDisabled()),`text=${await fullReviewButton.textContent().catch(()=> '')}`);
if(await fullReviewButton.count()&&!(await fullReviewButton.isDisabled())){
  await domClick(fullReviewButton); await page.waitForTimeout(400);
  const reviewInitial=await page.locator('#study-card').evaluate(card=>{const r=card.getBoundingClientRect(),word=card.querySelector('.word')?.getBoundingClientRect(),q=card.querySelector('.review-question'),qr=q?.getBoundingClientRect(),grid=q?.querySelector('div'),buttons=grid?[...grid.querySelectorAll('button')]:[],rects=buttons.map(b=>b.getBoundingClientRect()),rowTops=[...new Set(rects.map(x=>Math.round(x.top)))],cols=grid?getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length:0;return {h:r.height,wordH:word?.height||0,questionH:qr?.height||0,buttons:buttons.length,rows:rowTops.length,cols}});
  check('复习初始页主词区未异常撑高',Math.abs(reviewInitial.wordH-168)<=2 && reviewInitial.questionH>=250,JSON.stringify(reviewInitial));
  check('复习初始页真实 2×2',reviewInitial.buttons===4&&reviewInitial.rows===2&&reviewInitial.cols===2,JSON.stringify(reviewInitial));
  const reviewOption=page.locator('#study-card .review-question button').first();
  if(await reviewOption.count()){
    await domClick(reviewOption); await page.waitForTimeout(300);
    const reviewReveal=await page.locator('#study-card').evaluate(card=>{const r=card.getBoundingClientRect(),answer=card.querySelector('.answer-scroll,.answer,.compact-answer'),visible=answer?[...answer.querySelectorAll('*')].filter(x=>{const b=x.getBoundingClientRect();return b.width>0&&b.height>0&&x.children.length===0&&(x.textContent||'').trim()}):[];return {h:r.height,hasAnswer:Boolean(answer),align:visible.map(x=>getComputedStyle(x).textAlign)}});
    check('复习揭晓页与初始页等高',Math.abs(reviewReveal.h-reviewInitial.h)<=2,JSON.stringify(reviewReveal));
    check('复习揭晓文字水平居中',reviewReveal.hasAnswer&&reviewReveal.align.length>0&&reviewReveal.align.every(x=>x==='center'),JSON.stringify(reviewReveal.align));
  } else failures.push('复习真实选项不存在');
}

if(failures.length){console.error('FAILURES\n'+failures.join('\n'));process.exitCode=1}else console.log('PASS UI v3 strict real-state geometry regression');
await browser.close();
