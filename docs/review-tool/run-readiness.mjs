import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {hash,norm} from './automation.mjs';
import {realExamples} from '../../src/domain.js';
import {planRelease,writeRelease,qualityAudit,byteHash} from './publication.mjs';
import {sentenceFeatures,attributionDiagnosis,ATTRIBUTION_POLICY,classify,rankExample,compareRank} from './readiness-rules.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const read=async p=>JSON.parse(await fs.readFile(path.resolve(here,p),'utf8'));
const save=async(p,v)=>fs.writeFile(path.join(here,p),JSON.stringify(v,null,2));
const productionPath=path.resolve(here,'../../data/vocabulary.json'),originalBytes=await fs.readFile(productionPath),raw=JSON.parse(originalBytes);
const input=await read('expanded-results.json'),registry=(await read('source-registry.json')).sources;
if(hash(raw)!==input.report.datasetHash)throw Error('Production drift');
const candidates=input.candidates,selected=candidates.filter(c=>c.reviewStatus==='auto_verified');
if(selected.length!==1817)throw Error('Frozen 1817 cohort changed');
const replay=spawnSync(process.env.PIPELINE_PYTHON||path.join(here,process.platform==='win32'?'.venv/Scripts/python.exe':'.venv/bin/python'),[path.join(here,'morph_batch.py')],{input:JSON.stringify(selected.map(c=>({candidateId:c.candidateId,target:c.target,content:c.content}))),encoding:'utf8',env:{...process.env,PYTHONUTF8:'1'},maxBuffer:128*1024*1024});
if(replay.status!==0)throw Error('Kiwi replay failed');
const morphologyReplay=JSON.parse(replay.stdout),morphologyMismatches=morphologyReplay.filter((r,i)=>hash(r.morphology)!==hash(selected[i].morphology));
if(morphologyMismatches.length)throw Error('Kiwi evidence drift; quarantine rather than release');
const getSense=c=>raw.entries.find(w=>w.lexicalEntryId===c.lexicalEntryId).senses.find(s=>s.senseId===c.senseId);
const ranked=selected.map(c=>({...c,rank:rankExample(c,getSense(c))})).sort(compareRank);
const selectionRank=Object.fromEntries(ranked.map((c,i)=>[c.candidateId,i]));
const baseline={datasetHash:input.report.datasetHash,policy:input.policy,candidates:selected};
console.log('Running final gate on frozen 1817 candidates');
const gate=await planRelease(raw,baseline,registry,{selectionRank});
const ready=gate.candidates.filter(c=>c.reviewStatus==='auto_verified'&&!c.gateReasons.length);
const readyIds=new Set(ready.map(c=>c.candidateId));
const tally=rs=>rs.reduce((a,r)=>(a[r]=(a[r]||0)+1,a),{});
const categoryReport=rows=>{
 const result={overlapping:{},exclusive:{},total:rows.length};
 for(const row of rows){const cats=classify(row.reasons);for(const c of cats)result.overlapping[c]=(result.overlapping[c]||0)+1;
  const primary=['recoverableMetadata','qualityUncertainty','ruleDesign','expectedSelection'].find(c=>cats.includes(c))||'none';result.exclusive[primary]=(result.exclusive[primary]||0)+1;}
 return result;
};
const lengthRows=candidates.map(c=>({candidateId:c.candidateId,sentenceId:c.originalId,ko:c.content.text,zh:c.translation.text,...sentenceFeatures(c)}));
const summarize=rows=>({count:rows.length,otherGatesPassed:rows.filter(r=>r.otherGatesPassed).length,completePredicate:rows.filter(r=>r.completePredicate).length,
 characters:{min:Math.min(...rows.map(r=>r.characters)),max:Math.max(...rows.map(r=>r.characters))},
 ruleA:rows.filter(r=>r.ruleA).length,ruleB:Object.fromEntries([4,6,8].map(n=>[n,rows.filter(r=>r.ruleB[n]).length])),ruleC:Object.fromEntries([2,3,4].map(n=>[n,rows.filter(r=>r.ruleC[n]).length])),ruleD:rows.filter(r=>r.ruleD).length,
 AacceptedWithoutCompletePredicate:rows.filter(r=>r.ruleA&&!r.completePredicate).length,
 DnewAndOtherGatesPassed:rows.filter(r=>!r.ruleA&&r.ruleD&&r.otherGatesPassed).length});
