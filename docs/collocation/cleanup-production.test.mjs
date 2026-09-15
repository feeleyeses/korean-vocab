import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import {root,BEFORE,AFTER,RELEASE,read,loadManifest,project,restore,verify,publish,validateWarnings} from './cleanup-production.mjs';
import {hash} from '../review-tool/automation.mjs';
import {qualityAudit,byteHash} from '../review-tool/publication.mjs';
const source=await read(path.join(root,'data/vocabulary.json')),m=await loadManifest();
const previous=hash(source)===AFTER?restore(source,m):source,next=project(previous,m);
test('122 literal headwords only, counts/ownership restored',()=>{assert.equal(hash(next),AFTER);assert.equal(hash(restore(next,m)),BEFORE);assert.equal(m.removals.length,122);});
test('exact warning allowlist, same-count substitution rejected',async()=>{const a=(await qualityAudit(previous)).report,b=(await qualityAudit(next)).report;assert.equal(validateWarnings(a,b,m).delta,104);const bad=structuredClone(b),r=bad.reviewQueue.find(x=>x.reason.includes('collocation needs source'));r.reason+=' forged';assert.throws(()=>validateWarnings(a,bad,m),/Unexpected warning/);});
test('identity and literal equality required',()=>{const bad=structuredClone(m);bad.removals[0].original.ko+=' ';assert.throws(()=>project(previous,bad),/literal/);});
test('disabled before filesystem access',async()=>assert.deepEqual(await publish({target:'NONEXISTENT'}),{status:'disabled',writerEnabled:false,written:false}));
test('isolated commit, post audit, rollback and repeat safety',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'collocation-transaction-')),target=path.join(dir,'vocabulary.json'),bytes=JSON.stringify(previous,null,2)+'\n',productionBefore=await fs.readFile(path.join(root,'data/vocabulary.json'));
 try{
  await fs.writeFile(target,bytes);
  await assert.rejects(()=>publish({enabled:true,releaseId:'all',target,backupRoot:dir}),/Exact release/);
  await assert.rejects(()=>publish({enabled:true,releaseId:RELEASE,target,backupRoot:dir,faultAfterReplace:true}),/Injected/);
  assert.equal(await fs.readFile(target,'utf8'),bytes);
  const result=await publish({enabled:true,releaseId:RELEASE,target,backupRoot:dir});assert.equal(result.written,true);assert.equal(result.finalHash,AFTER);
  assert.equal((await verify({phase:'post_publish',target})).blockingErrors,0);
  assert.equal((await publish({enabled:true,releaseId:RELEASE,target,backupRoot:dir})).status,'already_published');
  assert.equal((await verify({phase:'pre_publish',target})).status,'already_published');
  assert.equal(byteHash(await fs.readFile(path.join(root,'data/vocabulary.json'))),byteHash(productionBefore));
 }finally{const rel=path.relative(os.tmpdir(),dir);assert.ok(rel.startsWith('collocation-transaction-')&&!rel.includes('..'));await fs.rm(dir,{recursive:true,force:true});}
});
