import test from 'node:test';
import assert from 'node:assert/strict';
import {locateIdentity,assertExampleIdentity} from './smoke-identity.mjs';
const target={entryId:'noun',headword:'유명',pos:'명사',senseId:'sense',exampleId:'ex',ko:'ko',zh:'zh'};
const noun={entryId:'noun',headword:'유명',pos:'명사',senseIds:['sense']},adjective={entryId:'adj',headword:'유명하다',pos:'형용사'};
test('A/C: exact famous noun independent of result order',()=>{for(const rows of [[adjective,noun],[noun,adjective]])assert.equal(locateIdentity(rows,target),noun);});
test('B: same headword disambiguated by POS and sense identity',()=>{assert.equal(locateIdentity([{...noun,entryId:'other',pos:'동사',senseIds:['other']},noun],target),noun);});
test('D/E: no exact target and ambiguous exact targets never select first',()=>{assert.throws(()=>locateIdentity([adjective,{headword:'유명인',pos:'명사'}],target),/locator_failed/);assert.throws(()=>locateIdentity([noun,{...noun}],target),/ambiguous_locator/);});
test('F: example attached to wrong sense fails',()=>{const word={lexicalEntryId:'noun',headword:'유명',partOfSpeech:'명사',senses:[{senseId:'wrong',examples:[{exampleId:'ex',ko:'ko',zh:'zh'}]}]};assert.throws(()=>assertExampleIdentity([word],target),/example_identity_failed/);word.senses[0].senseId='sense';assert.equal(assertExampleIdentity([word],target).s.senseId,'sense');assert.throws(()=>assertExampleIdentity([word,word],target),/duplicate/);});
