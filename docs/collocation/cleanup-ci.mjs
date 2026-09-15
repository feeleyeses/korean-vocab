// Verify current cleanup against its own frozen delta. Keep A/B tests intact,
// running on their exact reconstructed historical snapshot in an isolated tree.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {root,here,read,verify,BEFORE,check} from './cleanup-production.mjs';
import {hash} from '../review-tool/automation.mjs';
const requested=process.argv.indexOf('--phase'),phase=requested>=0?process.argv[requested+1]:(await read(path.join(here,'cleanup-release-record.json'))).phase;
const result=await verify({phase});check(['ready','published'].includes(result.status),'Invalid CI release state');
const directory=await fs.mkdtemp(path.join(os.tmpdir(),'collocation-ci-'));
const run=(args,cwd,extra={})=>{const p=spawnSync(process.execPath,args,{cwd,encoding:'utf8',maxBuffer:20e6,env:{...process.env,...extra}});console.log(p.stdout);if(p.status!==0){console.error(p.stderr);throw Error('Validation failed: '+args[0]);}};
try{
 const git=spawnSync(process.env.GIT_BIN||'git',['ls-files','-z'],{cwd:root,encoding:'utf8',maxBuffer:20e6});check(git.status===0,'Tracked fixture enumeration failed');
 for(const relative of git.stdout.split('\0').filter(Boolean)){
  const destination=path.resolve(directory,relative);check(destination.startsWith(directory+path.sep),'Fixture path escape');await fs.mkdir(path.dirname(destination),{recursive:true});await fs.copyFile(path.join(root,relative),destination);
 }
 await fs.writeFile(path.join(directory,'data/vocabulary.json'),JSON.stringify(result.previous,null,2)+'\n');
 check(hash(await read(path.join(directory,'data/vocabulary.json')))===BEFORE,'Historical B fixture hash mismatch');
 run(['docs/review-tool/train-ci.mjs'],directory,{GITHUB_ENV:''});
 const tests=(await fs.readdir(path.join(directory,'docs/review-tool'))).filter(p=>p.endsWith('.test.mjs')).map(p=>'docs/review-tool/'+p);
 run(['--test',...tests],directory,{RELEASE_PHASE:'post_publish',RELEASE_NAME:'B'});
 run(['docs/review-tool/ingest-test.mjs'],directory);
 // Cleanup tests operate on the actual checkout, not the historical fixture.
 run(['--test','docs/collocation/cleanup-production.test.mjs'],root);
 console.log(JSON.stringify({cleanup:result.status,currentDataValidated:true,historicalABTests:'passed',blockingErrors:0,warningDelta:result.warnings}));
}finally{const rel=path.relative(os.tmpdir(),directory);check(rel.startsWith('collocation-ci-')&&!rel.includes('..'),'Unsafe fixture cleanup');await fs.rm(directory,{recursive:true,force:true});}
