const state={enrichment:null,scheduled:false};
const important=(el,prop,value)=>el?.style?.setProperty(prop,value,'important');
const txt=el=>(el?.textContent||'').replace(/\s+/g,' ').trim();

function injectStyles(){
  if(document.querySelector('#kwf-ui-v33'))return;
  const s=document.createElement('style');
  s.id='kwf-ui-v33';
  s.textContent=`
  :root{--kwf-card-h:500px!important;--kwf-word-h:136px!important;--kwf-action-h:52px!important;--kwf-action-x:24px!important;--kwf-rail-edge:46px!important}
  #study #study-card.study-card{position:relative!important;border-radius:22px!important;padding:0 22px 18px!important;overflow:hidden!important}
  #study #study-card .card-meta{flex:0 0 56px!important;height:56px!important;min-height:56px!important;max-height:56px!important;padding:12px 0 6px!important}
  #study #study-card .word{padding:6px 0 4px!important;gap:6px!important}
  #study #study-card .word h3{font-size:clamp(52px,5vw,72px)!important}
  #study #study-card .pronunciation-stack{gap:4px 14px!important}

  /* Product invariant: answer in place, continue in place, minimal pointer travel. */
  #study .logic-panel ol>li:nth-child(3){font-size:0!important}
  #study .logic-panel ol>li:nth-child(3)>b{font-size:14px!important}
  #study .logic-panel ol>li:nth-child(3)::after{content:'判断后原位继续，尽量不移动鼠标';font-size:14px!important}

  #study #study-card .pre-answer{position:relative!important;display:flex!important;flex-direction:column!important;justify-content:center!important;align-items:stretch!important;padding:0 0 70px!important;margin:0!important}
  #study #study-card .pre-answer>p{position:static!important;inset:auto!important;transform:none!important;translate:none!important;margin:0 auto 6px!important;line-height:1.35!important;text-align:center!important}
  #study #study-card .pre-answer>.show-shortcut,#study #study-card .review-question>.show-shortcut{box-sizing:border-box!important;position:static!important;inset:auto!important;left:auto!important;right:auto!important;transform:none!important;translate:none!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;align-self:center!important;width:auto!important;min-width:118px!important;height:34px!important;min-height:34px!important;max-height:34px!important;margin:0 auto!important;padding:4px 14px!important;line-height:1.2!important;text-align:center!important}
  #study #study-card .pre-answer>div{box-sizing:border-box!important;position:absolute!important;left:var(--kwf-action-x)!important;right:var(--kwf-action-x)!important;bottom:0!important;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:10px!important;width:auto!important;height:var(--kwf-action-h)!important;margin:0!important;padding:0!important}
  #study #study-card .pre-answer>div>button{box-sizing:border-box!important;width:100%!important;height:var(--kwf-action-h)!important;min-height:var(--kwf-action-h)!important;max-height:var(--kwf-action-h)!important;margin:0!important;padding-block:0!important}

  #study #study-card .review-question{position:relative!important;justify-content:center!important;padding:0 0 126px!important}
  #study #study-card .review-question>p{margin:0 0 6px!important;text-align:center!important}
  #study #study-card .review-question>.show-shortcut{margin-bottom:10px!important}
  #study #study-card .review-question>div{box-sizing:border-box!important;position:absolute!important;left:var(--kwf-action-x)!important;right:var(--kwf-action-x)!important;bottom:0!important;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;grid-template-rows:repeat(2,52px)!important;gap:8px 10px!important;width:auto!important;height:112px!important;margin:0!important;padding:0!important}
  #study #study-card .review-question>div>button{box-sizing:border-box!important;width:100%!important;height:52px!important;min-height:52px!important;max-height:52px!important;margin:0!important;padding-block:0!important;text-align:center!important}

  #study #study-card .answer,#study #study-card .compact-answer{position:static!important;padding:0 0 70px!important;margin:0!important}
  #study #study-card .answer-scroll{gap:4px!important;padding:2px 8px!important;overflow:visible!important}
  #study #study-card .answer-scroll h4{font-size:clamp(26px,2.8vw,34px)!important;margin:0 0 1px!important}
  #study #study-card .answer-scroll .sentence{font-size:clamp(18px,1.7vw,21px)!important;margin:1px auto 0!important}
  #study #study-card .answer-scroll aside{margin:1px auto!important}
  #study #study-card .continue{box-sizing:border-box!important;position:absolute!important;left:var(--kwf-rail-edge)!important;right:var(--kwf-rail-edge)!important;bottom:18px!important;width:auto!important;height:var(--kwf-action-h)!important;min-height:var(--kwf-action-h)!important;max-height:var(--kwf-action-h)!important;margin:0!important;padding:0 18px!important;z-index:30!important}
  #study #study-card .fuzzy-correction{margin:2px auto!important;min-height:32px!important}

  #study #study-card details.answer-map{box-sizing:border-box!important;position:static!important;width:min(100%,500px)!important;margin:4px auto 0!important;padding:0!important;border:1px solid rgba(18,49,38,.14)!important;border-radius:12px!important;background:#fffdf7!important;opacity:1!important;overflow:hidden!important}
  #study #study-card details.answer-map>summary{box-sizing:border-box!important;list-style:none!important;cursor:pointer!important;display:flex!important;align-items:center!important;justify-content:center!important;height:34px!important;min-height:34px!important;margin:0!important;padding:0 12px!important;font-size:13px!important;line-height:1!important;text-align:center!important;text-decoration:none!important;background:#fffdf7!important}
  #study #study-card details.answer-map>summary::-webkit-details-marker{display:none!important}
  #study #study-card details.answer-map>summary::after{content:'⌄';margin-left:7px;opacity:.55}
  #study #study-card details.answer-map[open]>summary::after{content:'⌃'}
  #study #study-card details.answer-map[open]{position:absolute!important;left:22px!important;right:22px!important;top:238px!important;bottom:82px!important;z-index:20!important;display:flex!important;flex-direction:column!important;width:auto!important;margin:0!important;border:1px solid rgba(18,49,38,.18)!important;border-radius:14px!important;background:#fffdf7!important;opacity:1!important;overflow:hidden!important;box-shadow:0 8px 24px rgba(18,49,38,.08)!important}
  #study #study-card details.answer-map[open]>summary{flex:0 0 36px!important;height:36px!important;min-height:36px!important;max-height:36px!important;border-bottom:1px solid rgba(18,49,38,.12)!important}
  #study #study-card .option-map-list{box-sizing:border-box!important;flex:1 1 0!important;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;grid-template-rows:repeat(2,minmax(0,1fr))!important;gap:8px!important;width:100%!important;height:auto!important;min-height:0!important;max-height:none!important;margin:0!important;padding:8px!important;overflow:hidden!important}
  #study #study-card .option-map-list article{box-sizing:border-box!important;display:grid!important;place-content:center!important;min-width:0!important;min-height:0!important;height:auto!important;margin:0!important;padding:8px 10px!important;gap:4px!important;border-radius:11px!important;overflow:hidden!important;text-align:center!important}
  #study #study-card .option-map-list article b{font-size:14px!important;line-height:1.25!important}
  #study #study-card .option-map-list article span{font-size:20px!important;line-height:1.2!important;font-weight:700!important}
  #study #study-card .option-map-list article small,#study #study-card .answer-map>small{display:none!important}

  @media(max-width:900px){
    :root{--kwf-card-h:500px!important;--kwf-word-h:132px!important;--kwf-action-h:50px!important;--kwf-action-x:14px!important;--kwf-rail-edge:28px!important}
    #study #study-card.study-card{padding:0 14px 14px!important}
    #study #study-card .word h3{font-size:clamp(48px,14vw,64px)!important}
    #study #study-card .review-question>div{grid-template-rows:repeat(2,48px)!important;height:104px!important}
    #study #study-card .review-question>div>button{height:48px!important;min-height:48px!important;max-height:48px!important}
    #study #study-card .continue{bottom:14px!important}
    #study #study-card details.answer-map[open]{left:14px!important;right:14px!important;top:224px!important;bottom:76px!important}
    #study #study-card .option-map-list article b{font-size:13px!important}
    #study #study-card .option-map-list article span{font-size:18px!important}
  }`;
  document.head.appendChild(s);
}

