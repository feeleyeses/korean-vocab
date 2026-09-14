import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyReleaseA} from './verify-release-a.mjs';
test('frozen release: full gate, count/hash invariants and attribution coverage',async()=>{
 const phase=process.env.RELEASE_PHASE||'pre_publish';
 const r=await verifyReleaseA({phase});assert.equal(r.releaseReady,150);assert.equal(r.blockingErrors,0);assert.equal(r.newWarnings,0);assert.equal(r.productionWritten,phase==='post_publish');
});
