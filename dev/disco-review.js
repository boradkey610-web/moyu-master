import {Game,activities} from '../src/engine.js';
import {Renderer} from '../src/render.js';
import {SceneFade} from './scene-fade.js';

const canvas=document.querySelector('canvas'),output=canvas.getContext('2d');
const scene=document.createElement('canvas');scene.width=720;scene.height=920;
const c=scene.getContext('2d'),fade=new SceneFade();
const office=document.createElement('canvas');office.width=720;office.height=920;
const r=new Renderer(office),g=new Game(2,1);
const state={disco:false,enlarged:true,warning:false,paused:false,time:0,danceStartedAt:0};
await r.ready;
if(!r.art['player-dance'])throw new Error('Dance atlas unavailable');
r.art['player-dance'].img=await r.loadImage(new URL('../assets/generated/player-dance-eight-beat-clean/frames.png',import.meta.url).href);
for(const ins of g.inspectors)ins.hold=10000;
r.draw(g,0);
const x=g.player.x,feet=g.player.y+36;
const club=document.createElement('canvas');club.width=720;club.height=920;
const b=club.getContext('2d');
const wall=b.createLinearGradient(0,0,0,920);wall.addColorStop(0,'#111b23');wall.addColorStop(.35,'#263536');wall.addColorStop(1,'#0d1b23');
b.fillStyle=wall;b.fillRect(0,0,720,920);
// An independent illustrated room; no office pixels enter this background.
for(const right of [false,true]){
 b.save();if(right){b.translate(720,0);b.scale(-1,1);}
 const curtain=b.createLinearGradient(0,0,135,0);curtain.addColorStop(0,'#14272b');curtain.addColorStop(.45,'#334844');curtain.addColorStop(1,'#17292d');
 b.fillStyle=curtain;b.beginPath();b.moveTo(0,0);b.lineTo(160,0);b.bezierCurveTo(120,120,145,215,97,335);b.lineTo(0,405);b.closePath();b.fill();
 for(let i=0;i<5;i++){b.strokeStyle=i%2?'#8ea88e17':'#07191f66';b.lineWidth=5;b.beginPath();b.moveTo(25+i*25,0);b.bezierCurveTo(20+i*22,140,42+i*14,220,15+i*17,355);b.stroke();}
 r.box(b,44,254,70,144,8,'#16272d','#62776b',1);
 for(const y of [294,353]){r.ellipse(b,79,y,24,24,'#263a3d','#465e58');r.ellipse(b,79,y,10,10,'#11232a','#5c766a');}
 b.restore();
}
r.box(b,182,245,356,62,8,'#203234','#64766966',1);
r.box(b,212,230,82,16,4,'#17292f','#536b63',1);r.box(b,426,230,82,16,4,'#17292f','#536b63',1);
for(let i=0;i<13;i++){b.fillStyle=i%3?'#82b6a244':'#d0ad7355';b.fillRect(295+i*10,268,3,11+(i*7)%19);}
b.fillStyle='#81948233';b.fillRect(116,314,488,2);
let seed=418;
for(let i=0;i<6000;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const px=seed%720;seed=(Math.imul(seed,1664525)+1013904223)>>>0;b.fillStyle=i%2?'#d6d5aa08':'#00080e16';b.fillRect(px,seed%920,1,1);}

