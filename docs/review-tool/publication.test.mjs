import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {hash} from './automation.mjs';
import {writeRelease,planRelease} from './publication.mjs';
const read=async p=>JSON.parse(await fs.readFile(new URL(p,import.meta.url),'utf8'));
test('writer disabled before any filesystem access',async()=>assert.deepEqual(await writeRelease({target:'NONEXISTENT'}),{mode:'disabled',written:false}));
test('isolated atomic transaction and forced post-audit rollback',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'korean-writer-test-'));
 const previous={entries:[{senses:[{examples:[]}]}]},next={entries:[{senses:[{examples:[{exampleId:'test-example'}]}]}]};
 const release={blocked:0,releaseReady:1,next,manifest:{releaseId:'test',previousVocabularyHash:hash(previous),newVocabularyHash:hash(next),addedExampleIds:['test-example']}};
 try{
  for(const rollback of [false,true]){
   const target=path.join(dir,rollback?'rollback.json':'success.json');const bytes=JSON.stringify(previous);await fs.writeFile(target,bytes);
   let n=0;const call=()=>writeRelease({target,release,enabled:true,confirmationReleaseId:'test',audit:async()=>({passed:!(rollback&&++n===2)})});
   if(rollback){await assert.rejects(call,/Post-write/);assert.equal(await fs.readFile(target,'utf8'),bytes);}else{await call();assert.equal(hash(JSON.parse(await fs.readFile(target,'utf8'))),hash(next));}
  }
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('real release gate rejects node tampering, author tampering and dataset drift',async()=>{
 const raw=await read('../../data/vocabulary.json'),baseline=await read('./release-a-input.json'),registry=(await read('./source-registry.json')).sources;
 for(const kind of ['node','author','dataset']){
  const b=structuredClone(baseline);b.candidates=b.candidates.slice(0,1);
  if(kind==='node')b.candidates[0].evidence[0].nodeHash='0'.repeat(64);
  if(kind==='author')b.candidates[0].content.author='forged-author';
  if(kind==='dataset')b.datasetHash='0'.repeat(64);
  const out=await planRelease(raw,b,registry);assert.equal(out.releaseReady,0,kind);
 }
});
