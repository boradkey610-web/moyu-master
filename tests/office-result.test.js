import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {Game} from '../src/engine.js';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const coinCode=app.slice(app.indexOf('function coinAmount('),app.indexOf('function button('));
const statementCode=coinCode+app.slice(app.indexOf('function statement('),app.indexOf('function modalBackground('));
const modalCode=app.slice(app.indexOf('function processModal('),app.indexOf('const seatButtons='));

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
