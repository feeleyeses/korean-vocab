import React,{useMemo,useState,useRef} from 'react';
import { ArrowRight,Search,Download,Upload } from 'lucide-react';
import { Button,Chip,Settings,ProgressLevels,WordRow,Pagination,EmptyState } from './components.jsx';
import { scopeWords,wordProgress,reviewModes,reviewQueue,polyQueue } from './domain.js';

export function Home({words,store,settings,setSettings,start,openLibrary}) {
  const count=scopeWords(words,settings).length;
  return <div className="page-stack"><section className="home-intro"><h1>不只记住意思，<br className="desktop-break"/>还要知道什么时候说。</h1><div className="home-actions"><Button variant="primary" onClick={start}>开始学习<ArrowRight size={18}/></Button><Button onClick={openLibrary}>查看已学词库<ArrowRight size={18}/></Button></div></section>
    <ProgressLevels words={words} store={store} onSelect={l=>setSettings(s=>({...s,levels:[l]}))}/>
    <Settings settings={settings} setSettings={setSettings}/><div className="scope-summary">当前范围 {count} 词 · 本范围已学 {scopeWords(words,settings).filter(w=>store.profile.learnedIds.includes(w.id)||w.senses.some(s=>store.memories[s.id])).length}/{count}</div>
  </div>;
}
const defaults={levels:[],route:'full',capacity:12,tags:[]};
export function Library({words,store,compact=false,initialLearned=false,startReview}) {
  const [settings,setSettings]=useState(defaults),[states,setStates]=useState([]),[flags,setFlags]=useState(initialLearned?['learned']:[]),[sort,setSort]=useState('level'),[query,setQuery]=useState(''),[pos,setPos]=useState(''),[page,setPage]=useState(1),[expanded,setExpanded]=useState([]),[selected,setSelected]=useState([]);
  const fileRef=useRef(null);
  const result=useMemo(()=>scopeWords(words,settings).filter(w=>{
    const p=wordProgress(w,store.memories),q=query.trim().toLowerCase();
    return (!q||[w.headword,w.romanization,...w.senses.map(s=>s.gloss)].some(s=>s.toLowerCase().includes(q)))&&(!pos||w.pos===pos)&&
      (!states.length||states.some(s=>s==='pending'?!p.learned:s==='weak'?p.weak:p.mastered===p.total))&&
      flags.every(f=>f==='favorite'?store.favorites.includes(w.id):f==='sound'?w.rules.length>0:f==='due'?w.senses.some(s=>store.memories[s.id]&&Date.parse(store.memories[s.id].dueAt)<=Date.now()):p.learned>0||store.profile.learnedIds.includes(w.id));
  }).sort((a,b)=>sort==='headword'?a.headword.localeCompare(b.headword,'ko'):sort==='progress'?wordProgress(a,store.memories).fraction-wordProgress(b,store.memories).fraction:sort==='weak'?Number(wordProgress(b,store.memories).weak)-Number(wordProgress(a,store.memories).weak):a.levels[0]-b.levels[0]||a.headword.localeCompare(b.headword,'ko')),[words,store.memories,store.favorites,store.profile.learnedIds,settings,states,flags,sort,query,pos]);
  const current=Math.min(page,Math.max(1,Math.ceil(result.length/8)));
  function toggle(value,set){set(s=>s.includes(value)?s.filter(x=>x!==value):[...s,value]);setPage(1);}
  return <div className="page-stack library-page">
    {!compact&&<><div className="page-heading"><h1>词库</h1></div><ProgressLevels words={words} store={store} onSelect={l=>setSettings(s=>({...s,levels:[l]}))}/><Settings library settings={settings} setSettings={s=>{setSettings(s);setPage(1);}}/></>}
    <section className="library-filters"><div className="search-row"><label className="search-input"><Search size={18}/><input type="search" aria-label="搜索词库" placeholder="搜索韩文 / 中文 / 罗马音" value={query} onChange={e=>{setQuery(e.target.value);setPage(1);}}/></label>{!compact&&<select aria-label="词性" value={pos} onChange={e=>setPos(e.target.value)}><option value="">全部词性</option>{[...new Set(words.map(w=>w.pos))].sort().map(p=><option key={p}>{p}</option>)}</select>}</div>
    <div className="filter-grid"><fieldset><legend>状态</legend><div className="chips"><Chip active={!states.length} onClick={()=>setStates([])}>全部</Chip>{[['pending','待学'],['weak','薄弱'],['known','已掌握']].map(([v,l])=><Chip key={v} active={states.includes(v)} onClick={()=>toggle(v,setStates)}>{l}</Chip>)}</div></fieldset><fieldset><legend>排序</legend><div className="chips">{[['level','TOPIK顺序'],['progress','掌握进度'],['headword','韩语排序'],['weak','薄弱优先']].map(([v,l])=><Chip key={v} active={sort===v} onClick={()=>setSort(v)}>{l}</Chip>)}</div></fieldset></div>
    {!compact&&<div className="chips flag-filters">{[['learned','仅已学'],['favorite','收藏'],['sound','音变'],['due','今日到期']].map(([v,l])=><Chip key={v} active={flags.includes(v)} onClick={()=>toggle(v,setFlags)}>{l}</Chip>)}<Button variant="tertiary" onClick={()=>{setSettings(defaults);setFlags([]);setStates([]);setQuery('');setPos('');}}>清除筛选</Button></div>}</section>
    {selected.length>0&&startReview&&<div className="selection-bar"><span>已选 {selected.length} 个词</span><Button onClick={()=>startReview(selected)}>复习所选已学词</Button><Button variant="tertiary" onClick={()=>setSelected([])}>取消选择</Button></div>}
    <div className="word-list">{result.slice((current-1)*8,current*8).map(word=><WordRow key={word.id} word={word} store={store} expanded={expanded.includes(word.id)} onToggle={()=>toggle(word.id,setExpanded)} selected={selected.includes(word.id)} onSelect={!compact?()=>toggle(word.id,setSelected):undefined}/>)}</div>
    {!result.length&&<EmptyState title="没有符合筛选条件的词条" action={<Button onClick={()=>{setSettings(defaults);setFlags([]);setStates([]);setQuery('');setPos('');}}>清除筛选</Button>}/>}
    <Pagination page={current} total={result.length} onPage={setPage}/>
    {!compact&&<section className="profile-tools"><h2>本地学习档案</h2><div className="button-group"><Button onClick={store.exportProfile}><Download size={16}/>导出学习档案</Button><Button onClick={()=>fileRef.current.click()}><Upload size={16}/>导入学习档案</Button><input type="file" accept="application/json,.json" ref={fileRef} hidden onChange={e=>{store.importProfile(e.target.files[0]);e.target.value='';}}/></div></section>}
  </div>;
}
export function ReviewMenu({words,store,startReview,active}) {
  return <div className="review-modes">{reviewModes.map(([mode,label])=>{
    const count=mode.startsWith('poly')?polyQueue(words,store.memories,mode).length:reviewQueue(words,store.memories,mode,store.favorites).length;
    return <Chip key={mode} active={mode===active} onClick={()=>startReview(mode)}>复习·{label}<span>{count}</span></Chip>;
  })}</div>;
}
export function ReviewHome({words,store,startReview,startSound}) {
  const due=reviewQueue(words,store.memories,'due').length;
  return <div className="page-stack"><div className="page-heading"><h1>复习</h1></div><ReviewMenu words={words} store={store} startReview={startReview}/><section className="review-overview"><div><p className="muted">今日到期</p><strong>{due}<small> 个释义</small></strong></div><Button variant="primary" onClick={()=>startReview('due')}>开始今日复习<ArrowRight size={18}/></Button></section><section className="sound-entry"><div><h2>音变专项</h2><p className="muted">实际读音 · 罗马音 · 音变规则</p></div><Button onClick={startSound}>进入音变专项<ArrowRight size={18}/></Button></section></div>;
}
