import {activities,seats,nodes} from './engine.js';

const W=720,H=920;
const xs=[...new Set(nodes.map(n=>n.x))].sort((a,b)=>a-b);
const ys=[...new Set(nodes.map(n=>n.y))].sort((a,b)=>a-b);

function roundedRect(c,x,y,w,h,r,fill,stroke,lineWidth=3){
 c.beginPath();c.roundRect(x,y,w,h,r);
 if(fill){c.fillStyle=fill;c.fill();}
 if(stroke){c.strokeStyle=stroke;c.lineWidth=lineWidth;c.stroke();}
}

function thickLine(c,pts,color,width=4){
 c.save();c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';
 c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.stroke();c.restore();
}

export function drawAssetCard(c,img,x,y,w,h,r=14,crop=.82,border='#fffdf3'){
 if(!img)return false;
 const iw=img.width||img.naturalWidth,ih=img.height||img.naturalHeight;
 const cw=iw*crop,ch=ih*crop,sx=(iw-cw)/2,sy=(ih-ch)/2;
 c.save();
 c.beginPath();c.roundRect(x,y,w,h,r);c.clip();
 c.drawImage(img,sx,sy,cw,ch,x,y,w,h);
 c.restore();
 c.save();
 c.beginPath();c.roundRect(x,y,w,h,r);
 c.strokeStyle=border;c.lineWidth=3;c.stroke();
 c.restore();
 return true;
}

function paperFloor(c){
 const g=c.createLinearGradient(0,0,0,H);
 g.addColorStop(0,'#fff8e4');g.addColorStop(.5,'#f7e6c1');g.addColorStop(1,'#e9d3a8');
 c.fillStyle=g;c.fillRect(0,0,W,H);
 c.save();
 c.strokeStyle='rgba(150,108,68,.10)';c.lineWidth=1;
 for(let y=0;y<H;y+=46){
  c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke();
 }
 for(let x=0;x<W;x+=46){
  c.beginPath();c.moveTo(x,0);c.lineTo(x,H);c.stroke();
 }
 c.restore();
}

function walkways(c){
 c.save();
 c.lineCap='round';
 for(const x of xs)thickLine(c,[[x,52],[x,868]],'rgba(255,245,205,.35)',54);
 for(const y of ys)thickLine(c,[[28,y],[692,y]],'rgba(255,245,205,.35)',54);
 c.strokeStyle='rgba(191,146,91,.16)';c.lineWidth=3;
 for(const x of xs){
  c.beginPath();c.moveTo(x-24,52);c.lineTo(x-24,868);c.moveTo(x+24,52);c.lineTo(x+24,868);c.stroke();
 }
 for(const y of ys){
  c.beginPath();c.moveTo(28,y-24);c.lineTo(692,y-24);c.moveTo(28,y+24);c.lineTo(692,y+24);c.stroke();
 }
 c.restore();
}

function doorComponent(c,x,y,vertical=false){
 const w=vertical?30:42,h=vertical?54:34;
 roundedRect(c,x-w/2-3,y-h/2-3,w+6,h+6,11,'#e7c78d','#8b5a2b',4);
 roundedRect(c,x-w/2,y-h/2,w,h,9,'#f7f3e2','#8b5a2b',3);
 roundedRect(c,x-w/2+5,y-h/2+5,w-10,h-10,6,'#d9b47a',null,0);
 roundedRect(c,x-w/2+10,y-h/2+9,w-20,h-18,5,'#f5ead1',null,0);
}

