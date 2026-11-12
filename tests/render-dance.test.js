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
test('full-scene dance darkness has a soft tapered spotlight opening, not enclosing walls',()=>{
 const old=globalThis.document,darkRects=[],warmRects=[];let canvases=0;
 try{
  globalThis.document={createElement(){
   const index=canvases++,c=context();
   c.createLinearGradient=c.createRadialGradient=()=>({addColorStop(){}});
   c.fillRect=(...args)=>(index===0?darkRects:warmRects).push(args);
   return{getContext:()=>c};
  }};
  renderer().spotlightLayers(545,551);
  assert.deepEqual(darkRects[0],[0,0,720,920],'ambient darkness covers the entire map');
  const beam=warmRects.filter(rect=>rect[3]===1);
  assert.ok(beam.length>100);assert.equal(beam[0][2],12);
  assert.ok(beam.at(-1)[2]>78&&beam.at(-1)[2]<80);
  assert.ok(beam.every(([x,y,w,h])=>x>=505&&x+w<=585&&y>=438&&y+h<=551));
  assert.deepEqual(darkRects.filter(rect=>rect[3]===1),beam,'the bright opening follows the tapered light, not a cylinder');
 }finally{if(old===undefined)delete globalThis.document;else globalThis.document=old;}
});
test('music notes float outside the spotlight and disappear with the light',()=>{
 const r=renderer(),positions=[],heads=[],c=context();
 c.translate=(x,y)=>positions.push([x,y]);r.ellipse=(...args)=>heads.push(args);r.line=()=>{};
 r.danceNotes(c,{time:1,strength:1,x:545,feet:551});
 assert.equal(positions.length,4);assert.equal(heads.length,6);
 assert.ok(positions.every(([x,y])=>Math.abs(x-545)>40&&y<551&&y>438));
 r.danceNotes(c,null);r.danceNotes(c,{time:1,strength:0,x:545,feet:551});assert.equal(positions.length,4);
});
test('dance rolls the player chair under the desk and restores it before seated work',()=>{
 const r=renderer(),g=new Game(2,1),chairs=[],tucks=[];
 r.c=context();r.bg={};g.inspectors=[];g.special={seat:g.player.seat,left:10};
 for(const name of ['soundSources','goldGlow','goldBadge','text','chip','noiseBadge','incomePop','playerStakes','momentFeedback','soundSignals','danceSpotlight'])r[name]=()=>{};
 r.chair=(c,x,y,gold,layer)=>chairs.push({x,y,gold,layer});
 r.tuckedChair=(c,seat,gold,progress)=>tucks.push({seat:seat.id,gold,progress});
 r.paintedPerson=(c,a,pose)=>{if(pose.seated)r.chair(c,a.x,a.y,!!a.gold,'front');return true;};
 const countPlayer=()=>chairs.filter(ch=>ch.x===g.player.x&&ch.y===g.player.y);
 const draw=()=>{chairs.length=0;tucks.length=0;r.draw(g,g.elapsed);};
 g.setActivity('dance');draw();assert.equal(countPlayer().length,0);
 assert.deepEqual(tucks,[{seat:g.player.seat,gold:true,progress:0}]);
 g.step(.45);draw();assert.equal(tucks[0].progress,1);
 assert.ok(chairs.some(ch=>ch.x===g.npcs[0].x&&ch.y===g.npcs[0].y),'other workstation chairs stay visible');
 g.setActivity('work');g.step(.5);draw();assert.equal(countPlayer().length,0);
 assert.equal(tucks[0].progress,1);
 g.step(.3);draw();assert.ok(tucks[0].progress>0&&tucks[0].progress<1);
 g.step(.2);draw();assert.deepEqual(countPlayer().map(ch=>ch.layer),['base','front']);assert.equal(tucks.length,0);
 assert.ok(countPlayer().every(ch=>ch.gold),'gold chair style is restored');
 g.setActivity('dance');g.catchPlayer('老板');draw();assert.equal(countPlayer().length,2);
});
test('chair tuck translates the original chair, clips behind the desk and never scales or fades it',()=>{
 const r=renderer(),rects=[],translations=[],c=context();
 c.rect=(...args)=>rects.push(args);c.translate=(...args)=>translations.push(args);
 c.scale=c.drawImage=()=>assert.fail('chair must retain its size');
 r.chair=(ctx,x,y,gold,layer)=>{assert.equal(x,545);assert.equal(y,515);assert.equal(gold,true);assert.equal(layer,'all');};
 for(const progress of [0,.5,1])r.tuckedChair(c,{x:545,y:515},true,progress);
 assert.deepEqual(translations,[[0,-0],[0,-18],[0,-36]]);
 assert.deepEqual(rects.map(rect=>rect[1]),[491,501,511]);
});
