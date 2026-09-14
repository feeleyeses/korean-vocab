// Research-only release planner. No caller in the application or ingest pipeline.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {hash,norm,evaluate,publicationGate,freezePolicy} from './automation.mjs';
export const WRITER_DEFAULTS=Object.freeze({enabled:false});
export const byteHash=b=>createHash('sha256').update(b).digest('hex');
export async function qualityAudit(doc){
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'korean-release-audit-'));
 try{
  const input=path.join(dir,'vocabulary.json'),report=path.join(dir,'audit.json');
  await fs.writeFile(input,JSON.stringify(doc));
  const p=spawnSync(process.execPath,[fileURLToPath(new URL('../../scripts/vocab-quality-audit.mjs',import.meta.url)),input,'--report='+report],{encoding:'utf8',maxBuffer:8e6});
  const result=JSON.parse(await fs.readFile(report,'utf8'));
  return {passed:p.status===0,exitCode:p.status,report:result};
 }finally{await fs.rm(dir,{recursive:true,force:true});}
}
export async function planRelease(raw,baseline,registry,options={}){
 // Never trust candidate-embedded approval. Bind controlled registry to the frozen export version.
 const policy=structuredClone(baseline.policy);
 for(const [id,s] of Object.entries(policy.sources))policy.sources[id]={...registry[id],sourceVersion:s.sourceVersion};
 freezePolicy(policy);
 const audit=await qualityAudit(raw),gate=publicationGate(baseline.candidates,policy,{selectionRank:options.selectionRank,blockingQualityAudit:audit.passed?0:1,currentDatasetHash:hash(raw),expectedDatasetHash:baseline.datasetHash,entries:raw.entries});
 const allIds=new Set(raw.entries.flatMap(w=>w.senses.flatMap(s=>(s.examples||[]).map(e=>e.exampleId))));
 for(const c of gate.candidates){
  const currentSense=raw.entries.find(w=>w.lexicalEntryId===c.lexicalEntryId)?.senses.find(s=>s.senseId===c.senseId);
  if(currentSense?.examples?.some(e=>norm(e.ko)===norm(c.content.text)))c.gateReasons.push('duplicate_current_example');
  if(c.reviewStatus!=='auto_verified')c.gateReasons.push(...c.reasons);
  if(baseline.policy.singleSenseFastLane?.datasetHash!==baseline.datasetHash)c.gateReasons.push('baseline_dataset_binding');
  if(c.evidence.some(e=>!e.rawNode||e.nodeHash!==hash(e.rawNode)||e.documentHash!==hash(e.rawNode)))c.gateReasons.push('evidence_node_hash');
  const ko=c.evidence.find(e=>e.originalId===c.originalId),zh=c.evidence.find(e=>e.originalId===c.translation?.originalId);
  if(!ko?.rawNode||!zh?.rawNode||ko.nodeHash!==hash(ko.rawNode)||zh.nodeHash!==hash(zh.rawNode))c.gateReasons.push('required_node_hash');
  if(ko?.rawNode?.[3]!==c.content.author||zh?.rawNode?.[3]!==c.translation?.author||[c.content.author,c.translation?.author].some(a=>!a||a==='\\N'))c.gateReasons.push('attribution_node_conflict');
  if(allIds.has('external-'+c.candidateId))c.gateReasons.push('existing_example_id');
  if(c.type!=='example')c.gateReasons.push('example_only_release');
 }
 const ready=gate.candidates.filter(c=>c.reviewStatus==='auto_verified'&&!c.gateReasons.length);
 const next=structuredClone(raw);
 for(const c of ready){
  const sense=next.entries.find(w=>w.lexicalEntryId===c.lexicalEntryId).senses.find(s=>s.senseId===c.senseId);
  sense.examples??=[];
  sense.examples.push({exampleId:'external-'+c.candidateId,ko:c.content.text,zh:c.translation.text,source:c.sourceId,verified:true,verificationStatus:'auto_verified',
   provenance:{sentenceId:c.originalId,translationSentenceId:c.translation.originalId,author:c.content.author,translationAuthor:c.translation.author,license:c.sourceLicense,sourceUrl:c.sourceUrl,sourceVersion:c.sourceVersion,fetchedAt:c.fetchedAt,evidence:c.evidence,scoreVersion:c.scoreVersion}});
 }
 // Ensure no headword, sense, scheduling or other existing field is changed by projection.
 const restored=structuredClone(next),addedIds=new Set(ready.map(c=>'external-'+c.candidateId));
 for(const w of restored.entries)for(const s of w.senses)s.examples=(s.examples||[]).filter(e=>!addedIds.has(e.exampleId));
 const invariant=hash(restored)===hash(raw),post=await qualityAudit(next);
 if(!invariant||!post.passed)for(const c of ready)c.gateReasons.push(!invariant?'projection_changed_existing_data':'projected_quality_block');
 const accepted=ready.filter(c=>!c.gateReasons.length);
 return {mode:'dry-run',writerEnabled:false,published:0,releaseReady:accepted.length,blocked:gate.candidates.length-accepted.length,candidates:gate.candidates,
  blockReason:Object.entries(gate.candidates.flatMap(c=>[...new Set(c.gateReasons)]).reduce((a,r)=>(a[r]=(a[r]||0)+1,a),{})),audit,projectedAudit:post,invariant,
  manifest:{releaseId:'examples-'+hash([baseline.datasetHash,accepted.map(c=>c.candidateId)]).slice(0,20),sourceDatasetHash:hash(baseline.candidates),previousVocabularyHash:hash(raw),newVocabularyHash:hash(next),addedExampleIds:accepted.map(c=>'external-'+c.candidateId),timestamp:new Date().toISOString(),scoreVersion:policy.version},
  next:accepted.length===ready.length?next:null};
}
export async function writeRelease({target,release,enabled=false,confirmationReleaseId,audit=qualityAudit}){
 if(!enabled)return {mode:'disabled',written:false};
 if(!release.next||release.blocked||!release.releaseReady||confirmationReleaseId!==release.manifest.releaseId)throw Error('Release not authorized/fully ready');
 const absolute=path.resolve(target),lock=absolute+'.publication.lock',temp=absolute+'.release.tmp',backup=absolute+'.'+release.manifest.releaseId+'.backup';
  const handle=await fs.open(lock,'wx');let replaced=false,previous,tempOwned=false;
 try{
  previous=await fs.readFile(absolute);
  if(hash(JSON.parse(previous))!==release.manifest.previousVocabularyHash)throw Error('Dataset drift');
  await fs.writeFile(backup,previous,{flag:'wx'});
  await fs.writeFile(temp,JSON.stringify(release.next,null,2)+'\n',{flag:'wx'});
  tempOwned=true;
  const staged=JSON.parse(await fs.readFile(temp,'utf8'));
  if(hash(staged)!==release.manifest.newVocabularyHash||!(await audit(staged)).passed)throw Error('Staged audit/hash failed');
  const oldCount=JSON.parse(previous).entries.reduce((n,w)=>n+w.senses.reduce((v,s)=>v+(s.examples||[]).length,0),0);
  const newCount=staged.entries.reduce((n,w)=>n+w.senses.reduce((v,s)=>v+(s.examples||[]).length,0),0);
  if(newCount-oldCount!==release.manifest.addedExampleIds.length)throw Error('Count mismatch');
  if(byteHash(await fs.readFile(absolute))!==byteHash(previous))throw Error('Concurrent drift');
  await fs.rename(temp,absolute);replaced=true;
  const written=JSON.parse(await fs.readFile(absolute,'utf8'));
  if(hash(written)!==release.manifest.newVocabularyHash||!(await audit(written)).passed)throw Error('Post-write audit/hash failed');
  await fs.writeFile(backup+'.release.json',JSON.stringify({...release.manifest,previousFileHash:byteHash(previous),newFileHash:byteHash(await fs.readFile(absolute))},null,2),{flag:'wx'});
  return {written:true,backup,releaseId:release.manifest.releaseId};
 }catch(e){
  if(replaced){await fs.writeFile(temp,previous);await fs.rename(temp,absolute);}
  throw e;
 }finally{if(tempOwned)await fs.rm(temp,{force:true});await handle.close();await fs.rm(lock,{force:true});}
}
