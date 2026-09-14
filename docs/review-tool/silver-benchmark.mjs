import fs from 'node:fs/promises';
import {evaluate,consensus,hash} from './automation.mjs';
import {realExamples} from '../../src/domain.js';
const input=JSON.parse(await fs.readFile(new URL('./unblock-results.json',import.meta.url),'utf8'));
const {policy}=input;
// Independent structural checks against imported raw nodes, not the model's score/status.
function structuralPair(c){
 const ko=c.evidence.find(e=>e.originalId===c.originalId)?.rawNode,zh=c.evidence.find(e=>e.originalId===c.translation?.originalId)?.rawNode;
 const link=c.evidence.find(e=>e.originalId===c.translation?.linkEvidence?.originalId)?.rawNode;
 return c.sourceId==='Tatoeba'&&Array.isArray(ko)&&Array.isArray(zh)&&Array.isArray(link)&&ko[1]==='kor'&&zh[1]==='cmn'&&ko[2]===c.content.text&&zh[2]===c.translation.text&&link[0]===ko[0]&&link[1]===zh[0]&&c.translation.linkEvidence.type==='direct'&&c.translation.linkEvidence.from===ko[0]&&c.translation.linkEvidence.to===zh[0]&&c.morphology?.lemmaMatch&&c.morphology.posMatch&&c.morphology.lemma===c.target.headword&&!!c.content.author&&!!c.translation.author&&c.content.kind!=='definition'&&realExamples({gloss:c.target.gloss,definitionZh:c.target.definitionZh,examples:[{ko:c.content.text,zh:c.translation.text}]}).length===1;
}
const positives=input.candidates.filter(structuralPair);
const negativeRules={definition:c=>({...c,content:{...c.content,kind:'definition'}}),glossFallback:c=>({...c,translation:{...c.translation,text:c.target.gloss}}),posMismatch:c=>({...c,alignment:{...c.alignment,pos:'definitely-different-POS'}}),wrongHeadword:c=>({...c,alignment:{...c.alignment,headword:'다른단어'}}),disconnectedTranslation:c=>({...c,translation:{...c.translation,linkEvidence:{...c.translation.linkEvidence,to:'disconnected'}}}),homographConflict:c=>({...c,alignment:{...c.alignment,conflicts:['homograph_conflict']}})};
const negatives=[];
for(const c of positives)for(const [name,mutate] of Object.entries(negativeRules)){
 const changed=mutate(c),result=evaluate(changed,policy);
 const flag={definition:'fake_example',glossFallback:'translation_gloss_fallback',posMismatch:'POS_mismatch',wrongHeadword:'headword_pollution',disconnectedTranslation:'direct_zh_translation_unproven',homographConflict:'structured_alignment_conflict'}[name];
 negatives.push({parentCandidateId:c.candidateId,negativeType:name,expectedBlocker:flag,passed:result.reasons.includes(flag),score:result.score,labelOrigin:'deterministic mutation of imported source pair'});
}
const mirrors=positives.map(c=>{const original=consensus(c.evidence,policy).independent,duplicate=consensus([...c.evidence,...c.evidence],policy).independent;return {parentCandidateId:c.candidateId,negativeType:'duplicate-mirror',passed:original===duplicate};});
const goldEligible=positives.filter(c=>c.validationFlags.alignment&&c.validationFlags.licenseApproval);
const report={version:'silver-source-structure-v1',sourceInputHash:hash(input.candidates.map(c=>c.candidateId)),fixedSamples:input.report.fixedSampleCount,
 structuralPositives:positives.length,fullSenseAlignedPositives:goldEligible.length,positiveIds:positives.map(c=>c.candidateId),negativeCount:negatives.length+mirrors.length,negativePasses:[...negatives,...mirrors].filter(n=>n.passed).length,
 precisionProxy:null,precisionScope:'No full-sense silver positives; KO-ZH direct-link validity is not sense-correctness precision.',
 thresholdCalibration:{requestedHigh:policy.high,recommendedHigh:policy.high,lowered:false,activated:false,reason:'Keep current threshold; no full-sense positive holdout, do not use structural positives to certify content accuracy'},
 productionSourceIdPositives:0,productionNote:'Existing KRDICT_EXACT labels without target/sense IDs and raw evidence are not silver positives.',negatives,mirrors};
await fs.writeFile(new URL('./silver-report.json',import.meta.url),JSON.stringify(report,null,2));
console.log(JSON.stringify({structuralPositives:report.structuralPositives,fullSenseAlignedPositives:report.fullSenseAlignedPositives,negativeCount:report.negativeCount,negativePasses:report.negativePasses,precisionProxy:null,thresholdsLowered:false}));
if(report.negativePasses!==report.negativeCount)process.exitCode=1;
