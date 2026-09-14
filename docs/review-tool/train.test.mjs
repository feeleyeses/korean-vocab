import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {assertRules,paths,verifyRelease,read,root,here} from './train-lib.mjs';
import {writeRelease,byteHash} from './publication.mjs';
import {spawnSync} from 'node:child_process';
test('CLI defaults disabled; no overwrite and no premature C',async()=>{
 const run=xs=>spawnSync(process.execPath,xs,{cwd:root,encoding:'utf8'});
 const disabled=run(['docs/review-tool/publish-release.mjs','--release','B']);assert.equal(disabled.status,0);assert.equal(JSON.parse(disabled.stdout).mode,'disabled');
 const before=byteHash(await fs.readFile(paths('B').manifest));
 const repeat=run(['docs/review-tool/prepare-next-release.mjs','--name','B','--size','250']);assert.notEqual(repeat.status,0);assert.match(repeat.stderr,/Frozen release exists/);assert.equal(byteHash(await fs.readFile(paths('B').manifest)),before);
 const b=await read(paths('B').record);
 if(b.kind!=='published'){const next=run(['docs/review-tool/prepare-next-release.mjs','--name','C','--size','250']);assert.notEqual(next.status,0);assert.match(next.stderr,/Previous release not published/);}
});
test('frozen rules and protected A namespace',async()=>{assert.ok(await assertRules());assert.throws(()=>paths('A'));assert.throws(()=>paths('../B'));});
test('B full pre/post, drift, idempotence, rollback; production never written',async()=>{
 const record=await read(paths('B').record);
 const phase=record.kind==='published'?'post_publish':'pre_publish';
 const bytes=await fs.readFile(path.join(root,'data/vocabulary.json')),dir=await fs.mkdtemp(path.join(os.tmpdir(),'train-tests-'));
 try{
  const target=path.join(dir,'vocabulary.json'),previous=JSON.parse(bytes);
  // Historical B fixture stays runnable after C/D; remove only later manifest additions in memory.
  for(const file of (await fs.readdir(here)).filter(n=>/^release-[c-z]-manifest.json$/.test(n))){const m=await read(path.join(here,file));for(const w of previous.entries)for(const s of w.senses)s.examples=s.examples.filter(e=>!m.addedExampleIds.includes(e.exampleId));}
  await fs.writeFile(target,JSON.stringify(previous));
  const r=await verifyRelease({name:'B',phase,target});assert.equal(r.addedExamples,250);assert.equal(r.newWarnings,0);
  if(phase==='post_publish')for(const w of previous.entries)for(const s of w.senses)s.examples=s.examples.filter(e=>!r.bundle.m.exampleIds.includes(e.exampleId));
  await fs.writeFile(target,JSON.stringify(previous));const pre=await verifyRelease({name:'B',phase:'pre_publish',target});
  assert.deepEqual(await writeRelease({target,release:pre.plan}),{mode:'disabled',written:false});
  await writeRelease({target,release:pre.plan,enabled:true,confirmationReleaseId:r.bundle.m.releaseId,postVerify:opts=>verifyRelease({name:'B',...opts})});
  assert.equal((await verifyRelease({name:'B',phase:'post_publish',target})).status,'published');
  assert.equal((await verifyRelease({name:'B',phase:'pre_publish',target})).status,'already_published');
  await fs.writeFile(target,JSON.stringify({entries:[]}));await assert.rejects(()=>verifyRelease({name:'B',phase:'pre_publish',target}),/Production drift/);await assert.rejects(()=>verifyRelease({name:'B',phase:'post_publish',target}),/Post-release drift/);
  const rollback=path.join(dir,'rollback.json'),original=JSON.stringify(previous);await fs.writeFile(rollback,original);
  await assert.rejects(()=>writeRelease({target:rollback,release:pre.plan,enabled:true,confirmationReleaseId:r.bundle.m.releaseId,postVerify:async()=>{throw Error('forced');}}),/forced/);assert.equal(await fs.readFile(rollback,'utf8'),original);
  assert.equal(byteHash(await fs.readFile(path.join(root,'data/vocabulary.json'))),byteHash(bytes));
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
