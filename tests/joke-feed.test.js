import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/engine.js';
function quiet(){const g=new Game(2,123);g.inspectors=[];g.npcs=[];g.setActivity('joke');return g;}
function finish(g){const count=g.comic.post%3===0?3:1;for(let n=0;n<count;n++){assert.equal(g.actComic(),true);g.step(n<count-1?.36:g.comic.post%3===2?2.6:2);}}
test('点饼分三段，动画中不重复触发，完成一幕只发一次奖励',()=>{
 const g=quiet();assert.equal(g.comic.phase,'ready');assert.equal(g.actComic(),true);assert.equal(g.actComic(),false);assert.equal(g.comic.step,1);g.step(.36);assert.equal(g.comic.phase,'ready');
 g.actComic();g.step(.36);g.actComic();g.step(2.02);assert.equal(g.comic.phase,'done');assert.equal(g.comic.reward,3);assert.ok(Math.abs(g.coins-(2.74*2+3))<1e-6);
 const coins=g.coins;assert.equal(g.actComic(),false);g.step(.5);assert.ok(Math.abs(g.coins-coins-1)<1e-6);
 g.step(2);assert.equal(g.comic.post,0,'结果已满2秒但整幕不足6秒，不能提前轮换');g.step(.76);assert.equal(g.comic.post,1);
});
test('三幕循环，各幕至少6秒且结果停留2秒；挂机无完成奖也不强迫失败',()=>{
 const g=quiet();g.step(10);assert.equal(g.comic.post,0);assert.equal(g.comic.phase,'ready');assert.ok(Math.abs(g.coins-20)<1e-6);
 for(let post=0;post<4;post++){assert.equal(g.comic.post,post);finish(g);assert.equal(g.comic.phase,'done');g.step(1.9);assert.equal(g.comic.post,post);g.step(6);assert.equal(g.comic.post,post+1);assert.equal(g.comic.phase,'ready');}
 assert.equal(g.soundField.sources.length,0);
});
test('完成奖金受金椅、连摸叠加，重入保留进度不能刷奖',()=>{
 const a=quiet(),b=quiet();b.special={seat:b.player.seat,left:18};for(const g of [a,b]){g.step(3);finish(g);}
 assert.equal(a.comic.reward,3);assert.equal(b.comic.reward,6);assert.ok(Math.abs(b.coins-2*a.coins)<1e-6);assert.ok(Math.abs(b.pendingBonus-2*a.pendingBonus)<1e-6);
 a.setActivity('work');a.step(.1);const state=JSON.stringify(a.comic),money=a.coins;a.step(3);assert.equal(JSON.stringify(a.comic),state);a.setActivity('joke');assert.equal(JSON.stringify(a.comic),state);assert.equal(a.actComic(),false);assert.equal(a.coins,money);
});
test('暂停弹窗冻结漫画，收手和离座不接受新点击也不继续演出',()=>{
 for(const mutate of [g=>g.paused=true,g=>g.modal={kind:'warning'},g=>g.player.seat=null,g=>g.player.route=[{x:1,y:1}],g=>g.player.lock=1,g=>g.player.activity='work']){const g=quiet();mutate(g);assert.equal(g.actComic(),false);}
 const g=quiet();g.actComic();g.step(.1);g.paused=true;const before=JSON.stringify(g);g.step(2);assert.equal(JSON.stringify(g),before);g.paused=false;g.setActivity('work');assert.equal(g.actComic(),false);const t=g.comic.clock;g.step(1);assert.equal(g.comic.clock,t);
});
test('漫画照常巡逻、视觉抓包仍有效，首次警告不扣工资',()=>{
 const g=quiet(),ins=new Game(2,1).inspectors[0];g.inspectors=[ins];const x=ins.x;g.actComic();g.step(4);assert.notEqual(ins.x,x);Object.assign(ins,{x:g.player.x,y:g.player.y+30,angle:-Math.PI/2,queue:[{kind:'wait',phase:'checking',left:3,angle:-Math.PI/2}]});const before=g.coins;g.step(.92);assert.equal(g.modal.kind,'warning');assert.ok(g.coins>=before);assert.equal(g.actComic(),false);
});
