import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/engine.js';

function quiet(){const g=new Game(2,123);g.inspectors=[];g.npcs=[];g.setActivity('joke');return g;}

test('上滑换段子不发奖，点赞每条只发一次',()=>{
 const g=quiet();assert.equal(g.joke.post,0);
 assert.equal(g.jokeAction('like'),true);assert.equal(g.coins,1);assert.equal(g.joke.likes,1);
 assert.equal(g.jokeAction('like'),false);assert.equal(g.coins,1);
 assert.equal(g.jokeAction('next'),true);assert.equal(g.joke.post,1);assert.equal(g.joke.liked,false);assert.equal(g.coins,1);
 assert.equal(g.jokeAction('like'),true);assert.equal(g.coins,2);
});
test('原段子收入保留，点赞奖励参与金椅和连摸奖金',()=>{
 const a=quiet(),b=quiet();b.special={seat:b.player.seat,left:18};a.step(6);b.step(6);
 const ac=a.coins,bc=b.coins,ap=a.pendingBonus,bp=b.pendingBonus;
 a.jokeAction('like');b.jokeAction('like');
 assert.ok(Math.abs(ac-12)<1e-7);assert.equal(a.coins-ac,1);assert.equal(b.coins-bc,2);
 assert.ok(Math.abs((a.pendingBonus-ap)-.4)<1e-7);assert.ok(Math.abs((b.pendingBonus-bp)-.8)<1e-7);
 assert.equal(a.joke.reward,1);assert.equal(b.joke.reward,2);
});
test('收手再进入不能反复领取同一条的点赞奖励',()=>{
 const g=quiet();g.jokeAction('like');g.setActivity('work');
 assert.equal(g.jokeAction('next'),false);g.step(.1);g.setActivity('joke');
 const coins=g.coins;assert.equal(g.jokeAction('like'),false);assert.equal(g.coins,coins);
 assert.equal(g.joke.post,0);assert.equal(g.jokeAction('next'),true);assert.equal(g.jokeAction('like'),true);
});
test('暂停、弹窗、离座、移动、收手、锁定与其他活动拒绝段子互动',()=>{
 for(const change of [g=>{g.paused=true;},g=>{g.modal={kind:'warning'};},g=>{g.player.seat=null;},g=>{g.player.route=[{x:1,y:1}];},g=>{g.player.stopping=.1;},g=>{g.player.lock=1;},g=>{g.player.activity='work';}]){
  const g=quiet();change(g);const before=JSON.stringify(g);
  assert.equal(g.jokeAction('like'),false);assert.equal(g.jokeAction('next'),false);assert.equal(JSON.stringify(g),before);
 }
});
test('暂停冻结爱心反馈计时，恢复后继续',()=>{
 const g=quiet();g.jokeAction('like');g.paused=true;const before=JSON.stringify(g);g.step(2);assert.equal(JSON.stringify(g),before);
 g.paused=false;g.step(.2);assert.ok(g.joke.heartLeft>0&&g.joke.heartLeft<.8);
});
test('刷段子时老板继续巡逻，被抓后不能操作卡片',()=>{
 const g=new Game(2,123);g.npcs=[];g.setActivity('joke');const i=g.inspectors[0],x=i.x;g.step(4);assert.notEqual(i.x,x);
 g.inspectors=[i];Object.assign(i,{x:g.player.x,y:g.player.y+30,angle:-Math.PI/2,queue:[{kind:'wait',phase:'checking',left:3,angle:-Math.PI/2}]});
 g.step(.92);assert.equal(g.modal.kind,'warning');assert.equal(g.jokeAction('like'),false);assert.equal(g.jokeAction('next'),false);
});
