import fs from 'node:fs/promises';
import {evaluate,hash,publicationGate} from './automation.mjs';
import {duplicateCheck} from './example-lanes.mjs';
const read=async p=>JSON.parse(await fs.readFile(new URL(p,import.meta.url),'utf8'));
const input=await read('./wsd-input.json'),unblock=await read('./unblock-results.json'),raw=await read('../../data/vocabulary.json');
if(hash(raw)!==input.datasetHash)throw Error('Dataset changed; rebuild census');
// Symbolic fast-lane contract has no learned semantic threshold. The .92 score floor is unchanged.
const protocol={version:'single-sense-contract-v1',source:'Tatoeba direct KO-ZH',requirements:['approved unique lexical entry + one effective sense','no known external homograph','Kiwi exact lemma/POS','realExamples','source node/text/link hash','attribution/license registry','no duplicates'],numericThreshold:unblock.policy.high.example};
const policy={...unblock.policy,version:'example-lanes-v1',singleSenseFastLane:{datasetHash:input.datasetHash,entries:Object.fromEntries(input.rows.map(r=>[r.lexicalEntryId,r])),validation:{status:'pending',protocolHash:hash(protocol)}}};
let bge;try{bge=await read('./bge-report.json');}catch{bge={status:'unavailable',reason:'not run'};}
const seen=new Set();let candidates=unblock.candidates.filter(c=>c.type==='example').map(c=>({...c,duplicateCheck:{datasetHash:input.datasetHash,passed:!duplicateCheck(c,raw.entries,seen)},wsd:bge.rows?.find(r=>r.candidateId===c.candidateId)||null}));
// Validate the structural contract against real held-out source pairs and deterministic violations.
const testing={...policy,singleSenseFastLane:{...policy.singleSenseFastLane,validation:{...policy.singleSenseFastLane.validation,status:'passed'}}};
const potential=candidates.map(c=>evaluate(c,testing)).filter(c=>c.reviewStatus==='auto_verified');
const probes=[];
for(const c of potential){
 const cases={definition:{...c,content:{...c.content,kind:'definition'}},glossFallback:{...c,translation:{...c.translation,text:c.target.gloss}},lemmaMismatch:{...c,morphology:{...c.morphology,lemma:'NOT_TARGET'}},posMismatch:{...c,morphology:{...c.morphology,posMatch:false,posConflict:true}},disconnected:{...c,translation:{...c.translation,linkEvidence:{...c.translation.linkEvidence,to:'wrong'}}},duplicate:{...c,duplicateCheck:{...c.duplicateCheck,passed:false}},forgedText:{...c,content:{...c.content,text:c.content.text+' FAKE'}},missingAuthor:{...c,content:{...c.content,author:null}}};
 for(const [kind,bad] of Object.entries(cases))probes.push({candidateId:c.candidateId,kind,split:input.candidates.find(x=>x.candidateId===c.candidateId)?.split,passed:evaluate(bad,testing).reviewStatus!=='auto_verified'});
 for(const kind of ['multipleEntries','multipleSenses','externalHomograph']){
  const f=testing.singleSenseFastLane.entries[c.lexicalEntryId],changed={...f,...(kind==='multipleEntries'?{sameHeadwordPOSLexicalEntries:2}:kind==='multipleSenses'?{validSenseCount:2}:{homographSafe:false})};
  const badPolicy={...testing,singleSenseFastLane:{...testing.singleSenseFastLane,entries:{...testing.singleSenseFastLane.entries,[c.lexicalEntryId]:changed}}};
  probes.push({candidateId:c.candidateId,kind,split:input.candidates.find(x=>x.candidateId===c.candidateId)?.split,passed:evaluate(c,badPolicy).reviewStatus!=='auto_verified'});
 }
}
if(potential.length&&probes.every(p=>p.passed))policy.singleSenseFastLane.validation.status='passed';
const ranked=candidates.map(c=>evaluate(c,policy)).sort((a,b)=>b.score-a.score||a.candidateId.localeCompare(b.candidateId)),counts=new Map();
for(const c of ranked)if(c.reviewStatus==='auto_verified'){const count=counts.get(c.senseId)||0;if(count>=2){c.reviewStatus=c.verificationStatus='quarantine';c.reasons.push('per_sense_cap');}else counts.set(c.senseId,count+1);}
const gate=publicationGate(ranked,policy,{blockingQualityAudit:null,currentDatasetHash:hash(raw),expectedDatasetHash:input.datasetHash,entries:raw.entries});
const singleIds=new Set(input.rows.filter(r=>r.validSenseCount===1).map(r=>r.lexicalEntryId));
const recordCandidates=ranked.filter(c=>c.evidence.length);
const report={fixedSamples:100,singleSenseSamples:input.rows.filter(r=>r.validSenseCount===1).length,multiSenseSamples:input.rows.filter(r=>r.validSenseCount>1).length,
 singleSenseCandidates:recordCandidates.filter(c=>singleIds.has(c.lexicalEntryId)).length,tatoebaStructuralCandidates:potential.length,singleSenseAutoVerified:ranked.filter(c=>singleIds.has(c.lexicalEntryId)&&c.reviewStatus==='auto_verified').length,
 multiSenseCandidates:recordCandidates.filter(c=>!singleIds.has(c.lexicalEntryId)).length,multiSenseAligned:0,multiSenseAutoVerified:0,multiSenseQuarantine:recordCandidates.filter(c=>!singleIds.has(c.lexicalEntryId)).length,
 verifiedSenseCount:counts.size,quarantine:ranked.filter(c=>c.reviewStatus==='quarantine').length,sourceCandidateRecords:recordCandidates.length,missingInputRows:ranked.filter(c=>!c.evidence.length).length,
 blockers:Object.entries(ranked.filter(c=>c.reviewStatus!=='auto_verified').flatMap(c=>c.reasons).reduce((a,r)=>(a[r]=(a[r]||0)+1,a),{})).sort((a,b)=>b[1]-a[1]),
 structuralValidation:{potential:potential.length,probes:probes.length,passed:probes.filter(p=>p.passed).length,bySplit:Object.fromEntries(['train','calibration','test'].map(s=>[s,{positives:potential.filter(c=>input.candidates.find(x=>x.candidateId===c.candidateId)?.split===s).length,negatives:probes.filter(p=>p.split===s).length}])),precisionClaim:'Silver structural proxy only, not empirical semantic precision'},
 bgeStatus:bge.status,semanticThresholdActivated:false,scoreThreshold:policy.high.example,published:0,writerEnabled:false,publicationGateBlockers:gate.candidates.filter(c=>c.gateReasons.length).length};
