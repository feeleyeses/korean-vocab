const state = { enrichment: null, scheduled: false };
const important = (el, prop, value) => el?.style?.setProperty(prop, value, 'important');
const txt = el => (el?.textContent || '').replace(/\s+/g, ' ').trim();

function injectPolishStyles() {
  document.querySelector('#kwf-layout-system-prev')?.remove();
  if (document.querySelector('#kwf-layout-system-runtime')) return;
  const style = document.createElement('style');
  style.id = 'kwf-layout-system-runtime';
  style.textContent = `
    :root { --kwf-card-h: 500px !important; --kwf-word-h: 136px !important; --kwf-action-h: 52px !important; --kwf-action-x: 24px !important; --kwf-action-gap: 10px !important; --kwf-primary-action-w: 134px !important; --kwf-secondary-action-w: 168px !important; --kwf-review-action-w: 206px !important; }
    button,summary,a.mobile-tab { box-sizing:border-box!important; transform:none!important; transition-property:background-color,background,color,border-color,box-shadow,opacity!important; transition-duration:.18s!important; transition-timing-function:ease!important; }
    button:hover,summary:hover,a.mobile-tab:hover { transform:none!important; }
    #study #study-card.study-card { position:relative!important; border-radius:22px!important; padding:0 22px 18px!important; overflow:hidden!important; }
    #study #study-card .card-meta { flex:0 0 56px!important; height:56px!important; min-height:56px!important; max-height:56px!important; padding:12px 0 6px!important; }
    #study #study-card .word { padding:6px 0 4px!important; gap:6px!important; }
    #study #study-card .word h3 { font-size:clamp(52px,5vw,72px)!important; }
    #study #study-card .pronunciation-stack { gap:4px 14px!important; }

    /* Product rule: short interaction path. Keep action controls in one fixed rail. */
    #study .logic-panel ol>li:nth-child(3) { font-size:0!important; }
    #study .logic-panel ol>li:nth-child(3)>b { font-size:inherit!important; }
    #study .logic-panel ol>li:nth-child(3)::after { content:'判断后原位继续，尽量不移动鼠标'; font-size:14px; }

    #study #study-card .pre-answer { position:relative!important; display:flex!important; flex-direction:column!important; justify-content:center!important; align-items:stretch!important; padding:0 0 70px!important; margin:0!important; }
    #study #study-card .pre-answer>p { position:static!important; margin:0 auto 6px!important; line-height:1.35!important; text-align:center!important; }
    #study #study-card .pre-answer>.show-shortcut,
    #study #study-card .review-question>.show-shortcut { position:static!important; display:inline-flex!important; align-items:center!important; justify-content:center!important; align-self:center!important; width:var(--kwf-secondary-action-w)!important; min-width:var(--kwf-secondary-action-w)!important; max-width:var(--kwf-secondary-action-w)!important; height:34px!important; min-height:34px!important; max-height:34px!important; margin:0 auto!important; padding:0 14px!important; line-height:1.2!important; text-align:center!important; border-width:0!important; }
    #study #study-card .pre-answer>div { position:absolute!important; left:calc(50% - (((3 * var(--kwf-primary-action-w)) + (2 * var(--kwf-action-gap))) / 2))!important; right:auto!important; bottom:0!important; display:grid!important; grid-template-columns:repeat(3,var(--kwf-primary-action-w))!important; gap:var(--kwf-action-gap)!important; width:calc((3 * var(--kwf-primary-action-w)) + (2 * var(--kwf-action-gap)))!important; height:var(--kwf-action-h)!important; margin:0!important; padding:0!important; }
    #study #study-card .pre-answer>div>button { width:var(--kwf-primary-action-w)!important; min-width:var(--kwf-primary-action-w)!important; max-width:var(--kwf-primary-action-w)!important; height:var(--kwf-action-h)!important; min-height:var(--kwf-action-h)!important; max-height:var(--kwf-action-h)!important; margin:0!important; border-width:0!important; }

    #study #study-card .review-question { position:relative!important; justify-content:center!important; padding:0 0 126px!important; }
    #study #study-card .review-question>p { margin:0 0 6px!important; text-align:center!important; }
    #study #study-card .review-question>.show-shortcut { margin-bottom:10px!important; }
    #study #study-card .review-question>div { position:absolute!important; left:calc(50% - (((2 * var(--kwf-review-action-w)) + var(--kwf-action-gap)) / 2))!important; right:auto!important; bottom:0!important; display:grid!important; grid-template-columns:repeat(2,var(--kwf-review-action-w))!important; grid-template-rows:repeat(2,52px)!important; gap:8px var(--kwf-action-gap)!important; width:calc((2 * var(--kwf-review-action-w)) + var(--kwf-action-gap))!important; height:112px!important; margin:0!important; padding:0!important; }
    #study #study-card .review-question>div>button { width:var(--kwf-review-action-w)!important; min-width:var(--kwf-review-action-w)!important; max-width:var(--kwf-review-action-w)!important; height:52px!important; min-height:52px!important; max-height:52px!important; margin:0!important; text-align:center!important; border-width:1px!important; }

    #study #study-card .answer,#study #study-card .compact-answer { position:static!important; padding:0 0 70px!important; margin:0!important; }
    #study #study-card .answer-scroll { gap:4px!important; padding:2px 8px!important; overflow:visible!important; }
    #study #study-card .answer-scroll h4 { font-size:clamp(26px,2.8vw,34px)!important; margin:0 0 1px!important; }
    #study #study-card .answer-scroll .sentence { font-size:clamp(18px,1.7vw,21px)!important; margin:1px auto 0!important; }
    #study #study-card .answer-scroll aside { margin:1px auto!important; }
    #study #study-card :is(button,summary) { box-sizing:border-box!important; font:700 14px/1.2 Arial,"Noto Sans KR","Microsoft YaHei",sans-serif!important; transition-property:background-color,color,border-color,box-shadow,opacity!important; transition-duration:.18s!important; transition-timing-function:ease!important; }
    #study #study-card :is(button,summary):hover { transform:none!important; }
    #study #study-card .continue { --kwf-continue-w:var(--kwf-primary-action-w); position:absolute!important; left:calc(50% - (var(--kwf-continue-w) / 2))!important; right:auto!important; bottom:18px!important; width:var(--kwf-continue-w)!important; min-width:var(--kwf-continue-w)!important; max-width:var(--kwf-continue-w)!important; height:var(--kwf-action-h)!important; min-height:var(--kwf-action-h)!important; max-height:var(--kwf-action-h)!important; margin:0!important; padding:0 18px!important; z-index:30!important; border-width:0!important; }
    #study #study-card .fuzzy-correction { margin:2px auto!important; min-height:32px!important; }

    #study #study-card details.answer-map { box-sizing:border-box!important; position:static!important; width:min(100%,500px)!important; margin:4px auto 0!important; padding:0!important; border:1px solid rgba(18,49,38,.14)!important; border-radius:12px!important; background:#fffdf7!important; opacity:1!important; overflow:hidden!important; }
    #study #study-card details.answer-map>summary { list-style:none!important; cursor:pointer!important; display:flex!important; align-items:center!important; justify-content:center!important; height:34px!important; min-height:34px!important; margin:0!important; padding:0 12px!important; font-size:13px!important; line-height:1!important; text-align:center!important; text-decoration:none!important; background:#fffdf7!important; }
    #study #study-card details.answer-map>summary::-webkit-details-marker { display:none!important; }
    #study #study-card details.answer-map>summary::after { content:'⌄'; margin-left:7px; opacity:.55; }
    #study #study-card details.answer-map[open]>summary::after { content:'⌃'; }

    /* Open state replaces only the answer body, never the fixed action rail. */
    #study #study-card details.answer-map[open] { position:absolute!important; left:22px!important; right:22px!important; top:238px!important; bottom:82px!important; z-index:20!important; display:flex!important; flex-direction:column!important; width:auto!important; margin:0!important; border:1px solid rgba(18,49,38,.18)!important; border-radius:14px!important; background:#fffdf7!important; opacity:1!important; overflow:hidden!important; box-shadow:0 8px 24px rgba(18,49,38,.08)!important; }
    #study #study-card details.answer-map[open]>summary { flex:0 0 36px!important; height:36px!important; min-height:36px!important; max-height:36px!important; border-bottom:1px solid rgba(18,49,38,.12)!important; }
    #study #study-card .option-map-list { flex:1 1 0!important; display:grid!important; grid-template-columns:repeat(2,minmax(0,1fr))!important; grid-template-rows:repeat(2,minmax(0,1fr))!important; gap:8px!important; width:100%!important; height:auto!important; min-height:0!important; max-height:none!important; margin:0!important; padding:8px!important; overflow:hidden!important; }
    #study #study-card .option-map-list article { box-sizing:border-box!important; display:grid!important; place-content:center!important; min-width:0!important; min-height:0!important; height:auto!important; margin:0!important; padding:8px 10px!important; gap:4px!important; border-radius:11px!important; overflow:hidden!important; text-align:center!important; }
    #study #study-card .option-map-list article b { font-size:14px!important; line-height:1.25!important; }
    #study #study-card .option-map-list article span { font-size:20px!important; line-height:1.2!important; font-weight:700!important; }
    #study #study-card .option-map-list article small,#study #study-card .answer-map>small { display:none!important; }

    @media(max-width:900px){
      :root { --kwf-card-h:500px!important; --kwf-word-h:132px!important; --kwf-action-h:50px!important; --kwf-action-x:14px!important; --kwf-primary-action-w:102px!important; --kwf-secondary-action-w:154px!important; --kwf-review-action-w:158px!important; }
      #study #study-card.study-card { padding:0 14px 14px!important; }
      #study #study-card .word h3 { font-size:clamp(48px,14vw,64px)!important; }
      #study #study-card .review-question>div { grid-template-rows:repeat(2,48px)!important; height:104px!important; }
      #study #study-card .review-question>div>button { height:48px!important; min-height:48px!important; max-height:48px!important; }
      #study #study-card .continue { bottom:14px!important; }
      #study #study-card details.answer-map[open] { left:14px!important; right:14px!important; top:224px!important; bottom:76px!important; }
      #study #study-card .option-map-list article b { font-size:13px!important; }
      #study #study-card .option-map-list article span { font-size:18px!important; }
    }
  `;
  document.head.appendChild(style);
}

