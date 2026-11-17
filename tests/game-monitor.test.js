import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {seats} from '../src/engine.js';
import {monitorRect,paintMonitor} from '../dev/game-monitor.js';
const meta=JSON.parse(readFileSync(new URL('../assets/manifest.json',import.meta.url))).desk;
test('screen mapping follows source crop and selects only the seat-side monitor',()=>{
 for(let group=0;group<6;group++){
  const a=monitorRect(meta,seats[group*2]),b=monitorRect(meta,seats[group*2+1]);
  assert.equal(a.y,b.y);assert.ok(a.x+a.width<b.x);
  assert.ok(a.width>47&&a.width<48);assert.ok(a.height>23&&a.height<24);
 }
 assert.equal(monitorRect(meta,seats[4]).y-monitorRect(meta,seats[0]).y,235);
 assert.equal(monitorRect(meta,seats[2]).x-monitorRect(meta,seats[0]).x,290);
});
test('monitor artwork is clipped before any content is drawn and context is restored',()=>{
 const calls=[],c=new Proxy({}, {get:(o,k)=>o[k]??((...args)=>calls.push({key:k,args})),set:(o,k,v)=>{o[k]=v;return true;}}),rect=monitorRect(meta,seats[7]);
 paintMonitor(c,rect,2);
 assert.deepEqual(calls.find(v=>v.key==='roundRect').args,[rect.x,rect.y,rect.width,rect.height,1]);
 assert.ok(calls.findIndex(v=>v.key==='clip')<calls.findIndex(v=>v.key==='fillRect'));
 assert.equal(calls[0].key,'save');assert.equal(calls.at(-1).key,'restore');
});
