const state = { enrichment: null, scheduled: false };
const important = (el, prop, value) => el?.style?.setProperty(prop, value, 'important');
const txt = el => (el?.textContent || '').replace(/\s+/g, ' ').trim();

function injectPolishStyles() {
  if (document.querySelector('#kwf-ui-v31')) return;
  const style = document.createElement('style');
  style.id = 'kwf-ui-v31';
  style.textContent = `
    :root { --kwf-card-h: 540px !important; --kwf-word-h: 148px !important; }
    #study #study-card.study-card { border-radius: 22px !important; padding-bottom: 18px !important; }
    #study #study-card .card-meta { padding: 14px 0 8px !important; }
    #study #study-card .word { padding: 8px 0 6px !important; gap: 8px !important; }
    #study #study-card .word h3 { font-size: clamp(54px,5.3vw,76px) !important; }
    #study #study-card .pronunciation-stack { gap: 5px 16px !important; }

    /* Initial learning: one compact control cluster, no floating hint/shortcut collision. */
    #study #study-card .pre-answer {
      justify-content: center !important;
      align-items: stretch !important;
      gap: 0 !important;
      padding-top: 8px !important;
    }
    #study #study-card .pre-answer > p {
      position: static !important;
      margin: 0 auto 4px !important;
      line-height: 1.35 !important;
    }
    #study #study-card .pre-answer > .show-shortcut {
      position: static !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      min-height: 34px !important;
      height: 34px !important;
      margin: 0 auto 14px !important;
      padding: 4px 12px !important;
      line-height: 1.2 !important;
    }
    #study #study-card .pre-answer > div { margin-top: 0 !important; }

    /* Review question follows the same compact vertical rhythm. */
    #study #study-card .review-question { justify-content: center !important; padding-top: 4px !important; }
    #study #study-card .review-question > p { margin: 0 0 5px !important; }
    #study #study-card .review-question > .show-shortcut {
      min-height: 34px !important; height: 34px !important; margin: 0 auto 10px !important; padding: 4px 12px !important;
    }
    #study #study-card .review-question > div { gap: 8px 10px !important; }

    /* Revealed answer: denser hierarchy, no nested scrolling. */
    #study #study-card .answer-scroll { gap: 5px !important; padding: 4px 8px 2px !important; }
    #study #study-card .answer-scroll h4 { font-size: clamp(27px,3vw,36px) !important; margin: 0 0 2px !important; }
    #study #study-card .answer-scroll .sentence { font-size: clamp(18px,1.8vw,22px) !important; margin: 2px auto 0 !important; }
    #study #study-card .answer-scroll aside { margin: 1px auto !important; }
    #study #study-card .continue { height: 46px !important; min-height: 46px !important; max-height: 46px !important; flex-basis: 46px !important; margin-top: 6px !important; }

    /* Option → Korean mapping becomes a lightweight comparison tray instead of a scroll box. */
    #study #study-card details.answer-map {
      box-sizing: border-box !important;
      width: calc(100% - 16px) !important;
      margin: 5px 8px 2px !important;
      padding: 0 !important;
      border: 1px solid rgba(18,49,38,.14) !important;
      border-radius: 14px !important;
      background: rgba(239,244,239,.72) !important;
      overflow: hidden !important;
    }
    #study #study-card details.answer-map > summary {
      list-style: none !important;
      cursor: pointer !important;
      min-height: 34px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      margin: 0 !important;
      padding: 6px 12px !important;
      font-size: 13px !important;
      text-decoration: none !important;
    }
    #study #study-card details.answer-map > summary::-webkit-details-marker { display:none !important; }
    #study #study-card details.answer-map > summary::after { content:'⌄'; margin-left:7px; opacity:.55; }
    #study #study-card details.answer-map[open] > summary::after { content:'⌃'; }
    #study #study-card .option-map-list {
      display: grid !important;
      grid-template-columns: repeat(2,minmax(0,1fr)) !important;
      gap: 7px !important;
      width: 100% !important;
      max-height: none !important;
      height: auto !important;
      overflow: visible !important;
      margin: 0 !important;
      padding: 0 8px 8px !important;
    }
    #study #study-card .option-map-list article {
      box-sizing: border-box !important;
      min-height: 58px !important;
      height: 58px !important;
      display: grid !important;
      grid-template-columns: 1fr !important;
      place-content: center !important;
      gap: 2px !important;
      margin: 0 !important;
      padding: 6px 8px !important;
      border-radius: 11px !important;
      overflow: hidden !important;
    }
    #study #study-card .option-map-list article b { font-size: 13px !important; line-height: 1.2 !important; }
    #study #study-card .option-map-list article span { font-size: 18px !important; line-height: 1.2 !important; font-weight: 650 !important; }
    #study #study-card .option-map-list article small { display: none !important; }
    #study #study-card .answer-map > small { display:block !important; margin: 3px 10px 8px !important; font-size:11px !important; line-height:1.3 !important; }

    @media (max-width: 900px) {
      :root { --kwf-card-h: 520px !important; --kwf-word-h: 142px !important; }
      #study #study-card.study-card { padding-bottom: 14px !important; }
      #study #study-card .word h3 { font-size: clamp(50px,15vw,68px) !important; }
      #study #study-card .pre-answer > div { width: calc(100% - 28px) !important; margin-left:14px !important; margin-right:14px !important; gap:8px !important; }
      #study #study-card .pre-answer > div > button { min-height: 50px !important; }
      #study #study-card .review-question > div { width: calc(100% - 28px) !important; }
      #study #study-card .option-map-list article { min-height:54px !important; height:54px !important; }
    }
  `;
  document.head.appendChild(style);
}

