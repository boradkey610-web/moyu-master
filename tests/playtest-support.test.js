import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {levels} from '../src/engine.js';

const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const selectCode=app.slice(app.indexOf('function selectLevel('),app.indexOf('function instructions('));
const helpCode=app.slice(app.indexOf('function help('),app.indexOf('function meeting('));
const node=()=>({children:[],dataset:{},disabled:false,append(...items){this.children.push(...items);}});
function harness(extra={}){
 const dialog=node(),calls=[],icons={'#mirror svg':'<svg data-icon="mirror"></svg>','#meeting svg':'<svg data-icon="meeting"></svg>','.hud-clock svg':'<svg data-icon="clock"></svg>'};
 let html='';
 const context=vm.createContext({screen:null,document:{createElement:node},$:s=>icons[s]?{outerHTML:icons[s]}:dialog,button:(text,fn,className='')=>({...node(),textContent:text,fn,className}),show:value=>{html=value;},formatTime:t=>String(t),start:i=>calls.push(i),menu(){},hide(){calls.push('hide');},instructions(){},panelHead:()=>'',...extra});
 return {context,dialog,calls,html:()=>html};
}

test('新玩家与旧进度都能选择全部关卡，成绩不被清空',()=>{
 for(const unlocked of [1,2,4]){
  const save={unlocked,best:{'1-clean':26}},before=JSON.stringify(save),h=harness({levels,save});
  vm.runInContext(selectCode+';selectLevel()',h.context);
  const buttons=h.dialog.children[0].children;
  assert.equal(buttons.length,4);assert.ok(buttons.every(b=>!b.disabled));
  for(const b of buttons)b.fn();assert.deepEqual(h.calls,[0,1,2,3]);
  assert.match(h.html(),/全关卡开放/);assert.match(buttons[1].innerHTML,/最佳/);
  assert.equal(JSON.stringify(save),before);
 }
});

test('支援单使用原工具栏图标，领取仍只调用原奖励入口',()=>{
 const g={level:1,modal:null,ads:0,time:60,extended:false,inventory:{mirror:0,meeting:0},reward:type=>{rewards.push(type);return true;}},rewards=[],h=harness({g});
 vm.runInContext(helpCode+';help()',h.context);
 const rows=h.dialog.children.filter(b=>b.className==='assist-option');
 assert.equal(rows.length,3);assert.match(rows[0].innerHTML,/data-icon="mirror"/);assert.match(rows[1].innerHTML,/data-icon="meeting"/);assert.match(rows[2].innerHTML,/data-icon="clock"/);
 assert.deepEqual(rows.map(b=>b.disabled),[false,false,true]);
 rows[0].fn();assert.deepEqual(rewards,['mirror']);assert.deepEqual(h.calls,['hide']);
});

test('支援单保留已持有、已加时、剩余时间和本局次数限制',()=>{
 for(const [patch,expected]of [[{level:0},[]],[{},[false,false,false]],[{inventory:{mirror:1,meeting:0}},[true,false,false]],[{extended:true},[false,false,true]],[{time:31},[false,false,true]],[{ads:2},[true,true,true]]]){
  const g={level:2,modal:null,ads:0,time:30,extended:false,inventory:{mirror:0,meeting:0},...patch},h=harness({g});
  vm.runInContext(helpCode+';help()',h.context);
  assert.deepEqual(h.dialog.children.filter(b=>b.className==='assist-option').map(b=>b.disabled),expected);
 }
});