const sentenceMap=new Map();
for(const r of lengthRows){const previous=sentenceMap.get(r.sentenceId);sentenceMap.set(r.sentenceId,{...r,otherGatesPassed:r.otherGatesPassed||previous?.otherGatesPassed===true});}
const uniqueRows=[...sentenceMap.values()];
const bucket=n=>n>=4?'4+':String(n);
const lengthAudit={unit:'candidate-to-sense rows; unique source sentences also reported',candidateCount:lengthRows.length,uniqueSentenceCount:uniqueRows.length,all:summarize(lengthRows),byWhitespace:Object.fromEntries(['1','2','3','4+'].map(b=>[b,summarize(lengthRows.filter(r=>bucket(r.whitespaceTokens)===b))])),uniqueByWhitespace:Object.fromEntries(['1','2','3','4+'].map(b=>[b,summarize(uniqueRows.filter(r=>bucket(r.whitespaceTokens)===b))])),
 decision:'Keep Rule A in production gate. B/C/D are uncalibrated deterministic comparators, not activated. Morphology counts or EF presence do not establish semantic completeness/naturalness; no independent truth labels justify relaxing A.',
 rules:{A:'8..240 chars; legacy punctuation/whitespace tokens>=3',B:'8..240 chars; Kiwi morphemes N=4/6/8',C:'8..240 chars; lexical morphemes N=2/3/4',D:'8..240 chars; predicate+EF+nonlexical tail; >=2 lexical morphemes; exclude interjection-only'},rows:lengthRows};
const missing=candidates.filter(c=>c.reasons.includes('attribution_missing'));
const attrRows=missing.map(c=>({candidateId:c.candidateId,sentenceId:c.originalId,translationSentenceId:c.translation.originalId,...attributionDiagnosis(c)}));
const attribution={policy:ATTRIBUTION_POLICY,total:missing.length,resolvedAttribution:attrRows.filter(r=>r.complete).length,stillBlocked:attrRows.filter(r=>!r.complete).length,reasonBreakdown:tally(attrRows.flatMap(r=>r.reasons)),rows:attrRows,
 causeCounts:{exportOwnerAbsent:attrRows.filter(r=>r.reasons.some(x=>x.endsWith('export_owner_absent'))).length,ingestFieldLoss:attrRows.filter(r=>r.reasons.some(x=>x.endsWith('ingest_field_mismatch'))).length,metadataJoinFailed:attrRows.filter(r=>r.reasons.some(x=>x.endsWith('metadata_join_failed'))).length,recordSpecificAnonymousLicenseProven:0},
 decision:'No blanket sentence-ID-only exemption: current mixed export is CC-BY. No per-record CC0 or original-contributor evidence supplied. Export owner absence is not ingest loss; uncertainty remains blocked.'};