async function enrichment() {
  if (state.enrichment) return state.enrichment;
  try {
    const r = await fetch('data/enrichment.json', { cache: 'no-store' });
    state.enrichment = r.ok ? await r.json() : { entries: {} };
  } catch { state.enrichment = { entries: {} }; }
  return state.enrichment;
}

function hideMisplacedPlacement() {
  const study = document.querySelector('#study');
  if (!study) return;
  for (const label of [...study.querySelectorAll('span,p,div,small')].filter(x => txt(x) === '选择备考起点')) {
    let node = label;
    for (let i = 0; node && i < 6; i++, node = node.parentElement) {
      const t = txt(node);
      if ((t.includes('从初级 1 开始') || t.includes('定位测验')) && t.length < 480) { node.classList.add('kwf-v3-placement-misplaced'); break; }
    }
  }
}

function normalizeCard() {
  const card = document.querySelector('#study-card.study-card');
  if (!card) return;
  const mobile = matchMedia('(max-width: 900px)').matches;
  const cardH = mobile ? '520px' : '540px';
  const wordH = mobile ? '142px' : '148px';
  const revealed = Boolean(card.querySelector('.answer,.compact-answer,.answer-scroll'));
  const review = Boolean(card.querySelector('.review-question')) || /review-mode/.test(card.className);
  card.dataset.kwfUi = 'v3.1'; card.dataset.kwfState = revealed ? 'revealed' : 'initial'; card.dataset.kwfMode = review ? 'review' : 'learn';
  for (const [prop,value] of [['overflow','hidden'],['display','flex'],['flex-direction','column'],['height',cardH],['min-height',cardH],['max-height',cardH]]) important(card,prop,value);
  const meta = card.querySelector('.card-meta');
  if (meta) for (const [p,v] of [['flex','0 0 60px'],['height','60px'],['min-height','60px'],['max-height','60px']]) important(meta,p,v);
  const word = card.querySelector('.word');
  if (word) for (const [p,v] of [['position','static'],['inset','auto'],['transform','none'],['translate','none'],['flex',`0 0 ${wordH}`],['height',wordH],['min-height',wordH],['max-height',wordH],['margin','0']]) important(word,p,v);
  for (const el of card.querySelectorAll('.pre-answer,.answer,.compact-answer,.answer-scroll,.review-question,.pronunciation-stack,.sentence,.continue')) {
    important(el,'position','static'); important(el,'inset','auto'); important(el,'transform','none'); important(el,'translate','none');
  }
  const pre = card.querySelector('.pre-answer');
  if (pre) for (const [p,v] of [['flex','1 1 0'],['height','auto'],['min-height','0'],['max-height','none']]) important(pre,p,v);
  for (const answer of card.querySelectorAll('.answer,.compact-answer')) for (const [p,v] of [['flex','1 1 0'],['display','flex'],['flex-direction','column'],['height','auto'],['min-height','0'],['max-height','none'],['padding','0'],['margin','0']]) important(answer,p,v);
  for (const scroll of card.querySelectorAll('.answer-scroll')) for (const [p,v] of [['flex','1 1 0'],['height','auto'],['min-height','0'],['max-height','none'],['overflow','visible']]) important(scroll,p,v);
  for (const el of card.querySelectorAll('.answer *, .compact-answer *, .answer-scroll *')) important(el,'text-align','center');
  const question = card.querySelector('.review-question');
  if (question) for (const [p,v] of [['flex','1 1 0'],['height','auto'],['min-height','0'],['max-height','none'],['overflow','visible']]) important(question,p,v);
  for (const grid of card.querySelectorAll('.review-question > div')) {
    important(grid,'display','grid'); important(grid,'grid-template-columns','repeat(2,minmax(0,1fr))'); important(grid,'grid-template-rows',mobile?'repeat(2,48px)':'repeat(2,50px)'); important(grid,'height','auto');
  }
}

