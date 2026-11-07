import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/engine.js';
function encounter(who='老板'){
 const g=new Game(2,123);g.npcs=[{x:165,y:350,seat:null,target:1,route:[{x:255,y:350},{x:255,y:280}],next:999,color:0}];g.inspectors=[{...g.inspectors[0],name:who,x:355,y:370,queue:[{kind:'wait',left:20,angle:-Math.PI/2}]}];
 Object.assign(g.player,{x:355,y:350,seat:null,target:2,route:[{x:455,y:350},{x:455,y:280}]});
 g.special={seat:2,left:15};g.mirror=8;g.coins=20;g.step(.02);return g;
}
test('老板和主管招呼是点击剧情，冻结全局模拟而非只停走两秒',()=>{
 for(const who of ['老板','主管']){
  const g=encounter(who);assert.equal(g.modal.kind,'greeting');assert.equal(g.modal.who,who);assert.match(g.modal.lines[1],new RegExp(who+'好'));
  const before=JSON.stringify(g);g.step(30);assert.equal(JSON.stringify(g),before);
  assert.equal(g.moveTo(1),false);assert.equal(g.setActivity('game'),false);assert.equal(g.useMirror(),false);
 }
});
test('回应不扣钱、不消耗首次警告并立即继续原路线，近处不重复触发',()=>{
 const g=encounter();const route=structuredClone(g.player.route),x=g.player.x,time=g.time;
 g.dismiss();assert.equal(g.modal,null);assert.deepEqual(g.player.route,route);assert.equal(g.player.target,2);assert.equal(g.coins,20);assert.equal(g.warned,false);assert.equal(g.catches,0);
 g.step(.5);assert.ok(g.player.x>x);assert.ok(g.time<time);assert.equal(g.modal,null);assert.equal(g.stats.greetings,1);
 g.player.activity='joke';g.catchPlayer('老板');assert.equal(g.modal.kind,'warning');assert.equal(g.coins,20);
});
test('离开后重遇可以再次招呼，多检查者同帧不覆盖剧情',()=>{
 const g=encounter();g.dismiss();g.player.x=600;g.player.route=[{x:655,y:350}];g.step(.02);assert.equal(g.inspectors[0].greeted,false);
 g.player.x=355;g.player.route=[{x:455,y:350}];g.inspectors.push({...structuredClone(g.inspectors[0]),name:'主管'});g.step(.02);
 assert.equal(g.modal.who,'老板');assert.equal(g.stats.greetings,2);assert.equal(g.inspectors[1].greeted,false);
});
