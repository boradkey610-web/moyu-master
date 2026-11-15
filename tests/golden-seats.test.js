import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,pathBetween} from '../src/engine.js';
function quiet(level=2){const g=new Game(level,17);g.inspectors=[];g.npcs=[];return g;}

test('第十秒补齐金椅，首关一把其余两把，各自十八秒并分散桌组',()=>{
 for(let level=0;level<6;level++){
  const g=quiet(level);assert.ok(Array.isArray(g.specials),'金椅应使用独立生命周期集合');
  g.step(9.99);assert.equal(g.specials.length,0);g.step(.01);
  assert.equal(g.specials.length,level===0?1:2);
  assert.equal(new Set(g.specials.map(s=>s.seat)).size,g.specials.length);
  assert.equal(new Set(g.specials.map(s=>Math.floor(s.seat/2))).size,g.specials.length);
  for(const s of g.specials){assert.equal(s.left,18);assert.equal(g.occupied(s.seat),false);}
 }
});
test('一把到期时另一把继续原倒计时，随后补刷缺口',()=>{
 const g=quiet();g.specialAt=999;g.specials=[{seat:0,left:.2},{seat:2,left:8}];
 g.step(.3);assert.equal(g.specials.length,1);assert.equal(g.specials[0].seat,2);assert.ok(Math.abs(g.specials[0].left-7.7)<1e-6);
 g.specialAt=g.elapsed+.01;g.step(.02);
 assert.equal(g.specials.length,2);const retained=g.specials.find(s=>s.seat===2);assert.ok(Math.abs(retained.left-7.68)<1e-6);
 assert.notEqual(g.specials.find(s=>s!==retained).seat,g.player.seat);
});
test('没有空座时等待，腾出工位后在下一次检查补刷且不覆盖占用座',()=>{
 const g=quiet();assert.ok(Array.isArray(g.specials),'金椅应使用集合');
 g.npcs=g.layout.seats.filter(s=>s.id!==g.player.seat).map(s=>({...s,seat:s.id,route:[],next:Infinity}));
 g.step(10);assert.equal(g.specials.length,0);
 const freed=g.npcs.pop().seat;g.step(.8);assert.equal(g.specials.length,0);g.step(.2);
 assert.deepEqual(g.specials.map(s=>s.seat),[freed]);
 const second=g.npcs.pop().seat;g.step(1);assert.equal(g.specials.length,2);assert.ok(g.specials.some(s=>s.seat===second));
 for(const chair of g.specials)assert.equal(g.occupied(chair.seat),false);
});
test('坐上的金椅仍独立计时，暂停冻结到期与补刷',()=>{
 const g=quiet();g.specials=[{seat:g.player.seat,left:1},{seat:0,left:3}];g.specialAt=999;
 g.step(.4);const before=JSON.stringify(g.specials),next=g.specialAt;g.paused=true;g.step(40);
 assert.equal(JSON.stringify(g.specials),before);assert.equal(g.specialAt,next);
 g.paused=false;g.step(.7);assert.equal(g.specials.length,1);assert.equal(g.specials[0].seat,0);assert.ok(Math.abs(g.specials[0].left-1.9)<1e-6);
});
test('每次补刷遵守上限，并优先选择实际六秒内可达机会',()=>{
 for(let seed=1;seed<=30;seed++){
  const g=new Game(3,seed);g.spawnSpecial();assert.ok(Array.isArray(g.specials),'应能生成多把金椅');
  assert.equal(g.specials.length,2);const original=g.specials.map(s=>s.seat);g.spawnSpecial();assert.deepEqual(g.specials.map(s=>s.seat),original);
  let previous=g.player;const travel=pathBetween(g.player,g.layout.seats[g.specials[0].seat],g.layout).reduce((sum,p)=>{const d=Math.hypot(p.x-previous.x,p.y-previous.y);previous=p;return sum+d;},0)/110;
  assert.ok(travel<=6+1e-6);
 }
});
