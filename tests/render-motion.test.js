import test from 'node:test';
import assert from 'node:assert/strict';
import {Renderer} from '../src/render.js';

const renderer=()=>Object.assign(Object.create(Renderer.prototype),{motion:new Map(),facings:new Map()});
test('下行抵达检查点的最后一步，不能被检查朝向覆盖为背面',()=>{
 const r=renderer();
 r.pose({x:65,y:348,angle:Math.PI/2,queue:[{kind:'move',x:65,y:350}]},'boss');
 const pose=r.pose({x:65,y:350,angle:-Math.PI/2,queue:[{kind:'wait',left:3}]},'boss');
 assert.equal(pose.direction,'down');
 assert.equal(pose.moving,true);
});
test('下行后左右转弯以实际位移确定朝向，停步才切入站姿',()=>{
 for(const [dx,expected] of [[2,'right'],[-2,'left']]){
  const r=renderer();
  r.pose({x:355,y:348,angle:Math.PI/2,queue:[{kind:'move',x:355,y:350}]},'boss');
  r.pose({x:355,y:350,angle:-Math.PI/2,queue:[{kind:'wait',left:0}]},'boss');
  const turn={x:355+dx,y:350,angle:-Math.PI/2,queue:[{kind:'move',x:dx>0?655:65,y:350}]};
  assert.equal(r.pose(turn,'boss').direction,expected);
  const idle=r.pose({...turn,angle:dx>0?0:Math.PI,queue:[{kind:'wait',left:2}]},'boss');
  assert.equal(idle.direction,expected);assert.equal(idle.moving,false);
 }
});
test('刚解除招呼时使用下一段路线朝向，不复用旧检查朝向',()=>{
 const r=renderer();
 const actor={x:65,y:350,angle:-Math.PI/2,queue:[{kind:'move',x:65,y:585}],hold:2};
 r.pose(actor,'boss');
 const pose=r.pose({...actor,hold:0},'boss');
 assert.equal(pose.direction,'down');assert.equal(pose.moving,true);
});
test('坐姿素材未加载时必须进入坐姿回退，不能画成站在椅子上',()=>{
 const r=renderer();r.art={player:{}};
 const c=new Proxy({}, {get:()=>()=>{throw new Error('不应调用站姿绘制');}});
 assert.equal(r.paintedPerson(c,{type:'player',x:0,y:0,activity:'work'},{seated:true,direction:'up'},0),false);
});
test('上下行走的两个接触相位分别使用左腿和右腿素材，过渡帧不复用同侧抬脚',()=>{
 const r=renderer();r.art={boss:{},idle:{},back_steps:{},front_steps:{}};r.ellipse=()=>{};
 const c={save(){},restore(){}};let calls=[];r.sprite=(...args)=>{calls.push(args.slice(1,4));return true;};
 for(const [direction,atlas]of [['up','back_steps'],['down','front_steps']]){
  calls=[];
  for(const phase of [0,1,2,3])r.paintedPerson(c,{type:'boss',x:65,y:350,activity:'work'},{direction,seated:false,moving:true,travel:phase*8.5},0);
  assert.deepEqual(calls,[[atlas,0,1],['idle',direction==='up'?2:1,1],[atlas,1,1],['idle',direction==='up'?2:1,1]]);
 }
});
test('占座人物将金椅状态传入前层椅背，包含玩家与同事',()=>{
 const r=renderer();r.art={seated:{}};r.sprite=()=>true;let golds=[];r.chair=(c,x,y,gold)=>golds.push(gold);
 for(const type of ['player','npc0'])for(const gold of [true,false])r.paintedPerson({}, {type,x:0,y:0,activity:'work',gold},{seated:true},0);
 assert.deepEqual(golds,[true,false,true,false]);
});
