import {validate} from './core.mjs';
const $=id=>document.getElementById(id);let candidates=[],index=0;
const text=(parent,label,value)=>{const h=document.createElement('h3'),p=document.createElement('pre');h.textContent=label;p.textContent=typeof value==='string'?value:JSON.stringify(value,null,2);parent.append(h,p);};
const filtered=()=>candidates.filter(c=>(!$('source').value||c.sourceId===$('source').value)&&(!$('type').value||c.type===$('type').value)&&(!$('state').value||c.reviewStatus===$('state').value));
function render(){const rows=filtered();index=Math.max(0,Math.min(index,rows.length-1));const c=rows[index];$('current').replaceChildren();$('external').replaceChildren();$('counter').textContent=rows.length?(index+1)+' / '+rows.length:'0 / 0';$('prev').disabled=!c||index===0;$('next').disabled=!c||index===rows.length-1;
 if(!c){$('message').textContent='没有符合条件的数据';return;}
 text($('current'),c.current?.headword||c.lexicalEntryId,c.current?.pos||'');
 for(const s of c.current?.senses||[])text($('current'),s.gloss,{examples:s.examples||[],collocations:s.collocations||[]});
 for(const [label,value] of [['Score / Version',{score:c.score,version:c.scoreVersion}],['阻断原因',c.reasons],['发布闸门',c.gateReasons],['分项评分',c.scoreBreakdown],['Validation Flags',c.validationFlags],['候选',c.content],['译文',c.translation],['Evidence',c.evidence],['来源独立性',c.sourceCoverage],['再评估',c.reevaluation]])if(value!=null)text($('external'),label,value);
 $('message').textContent=c.reviewStatus+' · '+c.sourceId+' · sourceAccess='+(c.sourceAccess||'unknown')+' · 只读，不改变生产数据';
}
function load(rows){if(!Array.isArray(rows))throw Error('需要 candidates 数组');const ids=new Set();for(const c of rows){const errors=validate(c);if(errors.length)throw Error(errors.join(', '));if(ids.has(c.candidateId))throw Error('duplicate candidateId');ids.add(c.candidateId);}candidates=rows;index=0;$('source').replaceChildren(new Option('全部',''));for(const s of new Set(rows.map(c=>c.sourceId)))$('source').add(new Option(s,s));render();}
for(const id of ['source','type','state'])$(id).onchange=()=>{index=0;render();};
$('prev').onclick=()=>{index--;render();};$('next').onclick=()=>{index++;render();};
$('import').onchange=async e=>{try{const p=JSON.parse(await e.target.files[0].text());load(p.candidates||p);}catch(e){$('message').textContent=e.message;}};
$('export').onclick=()=>{const u=URL.createObjectURL(new Blob([JSON.stringify({schemaVersion:2,candidates:filtered()},null,2)],{type:'application/json'})),a=document.createElement('a');a.href=u;a.download='data-inspector.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);};
document.addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||e.ctrlKey||e.metaKey||e.altKey)return;const id={ArrowLeft:'prev',ArrowRight:'next'}[e.key];if(id){e.preventDefault();$(id).click();}});
try{let r=await fetch('unblock-results.json');if(r.status===404)r=await fetch('automation-results.json');if(!r.ok)throw Error('请先运行 unblock-benchmark.mjs');load((await r.json()).candidates);}catch(e){$('message').textContent='载入失败：'+e.message;}
