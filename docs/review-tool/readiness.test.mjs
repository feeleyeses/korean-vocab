import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {attributionDiagnosis,sentenceFeatures,classify,compareRank} from './readiness-rules.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
test('attribution distinguishes absent export owner and ingest/join faults',()=>{
 const c=structuredClone(read('./release-a-input.json').candidates.find(c=>c.reviewStatus==='auto_verified'));
 assert.equal(attributionDiagnosis(c).complete,true);
 c.content.author=null;assert.ok(attributionDiagnosis(c).reasons.includes('ko:ingest_field_mismatch'));
 c.evidence.find(e=>e.originalId===c.originalId).rawNode[3]='\\N';assert.ok(attributionDiagnosis(c).reasons.includes('ko:export_owner_absent'));
 c.evidence=[];assert.ok(attributionDiagnosis(c).reasons.includes('ko:metadata_join_failed'));
});
test('sentence comparators do not relax production rules or accept noun fragments',()=>{
 const fixture=(text,tags)=>({content:{text},morphology:{morphemes:tags.map(pos=>({pos}))},reasons:[]});
 const short=sentenceFeatures(fixture('담배를 피우십니까?',['NNG','JKO','VV','EP','EF','SF']));
 assert.equal(short.ruleA,false);assert.equal(short.ruleD,true);
 assert.equal(sentenceFeatures(fixture('아름다운 한국의 도시',['VA','ETM','NNP','JKG','NNG'])).ruleD,false);
 assert.equal(sentenceFeatures(fixture('정말 정말 와우!',['MAG','MAG','IC','SF'])).ruleD,false);
});
test('root cause classification separates selection, metadata, length and structural uncertainty',()=>{
 assert.deepEqual(classify(['example_cap']),['expectedSelection']);
 assert.deepEqual(classify(['attribution_missing']),['recoverableMetadata']);
 assert.deepEqual(classify(['sentenceLength','below_provisional_high']),['ruleDesign']);
 assert.deepEqual(classify(['kiwi_POS_conflict','below_provisional_high']),['qualityUncertainty']);
});
test('readiness frozen cohort, Release A and full-copy rollback assertions',()=>{
 const record=read('./release-a-record.json'),r={...record.originalReadiness,releaseA:record.releaseA,lowScores:{scoreOnlyBlocked:record.originalReadiness.scoreOnlyBlocked},attribution:{total:record.originalReadiness.attributionTotal}},m=read('./release-a-manifest.json');
 assert.equal(r.autoVerifiedTotal,1817);assert.equal(r.releaseReadyTotal+r.blockedTotal,1817);
 assert.equal(new Set(m.senseIds).size,m.candidateIds.length);assert.ok(m.candidateIds.length>=100&&m.candidateIds.length<=200);
 assert.equal(r.releaseA.transaction.blockingErrors,0);
 assert.equal(r.releaseA.transaction.rollbackByteIdentical,true);assert.equal(r.releaseA.transaction.productionUnchanged,true);
 assert.equal(r.releaseA.transaction.writerDefaultCheck.written,false);assert.equal(r.releaseA.transaction.newWarnings,0);
 assert.equal(r.lowScores.scoreOnlyBlocked,0);assert.equal(r.attribution.total,417);
});
