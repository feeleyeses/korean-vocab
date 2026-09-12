import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {mapVocabulary,senseGroups,realExamples,scopeWords} from '../src/domain.js';
const raw=await readFile('data/vocabulary.json','utf8'), data=JSON.parse(raw), words=mapVocabulary(data);
const rows=words.flatMap(w=>w.senses.map(s=>({w,s})));
const collocations=rows.flatMap(({w,s})=>(s.collocations||[]).map(c=>({w,s,c})));
const missing=x=>x==null||typeof x==='string'&&!x.trim();
const levels=[1,2,3,4,5,6];
const merged=[],over=[],under=[];
const norm=s=>s.normalize('NFKC').replace(/[\s；;、，,\/（）()]/g,'');
for(const w of words){
 const groups=senseGroups(w);
 for(const g of groups.filter(g=>g.senses.length>1)){
  const row={entryId:w.lexicalEntryId,headword:w.headword,gloss:g.gloss,senses:g.senses.map(s=>({id:s.senseId,gloss:s.gloss}))};
  merged.push(row);
  if(new Set(g.senses.map(s=>norm(s.gloss))).size>1)over.push({...row,reason:'合并组内存在不同规范化释义；仅为人工复核候选，不代表错误'});
 }
 for(let i=0;i<groups.length;i++)for(let j=i+1;j<groups.length;j++){
  const a=norm(groups[i].gloss),b=norm(groups[j].gloss);
  if(a===b||Math.min(a.length,b.length)>=2&&(a.includes(b)||b.includes(a)))
   under.push({entryId:w.lexicalEntryId,headword:w.headword,groups:[groups[i].senses.map(s=>s.senseId),groups[j].senses.map(s=>s.senseId)],glosses:[groups[i].gloss,groups[j].gloss],reason:'跨组规范化相等或包含关系；仅字面候选，不能证明语义相同'});
 }
}
const metadata=(items)=>({total:items.length,missingSource:items.filter(x=>missing(x.source)).length,missingVerificationStatus:items.filter(x=>missing(x.verificationStatus)).length,missingAnyVerification:items.filter(x=>missing(x.verificationStatus)&&typeof x.verified!=='boolean').length,verifiedTrue:items.filter(x=>x.verified===true).length});
const audit={
 dataset:'data/vocabulary.json',sha256:createHash('sha256').update(raw).digest('hex'),
 publicationRule:'mapVocabulary: entry.verificationStatus === approved; no additional sense-level filtering',
 entries:words.length,senses:rows.length,excludedEntries:data.entries.length-words.length,
 levels:levels.map(level=>({level,entries:words.filter(w=>w.levels.includes(level)).length,senses:rows.filter(r=>r.s.level===level).length,sprint:scopeWords(words,{levels:[level],route:'sprint',tags:[]}).length,missingCollocationZh:collocations.filter(r=>r.s.level===level&&missing(r.c.zh)).length})),
 polysemyWords:words.filter(w=>senseGroups(w).length>1).length,senseGroups:words.reduce((n,w)=>n+senseGroups(w).length,0),
 polysemySenseGroups:words.filter(w=>senseGroups(w).length>1).reduce((n,w)=>n+senseGroups(w).length,0),
 sensesMissingRealExamples:rows.filter(r=>!realExamples(r.s).length).length,
 collocations:collocations.length,missingCollocationZh:collocations.filter(r=>missing(r.c.zh)).length,
 missingCollocationVerification:collocations.filter(r=>missing(r.c.verificationStatus)&&typeof r.c.verified!=='boolean').length,
 collocationsNotVerified:collocations.filter(r=>r.c.verified!==true&&r.c.verificationStatus!=='approved').length,
 soundRuleEntries:words.filter(w=>w.rules.length).length,
 metadata:{entries:metadata(words),senses:metadata(rows.map(r=>r.s)),examples:metadata(rows.flatMap(r=>r.s.examples||[])),collocations:metadata(collocations.map(r=>r.c)),pronunciation:metadata(words.map(w=>w.pronunciation||{}))},
 fieldGaps:Object.fromEntries(['headword','partOfSpeech','source','verificationStatus'].map(k=>[k,words.filter(w=>missing(w[k])).length])),
 pronunciationGaps:{hangul:words.filter(w=>missing(w.pronunciation?.hangul)).length,romanization:words.filter(w=>missing(w.pronunciation?.romanization)).length,audio:words.filter(w=>missing(w.pronunciation?.audio)).length},
 missingCollocationZhItems:collocations.filter(r=>missing(r.c.zh)).map(({w,s,c})=>({entryId:w.lexicalEntryId,senseId:s.senseId,collocationId:c.collocationId,ko:c.ko,level:s.level})),
 notes:['Counts are stored records, not globally deduplicated phrases.','Entry level coverage is multi-label; missing zh distribution uses sense.level exactly once.','realExamples is the existing UI heuristic, not an independent authenticity certification.','verified=true is existing metadata, not newly verified by this audit.','No per-field source inheritance assumed. Missing metadata is not proof that content is false.','Empty soundRules does not imply an error: many words require no sound change.','Old sprint predicate is not a high-frequency certification.']
};
await mkdir('docs/audits',{recursive:true});
await writeFile('docs/audits/data-baseline.json',JSON.stringify(audit,null,2)+'\n');
await writeFile('docs/audits/polysemy-group-audit.json',JSON.stringify({datasetSha256:audit.sha256,method:'Existing senseGroups unchanged. Candidate detection uses NFKC and punctuation-stripped equality/containment only; no semantic rewriting.',mergedGroups:merged,suspectedOverMerge:over,suspectedUnderMerge:under},null,2)+'\n');
const summary=`# Published 数据基线审计

数据 SHA256：${audit.sha256}

仅统计 approved 词条，保持运行时释义映射；不更改任何数据或分组。

- 总词条：${audit.entries}；总释义：${audit.senses}
- 多义词：${audit.polysemyWords}；全库释义组：${audit.senseGroups}；多义词内释义组：${audit.polysemySenseGroups}
- 缺真实例句的释义：${audit.sensesMissingRealExamples}（使用现有 realExamples 筛选口径，不等于来源已独立认证）
- 搭配记录：${audit.collocations}；缺中文：${audit.missingCollocationZh}；缺验证字段：${audit.missingCollocationVerification}；未标记验证通过：${audit.collocationsNotVerified}
- 有音变规则的词条：${audit.soundRuleEntries}

| 等级 | 词条覆盖 | 释义 | 缺搭配中文 | 旧急救包可用量 |
| --- | ---: | ---: | ---: | ---: |
${audit.levels.map(r=>`| T${r.level} | ${r.entries} | ${r.senses} | ${r.missingCollocationZh} | ${r.sprint} |`).join('\n')}

词条覆盖允许跨级重复；搭配缺口按所属释义级别统计。急救包不是高频认证。

## 来源和验证字段

| 对象 | 总量 | 缺 source | 缺 verificationStatus | 同时缺 verified/status |
| --- | ---: | ---: | ---: | ---: |
${Object.entries(audit.metadata).map(([k,v])=>`| ${k} | ${v.total} | ${v.missingSource} | ${v.missingVerificationStatus} | ${v.missingAnyVerification} |`).join('\n')}

不把父级来源自动算作字段来源；verified 与 verificationStatus 分开统计。完整字段缺口和缺中文记录见 data-baseline.json。

## 多义分组复核

已合并组 ${merged.length}；疑似过度合并 ${over.length}；疑似漏合并 ${under.length}。候选仅依据字面归一化差异或跨组包含关系，不是语义判决。明细见 polysemy-group-audit.json；零候选也不证明没有语义遗漏。队列和 groupSenses 保持原样。

## 后续处理

仅输出缺口，不发布补全。搭配中文必须以后按 phrase-level 真实证据补充；绝不回退到 sense.gloss，无可信中文仍只展示韩文且不加占位文案。分组候选由人工按来源、例句、搭配判断。
`;
await writeFile('docs/audits/data-baseline.md',summary);
console.log(summary);
