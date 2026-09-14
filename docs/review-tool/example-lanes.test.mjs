import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {evaluate,publicationGate,hash} from './automation.mjs';
const results=JSON.parse(await fs.readFile(new URL('./release-a-input.json',import.meta.url),'utf8'));
const {policy}=results,positive=results.candidates.find(c=>c.reviewStatus==='auto_verified');
test('real fast lane exists without KRDict or global calibration; score threshold unchanged',()=>{assert.ok(positive);assert.equal(policy.calibrated,false);assert.equal(policy.high.example,.92);assert.equal(positive.singleSenseStructuralMatch,true);assert.ok(positive.score>=.92);assert.equal(evaluate(positive,policy).reviewStatus,'auto_verified');});
test('candidate cannot declare itself single-sense or approved source',()=>{const p=structuredClone(policy);p.singleSenseFastLane.entries={};assert.notEqual(evaluate({...positive,singleSenseStructuralMatch:true},p).reviewStatus,'auto_verified');const evil=structuredClone(positive);evil.evidence=evil.evidence.map(e=>({...e,sourceUrl:'https://not-the-source.example/'}));assert.notEqual(evaluate(evil,policy).reviewStatus,'auto_verified');});
test('real release mutations reject; per-sense capacity remains bounded',()=>{
 const c=positive;
 for(const bad of [{...c,content:{...c.content,kind:'definition'}},{...c,translation:null},{...c,morphology:{...c.morphology,posMatch:false}},{...c,content:{...c.content,author:null}},{...c,duplicateCheck:{...c.duplicateCheck,passed:false}}])assert.notEqual(evaluate(bad,policy).reviewStatus,'auto_verified');
 const counts={};for(const row of results.candidates)counts[row.senseId]=(counts[row.senseId]||0)+1;assert.ok(Object.values(counts).every(n=>n<=2));
});
test('no split leaks by lexical headword or KO/ZH id',{skip:!existsSync(new URL('./wsd-input.json',import.meta.url))},async()=>{const input=JSON.parse(await fs.readFile(new URL('./wsd-input.json',import.meta.url),'utf8'));for(const getter of [c=>c.target.headword,c=>c.originalId,c=>c.translation.originalId]){const map=new Map();for(const c of input.candidates){const key=getter(c);if(map.has(key))assert.equal(map.get(key),c.split);map.set(key,c.split);}}assert.equal(input.rows.length,100);});
test('stale production entry and missing blocking audit prevent release',()=>{const c=positive,entries=[{lexicalEntryId:c.lexicalEntryId,headword:c.target.headword,partOfSpeech:c.target.pos,senses:[{senseId:c.senseId,glossZh:c.target.gloss,examples:[]}]}];const ctx={entries,blockingQualityAudit:null,currentDatasetHash:'x',expectedDatasetHash:'x'};const gate=publicationGate([c],policy,ctx);assert.equal(gate.plan.length,0);assert.ok(gate.candidates[0].gateReasons.includes('stale_single_sense_entry'));assert.equal(gate.published,0);});
