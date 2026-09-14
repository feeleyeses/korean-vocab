import fs from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createInterface} from 'node:readline';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {realExamples} from '../../src/domain.js';
import {validate} from './core.mjs';
// No networking, no keys, no production writer.
const [manifestPath]=process.argv.slice(2);if(!manifestPath)throw Error('Usage: node docs/review-tool/ingest.mjs /path/manifest.json');
const manifest=JSON.parse(await fs.readFile(manifestPath,'utf8')),base=path.dirname(path.resolve(manifestPath));
const resolve=p=>path.resolve(base,p);
const output=new URL('./imports/',import.meta.url);await fs.mkdir(output,{recursive:true});
const result=[],errors=[],duplicates=[],unavailable=[];
const seen=new Set(),count=new Map();
function emit(row,s,target){
 if(!target){errors.push({reason:'unmapped target'});return;}
 const text=row.text?.trim();if(!text){errors.push({originalId:row.originalId,reason:'empty text'});return;}
 if(row.kind==='definition'||row.kind==='gloss'){errors.push({originalId:row.originalId,reason:'definition is not an example'});return;}
 const id=createHash('sha256').update([s.sourceId,s.sourceVersion,row.originalId,target.senseId,row.translationId||''].join('|')).digest('hex');
 if(seen.has(id)){duplicates.push(id);return;}seen.add(id);
 const gate=realExamples({gloss:target.gloss,examples:[{ko:text,zh:row.zh,source:s.sourceId}]}).length>0;
 const passes=gate&&row.posAligned===true&&row.senseAligned===true&&row.naturalnessReviewed===true;
 const c={candidateId:id,type:row.type||'example',lexicalEntryId:target.lexicalEntryId,senseId:target.senseId,sourceId:s.sourceId,sourceUrl:row.sourceUrl||s.sourceUrl,sourceLicense:s.sourceLicense,originalId:String(row.originalId),sourceVersion:s.sourceVersion,fetchedAt:s.fetchedAt,
 content:{text,author:row.author||null,attribution:s.attribution||null,contextId:row.contextId||row.originalId},
 translation:row.zh?{text:row.zh,language:'cmn',originalId:row.translationId||null,author:row.translationAuthor||null,license:row.translationLicense||s.sourceLicense,linkType:row.linkType||'source-provided'}:row.en?{text:row.en,language:'eng',originalId:row.translationId,author:row.translationAuthor||null,license:row.translationLicense||s.sourceLicense,linkType:'direct'}:null,
 matchMethod:row.matchMethod||'exact surface token; no inferred lemmatization',senseAlignment:'pending automatic source alignment',
 confidence:passes?.8:.3,reviewStatus:'candidate',reviewer:null,lastVerified:null,qualityGate:{passes,realExamples:gate,posAligned:!!row.posAligned,senseAligned:!!row.senseAligned,naturalnessReviewed:!!row.naturalnessReviewed,licenseApproval:'pending'},current:target.current||{headword:target.headword,pos:target.pos,senses:[{gloss:target.gloss}]}};
 c.sourceAccess='local-cache';
 c.evidence=[{sourceId:s.sourceId,canonicalSourceId:s.canonicalSourceId||s.sourceId,derivedFrom:s.derivedFrom||[],sourceUrl:c.sourceUrl,sourceLicense:s.sourceLicense,sourceVersion:s.sourceVersion,fetchedAt:s.fetchedAt,originalId:c.originalId,documentHash:createHash('sha256').update(JSON.stringify(row)).digest('hex'),hashScope:'normalized-cache-record'}];
 c.alignment={}; // Legacy booleans and old human accepts cannot authorize publication.
 const es=validate(c);if(es.length){errors.push({originalId:row.originalId,errors:es});return;}
 const k=target.senseId+'|'+c.type;if((count.get(k)||0)>=3)return;
 count.set(k,(count.get(k)||0)+1);result.push(c);
}
// Manifests must list sources in KRDict -> Tatoeba -> licensed corpus order.
const rank=s=>s.kind==='krdict-cache'?0:s.kind==='tatoeba-tsv'?1:2;
for(const s of [...manifest.sources].sort((a,b)=>rank(a)-rank(b))){
 if(s.status==='unavailable'){unavailable.push({sourceId:s.sourceId,status:'unavailable',reason:s.reason||'network/access failure'});continue;}
 try{
  if(s.kind==='krdict-cache'){
   const raw=JSON.parse(await fs.readFile(resolve(s.file),'utf8'));
   // Cache envelope preserves raw API target/sense/example pointers in originalId.
   let records=raw.records;
   if(!Array.isArray(records)){
    const array=x=>x==null?[]:Array.isArray(x)?x:[x];
    records=array(raw.channel?.item||raw.item).flatMap(item=>{
     const info=item.word_info||item,code=String(item.target_code||info.target_code||'');
     return array(info.sense_info).flatMap(sense=>array(sense.example_info).filter(e=>['문장','대화','sentence'].includes(e.type)).map((e,i)=>{
      const target=manifest.targets.find(t=>String(t.externalWordId)===code&&String(t.externalSenseId)===String(sense.sense_code||sense.sense_order));
      return {text:e.example,kind:'example',originalId:code+':'+(sense.sense_code||sense.sense_order)+':'+i,senseId:target?.senseId,sourceUrl:s.sourceUrl};
     }));
    });
    if(!records.length){if(!raw.channel&&!raw.item)throw Error('Unsupported cache shape');errors.push({sourceId:s.sourceId,status:'no_candidate',reason:'valid cache has no sentence examples'});}
   }
   for(const row of records)emit(row,s,manifest.targets.find(t=>t.senseId===row.senseId));
  }else if(s.kind==='tatoeba-tsv'){
   // Official detailed sentence TSV: id, language, text, username, added, modified.
   // Read only kor/cmn/eng fields. Links TSV is sentence id -> translation id.
   const kor=new Map(),other=new Map(),targets=manifest.targets,links=[],needed=new Set();
   for(const file of s.sentences){
    for await(const line of createInterface({input:createReadStream(resolve(file)),crlfDelay:Infinity})){
     const [id,lang,text,author]=line.split('\t');if(!['kor','cmn','eng'].includes(lang)||!text)continue;
     if(lang==='kor'){
      const hits=targets.filter(t=>(t.forms||[t.headword]).some(f=>text.split(/[\s.,!?]+/).includes(f)));
      if(hits.length)kor.set(id,{id,text,author:author==='\\N'?null:author,hits});
     }
    }
   }
   for await(const line of createInterface({input:createReadStream(resolve(s.links)),crlfDelay:Infinity})){
    const [a,b]=line.split('\t');if(kor.has(a)){links.push([a,b]);needed.add(b);}else if(kor.has(b)){links.push([b,a]);needed.add(a);}
   }
   for(const file of s.sentences)for await(const line of createInterface({input:createReadStream(resolve(file)),crlfDelay:Infinity})){
    const [id,lang,text,author]=line.split('\t');if(needed.has(id)&&['cmn','eng'].includes(lang)&&text)other.set(id,{id,lang,text,author:author==='\\N'?null:author});
   }
   let matchedLinks=0;
   for(const [a,b] of links.sort((a,b)=>(other.get(a[1])?.lang==='cmn'?0:1)-(other.get(b[1])?.lang==='cmn'?0:1))){
    const ko=kor.get(a),tr=other.get(b);
    if(!ko||!tr)continue;matchedLinks++;
    for(const t of ko.hits)emit({originalId:ko.id,text:ko.text,author:ko.author,zh:tr.lang==='cmn'?tr.text:null,en:tr.lang==='eng'?tr.text:null,translationId:tr.id,translationAuthor:tr.author,sourceUrl:'https://tatoeba.org/en/sentences/show/'+ko.id,matchMethod:'provided headword/forms exact-token + direct translation link',linkType:'direct'},s,t);
   }
   if(!matchedLinks)errors.push({sourceId:s.sourceId,status:'no_candidate',reason:'local files successfully read; no direct matching links'});
  }else throw Error('unsupported source kind; natural corpus requires separate licensed adapter');
 }catch(e){unavailable.push({sourceId:s.sourceId,status:'unavailable',reason:e.code||e.message});}
}
const runId=new Date().toISOString().replace(/[:.]/g,'-');
await fs.writeFile(new URL(runId+'.json',output),JSON.stringify({schemaVersion:1,candidates:result,errors,duplicates,access:unavailable},null,2)+'\n');
console.log(JSON.stringify({runId,candidates:result.length,errors:errors.length,duplicates:duplicates.length,unavailable:unavailable.length}));
