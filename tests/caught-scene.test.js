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

test('手机抓包仅被发现后直接对话，末尾停在第一人称回应且不倒播',()=>{
 for(const who of ['老板','主管']){
  const t=new CaughtTimeline(who,false,'joke'),phases=new Set();
  for(let i=0;i<100;i++){phases.add(t.state().phase);t.advance(.1);}
  assert.deepEqual([...phases],['discovery','talk','reaction','reply']);
  assert.equal(t.state().text,caughtLines(who,'joke')[1]);
  t.time=.71;assert.equal(t.state().phase,'talk');assert.equal(t.state().speaker,who);
  t.time=t.talkStart+.3;assert.ok(t.state().text.length>0);
  t.skip();const end=t.time;t.advance(.1);assert.equal(t.time,end);
 }
});
test('看段子抓包的提醒、罚款、动画和回应均保持冻结，跳过不解除暂停',()=>{
 for(const who of ['老板','主管'])for(const fine of [false,true]){
  const g=new Game(2,1);g.inspectors=[];g.npcs=[];g.setActivity('joke');g.coins=80;g.warned=fine;
  g.catchPlayer(who);assert.equal(g.modal.activity,'joke');assert.equal(g.coins,fine?30:80);
  const before=JSON.stringify({time:g.time,elapsed:g.elapsed,coins:g.coins,joke:g.joke,drops:g.drops});
  const t=new CaughtTimeline(who,false,'joke');t.advance(.1);const time=t.time;t.advance(10,true);assert.equal(t.time,time);
  t.skip();for(let i=0;i<100;i++)g.step(.1);
  assert.equal(JSON.stringify({time:g.time,elapsed:g.elapsed,coins:g.coins,joke:g.joke,drops:g.drops}),before);
  assert.ok(g.modal);assert.ok(t.state().ready);g.dismiss();g.step(.1);assert.ok(g.time<JSON.parse(before).time);
 }
 assert.equal(new CaughtTimeline('主管',true,'joke').state().phase,'reply');
});
