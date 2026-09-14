import {createRequire} from 'node:module';
import {args,loadRelease,check} from './train-lib.mjs';
import {hash} from './automation.mjs';
import {posLabel} from '../../src/pos-labels.js';
import {LOCATOR_VERSION,locateIdentity,assertExampleIdentity} from './smoke-identity.mjs';
const require=createRequire(import.meta.url),{chromium}=require('playwright');
const a=args(),{m,input,record}=await loadRelease(a.release),base=a.url;
check(base&&new URL(base).protocol==='https:','Explicit HTTPS deployed URL required');
const response=await fetch(new URL('data/vocabulary.json?release='+m.releaseId,base));check(response.ok,'Online vocabulary unavailable');
const data=await response.json();check(hash(data)===m.newVocabularyHash,'Online production hash drift');
const entries=new Map(data.entries.map(w=>[w.lexicalEntryId,w]));
const target=c=>({candidateId:c.candidateId,entryId:c.lexicalEntryId,headword:c.target.headword,pos:c.target.pos,senseId:c.senseId,exampleId:'external-'+c.candidateId,ko:c.content.text,zh:c.translation.text});
for(const c of input.candidates){
 const {e}=assertExampleIdentity(data.entries,target(c));
 check(e.source===c.sourceId&&e.provenance.sentenceId===c.originalId&&e.provenance.translationSentenceId===c.translation.originalId&&e.provenance.author===c.content.author&&e.provenance.translationAuthor===c.translation.author&&e.provenance.license===c.sourceLicense&&e.provenance.sourceVersion===c.sourceVersion&&hash(e.provenance.evidence)===hash(c.evidence),'Provenance mismatch');
}
const previous=structuredClone(data),ids=new Set(m.exampleIds);
for(const w of previous.entries)for(const s of w.senses)s.examples=s.examples.filter(e=>!ids.has(e.exampleId));
check(hash(previous)===m.previousVocabularyHash,'Unexpected replacement/delete');
const frozen=record.smokeAttempts?.[0]?.smokeSampleIds||record.online.smokeSampleIds;
check(frozen?.length===13&&new Set(frozen.map(s=>s.senseId)).size===13,'Original 13 samples required');
const samples=frozen.map(s=>{const c=input.candidates.find(c=>c.candidateId===s.candidateId);check(c&&s.exampleId==='external-'+c.candidateId&&s.senseId===c.senseId,'Frozen sample identity mismatch');return c;});
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})}),results=[];
const safeGeometry=async page=>check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal overflow');
const speechProbe=()=>{window.smokeSpeechCalls=[];const native=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{window.smokeSpeechCalls.push({text:u.text,lang:u.lang});native(u);};};
try{
 for(const width of [1440,390]){
  // Full, unmodified deployed data for library identity, TTS and favorites.
  const context=await browser.newContext({viewport:{width,height:width===390?844:950}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(speechProbe);
  await page.goto(base,{waitUntil:'networkidle'});
  const nav=page.locator(width===390?'.mobile-nav':'.topbar nav');
  check(await nav.getByRole('button').count()===(width===390?4:5),'Navigation count');
  await nav.getByRole('button',{name:'词库',exact:true}).click();
  for(const c of samples){
   const t=target(c),binding=assertExampleIdentity(data.entries,t);
   // Production identity must be uniquely recoverable from exact headword + POS.
   check(data.entries.filter(w=>w.headword===t.headword&&w.partOfSpeech===t.pos).length===1,'ambiguous_locator: production entry');
   check(binding.w.senses.filter(s=>s.glossZh===binding.s.glossZh).length===1,'ambiguous_locator: sense gloss');
   await page.getByRole('searchbox',{name:'搜索词库'}).fill(t.headword);
   await page.waitForFunction(headword=>Array.from(document.querySelectorAll('article[data-word]')).some(r=>r.getAttribute('data-word')===headword),t.headword).catch(()=>{throw Error('locator_failed: '+t.headword);});
   const snapshot=await page.locator('article[data-word]').evaluateAll(rows=>rows.map(r=>({headword:r.getAttribute('data-word'),pos:Array.from(r.querySelectorAll('p')).map(p=>p.textContent.trim()).find(t=>/^TOPIK\s/.test(t))?.split('·').at(-1).trim()})));
   locateIdentity(snapshot,{...t,pos:posLabel(t.pos)});
   const row=page.locator('article[data-word]').filter({has:page.getByRole('heading',{name:t.headword,exact:true,level:3})}).filter({has:page.getByText(new RegExp('^TOPIK\\s+[0-9 /]+\\s*·\\s*'+posLabel(t.pos)+'$'))});
   check(await row.count()===1,'ambiguous_locator: DOM row');
   const expand=row.getByRole('button',{name:'展开',exact:true});if(await expand.count())await expand.click();
   const sense=row.locator('article').filter({has:page.getByRole('heading',{name:binding.s.glossZh,exact:true,level:4})});
   check(await sense.count()===1,'locator_failed: exact sense');
   const ko=sense.getByText(t.ko,{exact:true}),zh=sense.getByText(t.zh,{exact:true});
   check(await ko.count()===1&&await zh.count()===1,'example_identity_failed: exact KO/ZH');
   // No DOM example IDs exist: exact paired text is mapped back to the unique verified source ID.
   check(await ko.evaluate((el,translation)=>Array.from(el.parentElement.querySelectorAll('p')).some(p=>p.textContent===translation),t.zh),'example_identity_failed: disconnected DOM pair');
   const star=row.getByRole('button',{name:/^(收藏|取消收藏)$/}),before=await star.getAttribute('aria-pressed');
   try{await star.click();check(await star.getAttribute('aria-pressed')!==before,'Favorite did not toggle');}
   finally{if(await star.getAttribute('aria-pressed')!==before)await star.click();}
   check(await star.getAttribute('aria-pressed')===before,'Favorite not restored');
   const calls=await page.evaluate(()=>window.smokeSpeechCalls.length);
   await row.getByRole('button',{name:'听发音',exact:true}).click();
   check(await page.evaluate(n=>window.smokeSpeechCalls.length===n+1&&window.smokeSpeechCalls.at(-1).lang==='ko-KR',calls),'TTS not triggered');
   await safeGeometry(page);check(!errors.length,'Page runtime error');
   results.push({...t,width,mode:'live-library',passed:true,favoriteRestored:true,ttsTriggered:true});
  }
  await context.close();
  for(const c of samples){
   const isolated=await browser.newContext({viewport:{width,height:width===390?844:950}}),p=await isolated.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.message));
   // Deterministic session fixture: exact live entry, isolated context, never user storage.
   await p.route('**/data/vocabulary.json*',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({...data,entries:[entries.get(c.lexicalEntryId)]})}));
   await p.goto(base,{waitUntil:'networkidle'});await p.getByRole('button',{name:'开始学习',exact:true}).click();
   const before=await p.locator('.judgment-buttons').boundingBox();await p.getByRole('button',{name:'直接看答案',exact:true}).click();
   const content=p.locator('.knowledge-scroll'),after=await p.locator('.continue').boundingBox();
   check(await content.getByText(c.content.text,{exact:true}).count()===1&&await content.getByText(c.translation.text,{exact:true}).count()===1,'Reveal KO/ZH mismatch');
   check(Math.abs(before.y-after.y)<1&&Math.abs(before.width-after.width)<1,'ActionRail drift');
   await safeGeometry(p);await content.evaluate(el=>{el.scrollTop=el.scrollHeight;});
   check(Math.abs((await p.locator('.continue').boundingBox()).y-after.y)<1&&!errs.length,'Scroll/Footer/runtime regression');
   results.push({...target(c),width,mode:'isolated-live-entry-reveal',passed:true});await isolated.close();
  }
 }
}finally{await browser.close();}
console.log(JSON.stringify({passed:true,status:'smoke_passed',locatorVersion:LOCATOR_VERSION,onlineHash:hash(data),releaseId:m.releaseId,allExampleIdsVerified:input.candidates.length,provenanceVerified:true,noReplacementOrDelete:true,sampled:13,distinctSenses:13,sampleIds:frozen,results}));
