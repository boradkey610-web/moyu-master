import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,activities} from '../src/engine.js';
import {Renderer} from '../src/render.js';
import {DiscoScene,discoOpacity,DANCE_ENTRY_SECONDS} from '../src/disco.js';

const renderer=()=>Object.assign(Object.create(Renderer.prototype),{motion:new Map(),facings:new Map(),art:{}});
const context=()=>new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>{o[k]=v;return true;}});
test('production disco reaches full opacity at dance warmup and fades throughout stop',()=>{
 const r=renderer(),g=new Game(2,1);g.inspectors=[];g.setActivity('dance');
 assert.equal(g.player.warmup,DANCE_ENTRY_SECONDS);
 const opacity=()=>discoOpacity(r.danceState(g),activities.dance.stop);
 assert.equal(opacity(),0);g.step(.4);assert.equal(opacity(),.5);
 g.step(.4);assert.equal(opacity(),1);g.setActivity('work');assert.equal(opacity(),1);
 g.step(.5);assert.ok(Math.abs(opacity()-.5)<1e-10);g.step(.5);assert.equal(opacity(),0);
 assert.equal(g.player.activity,'work');
});
test('early stop never brightens the interrupted entry, repeated work cannot restart it',()=>{
 const r=renderer(),g=new Game(2,1);g.inspectors=[];g.setActivity('dance');g.step(.2);
 const initial=discoOpacity(r.danceState(g),1);g.setActivity('work');
 assert.equal(discoOpacity(r.danceState(g),1),initial);
 let previous=initial;
 for(let i=0;i<9;i++){
  g.setActivity('work');g.step(.1);const opacity=discoOpacity(r.danceState(g),1);
  assert.ok(opacity<=previous+1e-10);previous=opacity;
 }
 g.step(.2);assert.equal(r.danceState(g),null);
});
test('pause freezes both fades and catch or movement restores office without stale state',()=>{
 const r=renderer(),g=new Game(2,1);g.inspectors=[];g.setActivity('dance');g.step(.4);
 const before=r.danceState(g);g.paused=true;g.step(3);assert.deepEqual(r.danceState(g),before);
 g.paused=false;g.catchPlayer('老板');assert.equal(discoOpacity(r.danceState(g),1),0);
 const next=new Game(2,1);next.inspectors=[];next.setActivity('dance');next.step(1);
 next.player.route=[{x:355,y:585}];assert.equal(r.danceState(next),null);
});
test('independent disco layer is cached, opaque and enlarges around the unchanged feet',()=>{
 const old=globalThis.document;let canvases=0;const traces=[],contexts=[];
 try{
  globalThis.document={createElement(){canvases++;const c=context();contexts.push(c);return{width:0,height:0,getContext:()=>c};}};
  const r=renderer();r.paintedDance=(c,a,t)=>{traces.push({a,t});return true;};
  const scene=new DiscoScene(r),c=contexts[1],scales=[],translations=[],output=context(),alphas=[];
  c.scale=(...args)=>scales.push(args);c.translate=(...args)=>translations.push(args);
  output.drawImage=()=>alphas.push(output.globalAlpha);
  const state={x:545,feet:551,time:2};scene.draw(output,state,.5);scene.draw(output,state,1);
  assert.equal(canvases,2);assert.deepEqual(alphas,[.5,1]);
  assert.ok(scales.some(([x,y])=>x===1.3&&y===1.3));
  assert.ok(translations.some(([x,y])=>x===545&&y===551));
  assert.deepEqual(traces,[{a:{x:545,y:515},t:2},{a:{x:545,y:515},t:2}]);
  assert.notEqual(scene.background,r.bg);
 }finally{if(old===undefined)delete globalThis.document;else globalThis.document=old;}
});
test('fixed disco warning uses actual inspection threats, not a fabricated timer',()=>{
 const r=renderer(),labels=[];r.box=()=>{};r.text=(c,label,x,y)=>labels.push({label,x,y});
 r.discoWarning({}, {activityThreats:()=>[]},{time:1});assert.equal(labels.length,0);
 r.discoWarning({}, {activityThreats:a=>{assert.equal(a,'dance');return['老板'];}},{time:1});
 assert.deepEqual(labels,[{label:'有人靠近…准备收手',x:360,y:127}]);
});
