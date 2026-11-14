import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/engine.js';
import {createRunner,jumpRunner,stepRunner} from '../src/runner.js';

function play(game,seconds){
 for(let t=0;t<seconds;t+=.02){
  if(game.runner.obstacle.x<=135)game.jump();
  game.step(.02);
 }
}
function quiet(){const g=new Game(2,123);g.inspectors=[];g.npcs=[];g.setActivity('game');return g;}

test('selecting game starts running immediately without jumping or earning idle coins',()=>{
 const g=quiet(),x=g.runner.obstacle.x;g.step(1);
 assert.ok(g.runner.clock>.99);assert.ok(g.runner.obstacle.x<x);assert.equal(g.runner.height,0);
 assert.equal(g.coins,0);assert.equal(g.pendingBonus,0);
 g.step(4);assert.equal(g.runner.cleared,0);assert.equal(g.coins,0);
 assert.ok(g.elapsed>4.99);assert.ok(g.time<86);
});
test('tap starts a jump, prevents airborne and repeated same-frame jumps, then lands',()=>{
 const r=createRunner();assert.equal(jumpRunner(r),true);assert.equal(jumpRunner(r),false);
 stepRunner(r,.02);assert.ok(r.height>0);assert.equal(jumpRunner(r),false);
 for(let i=0;i<45;i++)stepRunner(r,.02);
 assert.equal(r.height,0);assert.equal(jumpRunner(r),true);
});
test('actual timed jumps clear obstacles, increase rewards and earn pending bonus',()=>{
 const g=quiet();play(g,12);
 assert.ok(g.runner.cleared>=4);assert.ok(g.runner.streak>=4);assert.ok(g.coins>=22);assert.ok(g.pendingBonus>0);
});
test('cleared obstacle keeps its appearance and scrolls left without scoring twice',()=>{
 const r=createRunner();r.height=35;r.obstacle.x=43;
 assert.equal(stepRunner(r,.02),4);
 assert.ok(r.passedObstacle);assert.ok(r.passedObstacle.x>0);
 assert.equal(r.passedObstacle.variant,0);assert.equal(r.obstacle.variant,1);
 const x=r.passedObstacle.x;
 assert.equal(stepRunner(r,.1),0);assert.ok(r.passedObstacle.x<x);
 assert.equal(r.cleared,1);assert.equal(r.streak,1);
});
test('passed obstacle is removed only when its full artwork has left the screen',()=>{
 const r=createRunner();r.height=35;r.obstacle.x=43;stepRunner(r,.02);
 assert.ok(r.passedObstacle);
 r.passedObstacle.x=-r.passedObstacle.width+1;
 stepRunner(r,.002);assert.ok(r.passedObstacle,'partly visible obstacle must remain');
 stepRunner(r,.05);assert.equal(r.passedObstacle,null);
 assert.equal(r.cleared,1);
});
test('missing a jump clears the streak and gives no reward, recovery allows another attempt',()=>{
 const r=createRunner();r.streak=3;r.obstacle.x=90;
 assert.equal(stepRunner(r,.02),0);assert.equal(r.streak,0);assert.ok(r.hitLeft>0);
 assert.equal(jumpRunner(r),false);
 for(let i=0;i<35;i++)stepRunner(r,.02);
 assert.equal(jumpRunner(r),true);
});
test('gold chair doubles obstacle income and pending bonus',()=>{
 const a=quiet(),b=quiet();b.special={seat:b.player.seat,left:18};
 play(a,10);play(b,10);
 assert.ok(a.coins>0);assert.equal(b.coins,2*a.coins);assert.equal(b.pendingBonus,2*a.pendingBonus);assert.equal(Number(b.runner.feedback.slice(1)),2*Number(a.runner.feedback.slice(1)));
});
test('pause freezes runner, office and input together',()=>{
 const g=quiet();g.jump();g.step(.1);g.paused=true;
 const before=JSON.stringify(g);assert.equal(g.jump(),false);g.step(3);assert.equal(JSON.stringify(g),before);
});
test('stop blocks jumps and scoring immediately, then settles earned bonus at work',()=>{
 const g=quiet();play(g,8);const pending=g.pendingBonus,coins=g.coins;
 assert.ok(pending>0);g.setActivity('work');const runner=JSON.stringify(g.runner);
 assert.equal(g.jump(),false);g.step(.2);assert.equal(g.coins,coins);assert.equal(JSON.stringify(g.runner),runner);
 g.step(.3);assert.equal(g.player.activity,'work');assert.equal(g.pendingBonus,0);assert.equal(g.coins,coins+pending);
});
test('switching activity or moving cannot keep generating runner rewards',()=>{
 const g=quiet();g.jump();g.step(.1);g.moveTo(6);assert.equal(g.jump(),false);g.step(1);
 assert.equal(g.player.seat,null);assert.equal(g.coins,0);
});
test('catch clears pending rewards and freezes the game behind the warning',()=>{
 const g=quiet();play(g,8);assert.ok(g.pendingBonus>0);const coins=g.coins;
 g.catchPlayer('老板');const before=JSON.stringify(g.runner);g.step(2);
 assert.equal(g.coins,coins);assert.equal(g.pendingBonus,0);assert.equal(g.jump(),false);assert.equal(JSON.stringify(g.runner),before);
});
test('patrol continues during the runner and can catch an exposed player',()=>{
 const g=new Game(2,123);g.npcs=[];g.setActivity('game');g.jump();
 const inspector=g.inspectors[0],x=inspector.x;g.step(4);assert.notEqual(inspector.x,x);
 Object.assign(inspector,{x:g.player.x,y:g.player.y+30,queue:[{kind:'wait',phase:'checking',left:3,angle:-Math.PI/2}]});
 g.step(.72);assert.equal(g.modal.kind,'warning');assert.equal(g.player.activity,'work');
});
