import fs from 'node:fs/promises';
import {hash,reevaluate,publicationGate,POLICY} from './automation.mjs';
import {mapVocabulary,senseGroups} from '../../src/domain.js';
const read=async p=>JSON.parse(await fs.readFile(new URL(p,import.meta.url),'utf8'));
const raw=await read('../../data/vocabulary.json'),words=mapVocabulary(raw);
const examples=(await read('../research-poc/example-poc-report.json')).rows;
const collocations=(await read('../research-poc/collocation-poc-report.json')).rows;
const poly=await read('./candidates.json');
if(examples.length!==100||collocations.length!==50||poly.length!==50)throw Error('Fixed benchmark membership changed');
const samples=[],inputs=[];
function add(type,row,index,options){
 const w=words.find(w=>row.lexicalEntryId?w.lexicalEntryId===row.lexicalEntryId:w.headword===row.headword),sense=w?.senses.find(s=>s.senseId===row.senseId);
 if(!w)throw Error('Unmapped benchmark word');
 const sampleId=type+':'+(row.senseId||w.lexicalEntryId)+':'+index;
 const target={headword:w.headword,pos:w.pos,gloss:sense?.gloss||'',definitionZh:sense?.definitionZh,groups:senseGroups(w).map(g=>({gloss:g.gloss,senseIds:g.senses.map(s=>s.senseId)}))};
 samples.push({sampleId,type,headword:w.headword,lexicalEntryId:w.lexicalEntryId,senseId:row.senseId||null});
 for(const [i,o] of (options.length?options:[null]).entries()){
  const source=o?.sourceId||'unavailable',canonicalSourceId=/kaikki|wiktionary/i.test(source)?'wiktionary-ko':/chatbot/i.test(source)?'chatbot-data':source;
  const evidence=o?[{sourceId:source,canonicalSourceId,derivedFrom:/kaikki/i.test(source)?['wiktionary-ko']:[],sourceUrl:o.sourceUrl,sourceLicense:o.sourceLicense,sourceVersion:o.sourceVersion,originalId:o.originalId,fetchedAt:o.fetchedAt,documentHash:hash(o),hashScope:'cached-record-not-independent-document',rawEvidence:o.evidence||null}]:[];
  inputs.push({candidateId:hash([sampleId,i,source]),sampleId,type,lexicalEntryId:w.lexicalEntryId,senseId:row.senseId||null,target,current:{headword:w.headword,pos:w.pos,senses:w.senses},sourceId:source,sourceUrl:o?.sourceUrl||'https://krdict.korean.go.kr/',sourceLicense:o?.sourceLicense||'pending',sourceVersion:o?.sourceVersion||'unavailable',originalId:o?.originalId||sampleId,fetchedAt:o?.fetchedAt||'2026-09-13T00:00:00.000Z',sourceAccess:o?'local-cache':'unavailable',
   content:type==='example'?{text:o?.ko||'',kind:'example'}:type==='collocation'?{text:o?.phrase||row.originalCollocation,experimentalStatistics:o?{frequency:o.frequency,associationScore:o.associationScore}:null}:o?.content||{},
   translation:o?.zh?{text:o.zh,language:'cmn'}:null,alignment:{headword:w.headword},evidence,matchMethod:'legacy cache; source alignment not proven',senseAlignment:'pending',reviewStatus:'candidate'});
 }
}
examples.forEach((r,i)=>add('example',r,i,r.candidates||[]));
collocations.forEach((r,i)=>add('collocation',r,i,r.candidates||[]));
poly.forEach((r,i)=>add('polysemy',r,i,[r]));
const manifest={datasetHash:hash(raw),sampleIds:samples.map(s=>s.sampleId),inputHashes:inputs.map(c=>hash(c))};
try{const old=await read('./benchmark-lock.json');if(hash(old)!==hash(manifest))throw Error('Fixed benchmark changed; explicit versioned migration required');}catch(e){if(e.code!=='ENOENT')throw e;await fs.writeFile(new URL('./benchmark-lock.json',import.meta.url),JSON.stringify(manifest,null,2));}
let previous=[];try{previous=(await read('./automation-results.json')).candidates;}catch(e){if(e.code!=='ENOENT')throw e;}
const prev=new Map(previous.map(c=>[c.candidateId,c]));
const scored=inputs.map(c=>reevaluate(c,prev.get(c.candidateId)));
const gate=publicationGate(scored,POLICY,{blockingQualityAudit:null,expectedDatasetHash:hash(raw),currentDatasetHash:hash(raw),entries:raw.entries,existingContentKeys:raw.entries.flatMap(e=>e.senses.flatMap(s=>(s.examples||[]).map(x=>[e.lexicalEntryId,s.senseId,'example',String(x.ko||'').normalize('NFKC').toLowerCase().replace(/[\s\p{P}]/gu,'')].join('|'))))});
const summarize=rows=>{const total=rows.length,counts=Object.fromEntries(['auto_verified','quarantine','auto_rejected'].map(s=>[s,rows.filter(c=>c.verificationStatus===s).length]));return {total,counts,percent:Object.fromEntries(Object.entries(counts).map(([k,v])=>[k,Number((v/total*100).toFixed(2))])),conflict:rows.filter(c=>c.reasons.includes('polysemy_conflict')||c.reasons.includes('POS_mismatch')).length,duplicate:rows.filter(c=>c.reasons.includes('duplicate_sense')||c.gateReasons.includes('duplicate_content')).length,licenseBlocked:rows.filter(c=>!c.validationFlags.licenseApproval).length};};
const sampleResults=samples.map(s=>{const rows=gate.candidates.filter(c=>c.sampleId===s.sampleId);return {...s,verificationStatus:rows.some(c=>c.verificationStatus==='auto_verified')?'auto_verified':rows.every(c=>c.verificationStatus==='auto_rejected')?'auto_rejected':'quarantine',candidateIds:rows.map(c=>c.candidateId)};});
const report={scoreVersion:POLICY.version,calibrated:false,thresholds:POLICY.high,thresholdInterpretation:'Provisional only; not calibrated and cannot publish',precisionProxy:null,precisionExplanation:'No automatically eligible positives; precision cannot be estimated. Structural tests are not real-world precision.',sampleCounts:Object.fromEntries(['example','collocation','polysemy'].map(t=>{const rows=sampleResults.filter(r=>r.type===t);return [t,{total:rows.length,auto_verified:rows.filter(r=>r.verificationStatus==='auto_verified').length,quarantine:rows.filter(r=>r.verificationStatus==='quarantine').length,auto_rejected:rows.filter(r=>r.verificationStatus==='auto_rejected').length,published:0}];})),evaluationRows:gate.candidates.length,missingInputRows:inputs.filter(c=>!c.evidence.length).length,candidateCounts:summarize(gate.candidates.filter(c=>c.evidence.length)),sourceContribution:Object.fromEntries([...new Set(inputs.map(c=>c.sourceId))].map(s=>[s,{candidateRecords:inputs.filter(c=>c.sourceId===s&&c.evidence.length).length,autoVerified:gate.candidates.filter(c=>c.sourceId===s&&c.verificationStatus==='auto_verified').length,published:0}])),blockers:Object.entries(gate.candidates.filter(c=>c.evidence.length).flatMap(c=>c.reasons).reduce((a,r)=>(a[r]=(a[r]||0)+1,a),{})).sort((a,b)=>b[1]-a[1]),access:{KRDict:'unavailable; not zero coverage',Tatoeba:'unavailable; not zero coverage'},published:0,qualityAudit:'not run: no auto_verified rows; gate remains blocked',gatePlan:gate.plan,samples:sampleResults};
await fs.writeFile(new URL('./automation-results.json',import.meta.url),JSON.stringify({schemaVersion:2,report,candidates:gate.candidates},null,2));
await fs.writeFile(new URL('./benchmark-report.json',import.meta.url),JSON.stringify(report,null,2));
console.log(JSON.stringify({samples:report.sampleCounts,candidates:report.candidateCounts,sources:report.sourceContribution,topBlockers:report.blockers.slice(0,8)},null,2));