async function enrichment(){ if(state.enrichment)return state.enrichment; try{const r=await fetch('data/enrichment.json',{cache:'no-store'});state.enrichment=r.ok?await r.json():{entries:{}};}catch{state.enrichment={entries:{}};} return state.enrichment; }
function hideMisplacedPlacement(){ const study=document.querySelector('#study'); if(!study)return; for(const label of [...study.querySelectorAll('span,p,div,small')].filter(x=>txt(x)==='选择备考起点')){let node=label;for(let i=0;node&&i<6;i++,node=node.parentElement){const t=txt(node);if((t.includes('从初级 1 开始')||t.includes('定位测验'))&&t.length<480){node.classList.add('kwf-layout-placement-misplaced');break;}}} }

function normalizeCard(){
  const card=document.querySelector('#study-card.study-card'); if(!card)return;
  const mobile=matchMedia('(max-width:900px)').matches, cardH='500px', wordH=mobile?'132px':'136px', actionH=mobile?'50px':'52px', actionX=mobile?'14px':'24px', actionGap='10px', primaryActionW=mobile?'102px':'134px', secondaryActionW=mobile?'154px':'168px', reviewActionW=mobile?'158px':'206px', continueW=primaryActionW, preActionGroupW=`calc((3 * ${primaryActionW}) + (2 * ${actionGap}))`, reviewActionGroupW=`calc((2 * ${reviewActionW}) + ${actionGap})`;
  const revealed=Boolean(card.querySelector('.answer,.compact-answer,.answer-scroll')), review=Boolean(card.querySelector('.review-question'))||/review-mode/.test(card.className);
  card.dataset.kwfLayoutSystem='layout-v1';card.dataset.kwfLayoutAuthority='layout-system'; card.dataset.kwfState=revealed?'revealed':'initial'; card.dataset.kwfMode=review?'review':'learn';
  for(const [p,v] of [['--kwf-action-h',actionH],['--kwf-action-x',actionX],['--kwf-action-gap',actionGap],['--kwf-primary-action-w',primaryActionW],['--kwf-secondary-action-w',secondaryActionW],['--kwf-review-action-w',reviewActionW]])card.style.setProperty(p,v,'important');
  for(const [p,v] of [['position','relative'],['overflow','hidden'],['display','flex'],['flex-direction','column'],['height',cardH],['min-height',cardH],['max-height',cardH]])important(card,p,v);
  const meta=card.querySelector('.card-meta'); if(meta)for(const [p,v] of [['flex','0 0 56px'],['height','56px'],['min-height','56px'],['max-height','56px']])important(meta,p,v);
  const word=card.querySelector('.word'); if(word)for(const [p,v] of [['position','static'],['inset','auto'],['transform','none'],['translate','none'],['flex',`0 0 ${wordH}`],['height',wordH],['min-height',wordH],['max-height',wordH],['margin','0']])important(word,p,v);
  for(const el of card.querySelectorAll('.pronunciation-stack,.sentence')){important(el,'position','static');important(el,'inset','auto');important(el,'transform','none');important(el,'translate','none');}
  const pre=card.querySelector('.pre-answer'); if(pre){for(const [p,v] of [['position','relative'],['flex','1 1 0'],['height','auto'],['min-height','0'],['max-height','none']])important(pre,p,v);const shortcut=pre.querySelector(':scope>.show-shortcut');if(shortcut)for(const [p,v] of [['position','static'],['align-self','center'],['width',secondaryActionW],['min-width',secondaryActionW],['max-width',secondaryActionW],['height','34px'],['min-height','34px'],['max-height','34px'],['padding','0 14px'],['border-width','0'],['transform','none'],['translate','none'],['margin-left','auto'],['margin-right','auto']])important(shortcut,p,v);const grid=pre.querySelector(':scope>div');if(grid){for(const [p,v] of [['box-sizing','border-box'],['position','absolute'],['left',`calc(50% - (${preActionGroupW} / 2))`],['right','auto'],['bottom','0'],['width',preActionGroupW],['min-width',preActionGroupW],['max-width',preActionGroupW],['height',actionH],['display','grid'],['grid-template-columns',`repeat(3,${primaryActionW})`],['gap',actionGap],['transform','none'],['translate','none'],['margin','0'],['padding','0']])important(grid,p,v);for(const b of grid.querySelectorAll(':scope>button'))for(const [p,v] of [['box-sizing','border-box'],['display','flex'],['align-items','center'],['justify-content','center'],['width',primaryActionW],['min-width',primaryActionW],['max-width',primaryActionW],['height',actionH],['min-height',actionH],['max-height',actionH],['margin','0'],['padding','0 14px'],['border-width','0'],['transform','none'],['translate','none']])important(b,p,v);}}
  for(const answer of card.querySelectorAll('.answer,.compact-answer'))for(const [p,v] of [['position','static'],['flex','1 1 0'],['display','flex'],['flex-direction','column'],['height','auto'],['min-height','0'],['max-height','none'],['padding','0 0 70px'],['margin','0']])important(answer,p,v);
  for(const scroll of card.querySelectorAll('.answer-scroll'))for(const [p,v] of [['position','static'],['flex','1 1 0'],['height','auto'],['min-height','0'],['max-height','none'],['overflow','visible']])important(scroll,p,v);
  for(const el of card.querySelectorAll('.answer *, .compact-answer *, .answer-scroll *'))important(el,'text-align','center');
  const cont=card.querySelector('.continue'); if(cont)for(const [p,v] of [['box-sizing','border-box'],['position','absolute'],['left',`calc(50% - (${continueW} / 2))`],['right','auto'],['bottom',mobile?'14px':'18px'],['width',continueW],['min-width',continueW],['max-width',continueW],['height',actionH],['min-height',actionH],['max-height',actionH],['margin','0'],['border-width','0'],['z-index','30'],['transform','none'],['translate','none']])important(cont,p,v);
  const map=card.querySelector('details.answer-map');
  if(map){
    const summary=map.querySelector(':scope>summary'), list=map.querySelector('.option-map-list');
    const closedBottom=mobile?'76px':'82px', openBottom=mobile?'76px':'82px', openH=mobile?'204px':'212px';
    if(!map.open){
      for(const [p,v] of [['box-sizing','border-box'],['position','absolute'],['left',actionX],['right','auto'],['bottom',closedBottom],['top','auto'],['width',`calc(100% - (2 * ${actionX}))`],['min-width',`calc(100% - (2 * ${actionX}))`],['max-width',`calc(100% - (2 * ${actionX}))`],['height','36px'],['min-height','36px'],['max-height','36px'],['margin','0'],['padding','0'],['overflow','hidden'],['z-index','20'],['background','#fffdf7'],['transform','none'],['translate','none']])important(map,p,v);
    }else{
      for(const [p,v] of [['box-sizing','border-box'],['position','absolute'],['left',actionX],['right','auto'],['top','auto'],['bottom',openBottom],['width',`calc(100% - (2 * ${actionX}))`],['min-width',`calc(100% - (2 * ${actionX}))`],['max-width',`calc(100% - (2 * ${actionX}))`],['height',openH],['min-height',openH],['max-height',openH],['margin','0'],['padding','0'],['display','grid'],['grid-template-rows','36px minmax(0,1fr)'],['overflow','hidden'],['z-index','24'],['opacity','1'],['background','#fffdf7'],['border-radius','14px'],['transform','none'],['translate','none']])important(map,p,v);
    }
    if(summary)for(const [p,v] of [['box-sizing','border-box'],['height','36px'],['min-height','36px'],['max-height','36px'],['display','flex'],['align-items','center'],['justify-content','center'],['margin','0'],['padding','0 12px']])important(summary,p,v);
    if(list){
      for(const [p,v] of [['box-sizing','border-box'],['display',map.open?'grid':'none'],['grid-template-columns','repeat(2,minmax(0,1fr))'],['grid-template-rows','repeat(2,minmax(0,1fr))'],['gap','8px'],['width','100%'],['min-width','0'],['max-width','100%'],['height','100%'],['min-height','0'],['max-height','100%'],['padding','8px'],['margin','0'],['overflow','hidden'],['grid-row','2']])important(list,p,v);
      for(const a of list.querySelectorAll(':scope>article'))for(const [p,v] of [['box-sizing','border-box'],['display','grid'],['place-content','center'],['visibility','visible'],['opacity','1'],['width','100%'],['min-width','0'],['max-width','100%'],['height','100%'],['min-height','0'],['max-height','100%'],['overflow','hidden'],['margin','0'],['padding',mobile?'6px 8px':'8px 10px'],['text-align','center'],['transform','none'],['translate','none']])important(a,p,v);
    }
  }
  const question=card.querySelector('.review-question'); if(question){for(const [p,v] of [['position','relative'],['flex','1 1 0'],['height','auto'],['min-height','0'],['max-height','none'],['overflow','visible']])important(question,p,v);const shortcut=question.querySelector(':scope>.show-shortcut');if(shortcut)for(const [p,v] of [['position','static'],['align-self','center'],['width',secondaryActionW],['min-width',secondaryActionW],['max-width',secondaryActionW],['height','34px'],['min-height','34px'],['max-height','34px'],['padding','0 14px'],['border-width','0'],['transform','none'],['translate','none'],['margin-left','auto'],['margin-right','auto']])important(shortcut,p,v);const grid=question.querySelector(':scope>div');if(grid){for(const [p,v] of [['box-sizing','border-box'],['position','absolute'],['left',`calc(50% - (${reviewActionGroupW} / 2))`],['right','auto'],['bottom','0'],['width',reviewActionGroupW],['min-width',reviewActionGroupW],['max-width',reviewActionGroupW],['display','grid'],['grid-template-columns',`repeat(2,${reviewActionW})`],['grid-template-rows',mobile?'repeat(2,48px)':'repeat(2,52px)'],['gap',`8px ${actionGap}`],['height',mobile?'104px':'112px'],['transform','none'],['translate','none'],['margin','0'],['padding','0']])important(grid,p,v);for(const b of grid.querySelectorAll(':scope>button'))for(const [p,v] of [['box-sizing','border-box'],['display','flex'],['align-items','center'],['justify-content','center'],['width',reviewActionW],['min-width',reviewActionW],['max-width',reviewActionW],['height',mobile?'48px':'52px'],['min-height',mobile?'48px':'52px'],['max-height',mobile?'48px':'52px'],['margin','0'],['padding','0 14px'],['border-width','1px'],['transform','none'],['translate','none']])important(b,p,v);}}
}
function normalizeReviewStack(){const board=document.querySelector('#review .review-board');if(!board)return;board.classList.add('kwf-layout-review-stack');important(board,'display','flex');important(board,'flex-direction','column');important(board,'width','100%');for(const el of board.querySelectorAll('.learned-stat,.memory-profile,.memory-note,#learned-library-section')){important(el,'width','100%');important(el,'max-width','100%');important(el,'grid-column','1 / -1');}}
async function normalizeLearnedRows(){const data=await enrichment(),entries=data?.entries||{};for(const row of document.querySelectorAll('#learned-library-section .kwf-learned-row')){row.dataset.kwfLayoutSystem='layout-v1';important(row,'align-items','center');const main=row.querySelector('.learned-word-main'),meaning=row.querySelector('.learned-word-meaning'),status=row.querySelector('.learned-word-status');for(const el of [main,meaning,status]){important(el,'align-self','center');important(el,'justify-content','center');}const word=txt(main?.querySelector('b,strong'));if(!word)continue;const collocations=entries[word]?.collocations?.slice(0,2)||[];let host=row.querySelector('.kwf-row-collocation');if(!collocations.length){host?.remove();continue;}if(!host){host=document.createElement('div');host.className='kwf-row-collocation';row.appendChild(host);}host.replaceChildren(...collocations.map(item=>{const s=document.createElement('span');s.textContent=item;s.title=item;return s;}));}}
async function apply(){state.scheduled=false;injectPolishStyles();document.documentElement.dataset.kwfLayoutSystem='layout-v1';document.documentElement.dataset.kwfLayoutAuthority='layout-system';window.__KWF_LAYOUT_SYSTEM_READY__=true;hideMisplacedPlacement();normalizeCard();normalizeReviewStack();await normalizeLearnedRows();}
function schedule(){if(state.scheduled)return;state.scheduled=true;requestAnimationFrame(apply);}
const observer=new MutationObserver(schedule);
function boot(){window.__KWF_LAYOUT_SYSTEM_READY__=true;injectPolishStyles();observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','open']});addEventListener('resize',schedule,{passive:true});schedule();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
