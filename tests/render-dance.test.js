import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Renderer} from '../src/render.js';
import {Game} from '../src/engine.js';

const meta=JSON.parse(readFileSync(new URL('../assets/manifest.json',import.meta.url)))['player-dance'];
const renderer=()=>Object.assign(Object.create(Renderer.prototype),{art:{'player-dance':{meta,img:{}}},motion:new Map(),facings:new Map()});
const context=()=>new Proxy({}, {get:(target,key)=>target[key]??(()=>{}),set:(target,key,value)=>{target[key]=value;return true;}});

test('approved dance atlas uses 28 original cells, eight beats and a four-second loop',()=>{
 const png=readFileSync(new URL('../'+meta.src,import.meta.url));
 assert.equal(png.readUInt32BE(16),meta.width);assert.equal(png.readUInt32BE(20),meta.height);
 assert.equal(meta.frameCount,28);assert.equal(meta.duration,4);
 assert.equal(meta.width,meta.columns*meta.cellWidth);assert.equal(meta.height,meta.rows*meta.cellHeight);
 assert.ok(meta.footBaseline<meta.cellHeight);assert.ok(meta.anchor<meta.cellWidth);
 assert.match(meta.src,/eight-beat-v4\/frames.png$/);
});
test('all three dance phrases play in order without flipping or deforming the artwork',()=>{
 const r=renderer(),calls=[],c={drawImage(...args){calls.push(args);}};r.ellipse=()=>{};
 for(let i=0;i<28;i++)assert.equal(r.paintedPerson(c,{type:'player',x:545,y:515,activity:'dance'},{seated:false,direction:'left'},(i+.01)*4/28),true);
 assert.equal(calls.length,28);
 for(const [i,call]of calls.entries()){
  assert.equal(call[1],i%7*384);assert.equal(call[2],Math.floor(i/7)*480);
  assert.equal(call[3],384);assert.equal(call[4],480);
  assert.ok(Math.abs(call[6]+466*98/360-551)<1e-8,'feet stay aligned');
 }
 r.paintedDance(c,{x:545,y:515},4);assert.deepEqual(calls[28],calls[0]);
});
test('dance clock restarts at activation and freezes on pause, not at wall-clock time',()=>{
 const r=renderer(),g=new Game(2,1);g.inspectors=[];g.elapsed=12;g.setActivity('dance');
 assert.equal(g.player.danceStartedAt,12);assert.equal(r.danceState(g).time,0);
 g.step(.3);assert.ok(Math.abs(r.danceState(g).time-.3)<1e-8);
 const before=r.danceState(g);g.paused=true;g.step(4);assert.deepEqual(r.danceState(g),before);
 g.paused=false;g.setActivity('work');g.step(1);assert.equal(r.danceState(g),null);
 g.setActivity('dance');assert.equal(r.danceState(g).time,0);
});
test('light fades while stopping and disappears on work, movement or catch',()=>{
 const r=renderer(),g=new Game(2,1);g.inspectors=[];g.setActivity('dance');g.step(.3);
 assert.equal(r.danceState(g).strength,1);
 g.setActivity('work');g.step(.5);assert.ok(Math.abs(r.danceState(g).strength-.5)<1e-8);
 g.step(.5);assert.equal(r.danceState(g),null);
 g.setActivity('dance');g.catchPlayer('老板');assert.equal(r.danceState(g),null);
 g.player.activity='dance';g.player.seat=null;assert.equal(r.danceState(g),null);
 assert.equal(new Game(0,1).setActivity('dance'),false);
});
test('seated work is unchanged and missing dance art keeps the existing fallback',()=>{
 const r=renderer();r.art={};
 assert.equal(r.paintedPerson({}, {type:'player',x:0,y:0,activity:'dance'},{seated:false},0),false);
 r.art.seated={};let calls=[];r.sprite=(...args)=>{calls.push(args.slice(1,4));return true;};r.chair=()=>{};
 assert.equal(r.paintedPerson({}, {type:'player',x:0,y:0,activity:'work'},{seated:true},0),true);
 assert.deepEqual(calls,[['seated',0,0]]);
});
test('lighting composites after actors but before every inspection label and risk cue',()=>{
 const r=renderer(),g=new Game(2,1),order=[];g.setActivity('dance');g.elapsed=.4;
 r.c=context();r.bg={};
 for(const name of ['soundSources','inspectionCone','chair','text','chip','noiseBadge','incomePop','playerStakes','momentFeedback','soundSignals','inspectionLabel'])r[name]=()=>order.push(name);
 r.paintedPerson=()=>{order.push('actor');return true;};r.danceSpotlight=()=>order.push('light');
 r.draw(g,200);
 const light=order.indexOf('light');assert.ok(light>order.lastIndexOf('actor'));
 for(const name of ['inspectionLabel','noiseBadge','playerStakes','momentFeedback','soundSignals'])assert.ok(order.indexOf(name)>light,name);
});
test('spotlight geometry is cached across frames, with no scene pixel reads',()=>{
 const old=globalThis.document;let canvases=0;
 try{
  globalThis.document={createElement(){canvases++;const c=context();c.createLinearGradient=c.createRadialGradient=()=>({addColorStop(){}});return{getContext:()=>c};}};
  const r=renderer(),first=r.spotlightLayers(545,551);
  assert.equal(r.spotlightLayers(545,551),first);assert.equal(canvases,2);
  assert.notEqual(r.spotlightLayers(255,551),first);assert.equal(canvases,4);
 }finally{if(old===undefined)delete globalThis.document;else globalThis.document=old;}
});
test('dark stage stays inside the workstation cylinder instead of covering the office',()=>{
 const old=globalThis.document,rects=[];let canvases=0;
 try{
  globalThis.document={createElement(){
   const index=canvases++,c=context();
   c.createLinearGradient=c.createRadialGradient=()=>({addColorStop(){}});
   c.fillRect=(...args)=>{if(index===0&&c.globalCompositeOperation!=='destination-out')rects.push(args);};
   return{getContext:()=>c};
  }};
  renderer().spotlightLayers(545,551);
  assert.ok(rects.length>100);
  for(const [x,y,w,h]of rects){
   assert.ok(x>=505&&x+w<=585,'cylinder matches the 40px floor light radius');
   assert.ok(y>=438&&y+h<=565,'cylinder extends from lamp to floor ellipse');assert.equal(h,1);
  }
 }finally{if(old===undefined)delete globalThis.document;else globalThis.document=old;}
});
test('music notes float outside the floor-sized cylinder and disappear with the light',()=>{
 const r=renderer(),positions=[],heads=[],c=context();
 c.translate=(x,y)=>positions.push([x,y]);r.ellipse=(...args)=>heads.push(args);r.line=()=>{};
 r.danceNotes(c,{time:1,strength:1,x:545,feet:551});
 assert.equal(positions.length,4);assert.equal(heads.length,6);
 assert.ok(positions.every(([x,y])=>Math.abs(x-545)>40&&y<551&&y>438));
 r.danceNotes(c,null);r.danceNotes(c,{time:1,strength:0,x:545,feet:551});assert.equal(positions.length,4);
});
