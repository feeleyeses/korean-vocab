import {norm} from './automation.mjs';
const POS={'名词':'noun','명사':'noun','动词':'verb','동사':'verb','形容词':'adj','형용사':'adj','副词':'adv','부사':'adv','代词':'pron','대명사':'pron','数词':'num','수사':'num'};
export const canonicalPOS=p=>POS[p]||p;
export function similarity(a,b){a=norm(a);b=norm(b);if(!a||!b)return 0;if(a===b)return 1;const grams=s=>new Set([...s].slice(0,-1).map((_,i)=>s.slice(i,i+2))),x=grams(a),y=grams(b);return x.size+y.size?2*[...x].filter(v=>y.has(v)).length/(x.size+y.size):0;}
// Deterministic lexical/source alignment, not an embedding presented as semantic truth.
export function alignSense(target,record,sense,text,morphology){
 const conflicts=[];
 const headword=record?.headword===target.headword,pos=canonicalPOS(record?.partOfSpeech)===canonicalPOS(target.pos);
 if(record&&!headword)conflicts.push('headword_conflict');
 if(record&&!pos)conflicts.push('dictionary_POS_conflict');
 if(morphology?.posConflict)conflicts.push('kiwi_POS_conflict');
 if(record?.homographNumber!=null&&target.homographNo!=null&&Number(record.homographNumber)!==Number(target.homographNo))conflicts.push('homograph_conflict');
 const exactId=!!target.krdictTargetCode&&String(target.krdictTargetCode)===record?.target_code&&!!target.krdictSenseId&&String(target.krdictSenseId)===sense?.senseId&&sense?.senseIdKind==='explicit';
 const gloss=Math.max(similarity(target.gloss,sense?.glossZh),similarity(target.definitionZh,sense?.definitionZh));
 const context=!!text&&(sense?.examples||[]).some(e=>norm(e.text)===norm(text));
 const unique=!!record&&record.senses.filter(s=>Math.max(similarity(target.gloss,s.glossZh),similarity(target.definitionZh,s.definitionZh))===1).length===1;
 const structured=exactId?1:headword&&pos&&gloss===1&&unique?.9:0;
 const breakdown={structuredMatch:.45*structured,pos:.15*(pos?1:0),glossSimilarity:.2*gloss,contextSimilarity:.1*(context?1:0),sourceAuthority:.1*(record?.sourceId==='KRDict'?1:0)};
 const score=Number(Object.values(breakdown).reduce((a,b)=>a+b,0).toFixed(6));
 const tier=conflicts.length?'conflict':exactId?'A':headword&&pos&&gloss===1&&unique&&context?'B':'C';
 return {tier,senseAlignmentScore:score,scoreVersion:'structured-sense-v1',scoreBreakdown:breakdown,conflicts,
   qualified:!conflicts.length&&(tier==='A'||tier==='B'&&score>=.9),glossSimilarity:gloss,contextSimilarity:Number(context),
   contextMethod:'exact source example node',semanticModel:null};
}
