import {hash} from './automation.mjs';
// Future natural-corpus input contract only. No candidate scoring or publication.
export function prepareCorpusBatch(registry,sourceId,documents,target){
 const source=registry[sourceId];
 if(source?.licenseApproval!==true||source.kind!=='natural-corpus'||/chatbot/i.test(sourceId))throw Error('Approved natural corpus required');
 const seen=new Set();
 return documents.map(d=>{
  if(!d.originalId||!d.text||!d.sourceVersion||!d.sourceUrl||!Number.isFinite(Date.parse(d.fetchedAt)))throw Error('Incomplete document provenance');
  const documentHash=hash(d.rawNode??d.text);
  if(seen.has(documentHash))return null;seen.add(documentHash);
  return {target,content:{text:d.text},sourceId,sourceLicense:source.sourceLicense,originalId:d.originalId,sourceUrl:d.sourceUrl,sourceVersion:d.sourceVersion,fetchedAt:d.fetchedAt,documentHash,
   nextStage:'morph_batch.py',requiredStatistics:['documentFrequency','PMI-or-LogDice','window-or-dependency-pattern','senseAlignment'],translation:null};
 }).filter(Boolean);
}
