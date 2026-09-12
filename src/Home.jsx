import React from 'react';
import {ArrowRight,BookOpen,RotateCcw,CalendarClock,Volume2,MessageCircle} from 'lucide-react';
import {Button,Settings,ProgressLevels,NumberHighlight} from './components.jsx';
import {scopeWords,reviewQueue} from './domain.js';

function StudyIllustration(){
  return <div className="home-illustration" aria-hidden="true">
    <div className="home-art-card home-art-back"><BookOpen size={24}/><span>가 나 다</span></div>
    <div className="home-art-card home-art-front"><span className="home-art-label">한국어</span><strong>말</strong><div className="home-art-baseline"/><Volume2 size={24}/></div>
    <MessageCircle className="home-art-bubble" size={24}/>
  </div>;
}

export function Home({words,store,settings,setSettings,start,openLibrary}){
  const scoped=scopeWords(words,settings);
  const learned=scoped.filter(w=>store.profile.learnedIds.includes(w.id)||w.senses.some(s=>store.memories[s.id])).length;
  const metrics=[['今日学习',store.profile.stats.newCount,BookOpen],['今日复习',store.profile.stats.reviewCount,RotateCcw],['今日到期',reviewQueue(words,store.memories,'due').length,CalendarClock]];
  return <div className="home-page home-dashboard">
    <section className="home-study-card" aria-label="开始你的学习">
      <div className="home-study-content">
        <Settings words={words} settings={settings} setSettings={setSettings}/>
        <p className="home-scope">当前范围 <NumberHighlight value={scoped.length} compact/> 词<span>已学 {learned} / {scoped.length}</span></p>
        <div className="home-card-actions"><Button variant="primary" onClick={start}>开始学习<ArrowRight size={20}/></Button><Button onClick={openLibrary}>查看已学词库<ArrowRight size={20}/></Button></div>
      </div>
      <StudyIllustration/>
    </section>
    <ProgressLevels settings={settings} words={words} store={store} onSelect={l=>setSettings(s=>({...s,levels:[l]}))}/>
    <section className="home-overview" aria-label="今日概览"><h2>今日概览</h2><dl>{metrics.map(([label,value,Icon])=><div key={label}><dt><Icon size={20}/>{label}</dt><dd><NumberHighlight value={value}/><small>个</small></dd></div>)}</dl></section>
  </div>;
}
