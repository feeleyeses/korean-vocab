import { groupSenses, interleave, isSprint } from './legacy-domain.js';
export { schedule, intervalLabel, localDate } from './legacy-domain.js';

export const levels = [1, 2, 3, 4, 5, 6];
export const tags = [['all', '全部'], ['日常', '日常场景'], ['TOPIK', '书面/考试表达'], ['网络', '网络语境']];
export const reviewModes = [['due','今日到期'], ['full','全量库'], ['sprint','急救包'], ['poly-single','单个释义'], ['poly-multi','整词多选'], ['sound','音变专项']];
export function realExamples(sense) {
  return (sense.examples || []).filter(example => {
    const ko = example.ko?.trim(), zh = example.zh?.trim();
    if (!ko || !zh || zh === sense.gloss || zh === sense.definitionZh) return false;
    if (/definition|gloss/i.test(example.source || '')) return false;
    // Legacy dictionary definitions were incorrectly stored as examples.
    return !/(?:는|은|인) (?:것|사람|학교|사고|말|일|상태)\.$/.test(ko);
  });
}
export function mapVocabulary(data) {
  return (data.entries || []).filter(e => e.verificationStatus === 'approved').map(e => ({
    ...e, id: e.legacyId || e.lexicalEntryId, pos: e.partOfSpeech,
    reading: e.pronunciation?.hangul || e.headword,
    romanization: e.pronunciation?.romanization || '',
    rules: e.pronunciation?.soundRules || [],
    levels: (e.levels || []).map(l => Number(String(l).replace(/\D/g, ''))),
    tracks: e.tracks || [],
    senses: (e.senses || []).map(s => ({...s, id:s.legacyId || s.senseId, gloss:s.glossZh,
      level:Number(String(s.level || e.levels?.[0]).replace(/\D/g,'')),
      exampleKo:s.examples?.[0]?.ko || '', exampleZh:s.examples?.[0]?.zh || '',
      collocation:s.collocations?.[0]?.ko || '', collocationZh:s.collocations?.[0]?.zh || ''}))
  }));
}
export function senseGroups(word) { return groupSenses(word.senses); }
export function isDueWeak(memory, now = Date.now()) {
  return !!memory && (memory.rating !== 'remember' || new Date(memory.dueAt).getTime() <= now);
}
export function wordProgress(word, memories) {
  const learned = word.senses.filter(s => memories[s.id]).length;
  const mastered = word.senses.filter(s => memories[s.id]?.rating === 'remember').length;
  const weak = word.senses.some(s => isDueWeak(memories[s.id]));
  return { learned, mastered, weak, total:word.senses.length, fraction:mastered / Math.max(1,word.senses.length) };
}
export function scopeWords(words, settings) {
  return words.filter(w => (!settings.levels.length || settings.levels.some(l=>w.levels.includes(l))) &&
    (settings.route !== 'sprint' || isSprint(w)) && (!settings.tags.length || settings.tags.some(t=>w.tracks.includes(t))));
}
export function learningQueue(words, memories, settings, learnedIds = []) {
  const items = scopeWords(words, settings).filter(w=>!learnedIds.includes(w.id) && !w.senses.some(s=>memories[s.id])).map(word => ({word,
    sense:[...word.senses].sort((a,b)=>Number(!!b.primary)-Number(!!a.primary)||a.level-b.level)[0]})).filter(i=>i.sense);
  return interleave(items).slice(0, settings.capacity === 'all' ? items.length : settings.capacity);
}
export function reviewQueue(words, memories, mode, favorites = [], now = Date.now()) {
  const items = words.flatMap(word => word.senses.filter(s=>{
    const m=memories[s.id];
    if (!m) return false;
    if (mode === 'due') return new Date(m.dueAt).getTime() <= now;
    if (mode === 'weak') return isDueWeak(m,now);
    if (mode === 'sprint') return isSprint(word);
    if (mode === 'sound') return word.rules.length > 0;
    if (mode === 'favorite') return favorites.includes(word.id);
    return true;
  }).map(sense=>({word,sense})));
  items.sort((a,b)=>new Date(memories[a.sense.id].dueAt)-new Date(memories[b.sense.id].dueAt));
  return interleave(items);
}
export function polyQueue(words, memories, mode, now=Date.now()) {
  const poly = words.filter(w=>senseGroups(w).length>1);
  if (mode==='poly-single') return poly.flatMap(word=>word.senses.filter(s=>isDueWeak(memories[s.id],now)).map(sense=>({word,sense})));
  const filtered=poly.filter(w=>mode==='poly-learn' ? w.senses.some(s=>!memories[s.id]) : w.senses.some(s=>isDueWeak(memories[s.id],now)));
  // Rotate each new session so practice never hard-codes a particular first word.
  // The returned array is still a stable snapshot for the lifetime of that session.
  const offset=filtered.length?Math.floor(Math.random()*filtered.length):0;
  return [...filtered.slice(offset),...filtered.slice(0,offset)].map(word=>({word,sense:word.senses[0]}));
}
function hash(s) { return Array.from(s).reduce((h,c)=>(h*31+c.charCodeAt(0))>>>0,7); }
export function optionsFor(item, words, multi=false) {
  const correct=multi?senseGroups(item.word).map(g=>({id:g.senses[0].id,gloss:g.gloss,word:item.word,senses:g.senses})):
    [{id:item.sense.id,gloss:item.sense.gloss,word:item.word,senses:[item.sense]}];
  const seen=new Set(correct.map(c=>c.gloss));
  const distractors=[];
  for (const word of words.filter(w=>w.id!==item.word.id).sort((a,b)=>hash(item.sense.id+a.id)-hash(item.sense.id+b.id))) {
    for (const sense of word.senses) { if(!seen.has(sense.gloss)){ seen.add(sense.gloss); distractors.push({id:sense.id,gloss:sense.gloss,word,senses:[sense]}); } if(distractors.length>=3)break; }
    if(distractors.length>=3)break;
  }
  return [...correct,...distractors.slice(0,multi?Math.max(3,6-correct.length):3)].sort((a,b)=>hash(item.word.id+a.id)-hash(item.word.id+b.id));
}
export function grade(item, options, selected, multi) {
  const correct=options.filter(o=>multi?o.word.id===item.word.id:o.id===item.sense.id);
  const missed=correct.filter(o=>!selected.includes(o.id));
  const wrong=options.filter(o=>selected.includes(o.id)&&!correct.some(c=>c.id===o.id));
  return {wordId:item.word.id,correct,missed,wrong,chosen:correct.filter(o=>selected.includes(o.id)),isCorrect:!missed.length&&!wrong.length};
}
