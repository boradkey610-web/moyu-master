import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/engine.js';
function encounter(who='老板'){
 const g=new Game(2,123);g.npcs=[{x:165,y:350,seat:null,target:1,route:[{x:255,y:350},{x:255,y:280}],next:999,color:0}];g.inspectors=[{...g.inspectors[0],name:who,x:355,y:370,queue:[{kind:'wait',left:20,angle:-Math.PI/2}]}];
 Object.assign(g.player,{x:355,y:350,seat:null,target:2,route:[{x:455,y:350},{x:455,y:280}]});
 g.special={seat:2,left:15};g.mirror=8;g.coins=20;g.step(.02);return g;
}
test('路遇老板或主管只显示气泡，不暂停且继续移动',()=>{
 for(const who of ['老板','主管']){const g=encounter(who),x=g.player.x,time=g.time;assert.equal(g.modal,null);assert.equal(g.greeting.who,who);g.step(.5);assert.ok(g.player.x>x);assert.ok(g.time<time);assert.equal(g.stats.greetings,1);assert.equal(g.warned,false);assert.equal(g.catches,0);}
});
test('离开后重遇可再次招呼，多人相遇仍不中断',()=>{const g=encounter();g.player.x=600;g.player.route=[{x:655,y:350}];g.step(.02);assert.equal(g.inspectors[0].greeted,false);g.player.x=355;g.player.route=[{x:455,y:350}];g.inspectors.push({...structuredClone(g.inspectors[0]),name:'主管'});g.step(.02);assert.equal(g.modal,null);assert.equal(g.stats.greetings,3);});
