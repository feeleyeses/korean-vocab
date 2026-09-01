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
  '쉽다|쉽게 이해하다': '容易理解',
  '시간|시간이 없다': '没有时间',
  '시작하다|일을 시작하다': '开始工作',
  '시장|시장에 가다': '去市场',
  '쓰다|글을 쓰다': '写文章',
  '아버지|아버지와 어머니': '父亲和母亲',
  '아이|작은 아이': '小孩',
  '아침|아침을 먹다': '吃早饭',
  '앉다|자리에 앉다': '坐到座位上',
  '알다|방법을 알다': '知道方法',
  '어디|어디에서 만나다': '在哪里见面',
  '어렵다|이해하기 어렵다': '难以理解',
  '어머니|어머니께 전화하다': '给母亲打电话',
  '어제|어제 저녁': '昨天晚上',
  '언니|친한 언니': '亲近的姐姐',
  '언제|언제부터': '从什么时候开始',
  '여름|여름 휴가': '暑假；夏季休假',
  '열다|문을 열다': '开门',
  '오늘|오늘 아침': '今天早上',
  '오빠|우리 오빠': '我哥哥',
  '오후|오후 세 시': '下午三点',
  '옷이|옷이 예쁘다': '衣服漂亮',
  '월요일|월요일 아침': '星期一早上',
  '의자|의자에 앉다': '坐在椅子上',
  '이름|이름을 쓰다': '写名字',
  '읽다|책을 읽다': '读书',
  '자다|잠을 자다': '睡一觉',
  '작다|크기가 작다': '尺寸小',
  '저녁|저녁을 먹다': '吃晚饭',
  '적다|양이 적다': '量少',
  '좋다|기분이 좋다': '心情好',
  '주말|주말 계획': '周末计划',
  '집|집에 가다': '回家',
  '책상|책상 위': '书桌上',
  '책을|책을 읽다': '读书',
  '친구|친구를 만나다': '见朋友',
  '침대|침대에 눕다': '躺在床上',
  '크다|키가 크다': '个子高',
  '팔다|물건을 팔다': '卖东西',
  '학교|학교에 다니다': '上学',
  '학생|학생이 많다': '学生很多',
  '형|우리 형': '我哥哥',
  '꽃이|꽃이 피다': '花开',
  '끝이|끝이 나다': '结束',
  '도움|도움을 받다': '得到帮助',
  '도착하다|목적지에 도착하다': '到达目的地',
  '돌아오다|집에 돌아오다': '回到家',
  '동네|동네 사람': '街坊；小区居民',
  '두껍다|두꺼운 책': '厚书',
  '들다|가방을 들다': '提包',
  '들다|마음에 들다': '觉得满意；合自己的心意',
  '마감|마감 기한': '截止期限',
  '마을|마을 사람': '村民；社区居民',
  '마음|마음을 정하다': '下定决心',
  '몇 년|몇 년 동안': '几年期间',
  '모임|모임에 참석하다': '参加聚会',
  '무료|무료 서비스': '免费服务',
  '문자|문자를 보내다': '发短信',
  '문제|문제를 풀다': '解题',
  '문화|문화를 배우다': '学习文化',
  '미리|미리 준비하다': '提前准备'
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
