export const LOCATOR_VERSION='exact-entity-v1';
export function locateIdentity(rows,target){
 const exact=rows.filter(r=>r.headword===target.headword);
 const bound=exact.filter(r=>(!r.entryId||r.entryId===target.entryId)&&(!r.pos||r.pos===target.pos)&&(!r.senseIds||r.senseIds.includes(target.senseId)));
 if(bound.length===0)throw Error('locator_failed: '+target.headword);
 if(bound.length!==1)throw Error('ambiguous_locator: '+target.headword);
 return bound[0];
}
export function assertExampleIdentity(entries,target){
 const matches=[];
 for(const w of entries)for(const s of w.senses)for(const e of s.examples||[])if(e.exampleId===target.exampleId)matches.push({w,s,e});
 if(matches.length!==1)throw Error('example_identity_failed: duplicate/missing '+target.exampleId);
 const {w,s,e}=matches[0];
 if(w.lexicalEntryId!==target.entryId||w.headword!==target.headword||w.partOfSpeech!==target.pos||s.senseId!==target.senseId||e.ko!==target.ko||e.zh!==target.zh)throw Error('example_identity_failed: wrong sense/entry/text '+target.exampleId);
 return {w,s,e};
}
