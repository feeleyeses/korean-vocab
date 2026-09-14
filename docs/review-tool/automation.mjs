import {createHash} from 'node:crypto';
import {realExamples} from '../../src/domain.js';
import {validate} from './core.mjs';
export const STATES=['candidate','auto_verified','published','quarantine','auto_rejected'];
export const norm=x=>String(x||'').normalize('NFKC').toLowerCase().replace(/[\s\p{P}]/gu,'');
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
const frozenHashes=new WeakMap();
export const hash=x=>x&&typeof x==='object'&&frozenHashes.has(x)?frozenHashes.get(x):createHash('sha256').update(JSON.stringify(stable(x))).digest('hex');
// Full-corpus evaluation reuses an immutable policy; its canonical hash must not be rebuilt per sentence.
export function freezePolicy(policy){
 const value=hash(policy);
 const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
 freeze(policy);frozenHashes.set(policy,value);return policy;
}
export const POLICY={version:'rules-v2-provisional-1',calibrated:false,high:{example:.92,collocation:.92,polysemy:.95},corpus:{minimumDocuments:5,pmi:4,logDice:7},sources:{}};
export const WEIGHTS={example:{authority:.12,headword:.12,pos:.12,alignment:.24,translation:.18,structure:.12,consensus:.10},collocation:{authority:.10,headword:.14,pos:.14,alignment:.22,phrase:.25,consensus:.15},polysemy:{authority:.10,headword:.15,pos:.15,alignment:.25,novelty:.20,consensus:.15}};
const safeUrl=s=>{try{const u=new URL(s);return ['https:','http:'].includes(u.protocol)&&!/(key|token|secret)/i.test(u.search);}catch{return false;}};
// Registry is controlled configuration, never copied from candidate licenseApproval/AI flags.
export function consensus(evidence,policy){
 const usable=evidence.filter(e=>{const s=policy.sources[e.sourceId];return s?.licenseApproval===true&&s.sourceLicense===e.sourceLicense&&s.sourceVersion===e.sourceVersion&&e.canonicalSourceId===s.canonicalSourceId&&JSON.stringify(e.derivedFrom||[])===JSON.stringify(s.derivedFrom||[])&&safeUrl(e.sourceUrl)&&(!s.hosts||s.hosts.includes(new URL(e.sourceUrl).hostname))&&e.originalId&&/^[a-f0-9]{64}$/.test(e.documentHash||'');});
 const sets=[];
 for(const e of usable){let group=new Set([e.canonicalSourceId,...(e.derivedFrom||[]),'hash:'+e.documentHash]);
  for(let i=sets.length-1;i>=0;i--)if([...group].some(k=>sets[i].has(k))){group=new Set([...group,...sets[i]]);sets.splice(i,1);}sets.push(group);
 }return {independent:sets.length,usable};
}
export function evaluate(c,policy=POLICY){
 const blocked=[],fatal=[],flags={},evidence=Array.isArray(c.evidence)?c.evidence:[],cons=consensus(evidence,policy),target=c.target||{},x=c.content||{},text=x.text||'',tr=c.translation;
 const check=(name,pass,reason=name)=>{flags[name]=!!pass;if(!pass)blocked.push(reason);return !!pass;};
 const isType=['example','collocation','polysemy'].includes(c.type);
 if(!isType||validate({...c,reviewStatus:'candidate'}).length||c.evidence&&!Array.isArray(c.evidence))fatal.push('schema');
 check('sourceTraceable',evidence.length>0&&evidence.every(e=>e.sourceId&&e.originalId&&e.sourceVersion&&Number.isFinite(Date.parse(e.fetchedAt))&&safeUrl(e.sourceUrl)));
 if(evidence.some(e=>e.rawNode))check('sourceNodeIntegrity',evidence.every(e=>!e.rawNode||hash(e.rawNode)===e.documentHash),'source_node_hash_conflict');
 check('licenseApproval',cons.usable.length>0,'license_blocked');
 check('sourceAccess',c.sourceAccess!=='unavailable','source_unavailable');
 const primary=cons.usable[0],authority=primary?policy.sources[primary.sourceId]?.authority||0:0;
 // Alignment proof must point at an admitted source record, not an AI boolean.
 const p=c.alignment||{},proof=cons.usable.find(e=>e.originalId===p.originalId&&e.sourceId===p.sourceId);
 const exactHeadword=p.headword===target.headword&&!!target.headword;
 check('headword',exactHeadword,'headword_alignment_missing');
 check('pos',!!target.pos&&p.pos===target.pos,'pos_alignment_missing');
 if(p.pos&&target.pos&&p.pos!==target.pos)fatal.push('POS_mismatch');
 if(p.headword&&target.headword&&p.headword!==target.headword)fatal.push('headword_pollution');
 const aligned=!!proof&&p.method==='source-exact-sense'&&p.lexicalEntryId===c.lexicalEntryId&&p.senseId===c.senseId&&!!p.externalSenseId;
 const lane=policy.singleSenseFastLane,facts=lane?.entries?.[c.lexicalEntryId];
 const singleSenseStructuralMatch=c.type==='example'&&c.sourceId==='Tatoeba'&&!!proof&&facts?.entryApproved===true&&facts.validSenseCount===1&&facts.senseIds[0]===c.senseId&&facts.homographSafe===true&&facts.sameHeadwordPOSLexicalEntries===1&&facts.headword===target.headword&&facts.pos===target.pos&&c.morphology?.lemma===target.headword&&c.morphology?.lemmaMatch===true&&c.morphology?.posMatch===true&&!p.conflicts?.length;
 const wsd=policy.wsd,semantic=c.wsd;
 const multiSenseWSDMatch=c.type==='example'&&facts?.validSenseCount>1&&facts.homographSafe===true&&!!proof&&wsd?.calibrated===true&&wsd.validation?.sameWordHardNegativeCount>0&&wsd.validation?.testPassed===true&&semantic?.modelRevision===wsd.modelRevision&&semantic?.topSenseId===c.senseId&&Number.isFinite(semantic.topSenseScore)&&Number.isFinite(semantic.margin)&&semantic.topSenseScore>=wsd.semanticThreshold&&semantic.margin>=wsd.marginThreshold&&Number.isFinite(semantic.crossLingualScore)&&semantic.structuralScore===1&&c.morphology?.lemma===target.headword&&c.morphology?.posMatch===true&&!p.conflicts?.length;
 const sourceAligned=aligned||!!proof&&p.method==='source-tier-B'&&p.tier==='B'&&p.qualified===true&&p.senseAlignmentScore>=.9||singleSenseStructuralMatch||multiSenseWSDMatch;
 check('alignment',sourceAligned,'exact_sense_alignment_missing');
 if(lane&&c.type==='example')check('duplicate',c.duplicateCheck?.datasetHash===lane.datasetHash&&c.duplicateCheck?.passed===true,'duplicate_or_check_missing');
 if(p.conflicts?.length)check('structuredConflicts',false,'structured_alignment_conflict');
 if(c.morphology?.posConflict)check('kiwiPOS',false,'kiwi_POS_conflict');
 const extras={};
 if(c.type==='example'){
  const tokens=text.split(/[\s\p{P}]+/u),forms=[target.headword,...(p.lemmaForms||[])].filter(Boolean);
  const morphMatch=c.morphology?.lemma===target.headword&&c.morphology?.lemmaMatch===true&&c.morphology?.posMatch===true&&c.morphology?.modelVersion?.startsWith('kiwipiepy-');
  check('targetOccurs',morphMatch||!c.morphology&&forms.some(f=>tokens.includes(f)),'target_token_or_lemma_unproven');
  check('koreanLanguage',/[가-힣]/.test(text)&&((text.match(/[가-힣]/g)||[]).length/Math.max(1,text.replace(/\s/g,'').length)>.5));
  check('sentenceLength',text.length>=8&&text.length<=240&&tokens.filter(Boolean).length>=3);
  const fake=x.kind==='definition'||x.kind==='gloss'||/(?:는|은|인) (?:것|사람|학교|사고|말|일|상태)\.$/.test(text)||norm(text)===norm(target.definitionKo)&&!!text;
  if(fake)fatal.push('fake_example');
  if(tr?.text&&[target.gloss,target.definitionZh].filter(Boolean).some(g=>norm(g)===norm(tr.text)))fatal.push('translation_gloss_fallback');
  check('realExamples',realExamples({gloss:target.gloss,definitionZh:target.definitionZh,examples:[{ko:text,zh:tr?.text,source:x.kind||c.sourceId}]}).length===1);
  const link=tr?.linkEvidence;
  extras.translation=check('translation',tr?.language==='cmn'&&/[\p{Script=Han}]/u.test(tr.text||'')&&link?.type==='direct'&&link.from===c.originalId&&link.to===tr.originalId&&cons.usable.some(e=>e.originalId===link.originalId&&e.documentHash===link.documentHash)&&tr.licenseApproval===true,'direct_zh_translation_unproven');
  if(c.sourceId==='Tatoeba'){
   const koNode=evidence.find(e=>e.originalId===c.originalId)?.rawNode,zhNode=evidence.find(e=>e.originalId===tr?.originalId)?.rawNode,linkNode=evidence.find(e=>e.originalId===link?.originalId)?.rawNode;
   check('sourceTextExact',Array.isArray(koNode)&&koNode[0]===c.originalId&&koNode[1]==='kor'&&koNode[2]===text&&Array.isArray(zhNode)&&zhNode[0]===tr?.originalId&&zhNode[1]==='cmn'&&zhNode[2]===tr?.text,'source_text_conflict');
   check('sourceLinkExact',Array.isArray(linkNode)&&linkNode[0]===c.originalId&&linkNode[1]===tr?.originalId,'source_link_conflict');
   check('attributionComplete',!!c.content.author&&!!tr?.author,'attribution_missing');
  }
  extras.structure=flags.koreanLanguage&&flags.sentenceLength&&flags.realExamples&&flags.targetOccurs;
 }else if(c.type==='collocation'){
  if(tr?.text&&[target.gloss,target.definitionZh,target.headwordGloss].filter(Boolean).some(g=>norm(g)===norm(tr.text)))fatal.push('collocation_gloss_fallback');
  const dictionary=!!proof&&p.phrase===text&&p.nodeType==='collocation';
  const corpus=x.corpus||{},df=new Set(corpus.documentHashes||[]),stats=policy.corpus;
  const mined=df.size>=stats.minimumDocuments&&[...df].every(h=>/^[a-f0-9]{64}$/.test(h))&&corpus.documentFrequency===df.size&&(corpus.pmi>=stats.pmi||corpus.logDice>=stats.logDice)&&corpus.patternVersion&&corpus.patternMatched===true&&cons.usable.some(e=>e.documentHash===corpus.inputHash);
  check('notSentence',!/[.!?。？！]$/.test(text)&&text.split(/\s+/).length<=6,'complete_sentence_not_phrase');
  if(/[.!?。？！]$/.test(text))fatal.push('complete_sentence_not_phrase');
  extras.phrase=check('phrase',flags.notSentence&&(dictionary||mined),'dictionary_phrase_or_corpus_statistics_missing');
  // Missing/MT-only Chinese is dropped, not filled from headword/sense gloss.
  flags.phraseChinese=!!tr?.text&&tr.method==='source-phrase'&&tr.licenseApproval===true&&cons.usable.some(e=>e.originalId===tr.originalId&&e.documentHash===tr.documentHash);
 }else if(c.type==='polysemy'){
  const glosses=(target.groups||[]).map(g=>norm(g.gloss));
  const fresh=norm(x.glossZh||x.gloss||'');
  const similarity=(a,b)=>{const grams=s=>new Set([...s].slice(0,-1).map((_,i)=>s.slice(i,i+2))),aa=grams(a),bb=grams(b);return aa.size+bb.size?2*[...aa].filter(v=>bb.has(v)).length/(aa.size+bb.size):a===b?1:0;};
  if(fresh&&glosses.includes(fresh))fatal.push('duplicate_sense');
  const near=fresh&&glosses.some(g=>similarity(g,fresh)>=.8);
  if(near&&!fatal.includes('duplicate_sense'))blocked.push('near_duplicate_sense');
  if(p.affix)fatal.push('affix');
  check('homographResolved',p.etymologyResolved===true,'polysemy_conflict');
  // Cross-language semantic similarity is not approximated by sense counts.
  extras.novelty=check('novelty',!!fresh&&/[\p{Script=Han}]/u.test(fresh)&&!near&&p.noveltyMethod==='source-sense-id-diff'&&!!proof&&Array.isArray(p.existingExternalSenseIds)&&!p.existingExternalSenseIds.includes(p.externalSenseId),'novel_sense_unproven');
  check('polysemyAuthority',cons.usable.some(e=>policy.sources[e.sourceId]?.kind==='krdict')||cons.independent>=2,'single_source_polysemy');
 }
 const values={authority,headword:flags.headword?1:0,pos:flags.pos?1:0,alignment:sourceAligned?1:0,consensus:Math.min(cons.independent/2,1),...extras};
 const breakdown=Object.fromEntries(Object.entries(WEIGHTS[c.type]||{}).map(([k,w])=>[k,{weight:w,value:Number(values[k]||0),contribution:Number((w*Number(values[k]||0)).toFixed(6))}]));
 const score=Number(Object.values(breakdown).reduce((s,v)=>s+v.contribution,0).toFixed(6));
 check('calibrated',policy.calibrated===true||singleSenseStructuralMatch&&lane?.validation?.status==='passed'&&!!lane.validation.protocolHash||multiSenseWSDMatch,'threshold_uncalibrated');
 const status=fatal.length?'auto_rejected':!blocked.length&&score>=policy.high[c.type]?'auto_verified':'quarantine';
 if(!fatal.length&&score<policy.high[c.type])blocked.push('below_provisional_high');
 return {...c,singleSenseStructuralMatch,calibrationMode:singleSenseStructuralMatch?'deterministic-structural-contract':'numeric-threshold',reviewStatus:status,verificationStatus:status,score,confidence:score,scoreVersion:policy.version+'/'+c.type,scoreBreakdown:breakdown,evidence,sourceCoverage:{observed:new Set(evidence.map(e=>e.canonicalSourceId||e.sourceId)).size,admittedIndependent:cons.independent},validationFlags:flags,reasons:[...new Set([...fatal,...blocked])],policyHash:hash(policy),inputHash:hash(c),translation:c.type==='collocation'&&!flags.phraseChinese?null:tr};
}
// No writer: fresh validation against production state yields a release plan only.
export function publicationGate(candidates,policy,context){
 const output=[],plan=[],ids=new Set(),contentKeys=new Set(context.existingContentKeys||[]),counts=new Map();
 const duplicateIds=new Set(candidates.filter((c,i)=>candidates.findIndex(x=>x.candidateId===c.candidateId)!==i).map(c=>c.candidateId));
 for(const original of [...candidates].sort((a,b)=>(context.selectionRank?.[a.candidateId]??Infinity)-(context.selectionRank?.[b.candidateId]??Infinity)||(b.score||0)-(a.score||0)||a.candidateId.localeCompare(b.candidateId))){
  const c=evaluate(original,policy),reasons=[];
  if(original.verificationStatus!=='auto_verified')reasons.push('not_auto_verified');
  if(original.policyHash!==hash(policy))reasons.push('stale_policy');
  if(context.blockingQualityAudit!==0)reasons.push('blocking_quality_audit');
  if(context.currentDatasetHash!==context.expectedDatasetHash)reasons.push('stale_dataset');
  const entry=context.entries?.find(e=>e.lexicalEntryId===c.lexicalEntryId),sense=entry?.senses?.find(s=>s.senseId===c.senseId);
  if(!entry||entry.headword!==c.target?.headword||entry.partOfSpeech!==c.target?.pos||c.type!=='polysemy'&&!sense)reasons.push('production_target_mismatch');
  if(c.singleSenseStructuralMatch&&hash(entry)!==policy.singleSenseFastLane?.entries?.[c.lexicalEntryId]?.entryHash)reasons.push('stale_single_sense_entry');
  if(c.type==='polysemy')reasons.push('polysemy_semantic_adapter_pending');
  if(sense&&c.target.gloss!==sense.glossZh)reasons.push('stale_sense');
  if(duplicateIds.has(c.candidateId))reasons.push('duplicate_id');ids.add(c.candidateId);
  const k=[c.lexicalEntryId,c.senseId,c.type,norm(c.content?.text||c.content?.glossZh)].join('|');
  if(norm(c.content?.text||c.content?.glossZh)&&contentKeys.has(k))reasons.push('duplicate_content');
  const scope=c.senseId+'|'+c.type;
  if(c.type==='example'&&(counts.get(scope)||0)+(sense?.examples?.length||0)>=2)reasons.push('example_cap');
  if(c.verificationStatus==='auto_verified'&&!reasons.length){contentKeys.add(k);counts.set(scope,(counts.get(scope)||0)+1);plan.push({candidateId:c.candidateId,type:c.type,lexicalEntryId:c.lexicalEntryId,senseId:c.senseId,content:c.content,translation:c.translation,evidence:c.evidence});}
  const finalStatus=reasons.some(r=>['duplicate_id','duplicate_content'].includes(r))?'auto_rejected':reasons.length&&c.verificationStatus!=='auto_rejected'?'quarantine':c.verificationStatus;
  output.push({...c,verificationStatus:finalStatus,reviewStatus:finalStatus,gateReasons:reasons});
 }return {mode:'dry-run',published:0,plan,candidates:output};
}
export function reevaluate(c,previous,policy=POLICY){const next=evaluate(c,policy);const before=new Set((previous?.evidence||[]).map(hash)),after=new Set(next.evidence.map(hash));return {...next,reevaluation:{previousScore:previous?.score??null,newScore:next.score,scoreVersion:next.scoreVersion,changedEvidence:hash(previous?.evidence||[])!==hash(next.evidence),addedEvidence:[...after].filter(x=>!before.has(x)),removedEvidence:[...before].filter(x=>!after.has(x)),previousPolicyHash:previous?.policyHash||null,newPolicyHash:hash(policy)}};}