const low=candidates.filter(c=>c.reasons.includes('below_provisional_high'));
const band=s=>s>=.9?'0.90–0.92':s>=.85?'0.85–0.90':s>=.8?'0.80–0.85':'<0.80';
const lowReport={total:low.length,bands:{'0.90–0.92':0,'0.85–0.90':0,'0.80–0.85':0,'<0.80':0,...tally(low.map(c=>band(c.score)))},deductions:tally(low.flatMap(c=>Object.entries(c.scoreBreakdown).filter(([,v])=>v.value<1).map(([k])=>k))),reasonBreakdown:tally(low.flatMap(c=>c.reasons.filter(r=>r!=='below_provisional_high'))),scoreOnlyBlocked:low.filter(c=>c.reasons.every(r=>['below_provisional_high','per_sense_cap'].includes(r))).length,fullDeterministicContractPassed:low.filter(c=>Object.values(c.validationFlags).every(Boolean)).length,verificationBasis:{deterministicVerified:selected.filter(c=>c.calibrationMode==='deterministic-structural-contract').length,semanticScoreVerified:selected.filter(c=>c.calibrationMode!=='deterministic-structural-contract').length},decision:'0.92 unchanged; no bypass introduced. source authority/consensus penalties are constant, while sentence/structure failures explain low scores.',rows:low.map(c=>({candidateId:c.candidateId,score:c.score,scoreBreakdown:c.scoreBreakdown,reasons:c.reasons,calibrationMode:c.calibrationMode}))};
// Existing full-capacity examples are never deleted. Insufficient evidence is not a replacement proposal.
const replacements=gate.candidates.filter(c=>c.gateReasons.includes('example_cap')).map(c=>({candidateId:c.candidateId,senseId:c.senseId,status:'no_replacement',capacityOrigin:getSense(c).examples.length>=2?'production_already_full':'higher_ranked_new_candidate_reserved_remaining_slot',reason:'No existing example deleted; lower-ranked new candidate loses capacity selection',rank:rankExample(c,getSense(c))}));
// Release A: all gates passed, complete predicate, moderate length, exact credit, one new example/sense.
const perSense=new Set(),releaseRows=[];
for(const c of ranked){
 if(!readyIds.has(c.candidateId)||perSense.has(c.senseId)||!c.rank.completePredicate||c.rank.characters<12||c.rank.characters>80||!attributionDiagnosis(c).complete)continue;
 perSense.add(c.senseId);releaseRows.push(c);if(releaseRows.length===150)break;
}
const release=await planRelease(raw,{...baseline,candidates:releaseRows},registry,{selectionRank});
if(release.blocked||release.releaseReady!==releaseRows.length)throw Error('Release A failed gate');
const oldWarningKeys=new Set(release.audit.report.reviewQueue.map(hash));
const newWarnings=release.projectedAudit.report.reviewQueue.filter(w=>!oldWarningKeys.has(hash(w)));
if(newWarnings.length)throw Error('Release A introduces warnings');
release.manifest={...release.manifest,candidateIds:releaseRows.map(c=>c.candidateId),senseIds:releaseRows.map(c=>c.senseId),sourceIds:[...new Set(releaseRows.map(c=>c.sourceId))],sourceRecords:releaseRows.map(c=>({candidateId:c.candidateId,sentenceId:c.originalId,translationSentenceId:c.translation.originalId})),datasetHash:baseline.datasetHash,expectedNewHash:release.manifest.newVocabularyHash,rankingVersion:'release-rank-lexicographic-v1'};
// Bound additional audit to the exact projected document; verifies only additions and preserves all originals.
const releaseAudit=async doc=>{
 const base=await qualityAudit(doc),errors=[],ids=new Set();
 if(hash(doc)!==release.manifest.newVocabularyHash)errors.push('expected_hash');
 for(const w of doc.entries)for(const s of w.senses)for(const e of s.examples||[]){if(ids.has(e.exampleId))errors.push('duplicate_example_id');ids.add(e.exampleId);}
 for(const c of releaseRows){
  const s=doc.entries.find(w=>w.lexicalEntryId===c.lexicalEntryId)?.senses.find(s=>s.senseId===c.senseId),e=s?.examples.find(e=>e.exampleId==='external-'+c.candidateId);
  if(!e||e.ko!==c.content.text||e.zh!==c.translation.text||realExamples({...s,gloss:s.glossZh,examples:[e]}).length!==1)errors.push('example_integrity');
  if(!e?.provenance||e.provenance.sentenceId!==c.originalId||e.provenance.translationSentenceId!==c.translation.originalId)errors.push('provenance_schema');
  if(s&&s.examples.length!==getSense(c).examples.length+1)errors.push('sense_count');
 }
 return {passed:base.passed&&!errors.length,blockingErrors:errors.length+(base.passed?0:1),errors,base};
};
await fs.mkdir(path.join(here,'unblock-local/readiness'),{recursive:true});
const dir=await fs.mkdtemp(path.join(here,'unblock-local/readiness/release-a-'));
console.log('Testing Release A on isolated full-vocabulary copies: '+releaseRows.length);
const success=path.join(dir,'success.json'),rollback=path.join(dir,'rollback.json');
await fs.writeFile(success,originalBytes);await fs.writeFile(rollback,originalBytes);
const successResult=await writeRelease({target:success,release,enabled:true,confirmationReleaseId:release.manifest.releaseId,audit:releaseAudit});
let auditCalls=0,rollbackError=null;
try{await writeRelease({target:rollback,release,enabled:true,confirmationReleaseId:release.manifest.releaseId,audit:async doc=>{const result=await releaseAudit(doc);auditCalls++;return auditCalls===2?{...result,passed:false}:result;}});}catch(e){rollbackError=e.message;}
const transaction={blockingErrors:(await releaseAudit(JSON.parse(await fs.readFile(success)))).blockingErrors,newWarnings:newWarnings.length,baselineWarnings:release.audit.report.totals.warnings,projectedWarnings:release.projectedAudit.report.totals.warnings,success:successResult.written,rollbackSimulated:rollbackError==='Post-write audit/hash failed',rollbackByteIdentical:byteHash(await fs.readFile(rollback))===byteHash(originalBytes),productionOriginalHash:byteHash(originalBytes),productionUnchanged:byteHash(await fs.readFile(productionPath))===byteHash(originalBytes),isolatedDirectory:dir,writerDefaultCheck:await writeRelease({target:productionPath,release})};
if(transaction.blockingErrors||!transaction.rollbackByteIdentical||!transaction.productionUnchanged||!transaction.rollbackSimulated)throw Error('Transaction assertions failed');
const byLevel=rows=>Object.fromEntries(Array.from({length:6},(_,i)=>{const l='TOPIK-'+(i+1),r=rows.filter(c=>raw.entries.find(w=>w.lexicalEntryId===c.lexicalEntryId).levels.includes(l));return [l,{examples:r.length,senses:new Set(r.map(c=>c.senseId)).size}];}));
const blocked=gate.candidates.filter(c=>c.gateReasons.length||c.reviewStatus!=='auto_verified');
const report={autoVerifiedTotal:1817,releaseReadyTotal:ready.length,coveredSenseCount:new Set(ready.map(c=>c.senseId)).size,blockedTotal:1817-ready.length,blockingReasons:gate.blockReason,byLevel:byLevel(ready),morphologyReplay:{count:morphologyReplay.length,mismatches:morphologyMismatches.length,modelVersion:morphologyReplay[0].morphology.modelVersion},capacityOrigin:tally(replacements.map(r=>r.capacityOrigin)),
 finalGateCategories:categoryReport(blocked.map(c=>({reasons:c.gateReasons}))),fullCandidateCategories:categoryReport(candidates.filter(c=>c.reviewStatus!=='auto_verified')),
 attribution:{...attribution,rows:undefined},lowScores:{...lowReport,rows:undefined},sentenceRule:{...lengthAudit,rows:undefined},
 releaseA:{count:releaseRows.length,byLevel:byLevel(releaseRows),manifest:release.manifest,transaction},productionReady:transaction.blockingErrors===0&&releaseRows.length>0,multiSenseFrozen:true,writerEnabled:false,productionWritten:false};
