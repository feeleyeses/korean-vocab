import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {hash} from './automation.mjs';
import {byteHash,planRelease} from './publication.mjs';
import {verifyPhase} from './release-phase.mjs';
export const RELEASE_ID='examples-7d882c8df890c5ba0278';
const read=async p=>JSON.parse(await fs.readFile(new URL(p,import.meta.url),'utf8'));
export async function verifyReleaseA({phase,target=new URL('../../data/vocabulary.json',import.meta.url)}={}){
 if(!['pre_publish','post_publish'].includes(phase))throw Error('Explicit publication phase required');
 const mb=await fs.readFile(new URL('./release-a-manifest.json',import.meta.url)),ab=await fs.readFile(new URL('./RELEASE-A-ATTRIBUTION.md',import.meta.url));
 const m=JSON.parse(mb),record=await read('./release-a-record.json'),input=await read('./release-a-input.json'),current=JSON.parse(await fs.readFile(target,'utf8')),registry=(await read('./source-registry.json')).sources;
 const check=(ok,why)=>{if(!ok)throw Error(why);};
 check(m.releaseId===RELEASE_ID,'Unexpected release ID');
 check(byteHash(mb)===record.manifestByteHash,'Frozen manifest bytes changed');
 check(byteHash(ab)===record.attributionByteHash,'Attribution bytes changed');
 check(hash(input)===record.inputHash,'Frozen input changed');
 const state=verifyPhase(phase,hash(current),m);
 check(hash(input.candidates)===m.sourceDatasetHash,'Source dataset drift');
 for(const key of ['candidateIds','addedExampleIds','senseIds'])check(m[key].length===150&&new Set(m[key]).size===150,'Count/duplicate '+key);
 check(hash(input.candidates.map(c=>c.candidateId))===hash(m.candidateIds),'Candidate order/membership');
 check(hash(input.candidates.map(c=>c.senseId))===hash(m.senseIds),'Sense membership');
 check(hash(input.candidates.map(c=>'external-'+c.candidateId))===hash(m.addedExampleIds),'Example IDs');
 check(m.sourceIds.length===1&&m.sourceIds[0]==='Tatoeba','Unexpected source');
 for(const c of input.candidates){
  check(c.type==='example'&&c.reviewStatus==='auto_verified'&&!c.replacement,'Non-additive candidate');
  check(registry[c.sourceId]?.licenseApproval===true,'Source not admitted');
  const line=ab.toString('utf8').split('\n').find(l=>l.startsWith('- '+c.candidateId+':'));
  check(line&&[c.originalId,c.translation.originalId,c.content.author,c.translation.author,c.sourceVersion].every(v=>line.includes(v)),'Attribution incomplete');
 }
 if(state.status==='already_published')return {...state,phase,releaseId:RELEASE_ID,writerEnabled:false};
 const raw=structuredClone(current);
 if(phase==='post_publish'){
  const ids=new Set(m.addedExampleIds),found=[];
  for(const w of raw.entries)for(const s of w.senses){
   for(const e of s.examples||[])if(ids.has(e.exampleId))found.push([e.exampleId,s.senseId]);
   s.examples=(s.examples||[]).filter(e=>!ids.has(e.exampleId));
  }
  check(found.length===150&&new Set(found.map(x=>x[0])).size===150,'Post-release example count');
  check(found.every(([id,sid])=>m.senseIds[m.addedExampleIds.indexOf(id)]===sid),'Post-release sense mismatch');
 }
 check(hash(raw)===m.previousVocabularyHash&&hash(raw)===m.datasetHash,phase==='post_publish'?'Post-release baseline reconstruction failed':'Production drift');
 // Projection only. Discard generated metadata: never save a new manifest or vocabulary.
 const plan=await planRelease(raw,input,registry,{selectionRank:Object.fromEntries(m.candidateIds.map((id,i)=>[id,i]))});
 check(plan.releaseReady===150&&plan.blocked===0&&plan.invariant,'Release gate failed');
 check(hash(plan.next)===m.newVocabularyHash&&m.expectedNewHash===m.newVocabularyHash,'Projected hash mismatch');
 if(phase==='post_publish')check(hash(current)===hash(plan.next),'Post-release provenance/schema mismatch');
 const oldWarnings=new Set(plan.audit.report.reviewQueue.map(hash));
 check(!plan.projectedAudit.report.reviewQueue.some(w=>!oldWarnings.has(hash(w))),'New warning');
 return {...state,phase,releaseId:RELEASE_ID,releaseReady:150,writerEnabled:false,productionWritten:phase==='post_publish',manifestUnchanged:true,sourceDatasetHashMatches:true,attributionCoverage:150,previousVocabularyHash:hash(raw),expectedNewHash:hash(plan.next),blockingErrors:plan.projectedAudit.report.totals.blockingFailures,newWarnings:0};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const result=await verifyReleaseA({phase:process.argv.find(x=>x.startsWith('--phase='))?.slice(8)});
 console.log(JSON.stringify(result,null,2));
 if(result.status==='already_published')process.exitCode=2;
}
