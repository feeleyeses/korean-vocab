"""Frozen local model: same-headword alternatives only; legacy labels are not calibration truth."""
import os
os.environ['HF_HUB_OFFLINE']='1'
os.environ['TRANSFORMERS_OFFLINE']='1'
from pathlib import Path
import json,hashlib,subprocess
import torch
from sentence_transformers import SentenceTransformer
HERE=Path(__file__).resolve().parent
REV='5617a9f61b028005a4858fdac845db406aefb181'
scope=json.loads((HERE/'expanded-scope.json').read_text(encoding='utf-8'))
words=scope['multi'];rows=[]
for w in words:
    for g in w['groups']:
        for s in g['senses']:
            for ex in s['examples']:
                rows.append({'id':ex['exampleId'],'headword':w['headword'],'pos':w['pos'],'split':w['split'],'ko':ex['ko'],'zh':ex['zh'],'label':g['groupId'],'source':ex.get('source'),'truthTier':'legacy-unconfirmed','calibrationEligible':False})
index=HERE/'unblock-local/tatoeba-expanded-index.json'
access='unavailable'
if index.exists():
    tat=json.loads(index.read_text(encoding='utf-8'));access=tat['sourceAccess']
    for w in words:
        for p in tat.get('pairs',[]):
            m=p['matches'].get(w['headword']+'|'+w['pos'])
            if m:
                rows.append({'id':w['lexicalEntryId']+':'+p['ko']['sentenceId']+':'+p['zh']['sentenceId'],'headword':w['headword'],'pos':w['pos'],'split':w['split'],'ko':p['ko']['text'],'zh':p['zh']['text'],'label':None,'source':'Tatoeba','truthTier':'unlabeled-direct-pair','calibrationEligible':False,'morphology':m,'sourcePair':p})
torch.set_num_threads(4)
batch=[{'target':{'headword':r['headword'],'pos':r['pos']},'content':{'text':r['ko']}} for r in rows]
proc=subprocess.run([os.environ.get('PIPELINE_PYTHON',str(HERE/'.venv'/('Scripts/python.exe' if os.name=='nt' else 'bin/python'))),str(HERE/'morph_batch.py')],input=json.dumps(batch),capture_output=True,text=True,encoding='utf-8',check=True)
for r,m in zip(rows,json.loads(proc.stdout)):
    r['morphology']=m['morphology']
    r['structuralScore']=int(m['morphology']['lemmaMatch'] and m['morphology']['posMatch'] and not m['morphology']['posConflict'])
print(json.dumps({'stage':'load-local-model','rows':len(rows)}),flush=True)
model=SentenceTransformer(str(HERE/'unblock-local/models/models--BAAI--bge-m3/snapshots'/REV),device='cpu',trust_remote_code=False,local_files_only=True)
model.max_seq_length=256
texts=sorted({r[k] for r in rows for k in ('ko','zh')}|{g['gloss'] for w in words for g in w['groups']})
vectors=model.encode(texts,batch_size=8,normalize_embeddings=True,show_progress_bar=False);vec=dict(zip(texts,vectors))
for r in rows:
    w=next(w for w in words if w['headword']==r['headword'])
    scores=sorted([{'sense':g['groupId'],'gloss':g['gloss'],'score':float(vec[r['zh']]@vec[g['gloss']])} for g in w['groups']],key=lambda v:(-v['score'],v['sense']))
    r.update({'topSense':scores[0]['sense'],'topScore':scores[0]['score'],'secondSense':scores[1]['sense'],'secondScore':scores[1]['score'],'margin':scores[0]['score']-scores[1]['score'],'scores':scores,'crossLingualScore':float(vec[r['ko']]@vec[r['zh']]),'reviewStatus':'quarantine'})
    r['top1']=scores[0]['sense']==r['label'] if r['label'] else None
    r['top2']=r['label'] in [v['sense'] for v in scores[:2]] if r['label'] else None
def stats(rs):
    labeled=[r for r in rs if r['label']];m=sorted(r['margin'] for r in rs)
    return {'n':len(rs),'labeledLegacy':len(labeled),'top1LegacyDiagnostic':sum(r['top1'] for r in labeled)/len(labeled) if labeled else None,'top2LegacyDiagnostic':sum(r['top2'] for r in labeled)/len(labeled) if labeled else None,'margin':{'min':min(m),'median':m[len(m)//2],'max':max(m)} if m else None}
confusion={}
for r in rows:
    if r['label']:
        key=r['label']+' -> '+r['topSense'];confusion[key]=confusion.get(key,0)+1
report={'model':'BAAI/bge-m3','revision':REV,'headwords':len(words),'senseGroups':sum(len(w['groups']) for w in words),'sameHeadwordComparisonCount':sum(len(r['scores'])-1 for r in rows),'stats':stats(rows),'bySplit':{s:stats([r for r in rows if r['split']==s]) for s in ('train','calibration','test')},'perHeadword':{w['headword']:stats([r for r in rows if r['headword']==w['headword']]) for w in words},'confusionMatrixLegacyOnly':confusion,'errors':[{'id':r['id'],'headword':r['headword'],'label':r['label'],'predicted':r['topSense']} for r in rows if r['top1'] is False],'calibrationEligible':0,'calibrated':False,'thresholdActivated':False,'reason':'Existing verified flags are legacy-bundle without independently traceable sense/example nodes. Tatoeba direct pairs lack gold sense IDs; model predictions are not truth. No threshold tuning on these labels.','sourceAccess':access,'autoVerified':0,'rows':rows}
(HERE/'multi-wsd-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k not in ['rows','errors','confusionMatrixLegacyOnly','perHeadword']},ensure_ascii=False),flush=True)
