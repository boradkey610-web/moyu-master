import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {Game} from '../src/engine.js';
import {Renderer} from '../src/render.js';

function canvasContext(){
 let scale=1;const stack=[];
 return new Proxy({save(){stack.push(scale);},restore(){scale=stack.pop();},scale(x){scale*=x;},getScale:()=>scale,createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
}
test('贴图桌组数量和尺寸来自当前布局，16座家具保持一致比例',()=>{
 const r=Object.create(Renderer.prototype),c=canvasContext(),calls=[];r.art={office:{img:{}},desk:{}};r.box=r.door=()=>{};
 r.asset=(...args)=>calls.push(args);
 for(const level of [0,2,5]){
  r.layout=new Game(level,1).layout;calls.length=0;r.paintedOffice(c);
  assert.equal(calls.length,r.layout.desks.length);
  for(let i=0;i<calls.length;i++)assert.deepEqual(calls[i].slice(2),[r.layout.desks[i].x,r.layout.desks[i].y,r.layout.desks[i].w,r.layout.desks[i].h]);
 }
});
test('缺少桌组贴图时，回退家具仍按当前布局数量和比例绘制',()=>{
 const r=Object.create(Renderer.prototype),c=canvasContext(),calls=[];r.art={};
 for(const name of ['box','door','couch','plant','line','ellipse'])r[name]=()=>{};
 r.desk=(c,x,y,row,col)=>calls.push({row,col,scale:c.getScale()});
 for(const level of [0,2,5]){
  r.layout=new Game(level,1).layout;calls.length=0;r.drawOffice(c);
  assert.equal(calls.length,r.layout.desks.length);
  assert.ok(calls.every(d=>d.scale===r.layout.scale));assert.equal(c.getScale(),1);
 }
});
test('切换对局更新背景一次，人物使用当前局部比例且不改变世界锚点',()=>{
 const r=Object.create(Renderer.prototype),c=canvasContext(),backgrounds=[],actors=[];
 Object.assign(r,{c,bg:{getContext:()=>c},art:{},layout:new Game(2,1).layout,motion:new Map(),facings:new Map()});
 r.drawOffice=()=>backgrounds.push(r.layout.seatCount);
 for(const name of ['soundSources','printerStatus','movePath','inspectionCone','goldGlow','chair','goldBadge','soundSignals','discoOverlay','noiseMeter','playerStakes','momentFeedback','officeEventCue','inspectionLabel','incomePop','chip','noiseBadge','text'])r[name]=()=>{};
 r.paintedPerson=(c,a)=>{actors.push({x:a.x,y:a.y,scale:c.getScale()});return true;};
 for(const level of [0,5,2]){
  const g=new Game(level,3);g.npcs=[];g.inspectors=[];actors.length=0;
  r.draw(g,0);r.draw(g,1);
  assert.deepEqual(actors[0],{x:g.player.x,y:g.player.y,scale:g.layout.scale});
 }
 assert.deepEqual(backgrounds,[8,16,12]);assert.equal(c.getScale(),1);
});
test('真实座位同步逻辑在8到16再到8座重建按钮，中心与点击目标一致',()=>{
 const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
 const start=app.indexOf('function syncSeatButtons(){'),end=app.indexOf("for(const b of document.querySelectorAll('[data-activity]'))b.onclick",start);
 assert.ok(start>=0&&end>start,'应用应按对局同步座位按钮');
 const container={children:[],replaceChildren(...buttons){this.children=buttons;}};
 const context={g:null,screen:null,beep(){},$:()=>container,document:{createElement:()=>({style:{},attributes:{},setAttribute(k,v){this.attributes[k]=v;}})}};
 vm.createContext(context);vm.runInContext('let seatButtons=[];'+app.slice(start,end).replace('syncSeatButtons();',''),context);
 for(const level of [0,5,0]){
  const g=new Game(level,8);g.npcs=[];context.g=g;context.syncSeatButtons();
  assert.equal(container.children.length,g.layout.seats.length);
  for(const [i,button] of container.children.entries()){
   const seat=g.layout.seats[i];assert.equal(button.style.left,`${seat.x/720*100}%`);assert.equal(button.style.top,`${seat.y/920*100}%`);
   assert.match(button.attributes['aria-label'],new RegExp(`${i+1}号工位`));
  }
  container.children[0].onclick();assert.equal(g.player.target,0);
 }
});
