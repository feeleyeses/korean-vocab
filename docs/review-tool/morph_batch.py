"""JSON stdin/stdout batch; research pipeline only."""
import json, sys
from unblock_sources import morphology
rows=json.load(sys.stdin)
for row in rows:
    target=row.get('target',{})
    text=row.get('content',{}).get('text','')
    if text: row['morphology']=morphology(text,target.get('headword',''),target.get('pos',''))
json.dump(rows,sys.stdout,ensure_ascii=False)
