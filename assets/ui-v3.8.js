const imp=(el,p,v)=>el?.style?.setProperty(p,v,'important');

function applyReviewV38(){
  const card=document.querySelector('#study-card.study-card');
  if(!card)return;
  const isReview=card.classList.contains('review-mode')||Boolean(card.querySelector('.review-question, details.answer-map'));
  if(!isReview)return;
  const mobile=matchMedia('(max-width:900px)').matches;
  const edge=mobile?12:16;
  const buttonH=mobile?48:52;
  const continueBottom=mobile?14:18;
  const mapBottom=mobile?88:100;

  /* Do not resize or shift the review card itself. */
  for(const p of ['width','min-width','max-width','margin-left','margin-right']) card.style.removeProperty(p);

  /* Initial review: full-width question rail + four fixed, equal 2×2 buttons. */
  const q=card.querySelector('.review-question');
  const grid=q?.querySelector(':scope > div');
  if(q){
    for(const [p,v] of [['box-sizing','border-box'],['width','100%'],['max-width','100%'],['align-self','stretch'],['position','relative'],['margin','0'],['padding-bottom',mobile?'112px':'120px']]) imp(q,p,v);
  }
  if(grid){
    for(const [p,v] of [
      ['box-sizing','border-box'],['position','absolute'],['left',`${edge}px`],['right',`${edge}px`],['bottom','0'],
      ['width','auto'],['min-width','0'],['max-width','none'],['height',mobile?'104px':'112px'],
      ['display','grid'],['grid-template-columns','repeat(2,minmax(0,1fr))'],['grid-template-rows',`repeat(2,${buttonH}px)`],
      ['column-gap','12px'],['row-gap','8px'],['margin','0'],['padding','0']
    ]) imp(grid,p,v);
    for(const b of grid.querySelectorAll(':scope > button')){
      for(const [p,v] of [['box-sizing','border-box'],['display','flex'],['align-items','center'],['justify-content','center'],['width','100%'],['min-width','0'],['max-width','none'],['height',`${buttonH}px`],['min-height',`${buttonH}px`],['max-height',`${buttonH}px`],['margin','0'],['padding','0 14px']]) imp(b,p,v);
    }
  }

  const revealed=card.querySelector('.answer.compact-answer');
  if(revealed){
    const scroll=revealed.querySelector('.answer-scroll');
    if(scroll){
      imp(scroll,'padding-bottom','58px');
      const aside=scroll.querySelector('aside');
      if(aside) imp(aside,'display','none');
      for(const el of scroll.querySelectorAll('h4,.sentence,p,.chosen-answer')){
        imp(el,'text-align','center');
        imp(el,'margin-left','auto');
        imp(el,'margin-right','auto');
      }
    }

    /* Reveal CTA: wide on X-axis, same fixed height. */
    const cont=revealed.querySelector('.continue');
    if(cont){
      for(const [p,v] of [['box-sizing','border-box'],['position','absolute'],['left',`${edge}px`],['right',`${edge}px`],['bottom',`${continueBottom}px`],['width','auto'],['min-width','0'],['max-width','none'],['height',`${buttonH}px`],['min-height',`${buttonH}px`],['max-height',`${buttonH}px`],['margin','0'],['padding','0 18px'],['z-index','30']]) imp(cont,p,v);
    }

    const map=revealed.querySelector('details.answer-map');
    if(map){
      const summary=map.querySelector(':scope > summary');
      const list=map.querySelector('.option-map-list');

      /* Closed state: dedicated rail above Continue; no overlap with the answer body. */
      if(!map.open){
        for(const [p,v] of [['box-sizing','border-box'],['position','absolute'],['left',`${edge}px`],['right',`${edge}px`],['bottom',`${mapBottom}px`],['top','auto'],['width','auto'],['height','36px'],['min-height','36px'],['max-height','36px'],['margin','0'],['overflow','hidden'],['z-index','20'],['background','#fffdf7']]) imp(map,p,v);
        if(summary) for(const [p,v] of [['height','36px'],['min-height','36px'],['max-height','36px'],['display','flex'],['align-items','center'],['justify-content','center']]) imp(summary,p,v);
      }else{
        /* Open state: all four mappings occupy a clean 2×2 board above Continue. */
        for(const [p,v] of [['box-sizing','border-box'],['position','absolute'],['left',`${edge}px`],['right',`${edge}px`],['top','216px'],['bottom',`${mapBottom}px`],['width','auto'],['height','auto'],['min-height','0'],['max-height','none'],['margin','0'],['display','flex'],['flex-direction','column'],['overflow','hidden'],['z-index','24'],['opacity','1'],['background','#fffdf7'],['border-radius','14px']]) imp(map,p,v);
        if(summary) for(const [p,v] of [['flex','0 0 36px'],['height','36px'],['min-height','36px'],['max-height','36px']]) imp(summary,p,v);
      }

      if(list){
        for(const [p,v] of [['box-sizing','border-box'],['display','grid'],['grid-template-columns','repeat(2,minmax(0,1fr))'],['grid-template-rows','repeat(2,minmax(0,1fr))'],['gap','8px'],['width','100%'],['height','100%'],['min-height','0'],['max-height','none'],['padding','8px'],['margin','0'],['overflow','hidden'],['flex','1 1 0']]) imp(list,p,v);
        const articles=[...list.querySelectorAll(':scope > article')];
        for(const a of articles){
          for(const [p,v] of [['box-sizing','border-box'],['display','grid'],['place-content','center'],['visibility','visible'],['opacity','1'],['width','100%'],['min-width','0'],['max-width','none'],['height','100%'],['min-height','0'],['max-height','none'],['overflow','hidden'],['margin','0'],['padding',mobile?'6px 8px':'8px 10px'],['text-align','center']]) imp(a,p,v);
        }
        list.dataset.kwfMappingCount=String(articles.length);
      }
    }
  }

  card.dataset.kwfReviewGeometry='v3.8-fixed-wide-buttons';
  document.documentElement.dataset.kwfReviewUi='v3.8';
}

let scheduled=false;
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;applyReviewV38()})}
const observer=new MutationObserver(schedule);
function boot(){window.__KWF_UI_V38_READY__=true;observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','open']});applyReviewV38()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
