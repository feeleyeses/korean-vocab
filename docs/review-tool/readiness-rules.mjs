// Analysis and selection only. No threshold or sentence-gate override.
import {norm} from './automation.mjs';
export const ATTRIBUTION_POLICY={
 version:'tatoeba-export-credit-v1',
 sources:['https://tatoeba.org/en/downloads','https://en.wiki.tatoeba.org/articles/show/using-the-tatoeba-corpus','https://en.wiki.tatoeba.org/articles/show/quick-start'],
 ownerField:'Detailed export Username is owner/contributor, not proof of original authorship',
 named:'Preserve exact supplied username, sentence and translation IDs/URLs, export version, license link; texts unchanged.',
 orphan:'Do not infer author from Tatoeba brand, language, translation partner or other sentences. Missing owner requires original contributor evidence or record-specific public-domain/CC0 evidence.',
 cc0:'Only explicit record-specific CC0 evidence; never infer from the mixed export.',
 failure:'quarantine when credit evidence is missing or conflicted'
};
export function attributionDiagnosis(c){
 const sides=[['ko',c.originalId,c.content.author],['zh',c.translation.originalId,c.translation.author]];
 const reasons=[];
 for(const [side,id,author] of sides){
  const node=c.evidence.find(e=>e.originalId===id)?.rawNode;
  if(!Array.isArray(node)||node[0]!==id)reasons.push(side+':metadata_join_failed');
  else if(node[3]===undefined)reasons.push(side+':export_field_absent');
  else if(!node[3]||node[3]==='\\N')reasons.push(side+':export_owner_absent');
  else if(author!==node[3])reasons.push(side+':ingest_field_mismatch');
 }
 return {complete:!reasons.length,reasons};
}
const lexical=new Set(['NNG','NNP','NNB','NP','NR','VV','VA','VX','VCP','VCN','MM','MAG','MAJ','XSV','XSA']);
export function sentenceFeatures(c){
 const text=c.content.text,ms=c.morphology?.morphemes||[],tags=ms.map(m=>m.pos.split('-')[0]);
 const chars=[...text].length,whitespaceTokens=text.trim().split(/\s+/u).filter(Boolean).length;
 const oldTokens=text.split(/[\s\p{P}]+/u).filter(Boolean).length;
 const predicate=tags.some(t=>['VV','VA','VX','VCP','VCN','XSV','XSA'].includes(t));
 const finalEnding=tags.includes('EF'),endingIndex=tags.lastIndexOf('EF');
 const tail=tags.slice(endingIndex+1).every(t=>['SF','SP','SS','SSO','SSC','SE','SO','SW','JX'].includes(t));
 const lexicalCount=tags.filter(t=>lexical.has(t)).length,range=chars>=8&&chars<=240;
 const completePredicate=predicate&&finalEnding&&tail;
 return {characters:chars,whitespaceTokens,oldGateTokens:oldTokens,morphemes:ms.length,lexicalMorphemes:lexicalCount,punctuation:(text.match(/[\p{P}]/gu)||[]).join(''),predicate,finalEnding,completePredicate,
  ruleA:range&&oldTokens>=3,ruleB:Object.fromEntries([4,6,8].map(n=>[n,range&&ms.length>=n])),
  ruleC:Object.fromEntries([2,3,4].map(n=>[n,range&&lexicalCount>=n])),
  ruleD:range&&completePredicate&&lexicalCount>=2&&!tags.every(t=>['IC','SF','SP'].includes(t)),
  otherGatesPassed:!c.reasons.some(r=>!['sentenceLength','below_provisional_high','per_sense_cap'].includes(r))};
}
export function classify(reasons){
 const cats=new Set();
 for(const r of reasons){
  // Below-threshold is derived from the failed structure component in short sentences.
  // Keep the score reason in raw reports, but do not double-count it as an independent quality cause.
  if(r==='below_provisional_high'&&reasons.includes('sentenceLength'))continue;
  if(['per_sense_cap','example_cap','duplicate_or_check_missing','duplicate_content','duplicate_id','duplicate_current_example','existing_example_id'].includes(r))cats.add('expectedSelection');
  else if(/attribution|sourceTraceable|source_unavailable|metadata|license_blocked/.test(r))cats.add('recoverableMetadata');
  else if(r==='sentenceLength')cats.add('ruleDesign');
  else cats.add('qualityUncertainty');
 }
 return [...cats];
}
export function rankExample(c,sense){
 const f=sentenceFeatures(c),old=(sense.examples||[]).map(e=>new Set([...norm(e.ko)])),chars=new Set([...norm(c.content.text)]);
 const diversity=old.length?1-Math.max(...old.map(a=>[...a].filter(v=>chars.has(v)).length/Math.max(1,new Set([...a,...chars]).size))):1;
 // Versioned lexicographic order, not an uncalibrated quality probability.
 const vector=[Number(c.validationFlags.licenseApproval&&c.validationFlags.sourceTraceable),Number(c.validationFlags.translation),Number(c.morphology.lemmaMatch&&c.morphology.posMatch),Number(c.singleSenseStructuralMatch),Number(f.completePredicate),Number(f.characters>=12&&f.characters<=80),Number(diversity.toFixed(6)),Number(attributionDiagnosis(c).complete)];
 return {version:'release-rank-lexicographic-v1',vector,diversity,completePredicate:f.completePredicate,characters:f.characters};
}
export function compareRank(a,b){
 for(let i=0;i<a.rank.vector.length;i++){const d=b.rank.vector[i]-a.rank.vector[i];if(d)return d;}
 return a.candidateId.localeCompare(b.candidateId);
}
