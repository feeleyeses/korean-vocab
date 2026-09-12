import React,{useMemo,useState,useRef,useEffect} from 'react';
import { ArrowRight,Search,Download,Upload,ChevronDown as ChevronDownIcon,ListFilter,ArrowDownUp,SquareCheckBig,ListChecks,X,CalendarClock,AudioWaveform,Zap,Library as LibraryIcon } from 'lucide-react';
import { Button,Chip,Settings,ProgressLevels,WordRow,Pagination,EmptyState } from './components.jsx';
import {posLabel,posOptions} from './pos-labels.js';
import { levels,tags,scopeWords,wordProgress,reviewModes,reviewQueue,polyQueue,dueStats } from './domain.js';

export {Home} from './Home.jsx';
const defaults={levels:[],route:'full',capacity:12,tags:[]};
export function Library({words,store,compact=false,initialLearned=false,startReview}) {
  const [settings,setSettings]=useState(defaults),[states,setStates]=useState([]),[flags,setFlags]=useState(initialLearned?['learned']:[]),[sort,setSort]=useState('level'),[query,setQuery]=useState(''),[pos,setPos]=useState(''),[page,setPage]=useState(1),[expanded,setExpanded]=useState([]),[selected,setSelected]=useState([]);
  const fileRef=useRef(null),drawerRef=useRef(null),openerRef=useRef(null);
  const [drawer,setDrawer]=useState(false),[draft,setDraft]=useState(null),[multi,setMulti]=useState(false);
  const filterCount=settings.levels.length+settings.tags.length+states.length+flags.length+Number(!!pos)+Number(sort!=='level')+Number(settings.route!=='full');
  function reset(){setSettings(defaults);setStates([]);setFlags([]);setSort('level');setPos('');setQuery('');setPage(1);}
  function openFilters(){setDraft({settings,states,flags,sort,pos});setDrawer(true);}
  useEffect(()=>{if(!drawer)return;const old=document.body.style.overflow;document.body.style.overflow='hidden';drawerRef.current?.focus();
    return ()=>{document.body.style.overflow=old;openerRef.current?.focus();};},[drawer]);
  function closeOnKey(e){if(e.key==='Escape')setDrawer(false);if(e.key==='Tab'){const nodes=[...drawerRef.current.querySelectorAll('button,select,input,[tabindex="0"]')].filter(n=>!n.disabled);const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}
  function applyDraft(){setSettings(draft.settings);setStates(draft.states);setFlags(draft.flags);setSort(draft.sort);setPos(draft.pos);setPage(1);setDrawer(false);}
  function draftToggle(key,value){setDraft(d=>({...d,[key]:d[key].includes(value)?d[key].filter(x=>x!==value):[...d[key],value]}));}

  const result=useMemo(()=>scopeWords(words,settings).filter(w=>{
    const p=wordProgress(w,store.memories),q=query.trim().toLowerCase();
    return (!q||[w.headword,w.romanization,...w.senses.map(s=>s.gloss)].some(s=>s.toLowerCase().includes(q)))&&(!pos||posLabel(w.pos)===pos)&&
      (!states.length||states.some(s=>s==='pending'?!p.learned:s==='weak'?p.weak:p.mastered===p.total))&&
      flags.every(f=>f==='favorite'?store.favorites.includes(w.id):f==='sound'?w.rules.length>0:f==='due'?w.senses.some(s=>store.memories[s.id]&&Date.parse(store.memories[s.id].dueAt)<=Date.now()):p.learned>0||store.profile.learnedIds.includes(w.id));
  }).sort((a,b)=>sort==='headword'?a.headword.localeCompare(b.headword,'ko'):sort==='progress'?wordProgress(a,store.memories).fraction-wordProgress(b,store.memories).fraction:sort==='weak'?Number(wordProgress(b,store.memories).weak)-Number(wordProgress(a,store.memories).weak):a.levels[0]-b.levels[0]||a.headword.localeCompare(b.headword,'ko')),[words,store.memories,store.favorites,store.profile.learnedIds,settings,states,flags,sort,query,pos]);
  const current=Math.min(page,Math.max(1,Math.ceil(result.length/8)));
  function toggle(value,set){set(s=>s.includes(value)?s.filter(x=>x!==value):[...s,value]);setPage(1);}
  return <div className="page-stack library-page">
    {!compact&&<><div className="page-heading"><h1>词库</h1></div><ProgressLevels words={words} store={store} onSelect={l=>setSettings(s=>({...s,levels:[l]}))}/><div className="desktop-library-settings"><Settings library settings={settings} setSettings={s=>{setSettings(s);setPage(1);}}/></div></>}
    <section className="library-filters">
      <div className="search-row"><label className="search-input"><Search size={20}/><input type="search" aria-label="搜索词库" placeholder="搜索韩文 / 中文 / 罗马音" value={query} onChange={e=>{setQuery(e.target.value);setPage(1);}}/></label>
        <select className="desktop-filter" aria-label="词性" value={pos} onChange={e=>{setPos(e.target.value);setPage(1);}}><option value="">全部词性</option>{posOptions.map(p=><option key={p}>{p}</option>)}</select>
        <Button className="desktop-filter" onClick={reset}>清除筛选</Button>
      </div>
      <div className="desktop-filter filter-stack"><div className="chips"><Chip active={!states.length&&!flags.length} onClick={()=>{setStates([]);setFlags([]);}}>全部</Chip>{[['pending','待学'],['weak','薄弱'],['known','已掌握']].map(([v,l])=><Chip key={v} active={states.includes(v)} onClick={()=>toggle(v,setStates)}>{l}</Chip>)}{[['learned','仅已学'],['favorite','收藏'],['sound','音变'],['due','今日到期']].map(([v,l])=><Chip key={v} active={flags.includes(v)} onClick={()=>toggle(v,setFlags)}>{l}</Chip>)}</div>
      <div className="chips"><ArrowDownUp size={20}/>{[['level','TOPIK顺序'],['progress','掌握进度'],['headword','韩语排序'],['weak','薄弱优先']].map(([v,l])=><Chip key={v} active={sort===v} onClick={()=>setSort(v)}>{l}</Chip>)}</div></div>
      <div className="mobile-library-toolbar"><button className="button" ref={openerRef} onClick={openFilters}><ListFilter size={20}/>筛选 {filterCount>0&&filterCount}</button>{!compact&&<Button onClick={()=>setMulti(v=>!v)}><ListChecks size={20}/>{multi?'退出多选':'多选'}</Button>}<small>当前筛选 {filterCount} 项</small></div>
    </section>
    {!compact&&<header className={`list-toolbar ${multi?'is-selecting':''}`}><strong aria-live="polite">已选 {selected.length} 项</strong><div className="batch-controls">
      <Button disabled={!result.length} onClick={()=>setSelected(s=>[...new Set([...s,...result.slice((current-1)*8,current*8).map(w=>w.id)])])}><SquareCheckBig size={20}/>全选当页</Button>
      <Button className="desktop-filter" disabled={!result.length} onClick={()=>setSelected(s=>[...new Set([...s,...result.map(w=>w.id)])])}>全选当前筛选结果</Button><details className="batch-more"><summary>更多操作<ChevronDownIcon/></summary><Button disabled={!result.length} onClick={()=>setSelected(s=>[...new Set([...s,...result.map(w=>w.id)])])}>全选当前筛选结果</Button></details>
      <Button disabled={!selected.length} onClick={()=>setSelected([])}>取消选择</Button>
      {selected.length>0&&startReview&&<Button onClick={()=>startReview(selected)}>复习所选已学词</Button>}
    </div></header>}
    {drawer&&draft&&<div className="drawer-backdrop" onClick={e=>{if(e.target===e.currentTarget)setDrawer(false);}}><section className="filter-drawer" role="dialog" aria-modal="true" aria-label="筛选词库" tabIndex={-1} ref={drawerRef} onKeyDown={closeOnKey}>
      <header><h2>筛选词库</h2><Button aria-label="关闭筛选" onClick={()=>setDrawer(false)}><X size={20}/></Button></header>
      <div className="drawer-content">
        <fieldset><legend>TOPIK</legend><div className="chips">{levels.map(l=><Chip key={l} active={draft.settings.levels.includes(l)} onClick={()=>setDraft(d=>({...d,settings:{...d.settings,levels:d.settings.levels.includes(l)?d.settings.levels.filter(x=>x!==l):[...d.settings.levels,l]}}))}>T{l}</Chip>)}</div>
        <p>词库路线</p><div className="chips">{[['full','TOPIK 全量库'],['sprint','考前急救包']].map(([v,l])=><Chip key={v} active={draft.settings.route===v} onClick={()=>setDraft(d=>({...d,settings:{...d.settings,route:v}}))}>{l}</Chip>)}</div>
        <p>本组容量</p><div className="chips">{[[12,'12 词'],[24,'24 词'],['all','本范围全部']].map(([v,l])=><Chip key={v} active={draft.settings.capacity===v} onClick={()=>setDraft(d=>({...d,settings:{...d.settings,capacity:v}}))}>{l}</Chip>)}</div></fieldset>
        <fieldset><legend>词性</legend><select aria-label="词性" value={draft.pos} onChange={e=>setDraft(d=>({...d,pos:e.target.value}))}><option value="">全部词性</option>{posOptions.map(p=><option key={p}>{p}</option>)}</select></fieldset>
        <fieldset><legend>状态</legend><div className="chips"><Chip active={!draft.states.length&&!draft.flags.length} onClick={()=>setDraft(d=>({...d,states:[],flags:[]}))}>全部</Chip>{[['pending','待学'],['weak','薄弱'],['known','已掌握']].map(([v,l])=><Chip key={v} active={draft.states.includes(v)} onClick={()=>draftToggle('states',v)}>{l}</Chip>)}{[['learned','仅已学'],['favorite','收藏'],['sound','音变'],['due','今日到期']].map(([v,l])=><Chip key={v} active={draft.flags.includes(v)} onClick={()=>draftToggle('flags',v)}>{l}</Chip>)}</div></fieldset>
        <fieldset><legend>标签</legend><div className="chips">{tags.map(([v,l])=><Chip key={v} active={v==='all'?!draft.settings.tags.length:draft.settings.tags.includes(v)} onClick={()=>setDraft(d=>({...d,settings:{...d.settings,tags:v==='all'?[]:d.settings.tags.includes(v)?d.settings.tags.filter(x=>x!==v):[...d.settings.tags,v]}}))}>{l}</Chip>)}</div></fieldset>
        <fieldset><legend>排序</legend><div className="chips">{[['level','TOPIK顺序'],['progress','掌握进度'],['headword','韩语排序'],['weak','薄弱优先']].map(([v,l])=><Chip key={v} active={draft.sort===v} onClick={()=>setDraft(d=>({...d,sort:v}))}>{l}</Chip>)}</div></fieldset>
      </div><footer><Button onClick={()=>setDraft({settings:defaults,states:[],flags:[],sort:'level',pos:''})}>重置</Button><Button variant="primary" onClick={applyDraft}>应用筛选</Button></footer>
    </section></div>}
    <div className="word-list">{result.slice((current-1)*8,current*8).map(word=><WordRow key={word.id} word={word} store={store} expanded={expanded.includes(word.id)} onToggle={()=>setExpanded(s=>s.includes(word.id)?s.filter(x=>x!==word.id):[...s,word.id])} selected={selected.includes(word.id)} onSelect={!compact?()=>{setMulti(true);setSelected(s=>s.includes(word.id)?s.filter(x=>x!==word.id):[...s,word.id]);}:undefined}/>)}</div>
    {!result.length&&<EmptyState title="没有符合筛选条件的词条" action={<Button onClick={()=>{reset();}}>清除筛选</Button>}/>}
    <Pagination page={current} total={result.length} onPage={setPage}/>
    {!compact&&<section className="profile-tools"><h2>本地学习档案</h2><div className="button-group"><Button onClick={store.exportProfile}><Download size={20}/>导出学习档案</Button><Button onClick={()=>fileRef.current.click()}><Upload size={20}/>导入学习档案</Button><input type="file" accept="application/json,.json" ref={fileRef} hidden onChange={e=>{store.importProfile(e.target.files[0]);e.target.value='';}}/></div></section>}
  </div>;
}
export function ReviewMenu({words,store,startReview,active}) {
  return <div className="review-modes">{reviewModes.map(([mode,label])=>{
    const count=mode.startsWith('poly')?polyQueue(words,store.memories,mode).length:reviewQueue(words,store.memories,mode,store.favorites).length;
    const Icon=({due:CalendarClock,full:LibraryIcon,sprint:Zap,'poly-single':ListChecks,'poly-multi':ListChecks,sound:AudioWaveform})[mode];
    return <Chip key={mode} active={mode===active} onClick={()=>startReview(mode)}><Icon size={20}/><span className="review-mode-label">复习·{label}</span><span>{count}</span></Chip>;
  })}</div>;
}
export function ReviewHome({words,store,startReview,startSound}) {
  const stats=dueStats(words,store.memories);
  return <div className="page-stack"><div className="page-heading"><h1>复习</h1></div><ReviewMenu words={words} store={store} startReview={startReview}/><section className="review-overview"><div><h2>待复习 {stats.pending} 个释义</h2><p className="due-breakdown">逾期 {stats.overdue} · 今日到期 {stats.dueToday}{stats.overdue>0&&<span> · 最长逾期 {stats.longestOverdueDays} 天</span>}</p></div><Button variant="primary" onClick={()=>startReview('due')}>开始今日复习<ArrowRight size={20}/></Button></section><section className="sound-entry"><div><h2>音变专项</h2><p className="muted">实际读音 · 罗马音 · 音变规则</p></div><Button onClick={startSound}>进入音变专项<ArrowRight size={20}/></Button></section></div>;
}
