import React from 'react';
import { Volume2, Star, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { levels, tags, realExamples, wordProgress } from './domain.js';

export function Button({variant='secondary',className='',children,...props}) {
  return <button type="button" className={`button ${variant} ${className}`} {...props}>{children}</button>;
}
export function Chip({active,children,...props}) {
  return <Button variant="chip" aria-pressed={!!active} className={active?'selected':''} {...props}>{children}</Button>;
}
export function Progress({value,max,label}) {
  const fraction=Math.min(1,Math.max(0,max?value/max:0));
  return <div className="progress-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max||1} aria-valuenow={Math.min(value,max||1)}><span style={{width:`${fraction*100}%`}}/></div>;
}
export function WordActions({word,store}) {
  const saved=store.favorites.includes(word.id);
  return <div className="word-actions"><Button variant="tertiary" title="听发音" aria-label="听发音" onClick={()=>store.speak(word)}><Volume2 size={18}/><span className="listen-label">听</span></Button><Button variant="tertiary" title={saved?'取消收藏':'收藏'} aria-label={saved?'取消收藏':'收藏'} aria-pressed={saved} onClick={()=>store.favorite(word.id)}><Star size={18} fill={saved?'currentColor':'none'}/></Button></div>;
}
export function WordHero({word}) {
  return <div className="word-hero"><h2 lang="ko" className={word.headword.length>8?'long-headword':''}>{word.headword}</h2><dl className="pronunciation"><dt>实际读音</dt><dd lang="ko">{word.reading}</dd><dt>罗马音</dt><dd>{word.romanization||'暂缺'}</dd>{word.rules.length>0&&<><dt>音变</dt><dd>{word.rules.join('；')}</dd></>}</dl></div>;
}
export function Knowledge({word,sense,allCollocations=false}) {
  const examples=realExamples(sense);
  const collocations=(allCollocations?word.senses.flatMap(s=>s.collocations||[]):sense.collocations||[]).filter((c,i,all)=>c.ko&&all.findIndex(x=>x.ko===c.ko&&x.zh===c.zh)===i);
  return <div className="knowledge-grid">
    <section className="information-block definition"><h3>释义</h3><p>{sense.gloss}</p></section>
    {examples.length>0&&<section className="information-block examples"><h3>例句</h3>{examples.map((e,i)=><div className="bilingual" key={e.exampleId||i}><p lang="ko">{e.ko}</p><p className="muted">{e.zh}</p></div>)}</section>}
    {collocations.length>0&&<section className="information-block collocations"><h3>固定搭配</h3><ul>{collocations.map((c,i)=><li key={c.collocationId||i}><p lang="ko">{c.ko}</p>{c.zh?.trim()&&<p className="muted">{c.zh}</p>}</li>)}</ul></section>}
    {word.rules.length>0&&<section className="information-block sound-rules"><h3>音变规则</h3>{word.rules.map((rule,i)=><p key={i}>{rule}</p>)}</section>}
  </div>;
}
export function ProgressLevels({words,store,onSelect}) {
  return <section className="progress-section"><h2>TOPIK 学习进度</h2><div className="level-progress-grid">{levels.map(level=>{
    const entries=words.filter(w=>w.levels.includes(level)), learned=entries.filter(w=>store.profile.learnedIds.includes(w.id)||w.senses.some(s=>store.memories[s.id])).length;
    return <button key={level} className="level-progress" onClick={()=>onSelect?.(level)} aria-label={`选择 TOPIK ${level}`}><div><strong>T{level}</strong><span>{learned} / {entries.length}</span></div><Progress value={learned} max={entries.length} label={`TOPIK ${level} 学习进度`}/></button>;
  })}</div></section>;
}
export function Settings({settings,setSettings,library=false}) {
  function toggle(key,value){setSettings(s=>({...s,[key]:s[key].includes(value)?s[key].filter(v=>v!==value):[...s[key],value]}));}
  return <section className="settings-section"><h2>{library?'筛选词库':'开始你的学习'}</h2><div className="settings-grid">
    <fieldset><legend>学习范围</legend><div className="chips levels">{levels.map(l=><Chip key={l} active={settings.levels.includes(l)} onClick={()=>toggle('levels',l)}>T{l}</Chip>)}</div></fieldset>
    <fieldset><legend>词库路线</legend><div className="chips"><Chip active={settings.route==='full'} onClick={()=>setSettings(s=>({...s,route:'full'}))}>TOPIK 全量库</Chip><Chip active={settings.route==='sprint'} onClick={()=>setSettings(s=>({...s,route:'sprint'}))}>考前急救包</Chip></div></fieldset>
    <fieldset><legend>本组容量</legend><div className="chips">{[[12,'12 词'],[24,'24 词'],['all','本范围全部']].map(([v,label])=><Chip key={v} active={settings.capacity===v} onClick={()=>setSettings(s=>({...s,capacity:v}))}>{label}</Chip>)}</div></fieldset>
    <fieldset><legend>内容标签</legend><div className="chips">{tags.map(([v,label])=><Chip key={v} active={v==='all'?!settings.tags.length:settings.tags.includes(v)} onClick={()=>v==='all'?setSettings(s=>({...s,tags:[]})):toggle('tags',v)}>{label}</Chip>)}</div></fieldset>
  </div></section>;
}
export function EmptyState({title='暂无内容',text,action,children}) {
  return <div className="empty-state"><div className="empty-mark">✓</div><h2>{title}</h2>{text&&<p className="muted">{text}</p>}{action}{children}</div>;
}
export function WordRow({word,store,expanded,onToggle,selected,onSelect}) {
  const progress=wordProgress(word,store.memories);
  return <article className={`word-row ${expanded?'expanded':''}`} data-word={word.headword}>
    <div className="word-row-main">
      {onSelect&&<input type="checkbox" checked={selected} onChange={onSelect} aria-label={`选择 ${word.headword}`}/>}
      <div className="word-identity"><h3 lang="ko">{word.headword}</h3><p className="muted">TOPIK {word.levels.join(' / ')} · {word.pos}</p><p className="muted" lang="ko">{word.reading} · {word.romanization}</p></div>
      <div className="word-mastery"><span>{word.senses.length} 个释义</span><small>掌握 {progress.mastered}/{progress.total}</small><Progress value={progress.mastered} max={progress.total} label={`${word.headword} 掌握进度`}/></div>
      <div className="word-row-actions"><WordActions word={word} store={store}/><Button variant="tertiary" aria-expanded={expanded} onClick={onToggle}>{expanded?'收起':'展开'}{expanded?<ChevronUp size={16}/>:<ChevronDown size={16}/>}</Button></div>
    </div>
    {expanded&&<div className="word-details">{word.senses.map((sense,index)=><section className="sense-detail" key={sense.id}><div className="sense-heading"><span className="sense-number">{index+1}</span><h4>{sense.gloss}</h4>{store.memories[sense.id]&&<small>{({remember:'记得',fuzzy:'模糊',forgot:'不认识'})[store.memories[sense.id].rating]} · 下次 {new Date(store.memories[sense.id].dueAt).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}</small>}</div><Knowledge word={{...word,rules:[]}} sense={sense}/></section>)}{word.rules.length>0&&<section className="information-block"><h3>音变规则</h3>{word.rules.map(rule=><p key={rule}>{rule}</p>)}</section>}</div>}
  </article>;
}
export function Pagination({page,total,onPage}) {
  const max=Math.max(1,Math.ceil(total/8));
  return <div className="pagination"><span>第 {page}/{max} 页 · 共 {total} 个词</span><div className="button-group"><Button disabled={page<=1} onClick={()=>onPage(page-1)}><ChevronLeft size={16}/>上一页</Button><Button disabled={page>=max} onClick={()=>onPage(page+1)}>下一页<ChevronRight size={16}/></Button></div></div>;
}