function workstationIsland(c,row,col){
 const x=col?390:100,y=136+row*235;
 c.save();
 c.shadowColor='rgba(95,63,35,.18)';c.shadowBlur=14;c.shadowOffsetY=5;
 roundedRect(c,x-12,y-12,246,204,18,'#fff6df','#8a6741',4);
 c.restore();
 roundedRect(c,x+4,y+4,238,184,13,'#f8e9c8','#9a7144',3);
 roundedRect(c,x+18,y+22,210,74,10,'#edd39b','#8e6c43',3);
 roundedRect(c,x+30,y+28,186,48,9,'#f8c46b','#9a6a31',3);
 roundedRect(c,x+34,y+32,178,40,8,'#fcdca2','#b5864a',2);
 roundedRect(c,x+70,y+96,100,10,5,'#d3a968','#8b5a2b',2);
 roundedRect(c,x+48,y+104,30,12,6,'#f3e6c8','#8b5a2b',2);
 roundedRect(c,x+164,y+104,30,12,6,'#f3e6c8','#8b5a2b',2);
 for(const seat of seats.filter(s=>s.row===row&&s.col===col)){
   const sx=seat.x,sy=seat.y-46;
   roundedRect(c,sx-23,sy-24,46,40,7,'#7fb5c6','#4a7583',3);
   roundedRect(c,sx-18,sy-18,36,24,5,'#cfeaf1',null,0);
   roundedRect(c,sx-17,sy+23,34,9,4,'#9aa5a1','#5d6f68',2);
 }
}

export function drawMapBase(c,assets={}){
 c.clearRect(0,0,W,H);
 if(assets['map-floor']?.img){
  const img=assets['map-floor'].img;
  c.drawImage(img,0,113,1024,1309,0,0,W,H);
 }else paperFloor(c);
 walkways(c);
 roundedRect(c,4,4,W-8,H-8,26,'#00000000','#8a6741',4);
 const doorImg=assets['map-door']?.img;
 for(const y of ys){
  if(doorImg){c.drawImage(doorImg,-6,y-20,40,40);c.drawImage(doorImg,W-34,y-20,40,40);}
  else{doorComponent(c,12,y,true);doorComponent(c,W-12,y,true);}
 }
 for(const x of xs){
  if(doorImg){c.drawImage(doorImg,x-20,-6,40,40);c.drawImage(doorImg,x-20,H-34,40,40);}
  else{doorComponent(c,x,14,false);doorComponent(c,x,H-14,false);}
 }
 for(let row=0;row<3;row++)for(let col=0;col<2;col++)workstationIsland(c,row,col);
 const deskImg=assets['map-desk']?.img;
 if(deskImg)for(let row=0;row<3;row++)for(let col=0;col<2;col++){
  const x=col?390:100,y=136+row*235;
  c.drawImage(deskImg,x-10,y-8,230,188);
 }
 c.save();c.strokeStyle='rgba(128,92,56,.14)';c.lineWidth=2;
 for(let i=0;i<12;i++){const seat=seats[i];c.beginPath();c.ellipse(seat.x,seat.y+15,30,12,0,0,Math.PI*2);c.stroke();}
 c.restore();
}

