import React,{useEffect,useMemo,useState} from 'react';
import {BookOpen,Layers3,Library as LibraryIcon,Clock3} from 'lucide-react';
import {Home,Library,ReviewHome,ReviewMenu} from './pages.jsx';
import Session from './Session.jsx';
import {Polysemy} from './Polysemy.jsx';
import {mapVocabulary,learningQueue,reviewQueue,polyQueue} from './domain.js';
import {useLearningStore} from './store.js';

const defaults={levels:[],route:'full',capacity:12,tags:[]};
const nav=[['home','学习',BookOpen],['poly','多义',Layers3],['library','词库',LibraryIcon],['review','复习',Clock3]];

export default function App(){
  const [words,setWords]=useState([]),[loading,setLoading]=useState(true),[view,setView]=useState('home'),[settings,setSettings]=useState(defaults),[session,setSession]=useState(null);
  const store=useLearningStore();
  useEffect(()=>{fetch('./data/vocabulary.json').then(r=>r.json()).then(d=>setWords(mapVocabulary(d))).finally(()=>setLoading(false));},[]);
  useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});},[view,session?.id]);
  const counts=useMemo(()=>({learned:store.profile.learnedIds.length,due:reviewQueue(words,store.memories,'due').length}),[words,store.profile.learnedIds,store.memories]);
  function go(next){setSession(null);setView(next);}
  function startLearning(){const queue=learningQueue(words,store.memories,settings,store.profile.learnedIds);setSession({id:crypto.randomUUID(),mode:'new',title:'学习',queue,levels:settings.levels.length?settings.levels:[1,2,3,4,5,6]});setView('study');}
  function startReview(mode='due',ids){const source=Array.isArray(ids)?words.filter(w=>ids.includes(w.id)):words;const queue=reviewQueue(source,store.memories,Array.isArray(ids)?'full':mode,store.favorites);setSession({id:crypto.randomUUID(),mode:'review',title:mode==='sound'?'音变专项':'复习',queue,levels:[1,2,3,4,5,6]});setView('review');}
  function startPoly(mode){setSession({id:crypto.randomUUID(),mode,queue:polyQueue(words,store.memories,mode)});setView('poly');}
  if(loading)return <div className="app-loading">正在载入词库…</div>;
  return <div className="app-shell">
    <header className="topbar"><button className="brand" onClick={()=>go('home')}><span>ㅎ</span><b>韩语词场</b></button><nav aria-label="主导航">{nav.map(([id,label])=><button key={id} className={view===id||view==='study'&&id==='home'?'active':''} onClick={()=>go(id)}>{label}</button>)}</nav><div className="header-stats"><span>已学 <b>{counts.learned}</b></span><span>今日复习 <b>{counts.due}</b></span></div></header>
    <main className={`app-main view-${view}`}>
      {view==='home'&&<Home words={words} store={store} settings={settings} setSettings={setSettings} start={startLearning} openLibrary={()=>go('library')}/>}
      {view==='study'&&<><div className="mobile-session-title"><button onClick={()=>go('home')}>学习设置</button><b>学习新词</b></div><Session session={session} words={words} store={store} onExit={()=>go('home')} onRestart={startLearning}/></>}
      {view==='review'&&(session?<><ReviewMenu words={words} store={store} startReview={startReview} active={session.mode}/><Session session={session} words={words} store={store} onExit={()=>go('review')} onRestart={()=>startReview(session.mode)}/></>:<ReviewHome words={words} store={store} startReview={startReview} startSound={()=>startReview('sound')}/>)}
      {view==='poly'&&<Polysemy words={words} store={store} startPoly={startPoly} session={session} onExit={()=>{setSession(null);setView('poly');}}/>}
      {view==='library'&&<Library words={words} store={store} startReview={ids=>startReview('full',ids)}/>}
    </main>
    <nav className="mobile-nav" aria-label="移动端主导航">{nav.map(([id,label,Icon])=><button key={id} className={view===id||view==='study'&&id==='home'?'active':''} onClick={()=>go(id)}><Icon size={19}/><span>{label}</span></button>)}</nav>
    {store.notice&&<button className="toast" onClick={()=>store.setNotice('')}>{store.notice}</button>}
  </div>;
}
