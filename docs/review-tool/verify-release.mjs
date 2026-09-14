import {args,verifyRelease} from './train-lib.mjs';
const a=args(),r=await verifyRelease({name:a.release,phase:a.phase,target:a.target});
console.log(JSON.stringify({...r,plan:undefined,bundle:undefined},null,2));
if(r.status==='already_published')process.exitCode=2;
