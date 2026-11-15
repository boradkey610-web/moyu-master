import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,advanceInspectors} from '../src/engine.js';
import {Renderer} from '../src/render.js';
function drawing(){
 const labels=[],arcs=[],boxes=[],r=Object.create(Renderer.prototype);
 const c=new Proxy({fillText:text=>labels.push(text),arc:(...args)=>arcs.push(args)}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 r.box=(...args)=>boxes.push(args);
 return{r,c,labels,arcs,boxes,clear(){labels.length=arcs.length=boxes.length=0;}};
}
function game(level=2){const g=new Game(level,100);g.inspectors=[];g.npcs=[];return g;}
test('游戏动静从积累跨过可听阈值，边界使用真实半径且绘制无副作用',()=>{
 const g=game(),d=drawing();g.setActivity('game');g.step(5);d.r.noiseMeter(d.c,g);
 assert.ok(d.labels.includes('声音积累'));assert.ok(d.labels.includes('传出线'));assert.ok(d.boxes.some(([,x,y,w,h])=>w===148&&h===18));assert.ok(d.boxes.some(([,x,y,w,h])=>h===18&&w>29&&w<30),'5秒应显示约20%填充及其余底槽');d.r.noiseRange(d.c,g.soundField.sources[0],g.elapsed);assert.equal(d.arcs.length,0);
 g.step(5.1);d.clear();d.r.noiseMeter(d.c,g);assert.ok(d.labels.includes('近处可听'));
 const source=g.soundField.sources[0],before=JSON.stringify(g);d.r.noiseRange(d.c,source,g.elapsed);
 assert.ok(d.arcs.some(([x,y,r])=>x===source.x&&y===source.y&&r===source.radius));assert.equal(JSON.stringify(g),before);
 g.step(10);d.clear();d.r.noiseMeter(d.c,g);assert.ok(d.labels.includes('近处可听'));
 assert.ok(d.boxes.some(([,x,y,w,h])=>w===180&&h===90),'图标、状态和音量槽属于同一个紧凑标记');
 d.clear();d.r.noiseBadge(d.c,g,g.player);assert.equal(d.boxes.length,0,'不再单独绘制漂浮手柄');
});
test('蹦迪更快传出，停止后残余只显示回落、不会继续画可听范围',()=>{
 const g=game(),d=drawing();g.setActivity('dance');g.step(2);d.r.noiseMeter(d.c,g);assert.ok(d.labels.includes('声音传出'));
 g.setActivity('work');g.step(1.02);d.clear();d.r.noiseMeter(d.c,g);assert.ok(d.labels.includes('正在变小'));
 d.r.noiseRange(d.c,g.soundField.sources[0],g.elapsed);assert.equal(d.arcs.length,0);
 const before=JSON.stringify(g.soundField);g.paused=true;g.step(4);d.r.noiseMeter(d.c,g);assert.equal(JSON.stringify(g.soundField),before);
});
test('段子无声、打印机掩护与原有动静回落可区分',()=>{
 const quiet=game(),d=drawing();quiet.setActivity('joke');d.r.noiseMeter(d.c,quiet);assert.ok(d.labels.includes('无声'));
 const g=game(5);g.setActivity('game');g.step(9);const volume=g.soundField.sources[0].volume;
 advanceInspectors([],g.soundField.office.nextAt-g.soundField.clock+.1,g.soundField);g.step(2);d.clear();d.r.noiseMeter(d.c,g);
 assert.ok(d.labels.includes('声音被掩盖'));assert.ok(g.soundField.sources[0].volume<volume);d.r.noiseRange(d.c,g.soundField.sources[0],g.elapsed);assert.equal(d.arcs.length,0);
});
test('顶部工位的动静表避开打印机与关卡标签',()=>{
 const g=game(5),d=drawing(),positions=[];Object.assign(g.player,{seat:1,x:255,y:280,activity:'game'});
 d.c.translate=(x,y)=>positions.push([x,y]);d.r.noiseMeter(d.c,g);
 assert.ok(positions[0][1]-45>136,'标记应位于顶部事件区域之外');
});
