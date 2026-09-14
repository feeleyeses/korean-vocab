import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {hash} from './automation.mjs';
import {byteHash,planRelease} from './publication.mjs';
import {verifyPhase} from './release-phase.mjs';
export const root=fileURLToPath(new URL('../../',import.meta.url));
export const here=fileURLToPath(new URL('./',import.meta.url));
export const read=async p=>JSON.parse(await fs.readFile(p,'utf8'));
export const check=(ok,why)=>{if(!ok)throw Error(why);};
export const args=()=>Object.fromEntries(process.argv.slice(2).map((s,i,a)=>s.startsWith('--')?[s.slice(2),a[i+1]?.startsWith('--')?true:a[i+1]??true]:null).filter(Boolean));
export function paths(name){check(/^[B-Z]$/.test(name),'Explicit release B..Z required; Release A is immutable');const base=path.join(here,'release-'+name.toLowerCase());return {manifest:base+'-manifest.json',input:base+'-input.json',attribution:base+'-attribution.md',record:base+'-record.json'};}
export async function assertRules(){
 const lock=await read(path.join(here,'train-rules-lock.json'));
 for(const [p,digest] of Object.entries(lock.files))check(hash((await fs.readFile(path.join(root,p),'utf8')).replace(/\r\n/g,'\n'))===digest,'Frozen rule changed: '+p+'; stop train and version policy');
 return hash(lock);
}
export async function loadRelease(name){
 const p=paths(name),m=await read(p.manifest),input=await read(p.input),record=await read(p.record),credit=await fs.readFile(p.attribution,'utf8');
 check(record.rulesHash===await assertRules(),'Rules lock drift');
 check(byteHash(await fs.readFile(p.manifest))===record.manifestByteHash,'Manifest mismatch');
 check(hash(input)===record.inputHash&&hash(input.candidates)===m.sourceDatasetHash,'Source dataset drift');
 const policyRules=p=>{const c=structuredClone(p);delete c.singleSenseFastLane.datasetHash;delete c.singleSenseFastLane.entries;return c;};
 const frozen=await read(path.join(here,'release-a-input.json'));
 check(hash(policyRules(input.policy))===hash(policyRules(frozen.policy)),'Frozen policy/threshold/source version changed');
 check(hash(credit.replace(/\r\n/g,'\n'))===record.attributionHash,'Attribution drift');
 check(m.previousVocabularyHash!==m.newVocabularyHash&&m.expectedNewVocabularyHash===m.newVocabularyHash,'Manifest expected hash mismatch');
 const n=m.candidateIds.length;
 for(const ids of [m.candidateIds,m.exampleIds,m.senseIds])check(ids.length===n&&new Set(ids).size===n,'Duplicate/count mismatch');
 check(hash(m.addedExampleIds)===hash(m.exampleIds),'Example ID aliases');
 check(hash(input.candidates.map(c=>c.candidateId))===hash(m.candidateIds),'Candidate membership/order');
 check(hash(input.candidates.map(c=>c.senseId))===hash(m.senseIds),'Sense membership/order');
 check(hash(input.candidates.map(c=>'external-'+c.candidateId))===hash(m.exampleIds),'Example membership/order');
 for(const c of input.candidates){check(c.type==='example'&&!c.replacement,'Additions only');check([c.candidateId,c.originalId,c.translation.originalId,c.content.author,c.translation.author,c.sourceVersion].every(v=>v&&credit.includes(v)),'Attribution incomplete');}
 return {p,m,input,record,credit};
}
export async function verifyRelease({name,phase,target=path.join(root,'data/vocabulary.json')}){
 check(['pre_publish','post_publish'].includes(phase),'Explicit phase required');
 const bundle=await loadRelease(name),{m,input}=bundle,current=await read(target);
 const state=verifyPhase(phase,hash(current),m);
 if(state.status==='already_published')return {...state,phase};
 const previous=structuredClone(current);
 if(phase==='post_publish')for(const w of previous.entries)for(const s of w.senses)s.examples=(s.examples||[]).filter(e=>!m.exampleIds.includes(e.exampleId));
 check(hash(previous)===m.previousVocabularyHash&&input.datasetHash===m.previousVocabularyHash,'Baseline drift/replacement/delete');
 const registry=(await read(path.join(here,'source-registry.json'))).sources;
 const plan=await planRelease(previous,input,registry,{selectionRank:Object.fromEntries(m.candidateIds.map((id,i)=>[id,i]))});
 check(plan.releaseReady===m.candidateIds.length&&plan.blocked===0&&plan.invariant,'Publication gate failed');
 check(hash(plan.next)===m.newVocabularyHash,'Expected hash mismatch');
 const old=new Set(plan.audit.report.reviewQueue.map(hash));
 check(!plan.projectedAudit.report.reviewQueue.some(w=>!old.has(hash(w))),'New warning');
 if(phase==='post_publish')check(hash(current)===hash(plan.next),'Post-release projection/provenance drift');
 plan.manifest=m;
 return {...state,phase,plan,bundle,blockingErrors:0,newWarnings:0,addedExamples:m.candidateIds.length,coveredSenses:m.senseIds.length,replacements:0,deletedExamples:0};
}
