import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,pathBetween} from '../src/engine.js';

function walkingDistance(g,seat){let previous=g.player;return pathBetween(g.player,seat,g.layout).reduce((sum,p)=>{const distance=Math.hypot(p.x-previous.x,p.y-previous.y);previous=p;return sum+distance;},0);}
test('第二关起首次掉落优先开会通知，首关仍是反光镜',()=>{
 for(let level=0;level<6;level++)for(let seed=1;seed<=30;seed++){
  const g=new Game(level,seed);g.spawnDrop();assert.equal(g.drops[0].type,level===0?'mirror':'meeting');
 }
});
test('地图互补掉落，不占用背包已有道具的位置',()=>{
 const g=new Game(2,1);g.spawnDrop();g.spawnDrop();assert.deepEqual(g.drops.map(d=>d.type),['meeting','mirror']);
 const before=JSON.stringify(g.drops);g.spawnDrop();assert.equal(JSON.stringify(g.drops),before);
 g.drops=[];g.inventory.meeting=1;g.spawnDrop();assert.deepEqual(g.drops.map(d=>d.type),['mirror']);
 g.drops=[];g.inventory.mirror=1;g.spawnDrop();assert.equal(g.drops.length,0);
 g.inventory.meeting=0;g.spawnDrop();assert.equal(g.drops[0].type,'meeting');
 g.drops=[];g.npcs=g.layout.seats.filter(s=>s.id!==g.player.seat).map(s=>({...s,seat:s.id}));g.spawnDrop();assert.equal(g.drops.length,0);
});
test('掉落随机放在实际步行最近的三个可用空工位内',()=>{
 for(const level of [0,2,5])for(let seed=1;seed<=30;seed++){
  const g=new Game(level,seed),distances=g.empty().map(seat=>walkingDistance(g,seat)).sort((a,b)=>a-b);
  g.spawnDrop();const drop=g.drops[0];assert.equal(g.occupied(drop.seat),false);
  assert.ok(walkingDistance(g,g.layout.seats[drop.seat])<=distances[Math.min(2,distances.length-1)]+1e-8);
 }
});
test('首刷仍是14秒、间隔22秒，暂停冻结且换座拾取后可正常开会',()=>{
 const g=new Game(2,100),boss=g.inspectors[0];g.inspectors=[];g.specialAt=Infinity;
 g.step(13.9);assert.equal(g.drops.length,0);g.paused=true;g.step(30);assert.equal(g.drops.length,0);
 g.paused=false;g.step(.2);assert.equal(g.drops[0].type,'meeting');assert.equal(g.dropAt,36);
 assert.equal(g.moveTo(g.drops[0].seat),true);
 for(let i=0;i<800&&!g.inventory.meeting;i++)g.step(.02);
 assert.equal(g.inventory.meeting,1);assert.equal(g.stats.picked,1);
 g.inspectors=[boss];assert.equal(g.useMeeting(0),true);assert.equal(g.inventory.meeting,0);
 assert.equal(boss.leaving,true);assert.equal(boss.queue.find(q=>q.hidden).left,10);
});
