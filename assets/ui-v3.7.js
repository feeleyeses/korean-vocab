const imp=(el,p,v)=>el?.style?.setProperty(p,v,'important');

function applyReviewV37(){
  const card=document.querySelector('#study-card.study-card.review-mode');
  if(!card)return;
  const mobile=matchMedia('(max-width:900px)').matches;

  /* Never widen the review card itself. v3.7 only changes controls inside it. */
  for(const [p,v] of [['width','100%'],['min-width','0'],['max-width','100%'],['margin-left','0'],['margin-right','0']]) imp(card,p,v);
  const parent=card.parentElement;
  if(parent){imp(parent,'min-width','0');imp(parent,'width','auto');imp(parent,'max-width','none');}

  /* Initial review choices: visibly wider on the x axis, same height. */
  const q=card.querySelector('.review-question');
  const grid=q?.querySelector(':scope > div');
  if(grid){
    const edge=mobile?8:24;
    for(const [p,v] of [
      ['box-sizing','border-box'],['position','absolute'],['left',`${edge}px`],['right',`${edge}px`],
      ['width','auto'],['max-width','none'],['display','grid'],
      ['grid-template-columns','repeat(2,minmax(0,1fr))'],
      ['grid-template-rows',mobile?'repeat(2,48px)':'repeat(2,52px)'],['gap','8px 10px']
    ]) imp(grid,p,v);
    for(const b of grid.querySelectorAll(':scope > button')){
      for(const [p,v] of [['box-sizing','border-box'],['width','100%'],['min-width','0'],['max-width','none'],['height',mobile?'48px':'52px'],['padding-inline',mobile?'12px':'20px']]) imp(b,p,v);
    }
  }

  /* Reveal CTA uses the same wide x-axis rail. */
  const cont=card.querySelector('.continue');
  if(cont){
    const edge=mobile?14:24;
    for(const [p,v] of [['left',`${edge}px`],['right',`${edge}px`],['width','auto'],['max-width','none']]) imp(cont,p,v);
  }

  const map=card.querySelector('details.answer-map');
  if(map){
    const list=map.querySelector('.option-map-list');
    if(map.open){
      /* Keep status chips visible; replace only the dense answer body with the four-item mapping board. */
      const scroll=card.querySelector('.answer-scroll');
      if(scroll){
        [...scroll.children].forEach(el=>{
          if(!el.classList.contains('answer-head')) imp(el,'visibility','hidden');
        });
      }
      const edge=mobile?12:24;
      for(const [p,v] of [
        ['position','absolute'],['left',`${edge}px`],['right',`${edge}px`],
        ['top',mobile?'226px':'232px'],['bottom',mobile?'76px':'82px'],
        ['width','auto'],['max-width','none'],['display','flex'],['flex-direction','column'],
        ['z-index','24'],['overflow','hidden'],['opacity','1'],['background','#fffdf7'],
        ['border-radius','14px'],['box-shadow','0 8px 22px rgba(18,49,38,.10)']
      ]) imp(map,p,v);
    }else{
      const scroll=card.querySelector('.answer-scroll');
      if(scroll)[...scroll.children].forEach(el=>imp(el,'visibility','visible'));
    }
    if(list){
      for(const [p,v] of [
        ['box-sizing','border-box'],['flex','1 1 0'],['display','grid'],
        ['grid-template-columns','repeat(2,minmax(0,1fr))'],['grid-template-rows','repeat(2,minmax(0,1fr))'],
        ['gap','8px'],['width','100%'],['height','auto'],['min-height','0'],['max-height','none'],
        ['padding','8px'],['overflow','hidden']
      ]) imp(list,p,v);
      const articles=[...list.querySelectorAll(':scope > article')];
      articles.forEach(a=>{
        for(const [p,v] of [['display','grid'],['place-content','center'],['visibility','visible'],['opacity','1'],['width','100%'],['height','100%'],['min-width','0'],['min-height','0'],['overflow','hidden'],['text-align','center']]) imp(a,p,v);
      });
      list.dataset.kwfVisibleCount=String(articles.length);
    }
  }
  card.dataset.kwfReviewGeometry='v3.7-buttons-x';
  document.documentElement.dataset.kwfReviewUi='v3.7';
}

let scheduled=false;
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;applyReviewV37()})}
const observer=new MutationObserver(schedule);
function boot(){window.__KWF_UI_V37_READY__=true;observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','open']});applyReviewV37()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
