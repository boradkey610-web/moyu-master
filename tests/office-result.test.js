import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {Game,levels} from '../src/engine.js';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const coinCode=app.slice(app.indexOf('function coinAmount('),app.indexOf('function button('));
const statementCode=coinCode+app.slice(app.indexOf('function statement('),app.indexOf('function modalBackground('));
const modalCode=app.slice(app.indexOf('function processModal('),app.indexOf('let seatButtons='));

test('第四关与第五关继续新关，末关重玩自身而非跳回第四关',()=>{
 for(const [level,next]of [[3,4],[4,5],[5,5]]){
  const g=new Game(level,100);g.modal={kind:'win'};const calls=[];let choices;
  const context=vm.createContext({g,levels,screen:null,lastModal:null,record(){},statement:()=>'',activitySummary:()=>'',formatTime:String,save:{best:{}},show:(html,buttons)=>{choices=buttons;},start:i=>calls.push(i),selectLevel(){},beep(){}});
  vm.runInContext(modalCode+';processModal()',context);
  assert.equal(choices[0][0],level===5?'再摸一局':'下一天，继续 →');
  choices[0][1]();assert.deepEqual(calls,[next]);
 }
});

test('警告和罚款分别说明未收手奖金损失，不额外扣除工资',()=>{
 const g=new Game(2,1);g.inspectors=[];g.player.activity='game';g.coins=100;g.pendingBonus=11.9;g.catchPlayer('老板');
 for(const [amount,coins]of [[11,100],[7,50]]){
  let rendered='';const context=vm.createContext({g,screen:null,lastModal:null,portrait:()=>'<canvas></canvas>',panelHead:()=>'',show:html=>{rendered=html;},button:()=>({}),selectLevel(){},$:()=>({append(){}})});
  vm.runInContext(modalCode+';processModal()',context);
  assert.match(rendered,new RegExp(`未收手奖金 ${amount} 金币已清空`));assert.equal(g.coins,coins);
  if(amount===11){g.dismiss();g.player.activity='game';g.pendingBonus=7.9;g.catchPlayer('主管');}
 }
});

test('工资条使用实际收入和目标，通关与失败盖不同结果印章',()=>{
 for(const [kind,stamp]of [['timeout','未达标'],['win','准点溜走'],['lose','摸鱼翻车']]){
  const g={modal:{kind},config:{name:'周五抢座大战',target:440},coins:135.8,level:3,ads:0};
  const context=vm.createContext({g,portrait:()=>'<canvas></canvas>'});
  const html=vm.runInContext(statementCode+';statement()',context);
  assert.match(html,/摸鱼工资条/);assert.match(html,/<strong>135<\/strong>/);
  assert.match(html,/目标 440 金币/);assert.ok(html.includes(stamp));
  assert.match(html,/员工联 \/ 04/);assert.doesNotMatch(html,/score-track/);
 }
});

test('超时差一点达标时，工资条不会把收入提前显示为目标值',()=>{
 const g=new Game(0,1);g.inspectors=[];g.tutorialSeen=true;g.time=.01;g.coins=89.94;g.player.activity='joke';g.step(.01);
 assert.equal(g.modal.kind,'timeout');assert.ok(Math.abs(g.coins-89.96)<1e-8);
 const context=vm.createContext({g,portrait:()=>'<canvas></canvas>'});
 const html=vm.runInContext(statementCode+';statement()',context);
 assert.match(html,/<strong>89<\/strong>/);assert.match(html,/未达标/);
 let rendered='';
 const modalContext=vm.createContext({g,screen:null,lastModal:null,portrait:()=>'<canvas></canvas>',activitySummary:()=>'',show:html=>{rendered=html;},button:()=>({}),selectLevel(){},$:()=>({append(){}})});
 vm.runInContext(statementCode+modalCode+';processModal()',modalContext);
 assert.match(rendered,/还差 <b>1 金币<\/b>/);
});
