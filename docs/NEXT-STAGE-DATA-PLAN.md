# 下一阶段数据与同步计划

本轮仅规划，不修改词库、评分或 schedule。2026-09-13 当前按词条去重的各级覆盖：T1 596、T2 984、T3 882、T4 520、T5 574、T6 479。一个词条可以覆盖多个等级，不能将六级数量相加视为独立词总量。现有急救包 T1–T6 为 0 / 0 / 0 / 0 / 124 / 29；这些数量不是高频认证。

## P1：全量词库和急救包

1. 固定词库版本，输出各级词条、释义、例句、搭配、音变覆盖和来源缺失报告。现有等级是项目标注，不代表官方词表认证。
2. 以 lexicalEntryId / senseId 对齐来源，先处理同形异义和去重，再建立缺词清单；不得仅因各级数量不均衡便补足到人为目标。
3. 扩充一词多义；例句必须是真实例句并附出处，不能使用 gloss 冒充。搭配须关联释义；音变注明实际读音和规则来源。新增数据先进入人工审核队列。
4. 急救包候选来源优先：TOPIK 官方公开/练习题，其次国立国语院学习词汇及频率资料，最后可靠教材/公开词表交叉验证。采集前核查许可、版本、时间范围和可公开程度；不采集登录后试卷或未公开题。

可核对入口：

- TOPIK 官方站：https://www.topik.go.kr/ （具体公开题文件、题号和使用许可在采集阶段逐份核验；本轮未下载试卷）
- 国立国语院学习用词汇目录：https://www.korean.go.kr/front_eng/down/down_02V.do?etc_seq=71&pageIndex=1
- 国立国语院韩国语基础词典：https://krdict.korean.go.kr/m/kor/help

### 可复核评分设计（提案，尚未生产启用）

分词、词形还原及同形异义人工核对后，保存题目级和文档级证据。重复转载同一题只计一次。先分别统计 TOPIK I / II，再做范围内归一化，避免二级试卷长度压倒初级词。

候选公式：sprintScore = 100 × (0.55 × 官方题频率分 + 0.20 × 国立国语院频率分 + 0.15 × 学习词表重要度分 + 0.10 × 独立资料覆盖分)。

权重是待验证的产品提案，不是既定事实。用留出年份试题检查覆盖率和分级平衡后定版。频率采用去重文档频率和每万词频共同记录；rank 使用版本内百分位。缺来源不是零频率：保留 null，并将证据不足候选设为 pending，不凭模型补分，不静默重归一化缺失权重。词表等级不得直接充当官方 TOPIK 等级。

每个词必须保存：

- lexicalEntryId、TOPIK level 及 levelEvidence
- sources[]：sourceId、URL、标题、版本、许可、获取时间、文件 hash
- evidence[]：题次/题号/页码、词形、上下文定位、tokenCount、documentCount、频率或 rank
- sprintScore、scoreVersion、分项得分、evidenceCoverage、reviewStatus、reviewer、lastVerified

验收：每个发布的急救包词可追溯到证据；T1–T6 覆盖单独报告；零证据词不发布；旧 isSprint 规则仅在新索引审定后替换，并保留版本与回滚能力。

## P2：独立网络语库

网络语不参与正式 TOPIK 或 sprintScore。记录 headword、meaning、register、usageContext、example、source、firstSeen、lastVerified、riskLevel、status，并增加 entryId、来源时间与审核记录。

状态流：draft → verified → published → stale / retired；按过时、粗俗、争议风险安排复核周期。过期内容可以下线，但保留 tombstone 和旧 ID，避免学习记录引用断裂。来源过期或用法变化必须触发复核，不能用模型推测热度。

## P3：用户与多端同步

顺序：Auth → 用户数据模型 → 学习进度同步 → 收藏/设置同步 → 多端冲突处理。UI 和 P1 数据先稳定，再实施。

- 用户隔离：userId 关联 learningRecords、memories、favorites、settings、stats；服务端逐行授权。
- 保留 localStorage：首次迁移前导出原始快照，做 schemaVersion 校验、ID 映射与 dry-run；迁移以 migrationId 保证幂等，不直接清空本地数据。
- 学习记录使用 append-only eventId；同步去重后保持现有 schedule 语义，禁止简单相加 memories。并发复习按服务器序号和原始事件保留审计，重放规则需独立测试。
- 收藏使用显式新增/删除事件与 tombstone；设置按字段版本合并。设备时间不作为唯一冲突依据。
- streak / stats 从去重事件和用户时区推导；离线队列支持重试、游标和失败恢复。
- 导入导出包含 schemaVersion / 数据版本；备份定期自动化并演练恢复，明确保留周期、加密与账户删除流程。

交付门槛：跨设备、离线重放、并发收藏、时区跨日、重复导入、回滚恢复测试全部通过，再开启云同步。
