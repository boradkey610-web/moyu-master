import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,advanceInspectors} from '../src/engine.js';
import {Renderer} from '../src/render.js';
function drawing(){
 const labels=[],arcs=[],boxes=[],strokes=[],r=Object.create(Renderer.prototype);let path=[];
 const c=new Proxy({fillText:text=>labels.push(text),beginPath:()=>{path=[];},arc:(...args)=>{arcs.push(args);path.push(args);},stroke:()=>strokes.push({path:[...path],width:c.lineWidth,alpha:c.globalAlpha,ink:c.strokeStyle}),createRadialGradient:()=>({addColorStop(){}})}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 r.box=(...args)=>boxes.push(args);
 return{r,c,labels,arcs,boxes,strokes,clear(){labels.length=arcs.length=boxes.length=strokes.length=0;}};
}
function game(level=3){const g=new Game(level,100);g.inspectors=[];g.npcs=[];return g;}
test('水波纹是三层游戏细波和五层音乐细波，真实范围有连续薄外缘',()=>{
 for(const [kind,radius,count] of [['game',170,3],['dance',320,5]]){
  const d=drawing(),source={active:true,kind,x:355,y:515,radius},before=JSON.stringify(source);
  d.r.noiseRange(d.c,source,.25);
  const rings=d.strokes.filter(s=>s.path.some(a=>a[3]===0&&a[4]===Math.PI*2));
  assert.equal(rings.filter(s=>s.path[0][2]<radius).length,count);
  assert.ok(rings.some(s=>s.path[0][2]===radius));
  assert.ok(d.strokes.every(s=>s.width>=1.5&&s.width<=2.2),'去掉粗白底和粗色圈');
  assert.ok(d.arcs.every(a=>a[2]<=radius),'内部波纹及高光不越过真实范围');
  assert.equal(JSON.stringify(source),before);
 }
});
test('水波纹随模拟时间扩散，相同时刻结果一致',()=>{
 const d=drawing(),source={active:true,kind:'game',x:355,y:515,radius:170};
 d.r.noiseRange(d.c,source,.25);const first=JSON.stringify(d.strokes),radii=JSON.stringify(d.arcs.map(a=>a[2]));d.clear();d.r.noiseRange(d.c,source,.25);assert.equal(JSON.stringify(d.strokes),first);
 d.clear();d.r.noiseRange(d.c,source,.8);assert.notEqual(JSON.stringify(d.arcs.map(a=>a[2])),radii);
});
test('场景水波纹使用冻结的模拟时间，不随绘制时钟继续流动',()=>{
 const g=game(),d=drawing();g.setActivity('game');g.step(11);g.paused=true;
 d.r.soundSources(d.c,g,12);const before=JSON.stringify(d.strokes),state=JSON.stringify(g);
 d.clear();g.step(5);d.r.soundSources(d.c,g,90);
 assert.equal(JSON.stringify(d.strokes),before);assert.equal(JSON.stringify(g),state);
});
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
test('蹦迪更快传出，收手完成清空进度和可听范围',()=>{
 const g=game(),d=drawing();g.setActivity('dance');g.step(2);d.r.noiseMeter(d.c,g);assert.ok(d.labels.includes('声音传出'));
 g.setActivity('work');g.step(1.02);d.clear();d.r.noiseMeter(d.c,g);assert.equal(d.labels.length,0);assert.equal(g.soundField.sources.length,0);
 d.r.noiseRange(d.c,g.soundField.sources[0],g.elapsed);assert.equal(d.arcs.length,0);
 const before=JSON.stringify(g.soundField);g.paused=true;g.step(4);d.r.noiseMeter(d.c,g);assert.equal(JSON.stringify(g.soundField),before);
});
test('段子无声，打印机只隐藏范围，音量表继续积累',()=>{
 const quiet=game(),d=drawing();quiet.setActivity('joke');d.r.noiseMeter(d.c,quiet);assert.ok(d.labels.includes('无声'));
 const g=game(5);g.setActivity('game');g.step(9);const volume=g.soundField.sources[0].volume;
 advanceInspectors([],g.soundField.office.printer.nextAt-g.soundField.clock+.1,g.soundField);g.step(2);d.clear();d.r.noiseMeter(d.c,g);
 assert.ok(d.labels.includes('声音被掩盖'));assert.ok(g.soundField.sources[0].volume>volume);d.r.noiseRange(d.c,g.soundField.sources[0],g.elapsed);assert.equal(d.arcs.length,0);
});
test('顶部工位的动静表避开打印机与关卡标签',()=>{
 const g=game(5),d=drawing(),positions=[];Object.assign(g.player,{seat:1,x:255,y:280,activity:'game'});
 d.c.translate=(x,y)=>positions.push([x,y]);d.r.noiseMeter(d.c,g);
 assert.ok(positions[0][1]-45>136,'标记应位于顶部事件区域之外');
});

test('无障碍声音状态与打印机掩护和停机后的真实范围一致',()=>{
 const g=game(5),d=drawing();g.setActivity('game');g.step(g.soundField.office.printer.nextAt+2);
 const source=g.soundField.sources[0];assert.ok(source.volume>40);assert.equal(source.radius,0);
 assert.equal(d.r.noiseLabel(source),'声音被掩盖');
 g.step(g.soundField.office.printer.activeUntil-g.soundField.clock+.02);
 assert.ok(g.soundField.sources[0].radius>0);assert.equal(d.r.noiseLabel(g.soundField.sources[0]),'近处可听见');
});