report.quarantineSourceRecords=recordCandidates.filter(c=>c.reviewStatus==='quarantine').length;
report.tatoebaBlockers=Object.entries(ranked.filter(c=>c.sourceId==='Tatoeba'&&c.reviewStatus!=='auto_verified').flatMap(c=>c.reasons).reduce((a,r)=>(a[r]=(a[r]||0)+1,a),{})).sort((a,b)=>b[1]-a[1]);
report.bgeMetrics=bge.stats||null;
report.blockerCategories=Object.fromEntries(Object.entries({license:['license_blocked'],lemma:['target_token_or_lemma_unproven'],POS:['pos_alignment_missing','kiwi_POS_conflict'],semanticThreshold:[],margin:[],translation:['direct_zh_translation_unproven','source_link_conflict'],duplicate:['duplicate_or_check_missing']}).map(([key,flags])=>[key,recordCandidates.filter(c=>c.reviewStatus!=='auto_verified'&&c.reasons.some(r=>flags.includes(r))).length]));
report.multiSenseMetricsStatus='not measured: no multi-sense samples; zero is a sample count, not zero model accuracy';
await fs.writeFile(new URL('./example-lanes-results.json',import.meta.url),JSON.stringify({report,policy,candidates:ranked,publicationDryRun:gate,probes},null,2));
await fs.writeFile(new URL('./example-lanes-report.json',import.meta.url),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if(probes.some(p=>!p.passed))process.exitCode=1;