export function drawActivity(c,player,activity,t){
 if(player.seat===null||activity==='work')return;
 const x=player.x,y=player.y;
 if(activity==='joke'){
  const bob=Math.sin(t*3.4)*2;
  const glow=c.createRadialGradient(x,y-90,2,x,y-90,34);
  glow.addColorStop(0,'rgba(255,238,190,.28)');glow.addColorStop(1,'rgba(255,238,190,0)');
  c.fillStyle=glow;c.beginPath();c.arc(x,y-90,34,0,Math.PI*2);c.fill();
  roundedRect(c,x-26,y-142+bob,52,30,12,'#fff7df','#b98c47',3);
  c.beginPath();c.moveTo(x-12,y-114+bob);c.lineTo(x-3,y-102+bob);c.lineTo(x-19,y-102+bob);c.closePath();c.fillStyle='#fff7df';c.fill();
  c.strokeStyle='#b98c47';c.lineWidth=2;c.stroke();
 }else if(activity==='game'){
  const pulse=.28+.16*Math.abs(Math.sin(t*9));
  const glow=c.createRadialGradient(x,y-82,2,x,y-82,42);
  glow.addColorStop(0,`rgba(154,218,255,${pulse})`);glow.addColorStop(1,'rgba(154,218,255,0)');
  c.fillStyle=glow;c.beginPath();c.arc(x,y-82,42,0,Math.PI*2);c.fill();
  c.save();c.globalAlpha=.45+.2*Math.abs(Math.sin(t*13));c.strokeStyle='#9fd0e8';c.lineWidth=3;c.lineCap='round';
  c.beginPath();c.moveTo(x-12,y-20);c.lineTo(x-7,y-23);c.moveTo(x+7,y-20);c.lineTo(x+12,y-23);c.stroke();c.restore();
 }else if(activity==='dance'){
  const topY=y-150,floorY=y+42,bottomHalf=38,pulse=.30+.10*Math.sin(t*3.1);
  const beam=c.createLinearGradient(x,topY,x,floorY);
  beam.addColorStop(0,'rgba(255,236,168,.55)');beam.addColorStop(.45,`rgba(255,224,128,${pulse})`);beam.addColorStop(1,'rgba(255,214,110,.10)');
  c.fillStyle=beam;c.beginPath();c.moveTo(x-50,topY);c.lineTo(x+50,topY);c.lineTo(x+bottomHalf,floorY);c.lineTo(x-bottomHalf,floorY);c.closePath();c.fill();
  c.strokeStyle='rgba(255,244,196,.50)';c.lineWidth=3;c.beginPath();c.moveTo(x-50,topY);c.lineTo(x-bottomHalf,floorY);c.moveTo(x+50,topY);c.lineTo(x+bottomHalf,floorY);c.stroke();
  c.fillStyle='rgba(255,226,140,.30)';c.beginPath();c.ellipse(x,floorY,bottomHalf+10,bottomHalf*.34,0,0,Math.PI*2);c.fill();
 }
}

export function drawVision(c,inspector,activity,t){
 const range=activities[activity]?.range||100;
 const a0=inspector.angle-Math.PI/4,a1=inspector.angle+Math.PI/4;
 const checking=inspector.queue?.[0]?.phase==='checking',warning=inspector.queue?.[0]?.phase==='warning';
 const base=checking?'rgba(226,110,88,.14)':warning?'rgba(229,173,75,.15)':'rgba(185,170,124,.10)';
 c.save();
 c.beginPath();c.arc(inspector.x,inspector.y,range,a0,a1);c.lineTo(inspector.x,inspector.y);c.closePath();c.fillStyle=base;c.fill();
 c.fillStyle='rgba(255,238,200,.36)';c.beginPath();c.ellipse(inspector.x,inspector.y,12,9,0,0,Math.PI*2);c.fill();
 c.strokeStyle=checking?'#d1522f':warning?'#c98a24':'#a99a71';c.lineWidth=3;
 for(let k=0;k<3;k++){
  const u=((t*.55+k/3)%1),r=range*(.18+u*.82);
  c.globalAlpha=(1-u)*(checking?.95:warning?.8:.6);
  c.beginPath();c.arc(inspector.x,inspector.y,r,a0,a1);c.stroke();
 }
 c.globalAlpha=1;
 const sweep=a0+((Math.sin(t*2.2)*.5+.5)*(a1-a0));
 const g=c.createLinearGradient(inspector.x,inspector.y,inspector.x+Math.cos(sweep)*range,inspector.y+Math.sin(sweep)*range);
 g.addColorStop(0,checking?'rgba(217,105,79,.9)':warning?'rgba(207,150,59,.8)':'rgba(169,154,113,.6)');
 g.addColorStop(1,'rgba(255,255,255,0)');
 c.strokeStyle=g;c.lineWidth=3;c.beginPath();c.moveTo(inspector.x,inspector.y);c.lineTo(inspector.x+Math.cos(sweep)*range,inspector.y+Math.sin(sweep)*range);c.stroke();
 c.restore();
}

export function initStickerHud(root=document){
 const items=[...root.querySelectorAll('.hud-money,.hud-clock,.activity,#work,.tool-row button,.icon-button')];
 for(const el of items){
  el.classList.add('sticker');
  if(!el.querySelector(':scope > .sticker-shine')){
   const shine=document.createElement('i');shine.className='sticker-shine';el.append(shine);
  }
 }
}
