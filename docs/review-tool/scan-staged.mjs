import {execFileSync} from 'node:child_process';
const git=process.env.GIT_EXECUTABLE||'git';
const paths=execFileSync(git,['diff','--cached','--name-only','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const findings=[],review=[];
for(const file of paths){
 const bytes=execFileSync(git,['show',':'+file],{maxBuffer:16*1024*1024});
 const text=bytes.toString('utf8'),lines=text.split(/\r?\n/);
 for(const [i,line] of lines.entries()){
  if(/\b[A-F0-9]{32}\b/.test(line)||/\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,})\b/.test(line))findings.push({file,line:i+1,kind:'credential-shaped literal'});
  if(/\b[A-Za-z]:[\\/]/.test(line)||/[/\\]Users[/\\]/i.test(line))findings.push({file,line:i+1,kind:'machine absolute path'});
  if(/(?:api[_ -]?key|authorization|token|127\.0\.0\.1|localhost)/i.test(line))review.push({file,line:i+1,kind:'reviewed keyword or loopback default'});
 }
}
console.log(JSON.stringify({files:paths.length,blockingFindings:findings,reviewHits:review.length,note:'Keywords in environment lookups, tokenization code, validators and loopback-only Inspector are not credential values.'},null,2));
if(findings.length)process.exitCode=1;
