import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {args,root,here,check,verifyRelease} from './train-lib.mjs';
import {writeRelease,WRITER_DEFAULTS,byteHash} from './publication.mjs';
const a=args();
if(a.enabled!==true){console.log(JSON.stringify({mode:'disabled',written:false}));process.exit(0);}
const git=process.env.GIT_BINARY||'git';
const status=spawnSync(git,['status','--porcelain'],{cwd:root,encoding:'utf8'});check(status.status===0&&!status.stdout.trim(),'Clean working tree required');
const pre=await verifyRelease({name:a.release,phase:'pre_publish'});
if(pre.status==='already_published'){console.log(JSON.stringify(pre));process.exit(0);}
const {p,m,record}=pre.bundle;check(record.dryRun.passed&&record.kind==='prepared-not-published','Completed dry-run required');
const target=path.join(root,'data/vocabulary.json'),bytes=await fs.readFile(target);
const gitdir=spawnSync(git,['rev-parse','--absolute-git-dir'],{cwd:root,encoding:'utf8'});check(gitdir.status===0,'Backup location unavailable');
const backup=path.join(gitdir.stdout.trim(),'release-backups',m.releaseId);await fs.mkdir(backup,{recursive:true});
for(const file of [target,p.manifest,p.input,p.attribution,p.record])await fs.copyFile(file,path.join(backup,path.basename(file)),fs.constants.COPYFILE_EXCL);
const creditTarget=path.join(root,'data/releases',m.releaseId+'-ATTRIBUTION.md'),recordBytes=await fs.readFile(p.record);
let written=false,creditOwned=false;
try{
 const result=await writeRelease({target,release:pre.plan,enabled:true,confirmationReleaseId:m.releaseId,postVerify:opts=>verifyRelease({name:a.release,...opts})});written=result.written;
 const post=await verifyRelease({name:a.release,phase:'post_publish'});
 await fs.mkdir(path.join(root,'data/releases'),{recursive:true});
 await fs.copyFile(p.attribution,creditTarget,fs.constants.COPYFILE_EXCL);creditOwned=true;
 const next={...record,kind:'published',publication:{timestamp:new Date().toISOString(),previousVocabularyHash:m.previousVocabularyHash,newVocabularyHash:m.newVocabularyHash,addedExamples:post.addedExamples,coveredSenses:post.coveredSenses,blockingErrors:0,newWarnings:0},online:{passed:false,status:'awaiting-ci-pages-smoke'},writerEnabled:false};
 await fs.writeFile(p.record+'.tmp',JSON.stringify(next,null,2)+'\n',{flag:'wx'});await fs.rename(p.record+'.tmp',p.record);
 for(const suffix of ['.backup','.backup.release.json'])await fs.rename(target+'.'+m.releaseId+suffix,path.join(backup,'writer'+suffix));
 console.log(JSON.stringify({releaseId:m.releaseId,written:true,writerDefaults:WRITER_DEFAULTS,next:'Commit data and published record, push, then record-online-smoke. Do not prepare next batch yet.'}));
}catch(error){
 if(written){await fs.writeFile(target+'.rollback.tmp',bytes);await fs.rename(target+'.rollback.tmp',target);}
 await fs.writeFile(p.record+'.restore.tmp',recordBytes);await fs.rename(p.record+'.restore.tmp',p.record);
 await fs.rm(p.record+'.tmp',{force:true});
 if(creditOwned)await fs.rm(creditTarget);
 check(byteHash(await fs.readFile(target))===byteHash(bytes),'ROLLBACK FAILED');
 throw error;
}
