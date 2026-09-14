export const TYPES=['example','collocation','polysemy'];
export const STATES=['candidate','auto_verified','published','quarantine','auto_rejected'];
export const FIELDS=['candidateId','type','lexicalEntryId','senseId','sourceId','sourceUrl','sourceLicense','originalId','sourceVersion','fetchedAt','content','translation','matchMethod','senseAlignment','reviewStatus'];
export function validate(c){
 const errors=FIELDS.filter(k=>!(k in c)).map(k=>'missing '+k);
 if(!TYPES.includes(c.type))errors.push('invalid type');
 if(!STATES.includes(c.reviewStatus))errors.push('invalid reviewStatus');
 for(const k of ['candidateId','lexicalEntryId','sourceId','originalId','sourceVersion','sourceLicense'])if(typeof c[k]!=='string'||!c[k].trim())errors.push('invalid '+k);
 if(c.senseId!==null&&typeof c.senseId!=='string')errors.push('invalid senseId');
 if(!Number.isFinite(Date.parse(c.fetchedAt)))errors.push('invalid fetchedAt');
 try{const u=new URL(c.sourceUrl);if(!['http:','https:'].includes(u.protocol)||/key|token|secret/i.test(u.search))errors.push('unsafe sourceUrl');}catch{errors.push('invalid sourceUrl');}
 if(c.reviewStatus!=='candidate'){
  for(const key of ['score','scoreVersion','scoreBreakdown','evidence','sourceCoverage','validationFlags'])if(!(key in c))errors.push('missing '+key);
  if(typeof c.score!=='number'||c.score<0||c.score>1)errors.push('invalid score');
 }
 return errors;
}
