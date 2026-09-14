import fs from 'node:fs/promises';
import {hash,POLICY} from './automation.mjs';
// A separate, source-grounded truth file may label existing locked candidates only.
// No AI labels, no implicit positives from the scoring system itself.
const result=JSON.parse(await fs.readFile(new URL('./automation-results.json',import.meta.url),'utf8'));
const labels=process.argv[2]?JSON.parse(await fs.readFile(process.argv[2],'utf8')):[];
const known=new Map(result.candidates.map(c=>[c.candidateId,c]));
const ids=new Set();
for(const l of labels){if(!known.has(l.candidateId)||ids.has(l.candidateId)||!['supported','violates'].includes(l.label)||!l.evidenceUrl||!l.sourceVersion||l.labelMethod!=='source-grounded-test')throw Error('Invalid/duplicate/non-source-grounded benchmark label');ids.add(l.candidateId);}
const types={};
for(const type of ['example','collocation','polysemy']){
 const rows=labels.filter(l=>known.get(l.candidateId).type===type),curve=[];
 for(const threshold of [.7,.8,.85,.9,.92,.95,.97,.99,1]){
  const accepted=rows.filter(l=>known.get(l.candidateId).score>=threshold),fp=accepted.filter(l=>l.label==='violates').length;
  curve.push({threshold,accepted:accepted.length,falsePositives:fp,precisionProxy:accepted.length?1-fp/accepted.length:null,zeroErrorUpper95:accepted.length&&fp===0?1-Math.pow(.05,1/accepted.length):null});
 }
 // Do not automatically activate a policy based on labels without independence/source audit.
 types[type]={labeled:rows.length,positive:rows.filter(l=>l.label==='supported').length,negative:rows.filter(l=>l.label==='violates').length,curve,recommendedHigh:null,calibrated:false,reason:rows.length?'Curve only; label provenance/holdout independence and precision sufficiency not established':'No source-grounded truth labels; synthetic unit fixtures cannot calibrate content precision'};
}
await fs.writeFile(new URL('./calibration-report.json',import.meta.url),JSON.stringify({scoreVersion:POLICY.version,benchmarkHash:hash(result.report.samples),labelHash:hash(labels),types,policyActivated:false},null,2));
console.log(JSON.stringify({labels:labels.length,calibrated:false,recommendedHigh:null,policyActivated:false}));
