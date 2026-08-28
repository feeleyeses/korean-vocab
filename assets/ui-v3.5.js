const imp=(el,p,v)=>el?.style?.setProperty(p,v,'important');
const px=n=>`${n}px`;

function enforceReviewGeometry(){
  const card=document.querySelector('#study-card.study-card.review-mode');
  if(!card)return;
  const mobile=matchMedia('(max-width:900px)').matches;
  const q=card.querySelector('.review-question');
  const grid=q?.querySelector(':scope > div');
  if(grid){
    for(const [p,v] of [
      ['box-sizing','border-box'],['position','absolute'],['left','0px'],['right','0px'],
      ['width','auto'],['max-width','none'],['display','grid'],
      ['grid-template-columns','repeat(2,minmax(0,1fr))'],
      ['grid-template-rows',mobile?'repeat(2,48px)':'repeat(2,52px)'],
      ['gap','8px 10px']
    ]) imp(grid,p,v);
    for(const b of grid.querySelectorAll(':scope > button')){
      for(const [p,v] of [['box-sizing','border-box'],['width','100%'],['min-width','0'],['max-width','none'],['padding-inline',mobile?'10px':'18px']]) imp(b,p,v);
    }
  }

  const cont=card.querySelector('.continue');
  if(cont){
    const edge=mobile?4:12;
    for(const [p,v] of [['left',px(edge)],['right',px(edge)],['width','auto'],['max-width','none']]) imp(cont,p,v);
  }

  const map=card.querySelector('details.answer-map[open]');
  if(map){
    const side=mobile?4:10;
    for(const [p,v] of [
      ['position','absolute'],['left',px(side)],['right',px(side)],['top',mobile?'198px':'202px'],
      ['bottom',mobile?'70px':'76px'],['width','auto'],['max-width','none'],['display','flex'],
      ['flex-direction','column'],['z-index','20'],['overflow','hidden'],['opacity','1'],['background','#fffdf7']
    ]) imp(map,p,v);
    const list=map.querySelector('.option-map-list');
    if(list){
      for(const [p,v] of [
        ['box-sizing','border-box'],['flex','1 1 0'],['display','grid'],
        ['grid-template-columns','repeat(2,minmax(0,1fr))'],
        ['grid-template-rows','repeat(2,minmax(0,1fr))'],['gap','8px'],['width','100%'],
        ['height','auto'],['min-height','0'],['max-height','none'],['padding','8px'],['overflow','hidden']
      ]) imp(list,p,v);
      const articles=[...list.querySelectorAll(':scope > article')];
      for(const a of articles){
        for(const [p,v] of [['box-sizing','border-box'],['display','grid'],['place-content','center'],['visibility','visible'],['opacity','1'],['width','100%'],['height','100%'],['min-width','0'],['min-height','0'],['max-height','none'],['overflow','hidden'],['text-align','center']]) imp(a,p,v);
      }
      map.dataset.kwfOptionCount=String(articles.length);
    }
  }
  card.dataset.kwfReviewGeometry='v3.5';
}

let scheduled=false;
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;enforceReviewGeometry()})}
const observer=new MutationObserver(schedule);
function boot(){
  window.__KWF_UI_V35_READY__=true;
  document.documentElement.dataset.kwfReviewUi='v3.5';
  observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','open']});
  enforceReviewGeometry();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
