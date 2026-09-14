import {createRequire} from 'node:module';
import {args,loadRelease,check} from './train-lib.mjs';
import {hash} from './automation.mjs';
const require=createRequire(import.meta.url),{chromium}=require('playwright');
const a=args(),{m,input}=await loadRelease(a.release),base=a.url;
check(base&&new URL(base).protocol==='https:','Explicit HTTPS deployed URL required');
const response=await fetch(new URL('data/vocabulary.json?release='+m.releaseId,base));check(response.ok,'Online vocabulary unavailable');
const data=await response.json();check(hash(data)===m.newVocabularyHash,'Online production hash drift');
const entries=new Map(data.entries.map(w=>[w.lexicalEntryId,w]));
for(const c of input.candidates){const e=entries.get(c.lexicalEntryId)?.senses.find(s=>s.senseId===c.senseId)?.examples.find(e=>e.exampleId==='external-'+c.candidateId);check(e&&e.ko===c.content.text&&e.zh===c.translation.text,'Online example/provenance mismatch');}
const chosen=new Map(),add=c=>{if(c)chosen.set(c.candidateId,c);};
for(let i=1;i<=6;i++)add(input.candidates.find(c=>entries.get(c.lexicalEntryId).levels.includes('TOPIK-'+i)));
for(const pos of ['명사','동사','형용사'])add(input.candidates.find(c=>c.target.pos===pos));
const lengths=[...input.candidates].sort((a,b)=>a.content.text.length-b.content.text.length);add(lengths[0]);add(lengths.at(-1));
// Seeded random five; reproducible per release, never cherry-pick samples.
[...input.candidates].sort((a,b)=>hash([m.releaseId,a.candidateId]).localeCompare(hash([m.releaseId,b.candidateId]))).slice(0,5).forEach(add);
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})}),results=[];
try{for(const width of [1440,390])for(const c of chosen.values()){
 const context=await browser.newContext({viewport:{width,height:width===390?844:950}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 // Isolated UI fixture contains the exact fetched production entry; never mutate remote data or user storage.
 await page.route('**/data/vocabulary.json*',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({...data,entries:[entries.get(c.lexicalEntryId)]})}));
 await page.goto(base,{waitUntil:'networkidle'});await page.getByRole('button',{name:'开始学习',exact:true}).click();
 const before=await page.locator('.judgment-buttons').boundingBox();await page.getByRole('button',{name:'直接看答案',exact:true}).click();
 const text=await page.locator('.knowledge-scroll').innerText(),after=await page.locator('.continue').boundingBox();
 check(text.includes(c.content.text)&&text.includes(c.translation.text),'Reveal KO/ZH mismatch');
 check(Math.abs(before.y-after.y)<1&&Math.abs(before.width-after.width)<1,'ActionRail drift');
 check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal overflow');
 await page.locator('.knowledge-scroll').evaluate(el=>{el.scrollTop=el.scrollHeight;});
 check(Math.abs((await page.locator('.continue').boundingBox()).y-after.y)<1&&!errors.length,'Scroll/Footer/runtime regression');
 results.push({candidateId:c.candidateId,headword:c.target.headword,width,passed:true});await context.close();
}}finally{await browser.close();}
console.log(JSON.stringify({passed:true,onlineHash:hash(data),releaseId:m.releaseId,allExampleIdsVerified:input.candidates.length,sampled:chosen.size,results}));
