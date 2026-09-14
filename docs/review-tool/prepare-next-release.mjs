import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {hash} from './automation.mjs';
import {recompute} from './train-recompute.mjs';
import {rankExample,compareRank,attributionDiagnosis} from './readiness-rules.mjs';
import {planRelease,writeRelease,byteHash} from './publication.mjs';
import {args,paths,root,here,read,check,assertRules,verifyRelease} from './train-lib.mjs';
const a=args(),name=a.name,size=Number(a.size),p=paths(name);
check(Number.isInteger(size)&&size>0&&size<=400,'Invalid size');
const rulesHash=await assertRules();
for(const file of Object.values(p))check(!await fs.stat(file).catch(()=>null),'Frozen release exists; never overwrite '+file);
const predecessor=String.fromCharCode(name.charCodeAt(0)-1);
const prior=await read(path.join(here,'release-'+predecessor.toLowerCase()+'-record.json'));
check(prior.kind==='published','Previous release not published');
if(predecessor!=='A')check(prior.online?.passed&&prior.online.ci==='success'&&prior.online.pages==='success','Previous release online/CI/Pages incomplete');
if(size>250)check(prior.online?.passed&&(await read(paths(String.fromCharCode(predecessor.charCodeAt(0)-1)).record)).online?.passed,'Two successful train releases required before acceleration');
const production=path.join(root,'data/vocabulary.json'),bytes=await fs.readFile(production),raw=JSON.parse(bytes);
const previousHash=prior.publication?.newVocabularyHash||prior.newVocabularyHash;
check(hash(raw)===previousHash,'Production drift from predecessor');
const tat=await read(path.join(here,'unblock-local/tatoeba-expanded-index.json'));
const external=await read(path.join(here,'../research-poc/kaikki-matched-cache.json'));
const base=await read(path.join(here,'release-a-input.json')),registry=(await read(path.join(here,'source-registry.json'))).sources;
check(tat.sourceVersion===base.policy.sources.Tatoeba.sourceVersion,'Source version changed: stop frozen train');
const result=recompute(raw,tat,external,base,registry.Tatoeba);
// Replay all matched morphology, not just historical auto_verified records.
const python=process.env.PIPELINE_PYTHON||path.join(here,process.platform==='win32'?'.venv/Scripts/python.exe':'.venv/bin/python');
const replay=spawnSync(python,[path.join(here,'morph_batch.py')],{input:JSON.stringify(result.candidates.map(c=>({candidateId:c.candidateId,target:c.target,content:c.content}))),encoding:'utf8',env:{...process.env,PYTHONUTF8:'1'},maxBuffer:128*1024*1024});
check(replay.status===0,'Kiwi replay unavailable/failed');
const morph=JSON.parse(replay.stdout);check(morph.length===result.candidates.length&&morph.every((r,i)=>r.candidateId===result.candidates[i].candidateId&&hash(r.morphology)===hash(result.candidates[i].morphology)),'Kiwi evidence drift');
const selected=result.candidates.filter(c=>c.reviewStatus==='auto_verified');
const getSense=c=>raw.entries.find(w=>w.lexicalEntryId===c.lexicalEntryId).senses.find(s=>s.senseId===c.senseId);
const ranked=selected.map(c=>({...c,rank:rankExample(c,getSense(c))})).sort(compareRank),selectionRank=Object.fromEntries(ranked.map((c,i)=>[c.candidateId,i]));
const baseline={datasetHash:hash(raw),policy:result.policy,candidates:selected};
const gate=await planRelease(raw,baseline,registry,{selectionRank});
const ready=gate.candidates.filter(c=>c.reviewStatus==='auto_verified'&&!c.gateReasons.length),readyIds=new Set(ready.map(c=>c.candidateId));
const senses=new Set(),rows=[];
for(const c of ranked){if(!readyIds.has(c.candidateId)||senses.has(c.senseId)||!c.rank.completePredicate||c.rank.characters<12||c.rank.characters>80||!attributionDiagnosis(c).complete||c.reasons.length||Object.values(c.validationFlags).some(v=>v===false))continue;senses.add(c.senseId);rows.push(c);if(rows.length===size)break;}
check(rows.length===size,'Insufficient warning-free releaseReady; no partial manifest');
const input={...baseline,candidates:rows},plan=await planRelease(raw,input,registry,{selectionRank});
check(plan.releaseReady===size&&!plan.blocked&&plan.invariant,'Batch gate failed');
const oldWarnings=new Set(plan.audit.report.reviewQueue.map(hash));check(!plan.projectedAudit.report.reviewQueue.some(w=>!oldWarnings.has(hash(w))),'New warning');
const createdAt=new Date().toISOString(),m={...plan.manifest,name,createdAt,expectedNewVocabularyHash:plan.manifest.newVocabularyHash,candidateIds:rows.map(c=>c.candidateId),exampleIds:plan.manifest.addedExampleIds,senseIds:rows.map(c=>c.senseId),policyVersion:result.policy.version,sourceVersions:[...new Set(rows.map(c=>c.sourceVersion))],sourceIds:[...new Set(rows.map(c=>c.sourceId))],rankingVersion:'release-rank-lexicographic-v1',rulesHash};
const credit='# Release '+name+' — Tatoeba attribution\n\nCC BY 2.0 FR: https://creativecommons.org/licenses/by/2.0/fr/\nText unchanged; contributors from the official export.\n\n'+rows.map(c=>'- '+c.candidateId+': Korean ['+c.originalId+']('+c.sourceUrl+') — '+c.content.author+'; Chinese ['+c.translation.originalId+'](https://tatoeba.org/en/sentences/show/'+c.translation.originalId+') — '+c.translation.author+'; export '+c.sourceVersion).join('\n')+'\n';
const mb=JSON.stringify(m,null,2)+'\n';
const tally=rs=>rs.reduce((o,r)=>(o[r]=(o[r]||0)+1,o),{});
const report={...result.report,autoVerified: selected.length,releaseReady:ready.length,coveredSenseCount:new Set(ready.map(c=>c.senseId)).size,capacitySelected:gate.candidates.filter(c=>c.gateReasons.includes('example_cap')).length,publicationBlocked:gate.blocked,blockingReasons:gate.blockReason,byLevel:undefined,morphologyReplay:{count:morph.length,mismatches:0},blocked:tally(result.candidates.filter(c=>c.reviewStatus!=='auto_verified').flatMap(c=>c.reasons))};
const record={kind:'prepared-not-published',name,releaseId:m.releaseId,createdAt,rulesHash,manifestByteHash:byteHash(mb),inputHash:hash(input),attributionHash:hash(credit),previousVocabularyHash:m.previousVocabularyHash,newVocabularyHash:m.newVocabularyHash,report,byLevel:tally(rows.flatMap(c=>raw.entries.find(w=>w.lexicalEntryId===c.lexicalEntryId).levels)),sourceInputs:{tatoebaHash:hash(tat),homographCacheHash:hash(external)},dryRun:{passed:false},writerEnabled:false};
for(const [file,content] of [[p.manifest,mb],[p.input,JSON.stringify(input,null,2)+'\n'],[p.attribution,credit],[p.record,JSON.stringify(record,null,2)+'\n']])await fs.writeFile(file,content,{flag:'wx'});
// Frozen files exist before transaction; a failed dry-run leaves a non-publishable record.
const dir=await fs.mkdtemp(path.join(os.tmpdir(),'release-train-'));
try{
 const pre=await verifyRelease({name,phase:'pre_publish'}),target=path.join(dir,'success.json'),rollback=path.join(dir,'rollback.json');
 await fs.writeFile(target,bytes);await fs.writeFile(rollback,bytes);
 const postVerify=opts=>verifyRelease({name,...opts});
 await writeRelease({target,release:pre.plan,enabled:true,confirmationReleaseId:m.releaseId,postVerify});
 await verifyRelease({name,phase:'post_publish',target});
 const repeat=await verifyRelease({name,phase:'pre_publish',target});check(repeat.status==='already_published'&&!repeat.writerAllowed,'Idempotency failure');
 let rolled=false;try{await writeRelease({target:rollback,release:pre.plan,enabled:true,confirmationReleaseId:m.releaseId,postVerify:async()=>{throw Error('forced rollback');}});}catch(e){check(e.message==='forced rollback','Unexpected transaction failure');rolled=byteHash(await fs.readFile(rollback))===byteHash(bytes);}
 check(rolled&&byteHash(await fs.readFile(production))===byteHash(bytes),'Rollback/production invariant failed');
 record.dryRun={passed:true,blockingErrors:0,newWarnings:0,warningDelta:plan.projectedAudit.report.totals.warnings-plan.audit.report.totals.warnings,addedExamples:size,coveredSenses:size,replacements:0,deletedExamples:0,transactionPassed:true,rollbackByteIdentical:true,alreadyPublishedPassed:true,productionUntouched:true};
 await fs.writeFile(p.record,JSON.stringify(record,null,2)+'\n');
}finally{await fs.rm(dir,{recursive:true,force:true});}
console.log(JSON.stringify({report,byLevel:record.byLevel,releaseId:m.releaseId,previousHash:m.previousVocabularyHash,expectedNewHash:m.newVocabularyHash,dryRun:record.dryRun},null,2));
