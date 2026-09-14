"""Local frozen BGE-M3 dense diagnostic; no generated language data and no publishing."""
import os
os.environ.setdefault('HF_HUB_DISABLE_XET','1')
os.environ.setdefault('HF_HUB_ETAG_TIMEOUT','15')
os.environ.setdefault('HF_HUB_DOWNLOAD_TIMEOUT','30')
from pathlib import Path
import json, hashlib, urllib.request
HERE=Path(__file__).resolve().parent
def save(obj): (HERE/'bge-report.json').write_text(json.dumps(obj,ensure_ascii=False,indent=2),encoding='utf-8')
try:
    import torch
    from sentence_transformers import SentenceTransformer
    import importlib.metadata
    torch.set_num_threads(4)
    data=json.loads((HERE/'wsd-input.json').read_text(encoding='utf-8'))
    with urllib.request.urlopen('https://huggingface.co/api/models/BAAI/bge-m3',timeout=20) as r: metadata=json.load(r)
    revision=metadata['sha']
    print(json.dumps({'stage':'load-model','revision':revision}),flush=True)
    model=SentenceTransformer('BAAI/bge-m3',revision=revision,device='cpu',cache_folder=str(HERE/'unblock-local'/'models'),trust_remote_code=False)
    model.max_seq_length=256
    candidates=data['candidates'];textset=set()
    for c in candidates:
        textset.add(c['content']['text']);textset.add(c['translation']['text'])
        for s in c['entryFacts']['senses']: textset.add(s['gloss']+'；'+(s['definition'] or ''))
    texts=sorted(textset)
    vectors=model.encode(texts,batch_size=8,normalize_embeddings=True,show_progress_bar=False)
    vec=dict(zip(texts,vectors));rows=[]
    for c in candidates:
        senses=c['entryFacts']['senses'];zh=c['translation']['text'];ko=c['content']['text']
        scores=sorted([{'senseId':s['senseId'],'score':float(vec[zh]@vec[s['gloss']+'；'+(s['definition'] or '')])} for s in senses],key=lambda r:(-r['score'],r['senseId']))
        # Same-fold other headwords only: diagnostic retrieval negatives, not same-word WSD negatives.
        distractors={s['senseId']:s for d in candidates if d['split']==c['split'] and d['target']['headword']!=c['target']['headword'] for s in d['entryFacts']['senses']}
        negatives=[{'senseId':s['senseId'],'score':float(vec[zh]@vec[s['gloss']+'；'+(s['definition'] or '')])} for s in distractors.values()]
        negativeTop=max([n['score'] for n in negatives],default=None)
        rows.append({'candidateId':c['candidateId'],'split':c['split'],'topSenseId':scores[0]['senseId'],'topSenseScore':scores[0]['score'],'secondSenseScore':scores[1]['score'] if len(scores)>1 else None,'margin':scores[0]['score']-scores[1]['score'] if len(scores)>1 else None,'crossLingualScore':float(vec[ko]@vec[zh]),'structuralScore':float(c['morphology']['lemmaMatch'] and c['morphology']['posMatch']), 'scores':scores,'sameWordHardNegatives':len(scores)-1,'randomOtherGlossTop':negativeTop,'diagnosticMargin':scores[0]['score']-negativeTop if negativeTop is not None else None,'diagnosticTop1Correct':scores[0]['score']>negativeTop if negativeTop is not None else None})
    stats={}
    for split in ('train','calibration','test'):
        rs=[r for r in rows if r['split']==split]
        stats[split]={'n':len(rs),'otherGlossTop1':sum(r['diagnosticTop1Correct'] is True for r in rs)/len(rs) if rs else None,'sameWordHardNegatives':sum(r['sameWordHardNegatives'] for r in rs)}
    save({'status':'available','model':'BAAI/bge-m3','revision':revision,'modelLicense':'MIT','runtime':{k:importlib.metadata.version(k) for k in ['torch','transformers','sentence-transformers']},'inputHash':hashlib.sha256((HERE/'wsd-input.json').read_bytes()).hexdigest(),'device':'cpu','maxSeqLength':256,'normalized':True,'stats':stats,'rows':rows,'semanticThreshold':None,'marginThreshold':None,'calibrated':False,'reason':'Fixed set contains no multi-sense examples; other-gloss retrieval cannot calibrate same-headword WSD.'})
    print(json.dumps({'status':'available','rows':len(rows),'stats':stats}),flush=True)
except Exception as e:
    save({'status':'unavailable','model':'BAAI/bge-m3','metrics':None,'reason':type(e).__name__+': '+str(e)[:500],'calibrated':False})
    print(json.dumps({'status':'unavailable','reason':type(e).__name__}),flush=True)
