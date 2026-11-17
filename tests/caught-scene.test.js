import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/engine.js';
import {CaughtTimeline,caughtLines} from '../src/caught-scene.js';

test('抓包快照保留小游戏瞬间且不共享可变障碍，两种处罚均记录活动',()=>{
 for(const warned of [false,true]){
  const g=new Game(2,1);g.inspectors=[];g.npcs=[];g.setActivity('game');g.warned=warned;g.coins=80;
  g.runner.height=23;g.runner.obstacle.x=177;
  g.catchPlayer('主管');const snapshot=g.modal.runnerSnapshot;
  assert.equal(g.modal.activity,'game');assert.equal(snapshot.height,23);assert.equal(snapshot.obstacle.x,177);
  assert.equal(g.player.activity,'work');assert.equal(g.coins,warned?30:80);
  g.runner.obstacle.x=200;assert.equal(snapshot.obstacle.x,177);
 }
});
test('演出运行与最终等待均不推进仿真，点击回应才允许恢复',()=>{
 const g=new Game(2,1);g.inspectors=[];g.npcs=[];g.setActivity('game');g.catchPlayer('老板');
 const timeline=new CaughtTimeline('老板');
 const snapshot=()=>JSON.stringify({time:g.time,elapsed:g.elapsed,coins:g.coins,runner:g.runner,field:g.soundField,lock:g.player.lock,drops:g.drops});
 const before=snapshot();
 for(let i=0;i<200;i++){timeline.advance(.1);g.step(.1);}
 assert.equal(timeline.state().phase,'reply');assert.equal(snapshot(),before);
 assert.equal(g.jump(),false);g.dismiss();g.step(.1);assert.ok(g.time<JSON.parse(before).time);
});
test('隐藏页面暂停演出且不补算长时间，跳过与减少动态直接停在回应',()=>{
 const t=new CaughtTimeline('主管');t.advance(.1);const before=t.time;t.advance(20,true);assert.equal(t.time,before);
 t.advance(20);assert.equal(t.time,before+.1);t.skip();assert.equal(t.state().ready,true);
 assert.equal(new CaughtTimeline('老板',true).state().phase,'reply');
});
test('说话结束保持闭嘴，回应后不循环，主管采用生气台词',()=>{
 const t=new CaughtTimeline('主管');t.time=t.talkEnd-.01;
 assert.equal(t.state().mouth,0);assert.equal(t.state().text,caughtLines('主管')[0]);
 assert.match(t.state().text,/现在就关掉/);t.skip();const end=t.time;t.advance(.1);assert.equal(t.time,end);
});
