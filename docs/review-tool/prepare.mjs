import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {mapVocabulary,senseGroups} from '../../src/domain.js';
import {validate} from './core.mjs';
const root=new URL('../../',import.meta.url),read=async p=>JSON.parse(await fs.readFile(new URL(p,root),'utf8'));
const words=mapVocabulary(await read('data/vocabulary.json'));
const first=(await read('docs/research-poc/polysemy-candidates.json')).candidates.slice(0,50);
const cache=await read('docs/research-poc/kaikki-matched-cache.json');
const posMap={'명사':'noun','名词':'noun','동사':'verb','动词':'verb','형용사':'adj','形容词':'adj','부사':'adv','副词':'adv','代词':'pron','대명사':'pron','数词':'num','수사':'num'};
const canon=p=>({adjective:'adj',adverb:'adv',pronoun:'pron',numeral:'num'})[p]||p;
const norm=s=>s.normalize('NFKC').replace(/[\s.,;；，。()（）]/g,'');
const candidates=[],report=[];
for(const old of first){
 const w=words.find(w=>w.headword===old.headword);if(!w)continue;
 const pos=posMap[w.pos],records=cache.filter(e=>e.word===w.headword),kept=[],ignored=[];const seen=new Set();
 for(const [ri,e] of records.entries()){
  for(const [si,s] of (e.senses||[]).entries()){
   const text=(s.glosses||[]).join('；'),key=norm((s.glosses||[])[0]||'');
   let reason=!pos?'current-pos-unmapped':canon(e.pos)!==pos?'POS mismatch / affix':s.form_of||s.alt_of?'form/alternative entry':!key?'empty gloss':seen.has(key)?'duplicate sub-sense':null;
   // Separate dictionary etymology blocks are not automatically combined into a lexical entry.
   if(!reason&&records.filter(r=>canon(r.pos)===pos).length>1)reason='homograph/etymology unresolved: quarantine';
   if(reason){ignored.push({originalId:ri+':'+si,text,reason});continue;}
   seen.add(key);kept.push({originalId:ri+':'+si,text,pos:e.pos,etymology:e.etymology_text||null});
  }
 }
 const current=senseGroups(w).map(g=>({gloss:g.gloss,senseIds:g.senses.map(s=>s.senseId)}));
 const useful=kept.length>current.length;
 const item={headword:w.headword,lexicalEntryId:w.lexicalEntryId,currentSenses:current,externalSenses:kept,ignored,
 recommendation:useful?'review-add':'review-ignore-or-align',reason:useful?'same POS, single source entry block, deduplicated sense surplus; bilingual alignment still required':'no safe surplus after filters; review exclusions, do not add automatically'};
 report.push(item);
 // Keep all 50 review packets, including ignore decisions, rather than inventing high-confidence surplus.
 const c={candidateId:'poly-'+createHash('sha256').update(w.lexicalEntryId+old.sourceVersion).digest('hex').slice(0,20),type:'polysemy',lexicalEntryId:w.lexicalEntryId,senseId:null,sourceId:old.sourceId,sourceUrl:old.sourceUrl,sourceLicense:old.sourceLicense,originalId:old.originalId,sourceVersion:old.sourceVersion,fetchedAt:old.fetchedAt,content:item,translation:null,matchMethod:'exact-headword + POS + separate-etymology quarantine + first-gloss dedup',senseAlignment:{status:'needs-human-bilingual-alignment',currentGroups:current,automaticMerge:false},confidence:useful?.65:.2,reviewStatus:'candidate',reviewer:null,lastVerified:null,
 current:{headword:w.headword,pos:w.pos,senses:w.senses.map(s=>({gloss:s.gloss,examples:s.examples,collocations:s.collocations}))}};
 const errors=validate(c);if(errors.length)throw Error(errors.join(','));candidates.push(c);
}
await fs.writeFile(new URL('candidates.json',import.meta.url),JSON.stringify(candidates,null,2)+'\n');
await fs.writeFile(new URL('polysemy-filter-report.json',import.meta.url),JSON.stringify({input:50,packets:candidates.length,addReview:report.filter(r=>r.recommendation==='review-add').length,ignoreOrAlign:report.filter(r=>r.recommendation!=='review-add').length,items:report},null,2)+'\n');
console.log(JSON.stringify({packets:candidates.length,addReview:report.filter(r=>r.recommendation==='review-add').length}));