async function enrichment(){if(state.enrichment)return state.enrichment;try{const r=await fetch('data/enrichment.json',{cache:'no-store'});state.enrichment=r.ok?await r.json():{entries:{}}}catch{state.enrichment={entries:{}}}return state.enrichment}
function hideMisplacedPlacement(){const study=document.querySelector('#study');if(!study)return;for(const label of [...study.querySelectorAll('span,p,div,small')].filter(x=>txt(x)==='选择备考起点')){let node=label;for(let i=0;node&&i<6;i++,node=node.parentElement){const t=txt(node);if((t.includes('从初级 1 开始')||t.includes('定位测验'))&&t.length<480){node.classList.add('kwf-v3-placement-misplaced');break}}}}
function normalizeCard(){
  const card=document.querySelector('#study-card.study-card');if(!card)return;
  const mobile=matchMedia('(max-width:900px)').matches,cardH='500px',wordH=mobile?'132px':'136px',actionH=mobile?'50px':'52px',actionX=mobile?'14px':'24px',railEdge=mobile?'28px':'46px';
  const revealed=Boolean(card.querySelector('.answer,.compact-answer,.answer-scroll')),review=Boolean(card.querySelector('.review-question'))||/review-mode/.test(card.className);
  card.dataset.kwfUi='v3.3';card.dataset.kwfState=revealed?'revealed':'initial';card.dataset.kwfMode=review?'review':'learn';
  for(const [p,v] of [['position','relative'],['overflow','hidden'],['display','flex'],['flex-direction','column'],['height',cardH],['min-height',cardH],['max-height',cardH]])important(card,p,v);
  const meta=card.querySelector('.card-meta');if(meta)for(const [p,v] of [['flex','0 0 56px'],['height','56px'],['min-height','56px'],['max-height','56px']])important(meta,p,v);
  const word=card.querySelector('.word');if(word)for(const [p,v] of [['position','static'],['inset','auto'],['transform','none'],['translate','none'],['flex',`0 0 ${wordH}`],['height',wordH],['min-height',wordH],['max-height',wordH],['margin','0']])important(word,p,v);
  for(const el of card.querySelectorAll('.pronunciation-stack,.sentence,.show-shortcut')){important(el,'position','static');important(el,'inset','auto');important(el,'transform','none');important(el,'translate','none')}
  const pre=card.querySelector('.pre-answer');if(pre){for(const [p,v] of [['position','relative'],['flex','1 1 0'],['height','auto'],['min-height','0'],['max-height','none']])important(pre,p,v);const grid=pre.querySelector(':scope>div');if(grid){for(const [p,v] of [['box-sizing','border-box'],['position','absolute'],['left',actionX],['right',actionX],['bottom','0'],['height',actionH],['display','grid'],['grid-template-columns','repeat(3,minmax(0,1fr))']])important(grid,p,v);for(const b of grid.querySelectorAll('button'))for(const [p,v] of [['box-sizing','border-box'],['height',actionH],['min-height',actionH],['max-height',actionH],['padding-block','0']])important(b,p,v)}}
  for(const answer of card.querySelectorAll('.answer,.compact-answer'))for(const [p,v] of [['position','static'],['flex','1 1 0'],['display','flex'],['flex-direction','column'],['height','auto'],['min-height','0'],['max-height','none'],['padding','0 0 70px'],['margin','0']])important(answer,p,v);
  for(const scroll of card.querySelectorAll('.answer-scroll'))for(const [p,v] of [['position','static'],['flex','1 1 0'],['height','auto'],['min-height','0'],['max-height','none'],['overflow','visible']])important(scroll,p,v);
  for(const el of card.querySelectorAll('.answer *, .compact-answer *, .answer-scroll *'))important(el,'text-align','center');
  const cont=card.querySelector('.continue');if(cont)for(const [p,v] of [['box-sizing','border-box'],['position','absolute'],['left',railEdge],['right',railEdge],['bottom',mobile?'14px':'18px'],['width','auto'],['height',actionH],['min-height',actionH],['max-height',actionH],['margin','0'],['z-index','30']])important(cont,p,v);
  const q=card.querySelector('.review-question');if(q){for(const [p,v] of [['position','relative'],['flex','1 1 0'],['height','auto'],['min-height','0'],['max-height','none'],['overflow','visible']])important(q,p,v);const grid=q.querySelector(':scope>div');if(grid)for(const [p,v] of [['position','absolute'],['left',actionX],['right',actionX],['bottom','0'],['display','grid'],['grid-template-columns','repeat(2,minmax(0,1fr))'],['grid-template-rows',mobile?'repeat(2,48px)':'repeat(2,52px)'],['height',mobile?'104px':'112px']])important(grid,p,v)}
}
function normalizeReviewStack(){const board=document.querySelector('#review .review-board');if(!board)return;board.classList.add('kwf-v3-review-stack');important(board,'display','flex');important(board,'flex-direction','column');important(board,'width','100%');for(const el of board.querySelectorAll('.learned-stat,.memory-profile,.memory-note,#learned-library-section')){important(el,'width','100%');important(el,'max-width','100%');important(el,'grid-column','1 / -1')}}
async function normalizeLearnedRows(){const data=await enrichment(),entries=data?.entries||{};for(const row of document.querySelectorAll('#learned-library-section .kwf-learned-row')){row.dataset.kwfUi='v3.3';important(row,'align-items','center');const main=row.querySelector('.learned-word-main'),meaning=row.querySelector('.learned-word-meaning'),status=row.querySelector('.learned-word-status');for(const el of [main,meaning,status]){important(el,'align-self','center');important(el,'justify-content','center')}const word=txt(main?.querySelector('b,strong'));if(!word)continue;const collocations=entries[word]?.collocations?.slice(0,2)||[];let host=row.querySelector('.kwf-row-collocation');if(!collocations.length){host?.remove();continue}if(!host){host=document.createElement('div');host.className='kwf-row-collocation';row.appendChild(host)}host.replaceChildren(...collocations.map(item=>{const s=document.createElement('span');s.textContent=item;s.title=item;return s}))}}
async function apply(){state.scheduled=false;injectStyles();document.documentElement.dataset.kwfUi='v3.3';window.__KWF_UI_V3_READY__=true;hideMisplacedPlacement();normalizeCard();normalizeReviewStack();await normalizeLearnedRows()}
function schedule(){if(state.scheduled)return;state.scheduled=true;requestAnimationFrame(apply)}
const observer=new MutationObserver(schedule);
function boot(){window.__KWF_UI_V3_READY__=true;injectStyles();observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','open']});addEventListener('resize',schedule,{passive:true});schedule()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
