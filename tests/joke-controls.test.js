import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {Game} from '../src/engine.js';
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
function button(g){const element={},start=app.indexOf('const comicAction='),end=app.indexOf("$('#runner-jump').onpointerdown",start);assert.ok(start>0&&end>start,'comic click input exists');const ctx=vm.createContext({$:()=>element,g,screen:null,beep(){}});vm.runInContext(app.slice(start,end),ctx);return{element,ctx};}
test('道具原生点击一次启动一段，动画中再次点不跳过，键盘走同一点击',()=>{
 const g=new Game(2,1);g.inspectors=[];g.npcs=[];g.setActivity('joke');const {element}=button(g);element.onclick();assert.equal(g.comic.step,1);element.onclick();assert.equal(g.comic.step,1);g.step(.36);element.onclick();assert.equal(g.comic.step,2);
 assert.doesNotMatch(app,/holdLaugh|joke-hold|joke-air|joke-laugh/);
});
test('弹窗、暂停和收手期间原生点击不触发演出',()=>{
 const g=new Game(2,1);g.setActivity('joke');const {element,ctx}=button(g);ctx.screen='pause';element.onclick();assert.equal(g.comic.step,0);ctx.screen=null;g.paused=true;element.onclick();assert.equal(g.comic.step,0);g.paused=false;g.setActivity('work');element.onclick();assert.equal(g.comic.step,0);
});
