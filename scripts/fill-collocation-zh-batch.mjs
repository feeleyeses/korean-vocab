import fs from 'node:fs';

const rawPath = process.argv[2] || 'data/vocabulary.raw.json';
const outPath = process.argv[3] || 'artifacts/collocation-zh-editorial-batch-report.json';

const editorialTranslations = new Map(Object.entries({
  '누구|누구와 같이': '和谁一起',
  '누나|우리 누나': '我姐姐',
  '다르다|~와 다르다': '和……不同',
  '다음|다음 시간': '下节课；下次时间',
  '닫다|문을 닫다': '关门',
  '달|이번 달': '这个月',
  '닭|닭을 먹다': '吃鸡肉',
  '도서관|도서관에 가다': '去图书馆',
  '돈|돈을 쓰다': '花钱',
  '동생|동생을 돌보다': '照顾弟弟妹妹',
  '듣다|노래를 듣다': '听歌',
  '따뜻하다|따뜻한 물': '温水',
  '딸|딸과 아들': '女儿和儿子',
  '라디오|라디오 방송': '广播节目',
  '마시다|물을 마시다': '喝水',
  '마음|마음에 들다': '喜欢；合心意',
  '마음|마음이 편하다': '心里舒服',
  '만나다|사람을 만나다': '见人',
  '많다|사람이 많다': '人多',
  '말하다|한국어로 말하다': '用韩语说',
  '맛|맛이 좋다': '味道好',
  '맛있다|맛있는 음식': '好吃的食物',
  '머리|머리가 아프다': '头疼',
  '먹다|밥을 먹다': '吃饭',
  '멀다|거리가 멀다': '距离远',
  '메뉴|메뉴를 보다': '看菜单',
  '모자|모자를 쓰다': '戴帽子',
  '목|목이 아프다': '嗓子疼；脖子疼',
  '몸|몸이 좋지 않다': '身体不舒服',
  '문|문을 열다': '开门',
  '물|물을 마시다': '喝水',
  '바다|바다를 보다': '看海',
  '바지|바지를 입다': '穿裤子',
  '밖|밖에 나가다': '到外面去',
  '반|우리 반': '我们班',
  '밥을|밥을 먹다': '吃饭',
  '방|방을 청소하다': '打扫房间',
  '배|배가 고프다': '肚子饿',
  '배우다|언어를 배우다': '学习语言',
  '별|별을 보다': '看星星',
  '보내다|시간을 보내다': '度过时间',
  '보다|사진을 보다': '看照片',
  '봄|봄이 오다': '春天来了',
  '부모님|부모님과 살다': '和父母一起住',
  '분|십 분': '十分钟',
  '사과|사과를 하다': '道歉',
  '사다|물건을 사다': '买东西',
  '사람|많은 사람': '很多人',
  '사진|사진을 찍다': '拍照',
  '산|산에 오르다': '登山',
  '새|새 신발': '新鞋',
  '색|색이 예쁘다': '颜色漂亮',
  '생각|생각이 나다': '想起来',
  '샤워하다|샤워를 하다': '冲澡；淋浴',
  '서다|줄을 서다': '排队',
  '서점|서점에 가다': '去书店',
  '선물|선물을 주다': '送礼物',
  '선생님|선생님께 묻다': '问老师',
  '쉬다|잠깐 쉬다': '休息一会儿',
  '쉽다|쉽게 이해하다': '容易理解'
}));

const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
const entries = Array.isArray(raw) ? raw : raw.entries;
const updated = [];
const skipped = [];

for (const entry of entries) {
  for (const sense of entry.senses || []) {
    if (!sense.collocation) continue;
    const key = `${entry.headword}|${sense.collocation}`;
    const zh = editorialTranslations.get(key);
    if (!zh) continue;
    sense.collocationZh = zh;
    sense.collocationSource = 'EDITORIAL_REVIEW';
    updated.push({
      id: entry.id || entry.lexicalEntryId,
      headword: entry.headword,
      level: `TOPIK-${Number(String(sense.level || entry.levels?.[0] || entry.level || 1).replace(/[^0-9]/g, '')) || 1}`,
      collocation: sense.collocation,
      collocationZh: zh,
      source: sense.collocationSource
    });
  }
}

for (const [key, zh] of editorialTranslations) {
  if (!updated.some(item => `${item.headword}|${item.collocation}` === key)) {
    skipped.push({ key, zh, reason: 'not found or already translated' });
  }
}

fs.writeFileSync(rawPath, `${JSON.stringify(raw, null, 2)}\n`);
fs.mkdirSync(outPath.replace(/[\\/][^\\/]+$/, ''), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  source: 'EDITORIAL_REVIEW high-confidence TOPIK-1 phrase translations',
  updatedCount: updated.length,
  skippedCount: skipped.length,
  updated,
  skipped
}, null, 2)}\n`);

console.log(JSON.stringify({ updated: updated.length, skipped: skipped.length, outPath }, null, 2));