await save('readiness-report.json',report);
await save('readiness-gate.json',{...gate,next:undefined});
await save('readiness-sentence-audit.json',lengthAudit);
await save('readiness-attribution-audit.json',attribution);
await save('readiness-score-audit.json',lowReport);
await save('readiness-replacement-proposals.json',replacements);
await save('release-a-manifest.json',release.manifest);
await save('release-a-plan.json',{...release,next:undefined});
const credit='# Release A — Tatoeba text credits\n\nCC BY 2.0 FR: https://creativecommons.org/licenses/by/2.0/fr/\nText unchanged; Korean and Chinese contributors below are preserved as supplied by the official detailed export.\n\n'+releaseRows.map(c=>'- '+c.candidateId+': Korean ['+c.originalId+']('+c.sourceUrl+') — '+c.content.author+'; Chinese ['+c.translation.originalId+'](https://tatoeba.org/en/sentences/show/'+c.translation.originalId+') — '+c.translation.author+'; export '+c.sourceVersion).join('\n');
await fs.writeFile(path.join(here,'RELEASE-A-ATTRIBUTION.md'),credit);
console.log(JSON.stringify({autoVerifiedTotal:1817,releaseReadyTotal:ready.length,coveredSenseCount:report.coveredSenseCount,blockedTotal:report.blockedTotal,blockingReasons:report.blockingReasons,byLevel:report.byLevel,attribution:report.attribution,lowScores:report.lowScores,releaseA:releaseRows.length,transaction},null,2));
