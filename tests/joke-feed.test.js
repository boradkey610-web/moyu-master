import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,seats,forecastAll} from '../src/engine.js';
function quiet(){const g=new Game(2,123);g.inspectors=[];g.npcs=[];g.setActivity('joke');return g;}
function finishRound(g){g.step(1.2);for(const [held,seconds]of [[true,2],[false,1],[true,2],[false,1]]){g.holdLaugh(held);g.step(seconds);}}
test('按住压笑消耗气息，松手喘气并涨笑意，交替操作成功只奖一次',()=>{
 const g=quiet();g.step(1.2);g.holdLaugh(true);g.step(2);
 assert.ok(g.joke.laugh<18);assert.ok(g.joke.air<40);const air=g.joke.air;
 g.holdLaugh(false);g.step(1);assert.ok(g.joke.air>air);assert.ok(g.joke.laugh>0);
 g.holdLaugh(true);g.step(2);g.holdLaugh(false);g.step(1);
 assert.equal(g.joke.phase,'success');assert.equal(g.joke.reward,3);assert.ok(Math.abs(g.coins-(7.2*2+3))<1e-6);
 const money=g.coins;g.step(.5);assert.ok(Math.abs(g.coins-money-1)<1e-6);assert.equal(g.soundField.sources.length,0);
});
test('挂机与一直按住都会失败，无额外奖励，结果后自动换条',()=>{
 for(const held of [false,true]){const g=quiet();g.holdLaugh(held);g.step(4.8);
  assert.equal(g.joke.phase,'burst');assert.equal(g.joke.reward,0);assert.ok(Math.abs(g.coins-9.6)<1e-6);
  g.step(1.3);assert.equal(g.joke.post,1);assert.equal(g.joke.phase,'reading');assert.equal(g.joke.held,false);
 }
});
test('成功奖金受金椅与连续奖励叠加，停止才能结算待收',()=>{
 const a=quiet(),b=quiet();b.special={seat:b.player.seat,left:18};finishRound(a);finishRound(b);
 assert.equal(b.joke.reward,6);assert.ok(Math.abs(b.coins-a.coins*2)<1e-6);assert.ok(Math.abs(b.pendingBonus-a.pendingBonus*2)<1e-6);
 const before=a.coins,pending=a.pendingBonus;a.setActivity('work');a.step(.1);assert.ok(a.coins>=before+pending);assert.equal(a.pendingBonus,0);
});
test('收手离开或抓包释放按住，离开不继续小游戏，重入重开当前条',()=>{
 const g=quiet();g.step(1.2);g.holdLaugh(true);g.step(1);g.setActivity('work');assert.equal(g.joke.held,false);g.step(.1);
 const state=JSON.stringify(g.joke);g.step(3);assert.equal(JSON.stringify(g.joke),state);
 g.setActivity('joke');assert.equal(g.joke.phase,'reading');assert.equal(g.joke.time,0);
 g.holdLaugh(true);g.catchPlayer('老板');assert.equal(g.joke.held,false);assert.equal(g.modal.kind,'warning');
});
test('暂停弹窗冻结挑战，输入边界拒绝不合法按住但始终允许释放',()=>{
 const g=quiet();g.step(1.5);g.holdLaugh(true);g.paused=true;const before=JSON.stringify(g);g.step(4);assert.equal(JSON.stringify(g),before);assert.equal(g.holdLaugh(true),false);g.holdLaugh(false);assert.equal(g.joke.held,false);
 for(const change of [g=>g.modal={kind:'warning'},g=>g.player.seat=null,g=>g.player.route=[{x:1,y:1}],g=>g.player.stopping=.1,g=>g.player.lock=1,g=>g.player.activity='work']){const a=quiet();change(a);assert.equal(a.holdLaugh(true),false);}
});
test('笑声只在爆笑座位产生，范围内才听见，换座不会全知追踪，预测不改真实声场',()=>{
 for(const far of [false,true]){
  const g=quiet(),ins=new Game(2,1).inspectors[0];Object.assign(ins,{x:far?12:655,y:far?115:585,angle:0,queue:[{kind:'wait',left:30,angle:0}]});g.inspectors=[ins];g.step(5.2);
  const source=g.soundField.sources[0];assert.equal(source.kind,'joke');assert.equal(source.seat,7);
  if(far){assert.equal(ins.lastHeard,null);continue;}
  assert.equal(ins.lastHeard?.kind,'joke');assert.equal(ins.lastHeard.seat,7);assert.match(g.toast,/笑声/);
  const snapshot=JSON.stringify(g.inspectors);forecastAll(g.inspectors,10);assert.equal(JSON.stringify(g.inspectors),snapshot);
  const heard=structuredClone(ins.lastHeard);g.moveTo(6);g.step(4);assert.deepEqual(ins.lastHeard,heard);assert.equal(source.seat,7);assert.equal(g.soundField.sources.some(s=>s.seat===6),false);
 }
});
test('互动时老板继续巡逻，按住不免疫视觉检查',()=>{
 const g=quiet(),ins=new Game(2,1).inspectors[0];g.inspectors=[ins];g.holdLaugh(true);const x=ins.x;g.step(4);assert.notEqual(ins.x,x);
 Object.assign(ins,{...seats[7],y:seats[7].y+30,angle:-Math.PI/2,queue:[{kind:'wait',phase:'checking',left:3,angle:-Math.PI/2}]});g.step(.92);assert.equal(g.modal.kind,'warning');assert.equal(g.holdLaugh(true),false);
});
