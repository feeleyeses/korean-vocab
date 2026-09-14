import fs from 'node:fs/promises';
import {census,validSenses} from './example-lanes.mjs';
import {hash} from './automation.mjs';
const read=async p=>JSON.parse(await fs.readFile(new URL(p,import.meta.url),'utf8'));
const raw=await read('../../data/vocabulary.json'),baseline=await read('./automation-results.json'),input=await read('./unblock-results.json'),external=await read('../research-poc/kaikki-matched-cache.json');
const rows=baseline.report.samples.filter(s=>s.type==='example').map(s=>{const entry=raw.entries.find(e=>e.lexicalEntryId===s.lexicalEntryId);return {...s,...census(entry,raw.entries,external),senses:validSenses(entry).map(x=>({senseId:x.senseId,gloss:x.glossZh,definition:x.definitionZh,definitionKo:x.definitionKo||null}))};});
if(rows.length!==100)throw Error('Fixed example sample changed');
const candidates=input.candidates.filter(c=>c.type==='example'&&c.sourceId==='Tatoeba').map(c=>({...c,entryFacts:rows.find(r=>r.lexicalEntryId===c.lexicalEntryId)}));
// Connected components prevent the same lexical entry OR translation pair leaking across splits.
const parent=new Map();function find(x){if(!parent.has(x))parent.set(x,x);if(parent.get(x)!==x)parent.set(x,find(parent.get(x)));return parent.get(x);}function union(a,b){a=find(a);b=find(b);if(a!==b)parent.set(a<b?b:a,a<b?a:b);}
for(const c of candidates){union('word:'+c.target.headword,'ko:'+c.originalId);union('word:'+c.target.headword,'zh:'+c.translation.originalId);}
for(const c of candidates){const group=find('word:'+c.target.headword);const bucket=parseInt(hash(group).slice(0,8),16)%10;c.split=bucket<6?'train':bucket<8?'calibration':'test';c.splitGroup=group;}
const output={model:'BAAI/bge-m3',datasetHash:hash(raw),sampleHash:hash(rows.map(r=>r.sampleId)),rows,candidates,provisional:{semantic:.8,margin:.12},splitMethod:'hash connected headword and source KO/ZH IDs; 60/20/20; frozen model, no fine tuning'};
await fs.writeFile(new URL('./wsd-input.json',import.meta.url),JSON.stringify(output,null,2));
console.log(JSON.stringify({samples:100,single:rows.filter(r=>r.validSenseCount===1).length,multi:rows.filter(r=>r.validSenseCount>1).length,tatoeba:candidates.length,singleCandidates:candidates.filter(c=>c.entryFacts.validSenseCount===1).length,safeSingleCandidates:candidates.filter(c=>c.entryFacts.validSenseCount===1&&c.entryFacts.homographSafe).length,splits:Object.fromEntries(['train','calibration','test'].map(s=>[s,candidates.filter(c=>c.split===s).length]))}));
