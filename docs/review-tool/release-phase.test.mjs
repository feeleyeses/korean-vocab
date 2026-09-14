import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {verifyPhase} from './release-phase.mjs';
import {verifyReleaseA} from './verify-release-a.mjs';
import {releaseATransaction} from './release-a-transaction.mjs';
import {hash} from './automation.mjs';
import {planRelease,writeRelease} from './publication.mjs';
import {releaseAPrevious} from './historical-fixture.mjs';
const m={previousVocabularyHash:'previous',newVocabularyHash:'new'};
test('A-F: explicit phase and drift matrix',()=>{
 assert.equal(verifyPhase('pre_publish','previous',m).status,'ready');
 assert.deepEqual(verifyPhase('pre_publish','new',m),{status:'already_published',writerAllowed:false});
 assert.throws(()=>verifyPhase('pre_publish','other',m),/Production drift/);
 assert.equal(verifyPhase('post_publish','new',m).status,'published');
 for(const h of ['previous','other'])assert.throws(()=>verifyPhase('post_publish',h,m),/Post-release drift/);
 assert.throws(()=>verifyPhase(undefined,'previous',m),/Explicit/);
});
test('G-I: real frozen 150 transaction, post verification, repeat prevention and rollback in isolation',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'release-phase-test-'));
 const read=async p=>JSON.parse(await fs.readFile(new URL(p,import.meta.url),'utf8'));
 const manifest=await read('./release-a-manifest.json'),input=await read('./release-a-input.json'),registry=(await read('./source-registry.json')).sources;
 const raw=await releaseAPrevious(await read('../../data/vocabulary.json'));
 assert.equal(hash(raw),manifest.previousVocabularyHash);
 const bytes=JSON.stringify(raw),target=path.join(dir,'vocabulary.json');
 try{
  await fs.writeFile(target,bytes);
  await assert.rejects(()=>verifyReleaseA({target}),/Explicit/);
  await assert.rejects(()=>verifyReleaseA({phase:'post_publish',target}),/Post-release drift/);
  assert.equal((await verifyReleaseA({phase:'pre_publish',target})).status,'ready');
  assert.equal((await releaseATransaction({target})).mode,'disabled');
  assert.equal((await releaseATransaction({target,enabled:true,releaseId:manifest.releaseId})).written,true);
  assert.equal((await verifyReleaseA({phase:'post_publish',target})).status,'published');
  const after=await fs.readFile(target,'utf8');
  assert.equal((await releaseATransaction({target,enabled:true,releaseId:manifest.releaseId})).status,'already_published');
  assert.equal(await fs.readFile(target,'utf8'),after);
  const rollback=path.join(dir,'rollback.json');await fs.writeFile(rollback,bytes);
  const release=await planRelease(raw,input,registry,{selectionRank:Object.fromEntries(manifest.candidateIds.map((id,i)=>[id,i]))});release.manifest=manifest;
  await assert.rejects(()=>writeRelease({target:rollback,release,enabled:true,confirmationReleaseId:manifest.releaseId,postVerify:async args=>{
   const wrong=JSON.parse(await fs.readFile(args.target,'utf8'));wrong.entries[0].headword='WRONG';await fs.writeFile(args.target,JSON.stringify(wrong));
   await verifyReleaseA(args);
  }}),/Post-release drift/);
  assert.equal(await fs.readFile(rollback,'utf8'),bytes);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
