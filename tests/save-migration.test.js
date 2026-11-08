import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const legacyKey='moyu-master-save-v1',shortKey='moyu-master-save-v4-sound';
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const start=app.indexOf('const SAVE_KEY='),end=app.indexOf('function beep(');
assert.ok(start>=0&&end>start,'必须从生产 app.js 中提取存档加载片段');
const loadCode=app.slice(start,end);

function load(entries={},options={}){
 const data=new Map(Object.entries(entries)),writes=[],reads=[];
 const localStorage={
  getItem(key){reads.push(key);if(options.readBlocked)throw new Error('Storage unavailable');return data.get(key)??null;},
  setItem(key,value){if(options.writeBlocked)throw new Error('Storage unavailable');writes.push([key,value]);data.set(key,value);}
 };
 const context=vm.createContext({localStorage});
 vm.runInContext('let save={unlocked:1,best:{}};const levels=[{},{},{},{}];',context);
 vm.runInContext(loadCode,context,{timeout:1000});
 // Convert across VM realms before comparing plain objects.
 const save=JSON.parse(vm.runInContext('JSON.stringify(save)',context));
 return {save,data,writes,reads};
}

test('v1 仅继承解锁关卡，旧最佳不迁移且原存档不改写',()=>{
 const legacy=JSON.stringify({unlocked:3,best:{'0-clean':89,'1-assisted':120}});
 const result=load({[legacyKey]:legacy});
 assert.deepEqual(result.save,{unlocked:3,best:{}});
 assert.equal(result.data.get(legacyKey),legacy);
 assert.equal(result.writes.length,1);
 assert.equal(result.writes[0][0],shortKey);
 assert.deepEqual(JSON.parse(result.data.get(shortKey)),result.save);
 const second=load(Object.fromEntries(result.data));
 assert.deepEqual(second.save,result.save);
 assert.equal(second.writes.length,0);
 assert.deepEqual(second.reads,[shortKey]);
});

test('v4 保留合法有无助力成绩并优先于 v1，不在读取时覆盖成绩',()=>{
 const current={unlocked:2,best:{'0-clean':21.5,'0-assisted':19,'1-clean':0}};
 const result=load({[shortKey]:JSON.stringify(current),[legacyKey]:JSON.stringify({unlocked:4,best:{'0-clean':1}})});
 assert.deepEqual(result.save,current);
 assert.deepEqual(result.reads,[shortKey]);
 assert.deepEqual(result.writes,[]);
});

test('无效关卡与成绩字段不会污染可用存档',()=>{
 for(const [unlocked,expected]of [[0,1],[-4,1],[99,4],[2.9,2],['bad',1],[null,1]]){
  const result=load({[shortKey]:JSON.stringify({unlocked,best:{'0-clean':24,'1-assisted':31,'wrong':4,'1-clean':-1,'2-clean':'12','2-assisted':null,'3-clean':true}})});
  assert.deepEqual(result.save,{unlocked:expected,best:{'0-clean':24,'1-assisted':31}});
 }
 for(const best of [null,[],12,'invalid'])assert.deepEqual(load({[shortKey]:JSON.stringify({unlocked:2,best})}).save,{unlocked:2,best:{}});
 assert.deepEqual(load({[shortKey]:'{"unlocked":1,"best":{"0-clean":1e309}}'}).save,{unlocked:1,best:{}});
});

test('损坏或缺失的新版存档可以回退旧解锁或默认开局',()=>{
 for(const raw of ['{broken','null','[]','42','"invalid"']){
  const result=load({[shortKey]:raw,[legacyKey]:'{"unlocked":3,"best":{"0-clean":90}}'});
  assert.deepEqual(result.save,{unlocked:3,best:{}});
  assert.equal(result.data.get(legacyKey),'{"unlocked":3,"best":{"0-clean":90}}');
  assert.ok(result.writes.every(([key])=>key===shortKey));
 }
 assert.deepEqual(load().save,{unlocked:1,best:{}});
 assert.deepEqual(load({[shortKey]:'{',[legacyKey]:'{'}).save,{unlocked:1,best:{}});
});

test('禁用存储仍能开局，写入失败不丢失已读取的解锁',()=>{
 assert.deepEqual(load({}, {readBlocked:true,writeBlocked:true}).save,{unlocked:1,best:{}});
 const legacy='{"unlocked":4,"best":{"0-clean":80}}';
 const result=load({[legacyKey]:legacy},{writeBlocked:true});
 assert.deepEqual(result.save,{unlocked:4,best:{}});
 assert.equal(result.data.get(legacyKey),legacy);
 assert.deepEqual(result.writes,[]);
});
test('自然巡视仅继承v2短局解锁，旧目标成绩不参与新版纪录',()=>{const oldKey='moyu-master-save-v2-short',old=JSON.stringify({unlocked:4,best:{'2-clean':35,'3-clean':50}});const result=load({[oldKey]:old});assert.deepEqual(result.save,{unlocked:4,best:{}});assert.equal(result.data.get(oldKey),old);assert.equal(result.writes[0][0],'moyu-master-save-v4-sound');});

test('声源版只继承v3自然巡视的解锁而不复用旧最佳',()=>{const key='moyu-master-save-v3-patrol',raw=JSON.stringify({unlocked:4,best:{'3-clean':49}}),result=load({[key]:raw});assert.deepEqual(result.save,{unlocked:4,best:{}});assert.equal(result.data.get(key),raw);assert.equal(result.writes[0][0],shortKey);});
