import React,{useState,useMemo,useRef} from 'react';
import { Check, X, ChevronUp, ChevronDown, ArrowRight } from 'lucide-react';
import { Button,Progress,WordHero,WordActions,Knowledge,EmptyState } from './components.jsx';
import { optionsFor,grade,intervalLabel } from './domain.js';

export default function Session({session,words,store,onExit,onRestart}) {
  const [index,setIndex]=useState(0),[completed,setCompleted]=useState(false);
  if(!session.queue.length)return <EmptyState title={session.mode==='new'?'本范围没有待学新词':'暂无可复习内容'} text="选择其他学习范围，或先学习一些新词。" action={<Button onClick={onExit}>返回</Button>}/>;
  if(completed)return <EmptyState title={session.mode==='new'?'这一组完成了':'这轮复习完成了'} text={`已完成 ${session.queue.length} 张，结果已记录到学习档案。`} action={<div className="button-group"><Button onClick={onExit}>返回{session.mode==='new'?'学习':'复习'}</Button><Button variant="primary" onClick={onRestart}>再来一组</Button></div>}/>;
  const item=session.queue[index];
  return <div className="session-layout">
    <aside className="session-sidebar"><h2>本组进度</h2><p className="session-count">{index}<small> / {session.queue.length}</small></p><Progress value={index} max={session.queue.length} label="本组进度"/><dl><dt>当前已学</dt><dd>{store.profile.learnedIds.length} / {words.length}</dd><dt>当前队列余量</dt><dd>{session.queue.length-index}</dd><dt>学习范围</dt><dd>TOPIK {session.levels.join(' / ')}</dd></dl><Button variant="tertiary" onClick={onExit}>返回</Button></aside>
    <Question key={`${session.id}:${index}`} item={item} index={index} total={session.queue.length} mode={session.mode} title={session.title} words={words} store={store} onNext={()=>index+1>=session.queue.length?setCompleted(true):setIndex(index+1)}/>
    <aside className="session-sidebar rules-panel"><h2>本组规则</h2><ol><li><span>01</span>只看韩语并主动回想</li><li><span>02</span>{session.mode==='new'?'先判断记忆，再揭晓答案':'选择释义，再核对答案'}</li></ol></aside>
  </div>;
}
function Question({item,index,total,mode,title,words,store,onNext}) {
  const [result,setResult]=useState(null),[mapOpen,setMapOpen]=useState(false),locked=useRef(false);
  const options=useMemo(()=>optionsFor(item,words),[item,words]);
  const review=mode==='review';
  function answer(value) {
    if(locked.current)return;locked.current=true;
    const graded=review?grade(item,options,[value],false):null;
    const rating=review?(graded.isCorrect?'remember':'forgot'):value;
    store.record(item,[{sense:item.sense,rating}],mode,graded?.wrong||[]);
    setResult({rating,isCorrect:graded?.isCorrect});
  }
  const memory=store.memories[item.sense.id];
  return <article className={`learning-card ${result?'revealed':'initial'}`} data-mode={mode} data-word={item.word.headword}>
    <header className="card-header"><div><span>{title} · TOPIK {item.sense.level}</span><small>{index+1} / {total} · 还剩 {total-index-1} 张</small></div><WordActions word={item.word} store={store}/></header>
    <WordHero word={item.word}/>
    <div className="status-slot">{result&&<span className={`status ${review&&!result.isCorrect?'error':''}`}>{review?(result.isCorrect?<Check size={20}/>:<X size={20}/>):<Check size={20}/>} {review?(result.isCorrect?'答对':'答错'):({remember:'认识',fuzzy:'模糊',forgot:'不认识'})[result.rating]}<span>{intervalLabel(memory?.dueAt)}</span></span>}</div>
    <div className="content-area">
      {result&&<div className="knowledge-scroll" tabIndex={0} aria-label="知识内容"><Knowledge word={item.word} sense={item.sense} allCollocations/>
      {result&&review&&<div className="answer-map"><Button variant="tertiary" aria-expanded={mapOpen} onClick={()=>setMapOpen(v=>!v)}>查看选项对应韩文{mapOpen?<ChevronDown size={20}/>:<ChevronUp size={20}/>}</Button>{mapOpen&&<div className="answer-map-overlay" role="region" aria-label="选项对应韩文"><div className="answer-map-grid">{options.map(o=><div className={`mapped-option ${o.id===item.sense.id?'correct':''}`} key={o.id}><strong lang="ko">{o.word.headword}</strong><span>{o.gloss}</span></div>)}</div></div>}</div>}
      </div>}
    </div>
    <footer className={`card-footer ${review?'review-action-rail':'learning-action-rail'}`}>
      {result?<Button variant="primary" className="continue action-rail" onClick={onNext}>继续<ArrowRight size={20}/></Button>:review?<div className="review-options">{options.map(o=><Button key={o.id} className="choice" onClick={()=>answer(o.id)}>{o.gloss}</Button>)}</div>:<>
        <Button className="direct-answer" onClick={()=>answer('forgot')}>直接看答案</Button>
        <div className="judgment-buttons action-rail"><Button variant="primary" onClick={()=>answer('remember')}>认识</Button><Button variant="soft" onClick={()=>answer('fuzzy')}>模糊</Button><Button onClick={()=>answer('forgot')}>不认识</Button></div>
      </>}
    </footer>
  </article>;
}