function ellipse(x,y,rx,ry,fill){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();}
function glow(x,y,rx,ry,color,alpha=1){
 c.save();c.translate(x,y);c.scale(rx,ry);c.globalAlpha=alpha;
 const light=c.createRadialGradient(0,0,0,0,0,1);light.addColorStop(0,color);light.addColorStop(1,'transparent');
 c.fillStyle=light;c.fillRect(-1,-1,2,2);c.restore();
}
function beam(sx,sy,tx,ty,radius,color,opacity){
 c.save();c.translate(sx,sy);c.rotate(Math.atan2(ty-sy,tx-sx)-Math.PI/2);
 const length=Math.hypot(tx-sx,ty-sy);
 // Soft cross sections remove the hard walls of the previous cylinder.
 for(let y=0;y<length;y+=3){
  const u=y/length,w=3+radius*u,fade=Math.sin(u*Math.PI)*opacity;
  const light=c.createLinearGradient(-w,y,w,y);
  light.addColorStop(0,'transparent');light.addColorStop(.5,color);light.addColorStop(1,'transparent');
  c.globalAlpha=fade;c.fillStyle=light;c.fillRect(-w,y,w*2,3.5);
 }
 c.restore();
}
function floor(t){
 const colors=['#82c6bd','#d6ad69','#728fba'];
 const project=(col,row)=>[360+(col-4)*78*(.56+row*.095),320+row*52];
 for(let row=0;row<10;row++)for(let col=0;col<8;col++){
  const points=[project(col,row),project(col+1,row),project(col+1,row+1),project(col,row+1)];
  c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();
  const pulse=(1+Math.sin(t*Math.PI+(row+col)*.8))/2;
  c.globalAlpha=.035+pulse*.095;c.fillStyle=colors[(row+col)%3];c.fill();
  c.globalAlpha=.14;c.strokeStyle='#a2b7a9';c.lineWidth=1;c.stroke();
 }c.globalAlpha=1;
}
function mirrorBall(t){
 c.strokeStyle='#8a9a8b';c.lineWidth=2;c.beginPath();c.moveTo(360,0);c.lineTo(360,75);c.stroke();
 glow(360,104,94,80,'#9edac844',.7);
 const ball=c.createRadialGradient(348,89,1,360,108,33);ball.addColorStop(0,'#f4eccb');ball.addColorStop(.45,'#98bcb2');ball.addColorStop(1,'#304b4e');
 ellipse(360,106,32,32,ball);
 c.save();c.beginPath();c.arc(360,106,31,0,Math.PI*2);c.clip();
 for(let row=0;row<9;row++)for(let col=0;col<9;col++){
  c.globalAlpha=.2+.6*Math.max(0,Math.sin(col*.75+row*.4+t*.5));c.fillStyle=(row+col)%3?'#dce5cd':'#f7d296';c.fillRect(326+col*8,72+row*8,6,6);
 }c.restore();
 c.strokeStyle='#a5b5a077';c.lineWidth=1.5;c.beginPath();c.arc(360,106,32,0,Math.PI*2);c.stroke();
}
function notes(t){
 for(let i=0;i<5;i++){
  const phase=(t*.18+i*.2)%1,nx=x+Math.cos(i*2.4)*(66+phase*30),ny=feet-25-phase*145;
  c.save();c.translate(nx,ny);c.rotate(Math.sin(t+i)*.12);c.globalAlpha=Math.sin(phase*Math.PI)*.65;
  c.strokeStyle=i%2?'#83c9bf':'#efd498';c.fillStyle=c.strokeStyle;c.lineWidth=2;
  ellipse(0,0,5,3,c.fillStyle);c.beginPath();c.moveTo(4,0);c.lineTo(4,-18);c.lineTo(14,-14);c.stroke();c.restore();
 }
}
function dance(t){
 const scale=state.enlarged?1.3:1;
 c.save();c.translate(x,feet);c.scale(scale,scale);c.translate(-x,-feet);
 r.paintedDance(c,g.player,Math.max(0,t-state.danceStartedAt));c.restore();
}
function draw(){
 const t=state.time;c.clearRect(0,0,720,920);
 if(fade.value>0){
  c.drawImage(club,0,0);
  floor(t);
  c.save();c.globalCompositeOperation='screen';
  beam(130,75,430+Math.sin(t*.35)*105,740,145,'#75c8c1',.2);
  beam(620,75,240+Math.sin(t*.3+1)*90,760,130,'#e9b176',.17);
  glow(175,695,190,75,'#68c4c244',.6);glow(540,735,180,65,'#e0a36c44',.6);
  beam(x,feet-250,x,feet+8,66,'#ffe5ad',.33);
  glow(x,feet,83,25,'#ffe6b399',.85);
  c.restore();
  for(let i=0;i<26;i++){
   const px=40+(i*137)%640+Math.sin(t*.25+i)*14,py=160+(i*193)%620;
   glow(px,py,3+(i%3),2,'#eedeb699',.25+.25*Math.sin(t*.6+i));
  }
  mirrorBall(t);
  c.fillStyle='#e5bd7980';c.fillRect(72,67,135,2);c.fillStyle='#78bfb580';c.fillRect(515,67,135,2);
  r.box(c,x-13,feet-256,26,10,3,'#30433e','#8b9e81',1);
  glow(x,feet-245,17,8,'#ffedbdaa');
  dance(t);notes(t);
  const vignette=c.createRadialGradient(x,feet-60,180,360,460,650);vignette.addColorStop(0,'transparent');vignette.addColorStop(1,'#02090cb3');c.fillStyle=vignette;c.fillRect(0,0,720,920);
  r.box(c,32,851,656,42,7,'#102223d9','#8b947852',1);
  r.text(c,'沉浸蹦迪 · 检查者不可见',184,872,13,'#c5cdb9','400');
  for(let i=0;i<8;i++)ellipse(468+i*23,872,4,4,Math.floor(t%4*2)===i?'#ffe2a0':'#5b7771');
  if(state.warning){
   glow(0,440,110,350,'#e77b4a88',.6+.1*Math.sin(t*2));
   r.box(c,210,260,300,44,7,'#533226ed','#cda077',1);r.text(c,'有人靠近…准备收手',360,282,16,'#f4d8aa');
  }
 }
 output.clearRect(0,0,720,920);output.drawImage(office,0,0);
 if(fade.value>0){output.save();output.globalAlpha=fade.value;output.drawImage(scene,0,0);output.restore();}
 canvas.dataset.artStatus=office.dataset.artStatus;
 const phase=fade.transition?(state.disco?'渐入迪厅（准备跳舞）':'渐回办公室（收手中）'):(state.disco?'迪厅':'办公室');
 document.querySelector('#status').textContent=`${phase} · 迪厅 ${Math.round(fade.value*100)}% · 人物 ${state.enlarged?'1.3':'1.0'} 倍 · ${state.paused?'已暂停':'运行中'} · ${r.assetErrors.length?'资源异常':'资源已加载'}（提醒为演示）`;
}
for(const [id,key] of [['mode','disco'],['size','enlarged'],['warning','warning'],['pause','paused']]){
 document.querySelector('#'+id).onclick=()=>{
  state[key]=!state[key];document.querySelector('#'+id).setAttribute('aria-pressed',String(state[key]));
  if(key==='disco'){
   if(state.disco){
    if(fade.value===0)state.danceStartedAt=state.time;
    g.setActivity('dance');
    fade.to(1,g.player.warmup);
   }else fade.to(0,activities.dance.stop);
  }
  document.querySelector('#mode').textContent=state.disco?'一键工作 · 渐回办公室':'开始跳舞 · 渐入迪厅';
  document.querySelector('#size').textContent=state.enlarged?'人物 1.3 倍 · 对比原尺寸':'人物原尺寸 · 放大到 1.3 倍';
  document.querySelector('#warning').textContent=state.warning?'关闭靠近提醒':'演示「有人靠近」';
  document.querySelector('#pause').textContent=state.paused?'继续跳舞':'暂停观察舞姿';draw();
 };
}
window.discoReview={state,fade,renderer:r,draw,canvas};
let last=0;
function frame(now){if(last&&!state.paused){const dt=Math.min(.1,(now-last)/1000);state.time+=dt;fade.step(dt);}last=now;draw();requestAnimationFrame(frame);}
draw();
requestAnimationFrame(frame);
