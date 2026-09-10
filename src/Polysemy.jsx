import React,{useState,useMemo,useRef} from 'react';
import { ArrowRight,Check } from 'lucide-react';
import { Button,WordHero,WordActions,EmptyState,Knowledge } from './components.jsx';
import { optionsFor,grade,senseGroups } from './domain.js';
import { Library } from './pages.jsx';

export function Polysemy({words,store,startPoly,session,onExit}) {
  const [expanded,setExpanded]=useState(false);
  const poly=useMemo(()=>words.filter(w=>senseGroups(w).length>1),[words]);
  return <div className="page-stack"><div className="page-heading"><h1>一词多义</h1></div>
    {session?<PolySession key={session.id} session={session} words={words} store={store} onExit={onExit}/>:<section className="poly-entry"><h2>一个词，不等于一个答案</h2><p className="muted">每个释义单独记录掌握进度。</p><div className="poly-entry-actions"><Button variant="primary" onClick={()=>startPoly('poly-learn')}>学习新多义<ArrowRight size={18}/></Button><Button onClick={()=>startPoly('poly-single')}>复习·单个释义</Button><Button onClick={()=>startPoly('poly-multi')}>复习·整词多选</Button></div></section>}
    <section className="poly-library"><Button className="library-disclosure" aria-expanded={expanded} onClick={()=>setExpanded(v=>!v)}><span>{expanded?'收起':'查看'}全部多义词释义库</span><small>{poly.length} 个词 / {poly.reduce((s,w)=>s+senseGroups(w).length,0)} 个释义</small></Button>{expanded&&<Library words={poly} store={store} compact/>}</section>
  </div>;
}
function PolySession({session,words,store,onExit}) {
  const [index,setIndex]=useState(0),[complete,setComplete]=useState(false);
  if(!session.queue.length)return <EmptyState title={session.mode==='poly-learn'?'暂时没有新多义词':'暂无到期或薄弱释义'} text="复习队列只包含已有学习记录的词。" action={<Button onClick={onExit}>返回多义</Button>}/>;
  if(complete)return <EmptyState title="这轮多义练习结束了" text="本轮结果已记录到复习档案。" action={<Button onClick={onExit}>返回多义</Button>}/>;
  return <PolyQuestion key={`${session.id}:${index}`} item={session.queue[index]} index={index} total={session.queue.length} mode={session.mode} words={words} store={store} next={()=>index+1>=session.queue.length?setComplete(true):setIndex(index+1)}/>;
}
function PolyQuestion({item,index,total,mode,words,store,next}) {
  const [selected,setSelected]=useState([]),[result,setResult]=useState(null),locked=useRef(false);
  const multi=mode!=='poly-single',options=useMemo(()=>optionsFor(item,words,multi),[item,words,multi]);
  function submit() {
    if(locked.current||!selected.length)return;locked.current=true;
    const result=grade(item,options,selected,multi);
    // Result contains this question's actual option objects, independent of memory updates.
    setResult(result);
    store.record(item,result.correct.flatMap(o=>o.senses.map(sense=>({sense,rating:selected.includes(o.id)?'remember':'forgot'}))),mode==='poly-learn'?'new':'review',result.wrong);
  }
  return <><article className="poly-question" data-word={item.word.headword} data-submitted={!!result}>
    <div className="poly-prompt"><h2>{mode==='poly-learn'?'学习新多义':multi?'复习·整词多选':'复习·单个释义'}</h2><WordHero word={item.word}/><p className="muted">{index+1} / {total} · {senseGroups(item.word).length} 个释义</p><WordActions word={item.word} store={store}/></div>
    <div className="poly-answer"><h2>{multi?'请选择这个词的所有正确释义':'请选择正确释义'}</h2><div className="poly-options" role="group" aria-label={multi?'多选释义':'单选释义'}>{options.map(o=>{
      const isSelected=selected.includes(o.id),correct=result?.correct.some(c=>c.id===o.id),wrong=result?.wrong.some(c=>c.id===o.id);
      return <label className={`poly-option ${isSelected?'selected':''} ${correct?'correct':''} ${wrong?'error':''}`} key={o.id}><input type={multi?'checkbox':'radio'} name="poly-answer" checked={isSelected} disabled={!!result} onChange={()=>setSelected(s=>multi?(s.includes(o.id)?s.filter(v=>v!==o.id):[...s,o.id]):[o.id])}/><span>{o.gloss}</span>{result&&correct&&<Check size={16}/>}</label>;
    })}</div><div className="poly-submit">{result?<><span className="recorded"><Check size={18}/>已记录到复习档案</span><Button variant="primary" onClick={next}>下一题<ArrowRight size={18}/></Button></>:<Button variant="primary" disabled={!selected.length} onClick={submit}>提交所选释义</Button>}</div>{result&&<p className="muted">本次选对 {result.chosen.length}/{result.correct.length} 个释义 · 漏选 {result.missed.length} · 误选 {result.wrong.length}</p>}</div>
  </article>{result&&<section className="poly-results"><h2>本词释义结果</h2><div className="poly-result-grid">{[['漏选释义',result.missed],['误选项对应韩文',result.wrong],['本次选对',result.chosen]].map(([label,items])=><section className="result-group" key={label}><h3>{label} · {items.length}</h3>{items.length?items.map(o=><div className="result-item" key={o.id}><h4>{o.gloss}{label==='误选项对应韩文'&&<> = <span lang="ko">{o.word.headword}</span></>}</h4><Knowledge word={{...o.word,rules:[]}} sense={o.senses[0]}/></div>):<p className="muted">本题没有{label}</p>}</section>)}</div><details><summary>查看全部释义</summary>{item.word.senses.map(s=><Knowledge key={s.id} word={{...item.word,rules:[]}} sense={s}/>)}</details></section>}</>;
}