function normalizeReviewStack() {
  const board = document.querySelector('#review .review-board'); if (!board) return;
  board.classList.add('kwf-v3-review-stack'); important(board,'display','flex'); important(board,'flex-direction','column'); important(board,'width','100%');
  for (const el of board.querySelectorAll('.learned-stat,.memory-profile,.memory-note,#learned-library-section')) { important(el,'width','100%'); important(el,'max-width','100%'); important(el,'grid-column','1 / -1'); }
}

async function normalizeLearnedRows() {
  const data = await enrichment(), entries = data?.entries || {};
  for (const row of document.querySelectorAll('#learned-library-section .kwf-learned-row')) {
    row.dataset.kwfUi='v3.1'; important(row,'align-items','center');
    const main=row.querySelector('.learned-word-main'), meaning=row.querySelector('.learned-word-meaning'), status=row.querySelector('.learned-word-status');
    for (const el of [main,meaning,status]) { important(el,'align-self','center'); important(el,'justify-content','center'); }
    const word=txt(main?.querySelector('b,strong')); if(!word) continue;
    const collocations=entries[word]?.collocations?.slice(0,2)||[]; let host=row.querySelector('.kwf-row-collocation');
    if(!collocations.length){host?.remove();continue;} if(!host){host=document.createElement('div');host.className='kwf-row-collocation';row.appendChild(host);}
    host.replaceChildren(...collocations.map(item=>{const s=document.createElement('span');s.textContent=item;s.title=item;return s;}));
  }
}

async function apply(){ state.scheduled=false; injectPolishStyles(); document.documentElement.dataset.kwfUi='v3.1'; window.__KWF_UI_V3_READY__=true; hideMisplacedPlacement(); normalizeCard(); normalizeReviewStack(); await normalizeLearnedRows(); }
function schedule(){ if(state.scheduled)return; state.scheduled=true; requestAnimationFrame(apply); }
const observer=new MutationObserver(schedule);
function boot(){ injectPolishStyles(); observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']}); addEventListener('resize',schedule,{passive:true}); schedule(); }
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
