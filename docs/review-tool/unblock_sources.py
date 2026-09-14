"""Offline/API source adapters. No production writer, no API keys in artifacts/errors."""
import argparse, bz2, getpass, hashlib, io, json, os, re, subprocess, tarfile, urllib.request, urllib.parse
from pathlib import Path
from datetime import datetime, timezone
from defusedxml import ElementTree as ET
from kiwipiepy import Kiwi
import importlib.metadata

HERE = Path(__file__).resolve().parent
LOCAL = HERE / 'unblock-local'
REGISTRY = json.loads((HERE / 'source-registry.json').read_text(encoding='utf-8'))['sources']
KIWI = None
def digest(data):
    return hashlib.sha256(data if isinstance(data, bytes) else json.dumps(data, ensure_ascii=False, sort_keys=True).encode()).hexdigest()
def save(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
def now(): return datetime.now(timezone.utc).isoformat()
def kiwi():
    global KIWI
    if KIWI is None: KIWI = Kiwi(num_workers=1)
    return KIWI
POS = {'名词':'noun','명사':'noun','NNG':'noun','NNP':'noun','NNB':'noun','의존 명사':'noun','依存名词':'noun',
       '动词':'verb','동사':'verb','VV':'verb','XSV':'verb','形容词':'adj','형용사':'adj','VA':'adj','XSA':'adj',
       '副词':'adv','부사':'adv','MAG':'adv','代词':'pron','대명사':'pron','NP':'pron','수사':'num','数词':'num','NR':'num'}
def morphology(text, headword, pos):
    tokens = kiwi().tokenize(text)
    morphs = [{'surfaceForm':text[t.start:t.start+t.len], 'lemma':t.form+('다' if t.tag.split('-')[0] in ('VV','VA','VX','XSV','XSA') else ''),
               'pos':t.tag, 'form':t.form, 'start':t.start, 'length':t.len} for t in tokens]
    expected = POS.get(pos, pos)
    hits = [m for m in morphs if m['lemma'] == headword]
    # Derivational 공부/NNG + 하/XSV -> 공부하다, with no intervening whitespace.
    for i,m in enumerate(morphs):
        if i and m['pos'] in ('XSV','XSA') and morphs[i-1]['form']+m['lemma']==headword:
            first=morphs[i-1]; span=text[first['start']:m['start']+m['length']]
            if not re.search(r'\s',span): hits.append({**m,'lemma':headword,'surfaceForm':span})
    aligned=[m for m in hits if POS.get(m['pos'].split('-')[0], m['pos'])==expected]
    return {'surfaceForm':[m['surfaceForm'] for m in aligned or hits], 'lemma':headword if hits else None,
            'pos':sorted(set(m['pos'] for m in hits)), 'morphemes':morphs, 'lemmaMatch':bool(hits),
            'posMatch':bool(aligned), 'posConflict':bool(hits) and not aligned,
            'matchConfidence':1.0 if aligned else 0.5 if hits else 0.0,
            'modelVersion':'kiwipiepy-'+importlib.metadata.version('kiwipiepy'),
            'modelDataVersion':importlib.metadata.version('kiwipiepy_model')}

def xml_dict(node):
    if not list(node): return (node.text or '').strip()
    out={}
    for child in node:
        val=xml_dict(child)
        if child.tag in out: out[child.tag]=out[child.tag]+[val] if isinstance(out[child.tag],list) else [out[child.tag],val]
        else: out[child.tag]=val
    return out
def array(x): return x if isinstance(x,list) else [] if x is None else [x]
def parse_krdict(raw, version, fetched_at):
    """Official API search/view JSON/XML. trans_dfn is never an example translation."""
    if raw.lstrip().startswith(b'<'):
        tree=ET.fromstring(raw); obj={tree.tag:xml_dict(tree)}
    else: obj=json.loads(raw)
    if 'error' in obj: raise ValueError('KRDict API error response')
    channel=obj.get('channel',obj)
    if not isinstance(channel,dict) or 'item' not in channel: raise ValueError('Unsupported KRDict response shape')
    records=[]
    for item in array(channel.get('item')):
        info=item.get('word_info',item); code=str(item.get('target_code','')); head=info.get('word','').replace('^',' ')
        if not code or not head: continue
        senses=[]
        for index,s in enumerate(array(info.get('sense_info',info.get('sense'))),1):
            sid=str(s.get('sense_code',s.get('sense_order',index)))
            trans=[t for t in array(s.get('translation')) if isinstance(t,dict) and t.get('trans_lang') in ('중국어','11','Chinese','cmn')]
            examples=[]; phrases=[]
            for j,e in enumerate(array(s.get('example_info'))):
                if not isinstance(e,dict): continue
                kind=e.get('type'); text=e.get('example','')
                base={'originalId':f'{code}:{sid}:example:{j}','text':text,'rawNode':e,'nodeHash':digest(e),'translation':None}
                # Only explicit per-example translations; never reuse sense.translation/trans_dfn.
                et=[t for t in array(e.get('translation')) if isinstance(t,dict) and t.get('trans_lang') in ('중국어','11','Chinese','cmn') and t.get('trans_example')]
                if et: base['translation']={'text':et[0]['trans_example'],'language':'cmn','rawNode':et[0],'nodeHash':digest(et[0])}
                if kind in ('문장','대화','sentence'): examples.append(base)
                elif kind in ('구','phrase','collocation'): phrases.append(base)
            senses.append({'senseId':sid,'senseIdKind':'explicit' if s.get('sense_code') or s.get('sense_order') else 'snapshot-order',
              'definition':s.get('definition',''),'definitionZh':trans[0].get('trans_dfn') if trans else None,
              'glossZh':trans[0].get('trans_word') if trans else None,'examples':examples,'collocations':phrases,'rawNode':s,'nodeHash':digest(s)})
        records.append({'sourceId':'KRDict','headword':head,'partOfSpeech':info.get('pos'),'target_code':code,
          'homographNumber':info.get('sup_no',item.get('sup_no')),'senses':senses,'pronunciation':info.get('pronunciation_info',info.get('pronunciation')),
          'idioms':info.get('subword_info',[]),'sourceUrl':'https://krdict.korean.go.kr/kor/dicSearch/SearchView?ParaWordNo='+code,
          'sourceLicense':REGISTRY['KRDict']['sourceLicense'],'sourceVersion':version,'fetchedAt':fetched_at,
          'rawNode':item,'nodeHash':digest(item),'documentHash':digest(raw)})
    return records

def krdict(args):
    records=[]; errors=[]
    targets=json.loads((HERE.parent/'research-poc/example-poc-report.json').read_text(encoding='utf-8'))['rows']
    allowed={t['headword'] for t in targets}
    allowed.update(t['headword'] for t in json.loads((HERE/'candidates.json').read_text(encoding='utf-8')) for t in [t['content']])
    allowed.update(t['headword'] for t in json.loads((HERE.parent/'research-poc/collocation-poc-report.json').read_text(encoding='utf-8'))['rows'])
    files=list(Path(args.cache).glob('*.xml'))+list(Path(args.cache).glob('*.json')) if args.cache else []
    for file in files:
        try: records.extend(r for r in parse_krdict(file.read_bytes(),digest(file.read_bytes()),now()) if r['headword'] in allowed)
        except Exception as exc: errors.append({'file':file.name,'status':'unavailable','reason':type(exc).__name__})
    if args.online:
        key=getpass.getpass('KRDict key (hidden): ') if args.prompt_key else os.environ.get('KRDICT_API_KEY')
        if not key: errors.append({'status':'unavailable','reason':'missing_rotated_key'})
        else:
            def request(endpoint, params):
                url='https://krdict.korean.go.kr/api/'+endpoint+'?'+urllib.parse.urlencode(params)
                # Native Windows TLS; secret URL sent on stdin, never command line or stderr log.
                if os.name=='nt':
                    res=subprocess.run(['curl.exe','--silent','--show-error','--fail','--max-time','20','--retry','0','--config','-'],input=('url = "'+url+'"\n').encode(),capture_output=True)
                    if res.returncode: raise ConnectionError('native transport unavailable')
                    raw=res.stdout
                else:
                    with urllib.request.urlopen(url,timeout=20) as response: raw=response.read()
                if key.encode() in raw: raise ValueError('credential-bearing response not cached')
                return raw
            failures=0
            for word in sorted(allowed):
                if failures>=1: break # Native-terminal utility: fail once, stop. No retry storm.
                try:
                    params={'key':key,'q':word,'translated':'y','trans_lang':'11','method':'exact','num':'10'}
                    raw=request('search',params)
                    search=parse_krdict(raw,digest(raw),now())
                    for r in search:
                        if r['headword']!=word: continue
                        params.update(q=r['target_code'],method='target_code');params.pop('num',None)
                        detail=request('view',params)
                        parsed=parse_krdict(detail,digest(detail),now());records.extend(x for x in parsed if x['headword']==word)
                        # Response only, not request URL; errors are rejected before caching.
                        out=LOCAL/'krdict-cache';out.mkdir(parents=True,exist_ok=True)
                        (out/(r['target_code']+'.xml')).write_bytes(detail)
                except Exception as exc: failures+=1;errors.append({'status':'unavailable','reason':type(exc).__name__})
    result={'sourceAccess':'available' if records else 'unavailable','records':records,'errors':errors,'candidateCoverage':None if not records else len(records)}
    save(LOCAL/'krdict-records.json',result); print(json.dumps({'KRDict':result['sourceAccess'],'records':len(records),'errors':len(errors)}))

def open_export(url):
    response=urllib.request.urlopen(url,timeout=30)
    return response, response.headers.get('Last-Modified','unknown')
def tatoeba(args):
    rows=json.loads((HERE.parent/'research-poc/example-poc-report.json').read_text(encoding='utf-8'))['rows']
    vocab=json.loads((HERE.parent.parent/'data/vocabulary.json').read_text(encoding='utf-8'))['entries']
    pos={w['headword']:w['partOfSpeech'] for w in vocab}
    targets={r['headword']:pos[r['headword']] for r in rows}
    if getattr(args,'targets',None):
        targets=json.loads(Path(args.targets).read_text(encoding='utf-8'))['targets']
    sentences={}; hits={}; links=[]; sources={}; errors=[]
    base='https://downloads.tatoeba.org/exports/'
    def compressed(name,url):
        if args.exports: result=(open(Path(args.exports)/name,'rb'),digest((Path(args.exports)/name).read_bytes()))
        else: result=open_export(url)
        sources[name]={'url':url,'version':result[1]}
        return result
    try:
        with compressed('kor_sentences_detailed.tsv.bz2',base+'per_language/kor/kor_sentences_detailed.tsv.bz2')[0] as raw:
            for line in io.TextIOWrapper(bz2.BZ2File(raw),encoding='utf-8'):
                parts=line.rstrip('\n').split('\t')
                if len(parts)<4 or parts[1]!='kor': continue
                sid,lang,text,author=parts[:4]
                tokens=kiwi().tokenize(text)
                # Fast shortlist; full derivational matching is tested for 하다 forms as well.
                lemmas={t.form+('다' if t.tag.split('-')[0] in ('VV','VA','VX') else '') for t in tokens}
                possible=[w for w in targets if w in lemmas or w.endswith('하다') and w[:-2] in lemmas]
                matches={}
                for w in possible:
                    values=targets[w] if isinstance(targets[w],list) else [targets[w]]
                    for target_pos in values:
                        key=w+'|'+target_pos if isinstance(targets[w],list) else w
                        matches[key]=morphology(text,w,target_pos)
                matches={w:m for w,m in matches.items() if m['lemmaMatch']}
                if matches:
                    node={'sentenceId':sid,'language':lang,'text':text,'author':None if author=='\\N' else author,'license':REGISTRY['Tatoeba']['sourceLicense'],'translationLinks':[],'rawNode':parts,'nodeHash':digest(parts)}
                    sentences[sid]=node;hits[sid]=matches
        print(json.dumps({'stage':'korean-index','matchedSentences':len(sentences)}),flush=True)
        with compressed('links.tar.bz2',base+'links.tar.bz2')[0] as raw:
            with tarfile.open(fileobj=raw,mode='r|bz2') as archive:
                for member in archive:
                    if not member.isfile(): continue
                    for line in archive.extractfile(member):
                        a,b=line.decode('utf-8').strip().split('\t')[:2]
                        if a in sentences: links.append((a,b))
                        elif b in sentences: links.append((b,a))
        needed={b for a,b in links}
        print(json.dumps({'stage':'direct-links','neededIds':len(needed)}),flush=True)
        with compressed('cmn_sentences_detailed.tsv.bz2',base+'per_language/cmn/cmn_sentences_detailed.tsv.bz2')[0] as raw:
            for line in io.TextIOWrapper(bz2.BZ2File(raw),encoding='utf-8'):
                parts=line.rstrip('\n').split('\t')
                if len(parts)<4 or parts[0] not in needed or parts[1]!='cmn': continue
                sid,lang,text,author=parts[:4]
                sentences[sid]={'sentenceId':sid,'language':lang,'text':text,'author':None if author=='\\N' else author,'license':REGISTRY['Tatoeba']['sourceLicense'],'translationLinks':[],'rawNode':parts,'nodeHash':digest(parts)}
        pairs=[]
        for a,b in sorted(set(links)):
            if b not in sentences or sentences[b]['language']!='cmn': continue
            sentences[a]['translationLinks'].append(b)
            pairs.append({'ko':sentences[a],'zh':sentences[b],'link':{'from':a,'to':b,'type':'direct','rawNode':[a,b],'nodeHash':digest([a,b])},'matches':hits[a]})
        # Persist only direct Korean/Chinese records relevant to the fixed sample.
        kept={sid for p in pairs for sid in [p['ko']['sentenceId'],p['zh']['sentenceId']]}
        result={'sourceAccess':'available','fetchedAt':now(),'sourceVersion':'export-nodes-'+digest(pairs),'sourceManifests':sources,'sourceUrls':[base+'per_language/kor/kor_sentences_detailed.tsv.bz2',base+'links.tar.bz2',base+'per_language/cmn/cmn_sentences_detailed.tsv.bz2'],'sentences':[sentences[s] for s in sorted(kept)],'pairs':pairs,'errors':errors}
    except Exception as exc:
        result={'sourceAccess':'unavailable','candidateCoverage':None,'sentences':[],'pairs':[],'sourceManifests':sources,'errors':[{'reason':type(exc).__name__+': '+str(exc)}]}
    save(LOCAL/getattr(args,'output','tatoeba-index.json'),result); print(json.dumps({'Tatoeba':result['sourceAccess'],'directPairs':len(result['pairs']),'sentences':len(result['sentences'])}),flush=True)

if __name__=='__main__':
    parser=argparse.ArgumentParser();subs=parser.add_subparsers(dest='command',required=True)
    kr=subs.add_parser('krdict');kr.add_argument('--cache');kr.add_argument('--online',action='store_true');kr.add_argument('--prompt-key',action='store_true')
    ta=subs.add_parser('tatoeba');ta.add_argument('--exports');ta.add_argument('--targets');ta.add_argument('--output',default='tatoeba-index.json')
    args=parser.parse_args(); krdict(args) if args.command=='krdict' else tatoeba(args)
