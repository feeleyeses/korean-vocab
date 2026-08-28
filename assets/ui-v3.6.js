const imp=(el,p,v)=>el?.style?.setProperty(p,v,'important');

function widenReviewCard(){
  const card=document.querySelector('#study-card.study-card.review-mode');
  if(!card)return;
  const mobile=matchMedia('(max-width:900px)').matches;

  if(!mobile){
    for(const [p,v] of [
      ['box-sizing','border-box'],
      ['width','720px'],
      ['min-width','720px'],
      ['max-width','720px'],
      ['justify-self','center'],
      ['margin-left','auto'],
      ['margin-right','auto']
    ]) imp(card,p,v);

    /* Let the center column actually grow with the card instead of clipping it
       back to the old ~560px width. */
    let node=card.parentElement;
    for(let i=0;node&&node.id!=='study'&&i<4;i++,node=node.parentElement){
      const cs=getComputedStyle(node);
      if(cs.display==='flex' || cs.display==='grid' || node===card.parentElement){
        imp(node,'min-width','720px');
        if(node===card.parentElement) imp(node,'width','720px');
      }
    }
  }else{
    for(const [p,v] of [
      ['width','100%'],['min-width','0'],['max-width','100%'],['margin-left','0'],['margin-right','0']
    ]) imp(card,p,v);
  }

  const q=card.querySelector('.review-question');
  const grid=q?.querySelector(':scope > div');
  if(grid){
    for(const [p,v] of [
      ['left',mobile?'0px':'8px'],['right',mobile?'0px':'8px'],['width','auto'],['max-width','none'],
      ['grid-template-columns','repeat(2,minmax(0,1fr))'],['gap','8px 12px']
    ]) imp(grid,p,v);
    for(const b of grid.querySelectorAll(':scope > button')){
      for(const [p,v] of [['width','100%'],['max-width','none'],['min-width','0']]) imp(b,p,v);
    }
  }

  const cont=card.querySelector('.continue');
  if(cont){
    for(const [p,v] of [['left',mobile?'4px':'20px'],['right',mobile?'4px':'20px'],['width','auto'],['max-width','none']]) imp(cont,p,v);
  }

  const map=card.querySelector('details.answer-map[open]');
  if(map){
    for(const [p,v] of [['left',mobile?'4px':'18px'],['right',mobile?'4px':'18px'],['width','auto'],['max-width','none']]) imp(map,p,v);
  }

  card.dataset.kwfReviewGeometry='v3.6-wide-x';
  document.documentElement.dataset.kwfReviewUi='v3.6';
}

let scheduled=false;
function schedule(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;widenReviewCard()});
}
const observer=new MutationObserver(schedule);
function boot(){
  window.__KWF_UI_V36_READY__=true;
  observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','open']});
  widenReviewCard();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
