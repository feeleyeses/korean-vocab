import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {hash} from '../review-tool/automation.mjs';
import {byteHash,qualityAudit} from '../review-tool/publication.mjs';
export const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'../..');
export const RELEASE='collocation-cleanup-122-v1';
export const BEFORE='83c62a43166d9aa507136beee1708118065142ddabdd6d6c4ec431662791a2b8';
export const AFTER='540ea19b9e12f6bcf311ae24d5ea9cdccc4d6d71576a381e8355780fb63b459f';
export const PLAN='234a815fe252dfe0cf1501cd36ca5343585f3abd5248256853c649e6c148f35d';
export const DEFAULTS=Object.freeze({enabled:false});
export const norm=s=>String(s??'').normalize('NFKC').replace(/[\p{P}\p{Z}\s]/gu,'');
export const check=(ok,msg)=>{if(!ok)throw Error(msg);};
export const read=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const counts=v=>({entries:v.entries.length,senses:v.entries.reduce((n,e)=>n+e.senses.length,0),examples:v.entries.reduce((n,e)=>n+e.senses.reduce((n,s)=>n+s.examples.length,0),0),collocations:v.entries.reduce((n,e)=>n+e.senses.reduce((n,s)=>n+s.collocations.length,0),0)});
const owned=v=>v.entries.flatMap(e=>e.senses.flatMap(s=>s.collocations.map(c=>[e.lexicalEntryId,s.senseId,JSON.stringify(c)])));
function find(v,r){const es=v.entries.filter(e=>e.lexicalEntryId===r.lexicalEntryId);check(es.length===1,'Entry identity');const ss=es[0].senses.filter(s=>s.senseId===r.senseId);check(ss.length===1,'Sense identity');return {e:es[0],s:ss[0]};}
function validateManifest(m){check(m.releaseId===RELEASE&&m.previousVocabularyHash===BEFORE&&m.newVocabularyHash===AFTER&&m.sourcePlanHash===PLAN,'Manifest baseline mismatch');check(m.removals.length===122&&new Set(m.removals.map(r=>r.collocationId)).size===122&&new Set(m.removals.map(r=>r.senseId)).size===122,'Manifest count/uniqueness');check(m.removals.every(r=>r.action==='REMOVE'),'Only REMOVE authorized');}
export async function loadManifest(){const m=await read(path.join(here,'cleanup-release-manifest.json'));validateManifest(m);check(hash((await fs.readFile(path.join(root,'scripts/vocab-quality-audit.mjs'),'utf8')).replace(/\r\n/g,'\n'))===m.qualityPolicyHash,'Quality policy changed');return m;}
export function project(v,m){
 validateManifest(m);check(hash(v)===BEFORE,'Production drift');const n=structuredClone(v);
 for(const r of m.removals){const {e,s}=find(n,r);check(r.original.ko===e.headword&&norm(r.original.ko)===norm(e.headword),'Not literal headword duplicate');const c=s.collocations.filter(c=>c.collocationId===r.collocationId);check(c.length===1&&JSON.stringify(c[0])===JSON.stringify(r.original),'Collocation bytes/identity mismatch');check(s.collocations[r.index]?.collocationId===r.collocationId,'Original index mismatch');s.collocations.splice(r.index,1);}
 check(hash(n)===AFTER,'Expected hash mismatch');const restored=restore(n,m);check(hash(restored)===BEFORE,'Unexpected data changes');
 const removed=new Set(m.removals.map(r=>r.collocationId)),remaining=owned(v).filter(r=>!removed.has(JSON.parse(r[2]).collocationId));check(JSON.stringify(owned(n))===JSON.stringify(remaining),'Other484 bytes/ownership changed');
 check(JSON.stringify(counts(v))===JSON.stringify({entries:4020,senses:4059,examples:4459,collocations:606}),'Before counts');check(JSON.stringify(counts(n))===JSON.stringify({entries:4020,senses:4059,examples:4459,collocations:484}),'After counts');
 check(n.entries.every(e=>e.senses.every(s=>s.collocations.every(c=>norm(c.ko)!==norm(e.headword)))),'Headword duplicates remain');return n;
}
export function restore(v,m){validateManifest(m);check(hash(v)===AFTER,'Post-release drift');const n=structuredClone(v);for(const r of [...m.removals].reverse()){const {s}=find(n,r);check(!s.collocations.some(c=>c.collocationId===r.collocationId),'Already restored');s.collocations.splice(r.index,0,r.original);}check(hash(n)===BEFORE,'Restoration drift');return n;}
const bag=rows=>{const b=new Map();for(const r of rows){const k=JSON.stringify(r);b.set(k,(b.get(k)||0)+1);}return b;};
export function validateWarnings(pre,post,m){
 check(pre.totals.blockingFailures===0&&post.totals.blockingFailures===0,'Blocking quality failure');
 check(pre.totals.warnings===7039&&post.totals.warnings===7143,'Warning totals not allowlisted');
 check(pre.reviewQueue.length===pre.totals.warnings&&post.reviewQueue.length===post.totals.warnings,'Audit warning detail completeness');
 const a=bag(pre.reviewQueue),b=bag(post.reviewQueue),delta=[];for(const k of new Set([...a.keys(),...b.keys()])){const d=(b.get(k)||0)-(a.get(k)||0);if(d)delta.push([k,d]);}
 const expected=[...m.warningAllowlist.added.map(r=>[JSON.stringify(r),1]),...m.warningAllowlist.removed.map(r=>[JSON.stringify(r),-1])];
 const order=xs=>xs.sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0);
 check(JSON.stringify(order(delta))===JSON.stringify(order(expected)),'Unexpected warning identity/type/count; rollback required');
 check(m.warningAllowlist.added.length===113&&m.warningAllowlist.removed.length===9,'Allowlist count');
 check(m.warningAllowlist.added.every(r=>r.reason===r.reason.split(':')[0]+': collocation needs source and verification')&&m.warningAllowlist.removed.every(r=>r.reason===r.reason.split(':')[0]+': collocation.zh needs verified phrase meaning'),'Allowlist reason');
 return {addedMissingVerifiedPair:113,removedMissingZh:9,delta:104,unexpected:0};
}
export async function verify({phase,target=path.join(root,'data/vocabulary.json'),manifest}){
 check(['pre_publish','post_publish'].includes(phase),'Explicit phase required');const m=manifest||await loadManifest(),v=await read(target);
 if(phase==='pre_publish'&&hash(v)===AFTER)return {status:'already_published',writerAllowed:false};
 check(hash(v)===(phase==='pre_publish'?BEFORE:AFTER),phase==='pre_publish'?'Production drift':'Post-release drift');
 const previous=phase==='pre_publish'?v:restore(v,m),next=project(previous,m);
 const pre=await qualityAudit(previous),post=await qualityAudit(next);check(pre.passed&&post.passed,'Full quality audit failed');const warnings=validateWarnings(pre.report,post.report,m);
 return {status:phase==='pre_publish'?'ready':'published',phase,blockingErrors:0,warnings,counts:counts(next),finalHash:phase==='post_publish'?hash(v):null,writerAllowed:false,previous,next};
}
export async function publish({enabled=false,releaseId,target=path.join(root,'data/vocabulary.json'),backupRoot=path.join(root,'.git/collocation-backups'),faultAfterReplace=false,manifest}){
 if(!enabled)return {status:'disabled',writerEnabled:false,written:false};check(releaseId===RELEASE,'Exact release ID required');const m=manifest||await loadManifest();
 const original=await fs.readFile(target);if(hash(JSON.parse(original))===AFTER)return {status:'already_published',writerEnabled:false,written:false};
 const lock=target+'.collocation-lock',temp=target+'.collocation-temp';const handle=await fs.open(lock,'wx');let replaced=false,tempOwned=false;
 const backup=path.join(backupRoot,RELEASE+'-'+Date.now());
 try{
  await fs.mkdir(backup,{recursive:true});await fs.writeFile(path.join(backup,'vocabulary.json'),original,{flag:'wx'});await fs.writeFile(path.join(backup,'manifest.json'),JSON.stringify(m,null,2)+'\n');
  await fs.writeFile(path.join(backup,'backup-record.json'),JSON.stringify({releaseId:RELEASE,previousHash:hash(JSON.parse(original)),previousByteHash:byteHash(original),timestamp:new Date().toISOString()},null,2)+'\n');
  const ready=await verify({phase:'pre_publish',target,manifest:m});check(ready.status==='ready','Writer cannot repeat release');
  check(byteHash(await fs.readFile(target))===byteHash(original),'Concurrent drift');check(original.toString('utf8')===JSON.stringify(ready.previous,null,2)+'\n','Unexpected production formatting');
  await fs.writeFile(temp,JSON.stringify(ready.next,null,2)+'\n',{flag:'wx'});tempOwned=true;
  await verify({phase:'post_publish',target:temp,manifest:m});check(byteHash(await fs.readFile(target))===byteHash(original),'Concurrent drift');
  await fs.rename(temp,target);replaced=true;
  if(faultAfterReplace)throw Error('Injected post-write failure');
  const post=await verify({phase:'post_publish',target,manifest:m});
  const result={status:'published',releaseId:RELEASE,written:true,writerEnabled:false,previousHash:BEFORE,finalHash:AFTER,removed:122,senses:122,warningDelta:post.warnings,blockingErrors:post.blockingErrors,backupId:path.basename(backup),timestamp:new Date().toISOString()};
  await fs.writeFile(path.join(backup,'transaction.json'),JSON.stringify(result,null,2)+'\n');return result;
 }catch(e){
  if(replaced){await fs.writeFile(temp,original);tempOwned=true;await fs.rename(temp,target);check(byteHash(await fs.readFile(target))===byteHash(original),'Rollback failed');}
  await fs.writeFile(path.join(backup,'transaction.json'),JSON.stringify({status:'failed',reason:e.message,rollback:replaced?'restored_original_bytes':'not_needed',writerEnabled:false},null,2)+'\n');throw e;
 }finally{if(tempOwned)await fs.rm(temp,{force:true});await handle.close();await fs.rm(lock,{force:true});}
}
export async function createLock(){
 const raw=await fs.readFile(path.join(here,'collocation-repair-plan.json'));check(byteHash(raw)===PLAN,'Repair plan bytes changed');const plan=JSON.parse(raw),v=await read(path.join(root,'data/vocabulary.json'));check(hash(v)===BEFORE,'Production drift');
 const removals=plan.rows.filter(r=>r.action==='REMOVE').map(r=>{const {e,s}=find(v,r);const c=s.collocations.find(c=>c.collocationId===r.collocationId);check(c&&c.ko===r.originalKo&&(c.zh||'')===r.originalZh&&c.ko===e.headword,'Removal mismatch');return {action:r.action,lexicalEntryId:r.lexicalEntryId,senseId:r.senseId,collocationId:r.collocationId,index:s.collocations.indexOf(c),original:c};});
 const m={releaseId:RELEASE,previousVocabularyHash:BEFORE,newVocabularyHash:AFTER,sourcePlanHash:PLAN,qualityPolicyHash:hash((await fs.readFile(path.join(root,'scripts/vocab-quality-audit.mjs'),'utf8')).replace(/\r\n/g,'\n')),createdAt:new Date().toISOString(),removals,warningAllowlist:{added:[],removed:[]}};
 for(const r of removals){const {e}=find(v,r);const row=reason=>({lexicalEntryId:e.lexicalEntryId,headword:e.headword,source:e.source||null,levels:e.levels||[],reason:r.senseId+': '+reason,severity:'warning'});if(r.original.zh)m.warningAllowlist.added.push(row('collocation needs source and verification'));else m.warningAllowlist.removed.push(row('collocation.zh needs verified phrase meaning'));}
 await verify({phase:'pre_publish',manifest:m});await fs.writeFile(path.join(here,'cleanup-release-manifest.json'),JSON.stringify(m,null,2)+'\n',{flag:'wx'});return {locked:true,releaseId:RELEASE};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [command,...args]=process.argv.slice(2),value=k=>args[args.indexOf(k)+1];
 const r=command==='lock'?await createLock():command==='verify'?await verify({phase:value('--phase')}):command==='publish'?await publish({enabled:args.includes('--enabled'),releaseId:value('--release')}):{status:'disabled',writerEnabled:false};
 console.log(JSON.stringify({...r,previous:undefined,next:undefined},null,2));
}
