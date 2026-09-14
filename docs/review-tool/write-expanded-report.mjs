import fs from 'node:fs/promises';
const read=async p=>JSON.parse(await fs.readFile(new URL(p,import.meta.url),'utf8'));
const full=await read('./expanded-report.json'),wsd=await read('./multi-wsd-report.json'),pub=await read('./publication-report.json');
const pct=x=>x===null?'不可计算':(100*x).toFixed(1)+'%';
const md=`# Example expansion / WSD / publication dry-run

## 边界
未改 production vocabulary、D2、schedule、groupSenses 或学习流程；writer 默认关闭，没有生产写入。现有 .92 example 阈值、realExamples 和 8–240 字符/至少 3 个空白分词阈值保持原样。

## A. 全量单义 fast lane
真实全量扫描：eligible **${full.singleSenseTotal}**；Tatoeba 匹配候选 **${full.tatoebaMatched}**（覆盖 ${full.matchedSenseCount} 个 sense）；完整闸门与去重后、容量截断前 **${full.structurePassed}**；auto_verified **${full.autoVerified}**，覆盖 **${full.coveredSenseCount}** 个 sense；quarantine **${full.quarantine}**，auto_rejected **${full.autoRejected}**。

auto_verified 是候选状态，不等于 releaseReady；全量新增候选尚未通过独立 production publication gate。每个 sense 本轮最多保留 2 条；最终 gate 还会计算旧例句占用。不以固定样本比例外推。

| 等级 | eligible | 匹配候选 | auto_verified | 覆盖 sense |
|---|---:|---:|---:|---:|
${Object.entries(full.byLevel).map(([l,v])=>`| ${l} | ${v.singleSenseTotal} | ${v.tatoebaMatched} | ${v.autoVerified} | ${v.coveredSenseCount} |`).join('\n')}

分层按词条实际 levels 归属，多等级词条可能重复计数；总计使用去重词条/sense。

阻断原因（同一候选可计多个原因）：${full.blockedByReason.map(([k,v])=>`${k}: ${v}`).join('；')}。

## B. 真实同词 WSD
18 词、57 组；记录 **${wsd.stats.n}**，其中旧生产标签 **${wsd.stats.labeledLegacy}**，其余为 Tatoeba direct pair 未标注候选。所有干扰项来自相同 headword 的其他 senseGroups。

BGE-M3 revision ${wsd.revision}，本地 CPU、normalized dense、max length 256；固定模型，不微调。按 headword 哈希拆分 train/calibration/test，不跨 split。Top1/Top2 仅对旧标签进行诊断，不把模型预测写成真值。

| split | 总记录 | 旧标签 | Top1 诊断 | Top2 诊断 |
|---|---:|---:|---:|---:|
${Object.entries(wsd.bySplit).map(([k,v])=>`| ${k} | ${v.n} | ${v.labeledLegacy} | ${pct(v.top1LegacyDiagnostic)} | ${pct(v.top2LegacyDiagnostic)} |`).join('\n')}

整体旧标签 Top1 **${pct(wsd.stats.top1LegacyDiagnostic)}**，Top2 **${pct(wsd.stats.top2LegacyDiagnostic)}**；margin min/median/max：${JSON.stringify(wsd.stats.margin)}。完整 confusion matrix、per-headword errors、每句所有 sense score 见 multi-wsd-report.json。

**不够校准发布 gate**：57 条旧标签的来源均为 legacy-bundle，缺原始例句/义项证据。Tatoeba 证明真实译链，但不能单独证明对应哪个同词义项。因此本轮 calibrationEligible=0、multi auto_verified=0；.80/.12 仅保留前轮 provisional 概念，没有启用或降低。需要按 headword 分离、覆盖同词易混义项的可追溯 source/sense 对齐真实句子。不能用这 424 条候选的模型预测自证准确率。

## C. 旧 36 条 publication gate
**releaseReady ${pub.releaseReady} / blocked ${pub.blocked}**；原因：${JSON.stringify(pub.blockReason)}。

静态 source registry 重新绑定许可；检查作者与源节点一致、韩中句子及译链 hash、目标 ID、词条和数据集漂移、重复、容量、realExamples、schema、headword 不变性、完整词库质量审核与投影审核。容量保守计入现有全部例句槽位，不删除旧例句来腾位置。

原 36 条混合批次不能整体写入；从 gate 结果自动生成的 ${pub.readySubset.releaseReady} 条可发布子集 dry-run：blocked=${pub.readySubset.blocked}，quality audit passed=${pub.readySubset.auditPassed}。production writer 实际未调用启用模式。

安全事务原型：默认 disabled；未来需 enabled=true + 明确 releaseId；锁、备份、临时文件、质量审计、计数/hash、漂移复查、原子替换、写后审计、失败回滚。临时目录中已验证成功写入和故障回滚；不等于已在生产环境发布。manifest 包含 releaseId/sourceDatasetHash/previousVocabularyHash/newVocabularyHash/addedExampleIds/timestamp/scoreVersion，另记录字节文件 hash。

## 句长审计（规则未改）
| 韩文 | 中文 | 字符 | 空白/标点 token |
|---|---|---:|---:|
${pub.lengthAudit.map(r=>`| ${r.ko} | ${r.zh} | ${r.characters} | ${r.tokens} |`).join('\n')}

这 4 条都满足字符长度但仅 2 个 token，触发最少 3 token。空白分词对韩语较机械，不等于 Kiwi 形态素数量；本轮不据此放宽，需另行用全量长度分布及来源验证集评估。

## 可复跑入口
- prepare-expanded.mjs：只生成范围和旧 36 条快照（重新运行会覆盖快照，需先归档）。
- unblock_sources.py tatoeba --targets docs/review-tool/expanded-scope.json --output tatoeba-expanded-index.json：官方导出；可用 --exports 接本地压缩包。unavailable 不是零覆盖。
- run-expanded.mjs：全库单义候选 dry-run。
- multi-wsd.py：离线缓存 BGE-M3，同词 WSD 诊断。
- run-publication.mjs：旧候选 gate + 禁用 writer 检查。
- publication.test.mjs：隔离临时目录中的事务与污染/漂移回归测试。
- corpus-interface.mjs：未来许可自然语料接口，复用 Kiwi batch；不允许 Chatbot 数据成为正式来源，也不生成中文 fallback。
`;
await fs.writeFile(new URL('./EXPANDED-DRY-RUN-REPORT.md',import.meta.url),md);
