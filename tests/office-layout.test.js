import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,seats,nodes,pathBetween,advanceInspectors,forecastAll} from '../src/engine.js';

test('八工位两排均匀分布，不能只删第三排后留下大片空地',()=>{
 const g=new Game(0,1),left=g.layout.desks.filter(d=>d.col===0),gaps=[left[0].y-89,left[1].y-(left[0].seatY+40),844-(left[1].seatY+40)];
 assert.ok(Math.max(...gaps)-Math.min(...gaps)<=30,`上下及排间留白应均衡，实际${gaps}`);
});

test('六关工位按8、12、16递进，初始角色座位有效且互不占用',()=>{
 for(const [level,count] of [8,8,12,12,16,16].entries()){
  const g=new Game(level,31);
  assert.ok(g.layout,'对局应提供当前办公室布局');
  assert.equal(g.layout.seats.length,count);
  assert.deepEqual(g.layout.seats.map(s=>s.id),Array.from({length:count},(_,i)=>i));
  const occupied=[g.player,...g.npcs].map(a=>a.seat);
  assert.equal(new Set(occupied).size,occupied.length);
  assert.equal(g.npcs.length,g.config.npcs);
  for(const actor of [g.player,...g.npcs])assert.deepEqual({x:actor.x,y:actor.y},{x:g.layout.seats[actor.seat].x,y:g.layout.seats[actor.seat].y});
 }
 assert.equal(seats.length,12);assert.equal(nodes.length,12);
 assert.deepEqual(pathBetween(seats[6],seats[7]).at(-1),{x:seats[7].x,y:seats[7].y});
});

function crosses(a,b,rect){
 const e=1e-6;
 if(Math.abs(a.x-b.x)<e)return a.x>rect.x+e&&a.x<rect.x+rect.w-e&&Math.max(a.y,b.y)>rect.y+e&&Math.min(a.y,b.y)<rect.y+rect.h-e;
 return a.y>rect.y+e&&a.y<rect.y+rect.h-e&&Math.max(a.x,b.x)>rect.x+e&&Math.min(a.x,b.x)<rect.x+rect.w-e;
}
test('三档布局所有座位互通，正交路线不穿真实桌面',()=>{
 for(const level of [0,2,5]){
  const g=new Game(level,17);assert.ok(g.layout,'寻路应支持关卡布局');
  for(const a of g.layout.seats)for(const b of g.layout.seats){
   let previous=a;const route=pathBetween(a,b,g.layout);
   assert.ok(route.length);
   for(const point of route){
    assert.ok(Number.isFinite(point.x)&&Number.isFinite(point.y));
    assert.ok(Math.abs(previous.x-point.x)<1e-6||Math.abs(previous.y-point.y)<1e-6);
    for(const desk of g.layout.desks)assert.equal(crosses(previous,point,desk),false,`${g.layout.seats.length}座路径穿桌 ${a.id}→${b.id}`);
    previous=point;
   }
   assert.deepEqual(previous,{x:b.x,y:b.y});
  }
 }
});

test('两个不同布局对局交替移动不串图，默认12座数据不变',()=>{
 const small=new Game(0,8),large=new Game(5,9),defaults=JSON.stringify({seats,nodes});
 assert.ok(small.layout&&large.layout,'每个对局应有自己的布局');
 for(const g of [small,large]){g.inspectors=[];g.npcs=[];assert.ok(g.moveTo(0));}
 for(let i=0;i<1000;i++){small.step(.01);large.step(.01);}
 for(const g of [small,large]){assert.equal(g.player.seat,0);assert.equal(g.player.x,g.layout.seats[0].x);assert.equal(g.player.y,g.layout.seats[0].y);}
 assert.equal(small.layout.seats.length,8);assert.equal(large.layout.seats.length,16);
 assert.equal(JSON.stringify({seats,nodes}),defaults);
});

test('三档办公室巡视覆盖有效桌组，联合预测与真实推进一致',()=>{
 for(const level of [0,2,5]){
  const g=new Game(level,9);assert.ok(g.layout,'检查者应使用关卡布局');
  for(const ins of g.inspectors)assert.equal(ins.layout,g.layout);
  const before=JSON.stringify(g.inspectors),predicted=forecastAll(g.inspectors,10),actual=structuredClone(g.inspectors);
  assert.equal(JSON.stringify(g.inspectors),before);
  for(let step=1;step<=100;step++){
   advanceInspectors(actual,.1);
   for(let i=0;i<actual.length;i++){
    const p=predicted[i][step];
    assert.ok(Math.hypot(actual[i].x-p.x,actual[i].y-p.y)<1e-6);
    assert.equal(actual[i].hidden,p.hidden);
   }
  }
  const patrol=structuredClone(g.inspectors);for(const ins of patrol)ins.soundField.office=null;
  advanceInspectors(patrol,160);
  const visited=new Set(patrol.flatMap(i=>Object.keys(i.checkedZones).map(Number)));
  assert.equal(visited.size,g.layout.desks.length,'所有桌组都能被自然巡视覆盖');
  for(const zone of visited)assert.ok(zone>=0&&zone<g.layout.desks.length);
 }
});

test('三档布局闻声后仍查旧座位，换座不会让老板全知追踪',()=>{
 for(const level of [0,2,5]){
  const g=new Game(level,7),ins=g.inspectors[0],p=g.player;g.npcs=[];g.inspectors=[ins];g.tutorialSeen=true;g.soundField.office=null;
  Object.assign(ins,{x:p.x+70,y:p.y+44,angle:0,queue:[{kind:'wait',left:20,angle:0}]});
  g.setActivity('dance');g.step(3);assert.ok(ins.lastHeard);
  const heard=structuredClone(ins.lastHeard);g.setActivity('work');g.step(1.02);g.moveTo(0);g.step(.6);
  assert.deepEqual(ins.lastHeard,heard);assert.equal(heard.x,g.layout.seats[heard.seat].x);assert.equal(heard.y,g.layout.seats[heard.seat].y);
 }
});

test('三档办公室开会沿当前出口正常离场，预测包含停留和返回',()=>{
 for(const level of [0,2,5]){
  const g=new Game(level,8);g.soundField.office=null;g.inventory.meeting=1;
  assert.equal(g.useMeeting(0),true);
  const ins=g.inspectors[0],route=ins.queue.filter(q=>q.kind==='move'),door=route[0];
  assert.ok(g.layout.exits.some(e=>e.point.x===door.x&&e.point.y===door.y));
  const predicted=forecastAll(g.inspectors,12),actual=structuredClone(g.inspectors);
  advanceInspectors(actual,12);
  assert.ok(predicted[0].some(p=>p.hidden));assert.equal(actual[0].hidden,false);
  assert.ok(Math.hypot(actual[0].x-predicted[0].at(-1).x,actual[0].y-predicted[0].at(-1).y)<1e-6);
 }
});
