import {canonicalPOS} from './sense-alignment.mjs';
import {norm,hash} from './automation.mjs';
export const validSenses=w=>(w.senses||[]).filter(s=>s.senseId&&norm(s.glossZh)&&!['draft','rejected','needs_review'].includes(s.verificationStatus));
export function census(entry,entries,external){
 const senses=validSenses(entry),pos=canonicalPOS(entry.partOfSpeech);
 const siblings=entries.filter(w=>norm(w.headword)===norm(entry.headword)&&canonicalPOS(w.partOfSpeech)===pos);
 const externalBlocks=external.filter(w=>w.word===entry.headword&&canonicalPOS(w.pos)===pos);
 const homographSafe=siblings.length===1&&externalBlocks.length<=1;
 return {lexicalEntryId:entry.lexicalEntryId,headword:entry.headword,pos:entry.partOfSpeech,senseIds:senses.map(s=>s.senseId),validSenseCount:senses.length,sameHeadwordPOSLexicalEntries:siblings.length,externalSamePOSBlocks:externalBlocks.length,homographSafe,entryApproved:entry.verificationStatus==='approved',entryHash:hash(entry)};
}
// Build from production and external cache, never from a candidate-supplied lane flag.
export function structuralAllowlist(entries,external){return Object.fromEntries(entries.map(e=>{const facts=census(e,entries,external);return [e.lexicalEntryId,facts];}));}
export function duplicateCheck(c,entries,seen){
 const word=entries.find(w=>w.lexicalEntryId===c.lexicalEntryId),sense=word?.senses.find(s=>s.senseId===c.senseId),ko=norm(c.content?.text);
 if(!ko)return false;
 const key=c.lexicalEntryId+'|'+c.senseId+'|'+ko;
 const duplicate=seen.has(key)||(sense?.examples||[]).some(e=>norm(e.ko)===ko);
 seen.add(key);return duplicate;
}
