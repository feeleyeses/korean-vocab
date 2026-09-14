import fs from 'node:fs/promises';
import {verifyReleaseA} from './verify-release-a.mjs';
import {planRelease,writeRelease} from './publication.mjs';
// No CLI and no persistent enable switch. Caller must authorize this exact release.
export async function releaseATransaction({target,enabled=false,releaseId}={}){
 if(!enabled)return {mode:'disabled',written:false};
 if(releaseId!=='examples-7d882c8df890c5ba0278')throw Error('Exact Release A authorization required');
 const pre=await verifyReleaseA({phase:'pre_publish',target});
 if(pre.status==='already_published')return {...pre,written:false};
 const read=async p=>JSON.parse(await fs.readFile(new URL(p,import.meta.url),'utf8'));
 const manifest=await read('./release-a-manifest.json'),input=await read('./release-a-input.json'),registry=(await read('./source-registry.json')).sources;
 const raw=JSON.parse(await fs.readFile(target,'utf8'));
 const release=await planRelease(raw,input,registry,{selectionRank:Object.fromEntries(manifest.candidateIds.map((id,i)=>[id,i]))});
 // Use the frozen original manifest, never the planner's transient metadata.
 release.manifest=manifest;
 return writeRelease({target,release,enabled:true,confirmationReleaseId:releaseId,postVerify:verifyReleaseA});
}
