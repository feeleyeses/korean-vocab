import fs from 'node:fs/promises';
const read=async p=>JSON.parse(await fs.readFile(new URL(p,import.meta.url),'utf8'));
const r=await read('./readiness-report.json'),a=r.attribution,l=r.lowScores,t=r.releaseA.transaction;
const doc=`# Single-Sense Production Readiness

## 结论
冻结的 **1817** 条 auto_verified 完整最终 dry-run：**${r.releaseReadyTotal}** 条 releaseReady，覆盖 **${r.coveredSenseCount}** sense；**${r.blockedTotal}** 条正常容量淘汰，最终候选集中真正质量阻断 **0**。
本次未发布，production 字节 hash 保持 \`${t.productionOriginalHash}\`。D2、schedule、groupSenses、学习流程未改；WSD/搭配/急救包/后端暂停。

| TOPIK | releaseReady / sense | Release A |
|---|---:|---:|
${Object.entries(r.byLevel).map(([k,v])=>`| ${k} | ${v.examples} | ${r.releaseA.byLevel[k].examples} |`).join('\n')}

## Gate 与容量策略
检查静态 source registry、署名与 source raw node 一致、KO/ZH/link hash、direct translation、目标 ID、entryHash/datasetHash、Kiwi、realExamples、gloss fallback、重复和容量、schema、词头不变性、完整词库质量审计及投影审计。Kiwi 对 1817 条重新执行：${r.morphologyReplay.mismatches} 漂移。
排序为版本化字典序：来源/许可 → direct pair → lemma/POS → 单义结构 → 完整谓词 → 适中长度 → 与旧句字符集合差异 → 署名完整。语境多样性目前是透明的字符重叠 proxy，不宣称语义质量概率。
容量来源：${JSON.stringify(r.capacityOrigin)}。637 条是剩余槽位被更高排序的新例句占用；没有删除、替换旧例句，也没有凭新来源就生成 replacement。

## 四类原因分离
下表针对原全量 5986 候选中的 4169 条非 auto_verified 记录，不应与最终 1817 gate 混淆。重叠计数表示同一候选有多个原因；互斥主因按 metadata → 独立质量 → 句长 → 容量/去重分配。短句导致的低分不再次作为独立质量原因。

| 类别 | 重叠数量 | 互斥主因 |
|---|---:|---:|
${['expectedSelection','recoverableMetadata','qualityUncertainty','ruleDesign'].map(k=>`| ${k} | ${r.fullCandidateCategories.overlapping[k]||0} | ${r.fullCandidateCategories.exclusive[k]||0} |`).join('\n')}

最终 1817 gate：expected selection=637，metadata/quality/rule-design blocking=0。

## 句长审计
扫描 5986 个候选-释义记录、${r.sentenceRule.uniqueSentenceCount} 个唯一韩文 sentence ID。每行保留字符、空白 token、原 gate token、Kiwi 总/词汇形态素、标点、谓词、其他 gate 结果。唯一句子的“其他 gate 通过”表示至少一个匹配目标通过。

| 空白 tokens | 候选数 | 其他 gate 通过 | 完整谓词 proxy | A | B N=6 | C N=3 | D |
|---|---:|---:|---:|---:|---:|---:|---:|
${Object.entries(r.sentenceRule.byWhitespace).map(([k,v])=>`| ${k} | ${v.count} | ${v.otherGatesPassed} | ${v.completePredicate} | ${v.ruleA} | ${v.ruleB[6]} | ${v.ruleC[3]} | ${v.ruleD} |`).join('\n')}

A：原 8–240 字符 + 至少 3 空白/标点分词；B：字符范围 + 总形态素 N（扫描 4/6/8）；C：字符范围 + 词汇形态素 N（2/3/4）；D：字符范围 + 谓词/终结词尾/非词汇尾部 + 至少 2 词汇形态素。
**不替换旧规则**。D 比空白计数更贴近韩语结构，但形态标签不保证自然完整；D 可新增通过其他 gate 的 266 条，同时 A 中 70 条未满足完整谓词 proxy。没有独立真值证明可安全放宽，故 B/C/D 仅分析。Release A 额外要求完整谓词和 12–80 字符，不救回旧隔离句。

## Attribution 417 专项
resolvedAttribution=${a.resolvedAttribution}，stillBlocked=${a.stillBlocked}。全部韩文 raw export 的 Username 为缺失值；ingest 漏字段=0，metadata 关联失败=0，已有逐句匿名/CC0 许可证明=0。中文端不缺。
[Tatoeba 下载说明](https://tatoeba.org/en/downloads) 指出详细导出提供 owner 字段，混合文本导出使用 CC BY 2.0 FR，另有独立 CC0 数据；不能据此把缺 owner 的记录全部视作 CC0。[官方快速说明](https://en.wiki.tatoeba.org/articles/show/quick-start) 解释 orphan 是无 owner，而不是许可豁免。
因此保留缺值，不凭 Tatoeba 品牌、翻译者或相邻句推断作者。来源许可未能逐句证明时继续阻断，并非认定这些句子绝对不可用。具名记录保留导出提供的 contributor、双侧 ID/URL、版本、许可链接；不得把 owner 字段描述为已证明原创作者。
Release A 的独立署名文件为 RELEASE-A-ATTRIBUTION.md，未来必须随发布包提供。

## 886 条低分
| 分数区间 | 数量 |
|---|---:|
${Object.entries(l.bands).map(([k,v])=>`| ${k} | ${v} |`).join('\n')}

886 条都扣了 structure 分；其中 322 条还存在 POS/义项结构扣分。句长相关 589 条、韩文比例 10 条等可重叠。来源 authority 与单源 consensus 是恒定项，并非新出现的独立失败原因。
**仅因分数被阻断=0；已通过完整 deterministic contract 却被低分否决=0。** 1817 条是 deterministic verified；semantic-score verified=0。0.92 阈值不变，不添加分数豁免。

## Release A 与隔离事务
Release A **150 条 / 150 sense**，来源/署名/译链完整，无 replacement；未按等级强行凑配额，按排名自然覆盖 T1–T6。
Manifest 包含 candidateIds/senseIds/sourceIds/sourceRecords/previousVocabularyHash/expectedNewHash/scoreVersion/datasetHash/releaseId。
隔离完整生产副本：备份 → 临时写入 → 完整 quality/schema/ID duplicate/example 审计 → count/hash → 原子替换 → 写后审计；再注入写后审计失败，验证逐字节 rollback。

- blocking errors：**${t.blockingErrors}**
- 新 warning：**${t.newWarnings}**
- 既有全库 warning：${t.baselineWarnings} → ${t.projectedWarnings}，不是“整库零 warning”
- rollback 与原始字节一致：${t.rollbackByteIdentical}
- production 原始 hash 未变：${t.productionUnchanged}
- writer 默认 disabled：${!t.writerDefaultCheck.written}

**已具备 Release A 的技术发布准备条件，但本轮未授权且未执行真实落库。** 将来实际发布前仍须复核生产 hash，并将署名文件随包提供；不需用户逐条审核。

## 文件与复跑
run-readiness.mjs 仅操作已有候选，生产路径只读；writeRelease enabled=true 只用于 unblock-local/readiness 下的隔离副本。重新运行会生成新的隔离目录。
readiness-gate.json 为逐候选 gate；readiness-sentence-audit.json / readiness-attribution-audit.json / readiness-score-audit.json 为逐条原因；release-a-manifest.json / release-a-plan.json 为发布计划。新事务、分类、署名和句长回归测试在 readiness.test.mjs。
`;
await fs.writeFile(new URL('./SINGLE-SENSE-PRODUCTION-READINESS.md',import.meta.url),doc);
