import assert from 'node:assert/strict';
import {dueStats} from '../src/domain.js';
const now=new Date(2026,8,13,12).getTime();
const dates=[new Date(2026,8,10,23),new Date(2026,8,12,23,59,59),new Date(2026,8,13),new Date(now),new Date(now+1),'invalid'];
const words=[{id:'word',senses:dates.map((_,i)=>({id:String(i)}))}];
const memories=Object.fromEntries(dates.map((d,i)=>[String(i),{dueAt:d instanceof Date?d.toISOString():d}]));
assert.deepEqual(dueStats(words,memories,now),{pending:4,overdue:2,dueToday:2,longestOverdueDays:3});
assert.deepEqual(dueStats(words,{},now),{pending:0,overdue:0,dueToday:0,longestOverdueDays:0});
console.log('due stats: midnight, now, future, invalid and empty boundaries passed');
