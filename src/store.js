import { useState, useRef } from 'react';
import { schedule, localDate } from './domain.js';
const initialStats = {newCount:0, reviewCount:0, streak:0, lastStudyDate:'', learned:0};
function read() {
  const result={profile:{stats:initialStats,learnedIds:[],unlockedLevel:6},memories:{},favorites:[],confusions:[]};
  try {
    const profile=JSON.parse(localStorage.getItem('kwf:profile')||'null');
    if(profile) result.profile={...result.profile,...profile,stats:{...initialStats,...profile.stats}};
    if(result.profile.stats.lastStudyDate!==localDate()) result.profile.stats={...result.profile.stats,newCount:0,reviewCount:0};
    result.favorites=JSON.parse(localStorage.getItem('kwf:favorites')||'[]');
    result.confusions=JSON.parse(localStorage.getItem('kwf:confusions')||'[]');
    for(let i=0;i<localStorage.length;i++) {
      const key=localStorage.key(i);
      if(!key.startsWith('memory:'))continue;
      try {const m=JSON.parse(localStorage.getItem(key)); if(m?.wordId&&m.senseId&&m.rating&&m.dueAt)result.memories[m.senseId]=m;}catch{}
    }
  }catch{}
  return result;
}
export function useLearningStore() {
  const [state,setState]=useState(read), ref=useRef(state);
  const [notice,setNotice]=useState('');
  function update(next) {ref.current=next;setState(next);}
  function persist(key,value) {try{localStorage.setItem(key,JSON.stringify(value));}catch{setNotice('浏览器未能保存学习记录，请导出档案备份。');}}
  function favorite(id) {
    const old=ref.current, favorites=old.favorites.includes(id)?old.favorites.filter(x=>x!==id):[...old.favorites,id];
    persist('kwf:favorites',favorites); update({...old,favorites});
  }
  function record(item, ratings, mode, wrong=[]) {
    const old=ref.current, memories={...old.memories};
    for(const {sense,rating} of ratings) {
      const m={wordId:item.word.id,senseId:sense.id,rating,...schedule(rating,memories[sense.id]),mode,objectiveCorrect:rating==='remember'};
      memories[sense.id]=m;persist('memory:'+sense.id,m);
    }
    const learnedIds=[...new Set([...old.profile.learnedIds,item.word.id])], day=localDate(), yesterday=localDate(-1), stats=old.profile.stats;
    const profile={...old.profile,unlockedLevel:6,learnedIds,stats:{...stats,learned:learnedIds.length,
      newCount:stats.newCount+(mode==='new'?1:0),reviewCount:stats.reviewCount+(mode==='review'?1:0),lastStudyDate:day,
      streak:stats.lastStudyDate===day?stats.streak:stats.lastStudyDate===yesterday?stats.streak+1:1}};
    const confusions=[...wrong.map(o=>({promptWordId:item.word.id,confusedWordId:o.word.id,gloss:o.gloss,createdAt:new Date().toISOString(),learned:old.profile.learnedIds.includes(o.word.id)})),...old.confusions].slice(0,12);
    persist('kwf:profile',profile);persist('kwf:confusions',confusions);update({...old,profile,memories,confusions});
  }
  function exportProfile() {
    const s=ref.current,url=URL.createObjectURL(new Blob([JSON.stringify({version:1,exportedAt:new Date().toISOString(),profile:s.profile,memories:Object.values(s.memories),favorites:s.favorites,confusions:s.confusions},null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download=`korean-word-field-${localDate()}.json`;a.click();URL.revokeObjectURL(url);
  }
  async function importProfile(file) {
    if(!file)return;
    try {
      const data=JSON.parse(await file.text());
      if(!Array.isArray(data.memories)||!data.profile||!Array.isArray(data.profile.learnedIds)||!Array.isArray(data.favorites))throw Error('invalid');
      if(data.memories.some(m=>!m.wordId||!m.senseId||!['remember','fuzzy','forgot'].includes(m.rating)||!Number.isFinite(Date.parse(m.dueAt))||!Number.isFinite(Date.parse(m.reviewedAt))))throw Error('invalid');
      const next={profile:{...data.profile,stats:{...initialStats,...data.profile.stats},unlockedLevel:6},memories:Object.fromEntries(data.memories.map(m=>[m.senseId,m])),favorites:data.favorites,confusions:data.confusions||[]};
      for(const key of Object.keys(localStorage))if(key.startsWith('memory:'))localStorage.removeItem(key);
      for(const m of data.memories)persist('memory:'+m.senseId,m);
      persist('kwf:profile',next.profile);persist('kwf:favorites',next.favorites);persist('kwf:confusions',next.confusions);update(next);setNotice('已导入学习档案');
    }catch{setNotice('导入失败：请选择有效的学习档案 JSON。');}
  }
  function speak(word) {
    if(!('speechSynthesis' in window)){setNotice('此浏览器不支持发音播放。');return;}
    const utterance=new SpeechSynthesisUtterance(typeof word==='string'?word:word.reading||word.headword);
    utterance.lang='ko-KR';utterance.rate=.88;
    const voice=speechSynthesis.getVoices().find(v=>v.lang.startsWith('ko'));if(voice)utterance.voice=voice;
    utterance.onerror=e=>{if(e.error!=='interrupted'&&e.error!=='canceled')setNotice('发音暂不可用，请检查设备韩语语音与音量设置。');};
    speechSynthesis.cancel();speechSynthesis.speak(utterance);
  }
  return {...state,notice,setNotice,favorite,record,exportProfile,importProfile,speak};
}
