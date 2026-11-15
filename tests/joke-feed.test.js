import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/engine.js';
function quiet(){const g=new Game(2,123);g.inspectors=[];g.npcs=[];g.setActivity('joke');return g;}
test('一次点击只换一条，不发换条奖励',()=>{
 const g=quiet();assert.equal(g.joke.post,0);
 assert.equal(g.nextJoke(),true);assert.equal(g.joke.post,1);assert.equal(g.coins,0);assert.equal(g.pendingBonus,0);
 assert.equal(g.nextJoke(),true);assert.equal(g.joke.post,2);assert.equal(g.coins,0);
});
test('保留原段子基础收入、金椅和连摸奖金，连续换条不额外加钱',()=>{
 const a=quiet(),b=quiet();b.specials=[{seat:b.player.seat,left:18}];a.step(6);b.step(6);
 const ac=a.coins,bc=b.coins,ap=a.pendingBonus,bp=b.pendingBonus;
 for(let i=0;i<10;i++){a.nextJoke();b.nextJoke();}
 assert.ok(Math.abs(ac-12)<1e-7);assert.ok(Math.abs(bc-24)<1e-7);
 assert.equal(a.coins,ac);assert.equal(b.coins,bc);assert.equal(a.pendingBonus,ap);assert.equal(b.pendingBonus,bp);
});
test('收手期间不换条，重新进入保留当前条数',()=>{
 const g=quiet();g.nextJoke();g.setActivity('work');assert.equal(g.nextJoke(),false);
 g.step(.1);g.setActivity('joke');assert.equal(g.joke.post,1);assert.equal(g.nextJoke(),true);assert.equal(g.joke.post,2);
});
test('暂停、弹窗、离座、移动、收手、锁定与其他活动拒绝换条',()=>{
 for(const change of [g=>{g.paused=true;},g=>{g.modal={kind:'warning'};},g=>{g.player.seat=null;},g=>{g.player.route=[{x:1,y:1}];},g=>{g.player.stopping=.1;},g=>{g.player.lock=1;},g=>{g.player.activity='work';}]){
  const g=quiet();change(g);const before=JSON.stringify(g);assert.equal(g.nextJoke(),false);g.step(0);assert.equal(JSON.stringify(g),before);
 }
});
test('换段子时老板继续巡逻，被抓后不能换条',()=>{
 const g=new Game(2,123);g.npcs=[];g.setActivity('joke');const i=g.inspectors[0],x=i.x;g.nextJoke();g.step(4);assert.notEqual(i.x,x);
 g.inspectors=[i];Object.assign(i,{x:g.player.x,y:g.player.y+30,angle:-Math.PI/2,queue:[{kind:'wait',phase:'checking',left:3,angle:-Math.PI/2}]});
 g.step(.92);assert.equal(g.modal.kind,'warning');assert.equal(g.nextJoke(),false);
});
