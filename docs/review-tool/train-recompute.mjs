import {evaluate,hash,freezePolicy} from './automation.mjs';
import {duplicateCheck,structuralAllowlist} from './example-lanes.mjs';
export function recompute(raw,tat,external,base,registry){
const entries=structuralAllowlist(raw.entries,external);
const scope={datasetHash:hash(raw),entries,singleIds:Object.values(entries).filter(e=>e.entryApproved&&e.validSenseCount===1&&e.homographSafe).map(e=>e.lexicalEntryId)};
if(tat.sourceAccess!=='available')throw Error('Tatoeba unavailable; coverage unknown');
const policy=freezePolicy({...base.policy,version:'full-single-dry-run-v1',sources:{...base.policy.sources,Tatoeba:{...registry,sourceVersion:tat.sourceVersion}},singleSenseFastLane:{...base.policy.singleSenseFastLane,datasetHash:scope.datasetHash,entries:scope.entries}});
const candidates=[],seen=new Set();
const ev=(id,node,url)=>({...registry,sourceId:'Tatoeba',originalId:id,sourceUrl:url,sourceVersion:tat.sourceVersion,fetchedAt:tat.fetchedAt,rawNode:node,documentHash:hash(node),nodeHash:hash(node),hashScope:'source-node'});
for(const id of scope.singleIds){
 const w=raw.entries.find(w=>w.lexicalEntryId===id),s=w.senses.find(s=>s.senseId===scope.entries[id].senseIds[0]);
 for(const p of tat.pairs){
  const m=p.matches[w.headword+'|'+w.partOfSpeech];if(!m)continue;
  const url='https://tatoeba.org/en/sentences/show/'+p.ko.sentenceId,linkId=p.ko.sentenceId+':'+p.zh.sentenceId;
  const evidence=[ev(p.ko.sentenceId,p.ko.rawNode,url),ev(p.zh.sentenceId,p.zh.rawNode,'https://tatoeba.org/en/sentences/show/'+p.zh.sentenceId),ev(linkId,p.link.rawNode,url)];
  const c={type:'example',reviewStatus:'candidate',sourceAccess:'local-cache',matchMethod:'kiwi-lemma-pos-single-sense',senseAlignment:{method:'single-sense-structural',lexicalEntryId:id,senseId:s.senseId},candidateId:hash([id,s.senseId,p.ko.sentenceId,p.zh.sentenceId]),sampleId:'full:'+s.senseId,lexicalEntryId:id,senseId:s.senseId,
   target:{headword:w.headword,pos:w.partOfSpeech,gloss:s.glossZh,definitionZh:s.definitionZh,definitionKo:s.definitionKo},
   sourceId:'Tatoeba',sourceUrl:url,sourceVersion:tat.sourceVersion,sourceLicense:registry.sourceLicense,originalId:p.ko.sentenceId,fetchedAt:tat.fetchedAt,
   content:{text:p.ko.text,kind:'example',author:p.ko.author},translation:{text:p.zh.text,language:'cmn',originalId:p.zh.sentenceId,author:p.zh.author,licenseApproval:registry.licenseApproval,linkEvidence:{type:'direct',from:p.ko.sentenceId,to:p.zh.sentenceId,originalId:linkId,documentHash:evidence[2].documentHash}},
   evidence,morphology:m,alignment:{headword:w.headword,pos:m.posMatch?w.partOfSpeech:null,sourceId:'Tatoeba',originalId:p.ko.sentenceId,method:'lemma-POS-only'},wsd:null};
  c.duplicateCheck={datasetHash:scope.datasetHash,passed:!duplicateCheck(c,raw.entries,seen)};
  candidates.push(evaluate(c,policy));
 }
}
const ranked=candidates.sort((a,b)=>b.score-a.score||a.candidateId.localeCompare(b.candidateId));
const structurePassed=ranked.filter(c=>c.reviewStatus==='auto_verified').length,counts=new Map();
for(const c of ranked)if(c.reviewStatus==='auto_verified'){
 const n=counts.get(c.senseId)||0;if(n>=2){c.reviewStatus=c.verificationStatus='quarantine';c.reasons.push('per_sense_cap');}else counts.set(c.senseId,n+1);
}
const stats=rows=>({tatoebaMatched:rows.length,matchedSenseCount:new Set(rows.map(c=>c.senseId)).size,autoVerified:rows.filter(c=>c.reviewStatus==='auto_verified').length,coveredSenseCount:new Set(rows.filter(c=>c.reviewStatus==='auto_verified').map(c=>c.senseId)).size,quarantine:rows.filter(c=>c.reviewStatus==='quarantine').length,autoRejected:rows.filter(c=>c.reviewStatus==='auto_rejected').length});
const byLevel=Object.fromEntries(Array.from({length:6},(_,i)=>{const level='TOPIK-'+(i+1),ids=new Set(raw.entries.filter(w=>w.levels.includes(level)).map(w=>w.lexicalEntryId));return [level,{singleSenseTotal:scope.singleIds.filter(id=>ids.has(id)).length,...stats(ranked.filter(c=>ids.has(c.lexicalEntryId)))}];}));
const report={mode:'dry-run',writerEnabled:false,published:0,datasetHash:scope.datasetHash,singleSenseTotal:scope.singleIds.length,...stats(ranked),structurePassed,byLevel,levelCounting:'entry membership; entries may appear in multiple levels',blockedByReason:Object.entries(ranked.filter(c=>c.reviewStatus!=='auto_verified').flatMap(c=>c.reasons).reduce((a,r)=>(a[r]=(a[r]||0)+1,a),{})).sort((a,b)=>b[1]-a[1]),sourceAccess:tat.sourceAccess};
return {report,policy,candidates:ranked};
}

