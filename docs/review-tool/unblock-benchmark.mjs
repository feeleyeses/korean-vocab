import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {evaluate,POLICY,hash,reevaluate,publicationGate} from './automation.mjs';
import {alignSense,canonicalPOS} from './sense-alignment.mjs';
import {realExamples} from '../../src/domain.js';
const read=async p=>JSON.parse(await fs.readFile(new URL(p,import.meta.url),'utf8'));
const baseline=await read('./automation-results.json'),registry=(await read('./source-registry.json')).sources;
const tat=await read('./unblock-local/tatoeba-index.json'),kr=await read('./unblock-local/krdict-records.json');
const raw=await read('../../data/vocabulary.json');
const policy={...POLICY,version:'rules-v2-unblock-1',sources:{}};
const bind=(name,version)=>{if(registry[name])policy.sources[name]={...registry[name],sourceVersion:version};};
if(tat.sourceAccess==='available')bind('Tatoeba',tat.sourceVersion);
const evidence=(name,version,id,url,node,fetched)=>({sourceId:name,canonicalSourceId:registry[name].canonicalSourceId,derivedFrom:registry[name].derivedFrom,sourceLicense:registry[name].sourceLicense,sourceVersion:version,originalId:id,sourceUrl:url,fetchedAt:fetched,documentHash:hash(node),nodeHash:hash(node),rawNode:node,hashScope:'source-node'});
let candidates=[];const samples=baseline.report.samples;
const locked=await read('./benchmark-lock.json');
if(hash(samples.map(s=>s.sampleId))!==hash(locked.sampleIds))throw Error('Fixed benchmark membership changed');
let previous=baseline.candidates;try{previous=(await read('./unblock-results.json')).candidates;}catch(e){if(e.code!=='ENOENT')throw e;}
for(const sample of samples){
 const old=baseline.candidates.filter(c=>c.sampleId===sample.sampleId),template=old[0];
 const entry=raw.entries.find(e=>e.lexicalEntryId===sample.lexicalEntryId);
 const sense=entry.senses.find(s=>s.senseId===sample.senseId);
 const target={...template.target,homographNo:entry.homographNo,krdictTargetCode:entry.krdictTargetCode||null,krdictSenseId:sense?.krdictSenseId||null};
 const found=[];
 if(sample.type==='example'){
  for(const record of kr.records.filter(r=>r.headword===target.headword))for(const sourceSense of record.senses)for(const ex of sourceSense.examples){
   const alignment=alignSense(target,record,sourceSense,ex.text);
   const version='krdict-cache-'+hash(kr.records);bind('KRDict',version);
   const ev=evidence('KRDict',version,ex.originalId,record.sourceUrl,ex.rawNode,record.fetchedAt);
   const translated=ex.translation;
   const trId=ex.originalId+':cmn',linkId=ex.originalId+':translation-link';
   const linkNode={from:ex.originalId,to:trId,translation:translated?.rawNode};
   const linkEvidence=translated?evidence('KRDict',version,linkId,record.sourceUrl,linkNode,record.fetchedAt):null;
   found.push({...template,target,candidateId:hash([sample.sampleId,'KRDict',ex.originalId]),sourceId:'KRDict',sourceUrl:record.sourceUrl,sourceVersion:version,sourceLicense:registry.KRDict.sourceLicense,originalId:ex.originalId,fetchedAt:record.fetchedAt,sourceAccess:'local-cache',content:{text:ex.text,kind:'example'},
    translation:translated?{text:translated.text,language:'cmn',originalId:trId,licenseApproval:registry.KRDict.licenseApproval,linkEvidence:{type:'direct',from:ex.originalId,to:trId,originalId:linkId,documentHash:linkEvidence.documentHash}}:null,evidence:[ev,...(linkEvidence?[linkEvidence]:[])],
    alignment:{...alignment,headword:record.headword,pos:canonicalPOS(record.partOfSpeech)===canonicalPOS(target.pos)?target.pos:record.partOfSpeech,sourceId:'KRDict',originalId:ex.originalId,externalSenseId:sourceSense.senseId,lexicalEntryId:sample.lexicalEntryId,senseId:sample.senseId,method:alignment.tier==='A'?'source-exact-sense':alignment.tier==='B'?'source-tier-B':'source-unresolved'},senseAlignment:alignment});
  }
  for(const pair of tat.pairs||[]){
   const morph=pair.matches[target.headword];if(!morph)continue;
   const ko=pair.ko,zh=pair.zh,url='https://tatoeba.org/en/sentences/show/'+ko.sentenceId;
   const ev=evidence('Tatoeba',tat.sourceVersion,ko.sentenceId,url,ko.rawNode,tat.fetchedAt);
   const zhEv=evidence('Tatoeba',tat.sourceVersion,zh.sentenceId,'https://tatoeba.org/en/sentences/show/'+zh.sentenceId,zh.rawNode,tat.fetchedAt);
   const linkId=ko.sentenceId+':'+zh.sentenceId,linkEv=evidence('Tatoeba',tat.sourceVersion,linkId,url,pair.link.rawNode,tat.fetchedAt);
   const align=alignSense(target,null,null,ko.text,morph);
   found.push({...template,target,candidateId:hash([sample.sampleId,'Tatoeba',ko.sentenceId,zh.sentenceId]),sourceId:'Tatoeba',sourceUrl:url,sourceLicense:registry.Tatoeba.sourceLicense,sourceVersion:tat.sourceVersion,originalId:ko.sentenceId,fetchedAt:tat.fetchedAt,sourceAccess:'local-cache',content:{text:ko.text,kind:'example',author:ko.author},
    translation:{text:zh.text,language:'cmn',originalId:zh.sentenceId,author:zh.author,licenseApproval:registry.Tatoeba.licenseApproval,linkEvidence:{type:'direct',from:ko.sentenceId,to:zh.sentenceId,originalId:linkId,documentHash:linkEv.documentHash}},evidence:[ev,zhEv,linkEv],morphology:morph,
    alignment:{...align,headword:target.headword,pos:morph.posMatch?target.pos:null,sourceId:'Tatoeba',originalId:ko.sentenceId,method:'lemma-POS-only'},senseAlignment:align});
  }
 }
 const legacy=old.filter(c=>c.evidence.length).map(c=>({...c,target}));
 const ranked=[...found,...legacy].sort((a,b)=>{
  const priority=c=>c.sourceId==='KRDict'?0:c.sourceId==='Tatoeba'?1:2;
  const good=c=>Number(c.morphology?.posMatch&&realExamples({gloss:target.gloss,definitionZh:target.definitionZh,examples:[{ko:c.content.text,zh:c.translation?.text}]}).length);
  return priority(a)-priority(b)||good(b)-good(a)||a.candidateId.localeCompare(b.candidateId);
 });
 const unique=ranked.filter((c,i)=>ranked.findIndex(x=>x.content.text===c.content.text&&x.translation?.text===c.translation?.text)===i);
 candidates.push(...(unique.length?sample.type==='example'?unique.slice(0,3):unique:[{...template,target}]));
}
const python=process.env.PIPELINE_PYTHON||fileURLToPath(new URL(process.platform==='win32'?'./.venv/Scripts/python.exe':'./.venv/bin/python',import.meta.url));
const proc=spawnSync(python,[fileURLToPath(new URL('./morph_batch.py',import.meta.url))],{input:JSON.stringify(candidates),encoding:'utf8',env:{...process.env,PYTHONUTF8:'1'},maxBuffer:40*1024*1024});
if(proc.status!==0)throw Error('Kiwi batch failed: '+proc.stderr);candidates=JSON.parse(proc.stdout);
// Kiwi disagreement is uncertainty, not a dictionary-source POS rejection.
for(const c of candidates){if(c.morphology?.posMatch&&!c.alignment?.pos)c.alignment={...c.alignment,headword:c.target.headword,pos:c.target.pos};}
const scored=candidates.map(c=>reevaluate(c,previous.find(p=>p.candidateId===c.candidateId),policy));
const gate=publicationGate(scored,policy,{blockingQualityAudit:null,expectedDatasetHash:hash(raw),currentDatasetHash:hash(raw),entries:raw.entries});
const stats=rows=>({sourceCandidateCount:rows.filter(c=>c.evidence.length).length,auto_verified:rows.filter(c=>c.reviewStatus==='auto_verified').length,quarantine:rows.filter(c=>c.reviewStatus==='quarantine').length,auto_rejected:rows.filter(c=>c.reviewStatus==='auto_rejected').length,licenseBlocked:rows.filter(c=>!c.validationFlags.licenseApproval).length,posBlocked:rows.filter(c=>!c.validationFlags.pos||c.morphology?.posConflict).length,senseBlocked:rows.filter(c=>!c.validationFlags.alignment).length,translationBlocked:rows.filter(c=>c.type==='example'&&!c.validationFlags.translation).length});
const sampleStats=type=>{const group=samples.filter(s=>s.type===type),rows=gate.candidates.filter(c=>c.type===type),status=s=>{const r=rows.filter(c=>c.sampleId===s.sampleId);return r.some(c=>c.reviewStatus==='auto_verified')?'auto_verified':r.every(c=>c.reviewStatus==='auto_rejected')?'auto_rejected':'quarantine';};return {samples:group.length,auto_verified:group.filter(s=>status(s)==='auto_verified').length,quarantine:group.filter(s=>status(s)==='quarantine').length,auto_rejected:group.filter(s=>status(s)==='auto_rejected').length,missingInputRows:rows.filter(c=>!c.evidence.length).length,recordMetrics:stats(rows.filter(c=>c.evidence.length))};};
const report={thresholds:policy.high,calibrated:policy.calibrated,fixedSampleCount:samples.length,sourceAccess:{KRDict:kr.sourceAccess,Tatoeba:tat.sourceAccess},sourceRegistryEntries:Object.keys(registry),byType:Object.fromEntries(['example','collocation','polysemy'].map(type=>[type,sampleStats(type)])),bySource:Object.fromEntries(['KRDict','Tatoeba','Kaikki-ko-Wiktionary','songys-chatbot-v1'].map(source=>[source,source==='KRDict'&&kr.sourceAccess==='unavailable'?{sourceAccess:'unavailable',sourceCandidateCount:null}:stats(gate.candidates.filter(c=>c.sourceId===source))])),published:0,writerEnabled:false,publicationDryRunBlockingErrors:gate.candidates.filter(c=>c.gateReasons.length).length,plan:gate.plan};
await fs.writeFile(new URL('./unblock-results.json',import.meta.url),JSON.stringify({report,policy,candidates:gate.candidates},null,2));
await fs.writeFile(new URL('./unblock-report.json',import.meta.url),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
