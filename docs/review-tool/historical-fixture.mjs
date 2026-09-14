import fs from 'node:fs/promises';
import {hash} from './automation.mjs';
// Test-only reconstruction of frozen A from later additive releases. Never writes production.
export async function releaseAPrevious(raw){
 const copy=structuredClone(raw),files=(await fs.readdir(new URL('./',import.meta.url))).filter(n=>/^release-[a-z]-manifest.json$/.test(n));
 const manifests=await Promise.all(files.map(async n=>JSON.parse(await fs.readFile(new URL(n,import.meta.url),'utf8'))));
 const ids=new Set(manifests.flatMap(m=>m.addedExampleIds));
 for(const w of copy.entries)for(const s of w.senses)s.examples=(s.examples||[]).filter(e=>!ids.has(e.exampleId));
 const a=manifests.find(m=>m.releaseId==='examples-7d882c8df890c5ba0278');
 if(hash(copy)!==a.previousVocabularyHash)throw Error('Historical fixture drift');
 return copy;
}
