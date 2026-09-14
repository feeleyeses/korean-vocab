import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {hash} from './automation.mjs';
import {byteHash,planRelease} from './publication.mjs';
export const RELEASE_ID='examples-7d882c8df890c5ba0278';
const read=async p=>JSON.parse(await fs.readFile(new URL(p,import.meta.url),'utf8'));
export async function verifyReleaseA(){
 const mb=await fs.readFile(new URL('./release-a-manifest.json',import.meta.url)),ab=await fs.readFile(new URL('./RELEASE-A-ATTRIBUTION.md',import.meta.url));
 const m=JSON.parse(mb),record=await read('./release-a-record.json'),input=await read('./release-a-input.json'),raw=await read('../../data/vocabulary.json'),registry=(await read('./source-registry.json')).sources;
 const check=(ok,why)=>{if(!ok)throw Error(why);};
 check(m.releaseId===RELEASE_ID,'Unexpected release ID');
 check(byteHash(mb)===record.manifestByteHash,'Frozen manifest bytes changed');
 check(byteHash(ab)===record.attributionByteHash,'Attribution bytes changed');
 check(hash(input)===record.inputHash,'Frozen input changed');
 check(hash(raw)===m.previousVocabularyHash&&hash(raw)===m.datasetHash,'Production drift');
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
 // Projection only. Discard generated metadata: never save a new manifest or vocabulary.
 const plan=await planRelease(raw,input,registry,{selectionRank:Object.fromEntries(m.candidateIds.map((id,i)=>[id,i]))});
 check(plan.releaseReady===150&&plan.blocked===0&&plan.invariant,'Release gate failed');
 check(hash(plan.next)===m.newVocabularyHash&&m.expectedNewHash===m.newVocabularyHash,'Projected hash mismatch');
 const oldWarnings=new Set(plan.audit.report.reviewQueue.map(hash));
 check(!plan.projectedAudit.report.reviewQueue.some(w=>!oldWarnings.has(hash(w))),'New warning');
 return {releaseId:RELEASE_ID,releaseReady:150,writerEnabled:false,productionWritten:false,manifestUnchanged:true,sourceDatasetHashMatches:true,attributionCoverage:150,previousVocabularyHash:hash(raw),expectedNewHash:hash(plan.next),blockingErrors:plan.projectedAudit.report.totals.blockingFailures,newWarnings:0};
}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log(JSON.stringify(await verifyReleaseA(),null,2));
