import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyReleaseA} from './verify-release-a.mjs';
import {verifyRelease} from './train-lib.mjs';
test('frozen release: full gate, count/hash invariants and attribution coverage',async()=>{
 const phase=process.env.RELEASE_PHASE||'post_publish',name=process.env.RELEASE_NAME||'A';
 const r=name==='A'?await verifyReleaseA({phase}):await verifyRelease({name,phase});assert.equal(r.blockingErrors,0);assert.equal(r.newWarnings,0);
 assert.equal(r.status,phase==='post_publish'?'published':'ready');
});
