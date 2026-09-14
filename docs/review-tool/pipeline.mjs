import fs from 'node:fs/promises';
import {watch} from 'node:fs';
import path from 'node:path';
import {POLICY,hash,reevaluate,publicationGate,norm} from './automation.mjs';
// Local orchestration, no network and no production writer. --watch reevaluates changed inputs.
const configPath=process.argv[2];if(!configPath)throw Error('Usage: node pipeline.mjs /absolute/config.json [--watch]');
const read=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const base=path.dirname(path.resolve(configPath)),output=new URL('./pipeline-results.json',import.meta.url);
let busy=false,again=false;
async function run(){if(busy){again=true;return;}busy=true;
 try{
 const cfg=await read(configPath),dataset=await read(new URL('../../data/vocabulary.json',import.meta.url));
 const policy=cfg.policyFile?await read(path.resolve(base,cfg.policyFile)):POLICY;
 let previous=[];try{previous=(await read(output)).candidates;}catch(e){if(e.code!=='ENOENT')throw e;}
 const prior=new Map(previous.map(c=>[c.candidateId,c])),rows=[],access=[];
 for(const input of cfg.inputs||[]){try{const payload=await read(path.resolve(base,input));rows.push(...(payload.candidates||payload));access.push(...(payload.access||[]));}catch(e){access.push({input,status:'unavailable',reason:e.code||'invalid payload'});}}
 const normalized=rows.map(c=>{const w=dataset.entries.find(e=>e.lexicalEntryId===c.lexicalEntryId),s=w?.senses.find(s=>s.senseId===c.senseId);return {...c,target:c.target||{headword:w?.headword,pos:w?.partOfSpeech,gloss:s?.glossZh,definitionZh:s?.definitionZh},alignment:c.alignment||{},evidence:c.evidence||[],sourceAccess:c.sourceAccess||'local-cache'};});
 const scored=normalized.map(c=>reevaluate(c,prior.get(c.candidateId),policy));
 const context={blockingQualityAudit:cfg.blockingQualityAudit??null,currentDatasetHash:hash(dataset),expectedDatasetHash:cfg.expectedDatasetHash,entries:dataset.entries,existingContentKeys:dataset.entries.flatMap(e=>e.senses.flatMap(s=>['example','collocation'].flatMap(type=>(s[type==='example'?'examples':'collocations']||[]).map(x=>[e.lexicalEntryId,s.senseId,type,norm(x.ko)].join('|')))))};
 const gate=publicationGate(scored,policy,context);
 await fs.writeFile(output,JSON.stringify({schemaVersion:2,inputHash:hash(normalized),policyHash:hash(policy),access,...gate},null,2));
 console.log(JSON.stringify({inputs:rows.length,releasePlan:gate.plan.length,published:0,accessFailures:access.filter(a=>a.status==='unavailable').length}));
 }finally{busy=false;if(again){again=false;await run();}}
}
await run();
if(process.argv.includes('--watch')){
 const cfg=await read(configPath),directories=new Set([base,...(cfg.inputs||[]).map(p=>path.dirname(path.resolve(base,p))),...(cfg.policyFile?[path.dirname(path.resolve(base,cfg.policyFile))]:[])]);
 const files=new Set([path.resolve(configPath),...(cfg.inputs||[]).map(p=>path.resolve(base,p)),...(cfg.policyFile?[path.resolve(base,cfg.policyFile)]:[])]);
 let timer;for(const dir of directories)watch(dir,(_,name)=>{if(!name||!files.has(path.resolve(dir,String(name))))return;clearTimeout(timer);timer=setTimeout(()=>run().catch(e=>console.error(e.code||'pipeline failed')),300);});
 console.log('Watching local configured input/policy directories; no network polling.');
}
