const imp=(el,p,v)=>el?.style?.setProperty(p,v,'important');

function applyReviewV38(){
  const card=document.querySelector('#study-card.study-card');
  if(!card)return;
  const isReview=card.classList.contains('review-mode')||Boolean(card.querySelector('.review-question, details.answer-map'));
  if(!isReview)return;
  const mobile=matchMedia('(max-width:900px)').matches;
  const edge=12;
  const buttonH=mobile?48:52;
  const continueBottom=mobile?14:18;
  const mapBottom=mobile?88:100;
  const usable=`calc(100% - ${edge*2}px)`;

  /* Never resize or shift the review card itself. */
  for(const p of ['width','min-width','max-width','margin-left','margin-right']) card.style.removeProperty(p);

  const q=card.querySelector('.review-question');
  const grid=q?.querySelector(':scope > div');
  if(q){
    for(const [p,v] of [['box-sizing','border-box'],['width','100%'],['min-width','0'],['max-width','100%'],['align-self','stretch'],['position','relative'],['margin','0'],['padding-bottom',mobile?'112px':'120px']]) imp(q,p,v);
  }
  if(grid){
    for(const [p,v] of [
      ['box-sizing','border-box'],['position','absolute'],['left',`${edge}px`],['right','auto'],['bottom','0'],
      ['width',usable],['min-width',usable],['max-width',usable],['height',mobile?'104px':'112px'],
      ['display','grid'],['grid-template-columns','repeat(2,minmax(0,1fr))'],['grid-template-rows',`repeat(2,${buttonH}px)`],
      ['column-gap','12px'],['row-gap','8px'],['justify-self','stretch'],['align-self','end'],['transform','none'],['translate','none'],['margin','0'],['padding','0']
    ]) imp(grid,p,v);
    for(const b of grid.querySelectorAll(':scope > button')){
      for(const [p,v] of [['box-sizing','border-box'],['display','flex'],['align-items','center'],['justify-content','center'],['width','100%'],['min-width','0'],['max-width','none'],['height',`${buttonH}px`],['min-height',`${buttonH}px`],['max-height',`${buttonH}px`],['margin','0'],['padding','0 14px'],['transform','none'],['translate','none']]) imp(b,p,v);
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

    const cont=revealed.querySelector('.continue');
    if(cont){
      for(const [p,v] of [['box-sizing','border-box'],['position','absolute'],['left',`${edge}px`],['right','auto'],['bottom',`${continueBottom}px`],['width',usable],['min-width',usable],['max-width',usable],['height',`${buttonH}px`],['min-height',`${buttonH}px`],['max-height',`${buttonH}px`],['margin','0'],['padding','0 18px'],['z-index','30'],['transform','none'],['translate','none']]) imp(cont,p,v);
    }

    const map=revealed.querySelector('details.answer-map');
    if(map){
      const summary=map.querySelector(':scope > summary');
      const list=map.querySelector('.option-map-list');
      if(!map.open){
        for(const [p,v] of [['box-sizing','border-box'],['position','absolute'],['left',`${edge}px`],['right','auto'],['bottom',`${mapBottom}px`],['top','auto'],['width',usable],['min-width',usable],['max-width',usable],['height','36px'],['min-height','36px'],['max-height','36px'],['margin','0'],['overflow','hidden'],['z-index','20'],['background','#fffdf7'],['transform','none'],['translate','none']]) imp(map,p,v);
        if(summary) for(const [p,v] of [['height','36px'],['min-height','36px'],['max-height','36px'],['display','flex'],['align-items','center'],['justify-content','center']]) imp(summary,p,v);
      }else{
        for(const [p,v] of [['box-sizing','border-box'],['position','absolute'],['left',`${edge}px`],['right','auto'],['top','216px'],['bottom',`${mapBottom}px`],['width',usable],['min-width',usable],['max-width',usable],['height','auto'],['min-height','0'],['margin','0'],['display','flex'],['flex-direction','column'],['overflow','hidden'],['z-index','24'],['opacity','1'],['background','#fffdf7'],['border-radius','14px'],['transform','none'],['translate','none']]) imp(map,p,v);
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

let raf=0;
function schedule(delay=0){
  if(delay){setTimeout(()=>schedule(0),delay);return}
  if(raf)return;
  raf=requestAnimationFrame(()=>{raf=0;applyReviewV38()});
}
function settle(){schedule(0);schedule(40);schedule(120);schedule(260)}
const observer=new MutationObserver(()=>settle());
function boot(){
  window.__KWF_UI_V38_READY__=true;
  window.__KWF_APPLY_REVIEW_V38__=applyReviewV38;
  observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','open']});
  document.addEventListener('click',settle,true);
  window.addEventListener('resize',settle);
  settle();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
