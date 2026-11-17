import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/engine.js';

function playing(){
 const g=new Game(2,1);g.tutorialSeen=true;g.npcs=[];g.soundField.office=null;g.setActivity('game');return g;
}
test('实际巡视听见游戏后走近检查，触发免费提醒和下一次50金币罚款',()=>{
 for(const warned of [false,true]){
  const g=playing();g.warned=warned;g.coins=100;
  for(let n=0;n<3000&&!g.modal;n++)g.step(.02);
  assert.equal(g.catches,1);assert.equal(g.modal.kind,warned?'fine':'warning');
  assert.equal(g.modal.who,'老板');assert.equal(g.modal.activity,'game');assert.ok(g.modal.runnerSnapshot);
  assert.equal(g.coins,warned?50:100);
  const before=g.time;g.step(5);assert.equal(g.time,before);
 }
});
test('142像素外听见游戏先走近，检查预告时及时收手可以躲过抓包',()=>{
 const g=playing(),boss=g.inspectors[0];
 Object.assign(boss,{x:421,y:585,angle:Math.PI,zone:null,queue:[{kind:'wait',left:40,angle:Math.PI}]});
 let warned=false;
 for(let n=0;n<2000&&!g.modal;n++){
  g.step(.02);
  if(boss.queue[0]?.phase==='warning'&&boss.evidenceKind==='sound'){
   warned=true;assert.ok(Math.hypot(g.player.x-boss.x,g.player.y-boss.y)<=140);
   assert.equal(g.catches,0);g.setActivity('work');break;
  }
 }
 assert.ok(warned);g.step(5);assert.equal(g.catches,0);assert.equal(g.modal,null);
});
test('游戏声音只记录当时的座位，换座后不追踪新位置',()=>{
 const g=playing(),boss=g.inspectors[0];
 Object.assign(boss,{x:421,y:585,angle:Math.PI,zone:null,queue:[{kind:'wait',left:40,angle:Math.PI}]});
 for(let n=0;n<1000&&!boss.lastHeard;n++)g.step(.02);
 const heard=structuredClone(boss.lastHeard);assert.equal(heard.seat,7);
 g.moveTo(0);g.step(8);assert.deepEqual(boss.lastHeard,heard);assert.equal(g.catches,0);
});
