import {Game,seats} from '../src/engine.js';
import {Renderer} from '../src/render.js';
import {monitorRect,paintMonitor} from './game-monitor.js';
import {drawTyping,typingFrame} from './player-typing.js';

const canvas=document.querySelector('#office'),detail=document.querySelector('#detail'),r=new Renderer(canvas),g=new Game(2,1);
const state={gameScreen:true,paused:false,time:0,seat:7,typing:true,speed:1};
const select=document.querySelector('#seat');
for(const seat of seats){const option=document.createElement('option');option.value=seat.id;option.textContent=String(seat.id+1).padStart(2,'0');select.append(option);}
select.value='7';
await r.ready;
const response=await fetch(new URL('../assets/generated/player-typing-v2/preview.json',import.meta.url));
if(!response.ok)throw new Error('Typing metadata unavailable');
const typingMeta=await response.json();
const typingAsset={meta:typingMeta,img:await r.loadImage(new URL('../'+typingMeta.src,import.meta.url).href)};
const paintedPerson=r.paintedPerson.bind(r);
r.paintedPerson=(c,actor,pose,time)=>{
 if(actor.type==='player'&&pose.seated&&state.gameScreen&&state.typing){
  drawTyping(c,typingAsset,actor,state.time);r.chair(c,actor.x,actor.y,!!actor.gold,'front');return true;
 }
 return paintedPerson(c,actor,pose,time);
};
r.layout=g.layout;r.drawOffice(r.bg.getContext('2d'));
const original=document.createElement('canvas');original.width=720;original.height=920;original.getContext('2d').drawImage(r.bg,0,0);
const ctx=r.bg.getContext('2d');
g.inspectors=[];
function draw(){
 const seat=seats[state.seat];Object.assign(g.player,seat,{seat:seat.id,activity:'work'});
 const neighbor=seats[seat.id^1];g.npcs=[{...neighbor,seat:neighbor.id,route:[],target:null,color:0}];
 g.elapsed=state.time;
 ctx.clearRect(0,0,720,920);ctx.drawImage(original,0,0);
 const rect=monitorRect(r.art.desk.meta,seat,g.layout);
 if(state.gameScreen)paintMonitor(ctx,rect,state.time);
 // Screen content belongs behind actors, keeping head and hand occlusion intact.
 r.draw(g,state.time);
 const zoom=detail.getContext('2d');zoom.clearRect(0,0,900,760);zoom.imageSmoothingEnabled=true;
 const desk=g.layout.desks.find(d=>d.row===seat.row&&d.col===seat.col);
 zoom.drawImage(canvas,desk.x-12,desk.y-22,260,220,0,0,900,760);
 document.querySelector('#status').textContent=`${seat.id+1} 号工位 · ${state.gameScreen?'动态赛车':'办公屏幕'} · ${state.typing&&state.gameScreen?'敲键盘 '+(typingFrame(typingMeta,state.time)+1)+'/6':'原工作坐姿'} · ${state.paused?'已暂停':state.speed===1?'正常速度':'四分之一速度'} · ${r.assetErrors.length?'资源异常':'素材已加载'} · 仅预览`;
}
document.querySelector('#toggle').onclick=()=>{state.gameScreen=!state.gameScreen;document.querySelector('#toggle').setAttribute('aria-pressed',String(state.gameScreen));document.querySelector('#toggle').textContent=state.gameScreen?'游戏屏幕 · 查看原图':'原始屏幕 · 查看赛车';draw();};
function pauseLabel(){document.querySelector('#pause').setAttribute('aria-pressed',String(state.paused));document.querySelector('#pause').textContent=state.paused?'继续播放':'暂停观察';}
document.querySelector('#pause').onclick=()=>{state.paused=!state.paused;pauseLabel();draw();};
document.querySelector('#slow').onclick=()=>{state.speed=state.speed===1?.25:1;document.querySelector('#slow').setAttribute('aria-pressed',String(state.speed!==1));document.querySelector('#slow').textContent=state.speed===1?'慢速查看':'恢复正常速度';draw();};
document.querySelector('#typing').onclick=()=>{state.typing=!state.typing;document.querySelector('#typing').setAttribute('aria-pressed',String(state.typing));document.querySelector('#typing').textContent=state.typing?'敲键盘 · 对比静态姿势':'原工作坐姿 · 查看敲键盘';draw();};
document.querySelector('#step').onclick=()=>{state.paused=true;state.time+=.1;pauseLabel();draw();};
select.onchange=()=>{state.seat=Number(select.value);draw();};
window.gameScreenReview={renderer:r,game:g,state,draw,original,typingAsset,monitorRect:()=>monitorRect(r.art.desk.meta,seats[state.seat],g.layout)};
let last=0;function frame(now){if(last&&!state.paused)state.time+=Math.min(.1,(now-last)/1000)*state.speed;last=now;draw();requestAnimationFrame(frame);}
draw();requestAnimationFrame(frame);
