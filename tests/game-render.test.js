import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Renderer} from '../src/render.js';
import {Game} from '../src/engine.js';
import {createOfficeLayout} from '../src/office-layout.js';
import {monitorRect} from '../src/game-monitor.js';
const manifest=JSON.parse(readFileSync(new URL('../assets/manifest.json',import.meta.url)));
const context=()=>{const calls=[];return {calls,c:new Proxy({}, {get:(o,k)=>o[k]??((...args)=>calls.push([k,...args])),set:(o,k,v)=>{o[k]=v;return true;}})};};
const renderer=()=>Object.assign(Object.create(Renderer.prototype),{art:{desk:{meta:manifest.desk,img:{}},'player-typing':{meta:manifest['player-typing'],img:{}}},motion:new Map()});

test('runtime typing atlas loads the six original cells',()=>{
 const m=manifest['player-typing'],png=readFileSync(new URL('../'+m.src,import.meta.url));
 assert.equal(png.readUInt32BE(16),m.columns*m.cellWidth);
 assert.equal(png.readUInt32BE(20),m.rows*m.cellHeight);
 assert.equal(new Set(m.sequence).size,6);
});
test('monitor crops follow every desk in 8, 12 and 16 seat layouts',()=>{
 for(const count of [8,12,16]){
  const layout=createOfficeLayout(count);
  for(const seat of layout.seats){
   const d=layout.desks.find(d=>d.row===seat.row&&d.col===seat.col),rect=monitorRect(manifest.desk,seat,layout);
   assert.ok(rect.x>=d.x&&rect.x+rect.width<=d.x+d.w);
   assert.ok(rect.y>=d.y&&rect.y+rect.height<=d.y+d.h);
   assert.ok(Math.abs(rect.width/layout.scale-(seat.id%2?255:256)*238/(manifest.desk.bounds[2]-manifest.desk.bounds[0]))<1e-8);
   const other=monitorRect(manifest.desk,layout.seats[seat.id^1],layout);
   assert.ok(seat.id%2?other.x+other.width<rect.x:rect.x+rect.width<other.x);
  }
 }
});
test('only seated player gaming replaces the character; work, jokes and coworkers keep existing poses',()=>{
 const r=renderer(),{c,calls}=context(),a={type:'player',x:545,y:515,activity:'game'};
 r.chair=()=>{};r.sprite=()=>assert.fail('game must use typing atlas');
 assert.equal(r.paintedPerson(c,a,{seated:true},.51),true);
 assert.equal(calls.find(v=>v[0]==='drawImage')[2],5*384);
 r.art.seated={};const poses=[];r.sprite=(c,name,row,frame)=>poses.push([name,row,frame]);
 for(const actor of [{...a,activity:'work'},{...a,activity:'joke'},{...a,type:'npc0'}])r.paintedPerson(c,actor,{seated:true},0);
 assert.deepEqual(poses,[['seated',0,0],['seated',0,1],['seated',1,0]]);
 delete r.art['player-typing'];r.paintedPerson(c,a,{seated:true},0);
 assert.deepEqual(poses.at(-1),['seated',0,2]);
});
test('monitor persists while stopping and resets on work, movement or catch; pause freezes animation',()=>{
 const r=renderer(),g=new Game(2,1);g.inspectors=[];g.npcs=[];
 g.setActivity('game');g.step(.2);
 const first=context();r.gameMonitor(first.c,g);assert.ok(first.calls.length>0);
 g.paused=true;g.step(4);const paused=context();r.gameMonitor(paused.c,g);assert.deepEqual(paused.calls,first.calls);
 g.paused=false;g.setActivity('work');assert.ok(g.player.stopping>0);
 const stopping=context();r.gameMonitor(stopping.c,g);assert.ok(stopping.calls.length>0);
 g.step(1);const work=context();r.gameMonitor(work.c,g);assert.equal(work.calls.length,0);
 g.setActivity('game');g.catchPlayer('老板');const caught=context();r.gameMonitor(caught.c,g);assert.equal(caught.calls.length,0);
 g.player.activity='game';g.player.route=[{x:100,y:100}];const moving=context();r.gameMonitor(moving.c,g);assert.equal(moving.calls.length,0);
});
test('game screen is drawn before actors and typing uses simulation time during pause',()=>{
 const r=renderer(),g=new Game(2,1),{c}=context(),order=[];g.inspectors=[];g.npcs=[];g.setActivity('game');
 r.c=c;r.bg={};r.layout=g.layout;
 for(const name of ['soundSources','chair','text','chip','noiseBadge','noiseMeter','incomePop','playerStakes','momentFeedback','soundSignals','inspectionLabel','discoOverlay'])r[name]=()=>{};
 r.gameMonitor=()=>order.push('screen');r.paintedPerson=(c,a,pose,t)=>{order.push(['actor',t]);return true;};
 g.elapsed=.51;g.paused=true;r.draw(g,123);r.draw(g,456);
 assert.deepEqual(order,['screen',['actor',.51],'screen',['actor',.51]]);
});
