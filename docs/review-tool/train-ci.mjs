import fs from 'node:fs/promises';
import path from 'node:path';
import {here,read,verifyRelease,check} from './train-lib.mjs';
import {verifyReleaseA} from './verify-release-a.mjs';
const names=(await fs.readdir(here)).filter(n=>/^release-[a-z]-record.json$/.test(n)).sort();
let active;
for(const file of names){const r=await read(path.join(here,file));check(['published','prepared-not-published'].includes(r.kind),'Unknown release state');active={name:file[8].toUpperCase(),phase:r.kind==='published'?'post_publish':'pre_publish'};}
check(active,'No release declared');
const result=active.name==='A'?await verifyReleaseA({phase:active.phase}):await verifyRelease(active);
check(result.status!=='already_published','Release record not advanced with production');
if(process.env.GITHUB_ENV)await fs.appendFile(process.env.GITHUB_ENV,'RELEASE_PHASE='+active.phase+'\nRELEASE_NAME='+active.name+'\n');
console.log(JSON.stringify({...active,status:result.status,blockingErrors:result.blockingErrors}));
