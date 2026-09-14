import fs from 'node:fs/promises';
import {hash} from './automation.mjs';
import {structuralAllowlist} from './example-lanes.mjs';
import {mapVocabulary,senseGroups,realExamples} from '../../src/domain.js';
const read=async p=>JSON.parse(await fs.readFile(new URL(p,import.meta.url),'utf8'));
const raw=await read('../../data/vocabulary.json'),external=await read('../research-poc/kaikki-matched-cache.json');
const entries=structuralAllowlist(raw.entries,external);
const singles=Object.values(entries).filter(e=>e.entryApproved&&e.validSenseCount===1&&e.homographSafe);
const multi=mapVocabulary(raw).filter(w=>senseGroups(w).length>1).map(w=>({
 lexicalEntryId:w.lexicalEntryId,headword:w.headword,pos:w.pos,
 kaikkiCandidates:external.filter(e=>e.word===w.headword),
 split:['train','train','train','calibration','test'][parseInt(hash(w.headword).slice(0,8),16)%5],
 groups:senseGroups(w).map((g,i)=>({groupId:w.lexicalEntryId+':group:'+i,gloss:g.gloss,senses:g.senses.map(s=>({senseId:s.senseId,gloss:s.glossZh,definition:s.definitionZh,examples:realExamples(s)}))}))
}));
const previous=await read('./example-lanes-results.json');
const output={datasetHash:hash(raw),entries,singleIds:singles.map(s=>s.lexicalEntryId),multi,
 targets:[...singles,...multi].reduce((a,w)=>{a[w.headword]=[...new Set([...(a[w.headword]||[]),w.pos])];return a;},{})};
await fs.writeFile(new URL('./expanded-scope.json',import.meta.url),JSON.stringify(output,null,2));
await fs.writeFile(new URL('./publication-baseline.json',import.meta.url),JSON.stringify({datasetHash:hash(raw),policy:previous.policy,candidates:previous.candidates.filter(c=>c.reviewStatus==='auto_verified')},null,2));
console.log(JSON.stringify({singleSenseTotal:singles.length,multi:multi.length,groups:multi.reduce((n,w)=>n+w.groups.length,0),realExamples:multi.reduce((n,w)=>n+w.groups.flatMap(g=>g.senses.flatMap(s=>s.examples)).length,0)}));
