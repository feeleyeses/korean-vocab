import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {freezePolicy,hash} from './automation.mjs';
import {prepareCorpusBatch} from './corpus-interface.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));
test('immutable policy hashing preserves original canonical hash',()=>{
 const policy={a:[{x:1}],b:{c:2}},before=hash(policy);freezePolicy(policy);
 assert.equal(hash(policy),before);assert.equal(hash(JSON.parse(JSON.stringify(policy))),before);
 assert.throws(()=>policy.a[0].x=3);
});
test('full dry-run accounting, scope, provenance and capacity',{skip:!fs.existsSync(new URL('./expanded-results.json',import.meta.url))},()=>{
 const {report,policy,candidates}=read('./expanded-results.json');
 assert.equal(candidates.length,report.tatoebaMatched);
 assert.equal(report.autoVerified+report.quarantine+report.autoRejected,candidates.length);
 const cap=new Map();
 for(const c of candidates.filter(c=>c.reviewStatus==='auto_verified')){
  const f=policy.singleSenseFastLane.entries[c.lexicalEntryId];
  assert.equal(f.validSenseCount,1);assert.equal(f.homographSafe,true);
  assert.equal(c.morphology.posMatch,true);assert.equal(c.morphology.lemma,c.target.headword);
  assert.equal(c.translation.linkEvidence.type,'direct');assert.ok(c.content.author&&c.translation.author);
  for(const e of c.evidence)assert.equal(e.documentHash,hash(e.rawNode));
  cap.set(c.senseId,(cap.get(c.senseId)||0)+1);
 }
 assert.equal(cap.size,report.coveredSenseCount);assert.ok([...cap.values()].every(n=>n<=2));
});
test('WSD split is headword isolated and evaluation alternatives share headword',{skip:!fs.existsSync(new URL('./multi-wsd-report.json',import.meta.url))||!fs.existsSync(new URL('./expanded-scope.json',import.meta.url))},()=>{
 const data=read('./multi-wsd-report.json'),heads=new Map(),scope=read('./expanded-scope.json');
 for(const r of data.rows){
  assert.ok(!heads.has(r.headword)||heads.get(r.headword)===r.split);heads.set(r.headword,r.split);
  const w=scope.multi.find(w=>w.headword===r.headword);
  assert.ok(r.scores.every(s=>w.groups.some(g=>g.groupId===s.sense)));
  assert.equal(r.calibrationEligible,false);assert.equal(r.reviewStatus,'quarantine');
 }
 assert.equal(data.calibrated,false);
});
test('corpus interface rejects Chatbot and unapproved corpora',()=>{
 assert.throws(()=>prepareCorpusBatch({},'unknown',[],{}));
 assert.throws(()=>prepareCorpusBatch({Chatbot:{licenseApproval:true,kind:'natural-corpus'}},'Chatbot',[],{}));
});
