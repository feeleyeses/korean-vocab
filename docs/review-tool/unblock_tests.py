import json, unittest
from unblock_sources import morphology, parse_krdict, save, HERE

CASES=[
 ('나는 학교에 갔다.','가다','动词',True),('나는 집에 가요.','가다','动词',True),('학교에 가서 공부해요.','가다','动词',True),
 ('밥을 먹었어요.','먹다','动词',True),('책을 읽어요.','읽다','动词',True),('어제 영화를 봤어요.','보다','动词',True),
 ('음악을 들어요.','듣다','动词',True),('길을 걸어요.','걷다','动词',True),('친구를 도와요.','돕다','动词',True),
 ('편지를 썼어요.','쓰다','动词',True),('오늘 공부했어요.','공부하다','动词',True),('이 집은 커요.','크다','形容词',True),
 ('학교에 학생들이 있어요.','학교','名词',True),('사람들이 많이 왔어요.','사람','名词',True),('나는 밥을 먹어요.','가다','动词',False),
 ('这是一句中文。','가다','动词',False),('눈이 내려요.','눈','动词',False),('그는 빨리 달려요.','빨리','副词',True),
 ('나는 한국어를 배웠어요.','배우다','动词',True),('날씨가 추워요.','춥다','形容词',True)]

class Checks(unittest.TestCase):
 def test_morphology(self):
  results=[]
  for text,lemma,pos,expected in CASES:
   m=morphology(text,lemma,pos);results.append({'text':text,'headword':lemma,'pos':pos,'expected':expected,'passed':m['posMatch']==expected,'result':m})
  save(HERE/'morphology-report.json',{'kind':'controlled morphology probes, not corpus/silver positives','total':len(results),'passed':sum(r['passed'] for r in results),'rows':results})
  for r in results:
   with self.subTest(text=r['text']): self.assertTrue(r['passed'])
 def test_xml_translation_boundary(self):
  raw='<channel><item><target_code>1</target_code><word_info><word>학교</word><pos>명사</pos><sense_info><definition>교육 기관.</definition><translation><trans_lang>중국어</trans_lang><trans_dfn>学校</trans_dfn></translation><example_info><type>문장</type><example>나는 학교에 갔다.</example></example_info><example_info><type>구</type><example>학교 생활</example></example_info></sense_info></word_info></item></channel>'.encode()
  record=parse_krdict(raw,'fixture','2026-09-13T00:00:00Z')[0]
  self.assertEqual(record['senses'][0]['definitionZh'],'学校')
  self.assertIsNone(record['senses'][0]['examples'][0]['translation'])
  self.assertEqual(len(record['senses'][0]['collocations']),1)
  self.assertEqual(record['senses'][0]['senseIdKind'],'snapshot-order')
 def test_xxe(self):
  with self.assertRaises(Exception): parse_krdict(b'<!DOCTYPE x [<!ENTITY e SYSTEM "file:///secret">]><channel>&e;</channel>','fixture','2026-09-13T00:00:00Z')

if __name__=='__main__': unittest.main()
