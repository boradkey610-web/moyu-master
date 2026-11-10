import {seats,activities} from './engine.js';
import {drawMapBase,drawActivity,drawVision,drawAssetCard} from './components.js';
const W=720,H=920;
export class Renderer{
 constructor(canvas){this.canvas=canvas;this.c=canvas.getContext('2d');this.bg=document.createElement('canvas');this.bg.width=W;this.bg.height=H;this.drawOffice(this.bg.getContext('2d'));this.art={};this.motion=new Map();this.ready=this.loadArt();}
 async loadArt(){
  this.assetErrors=[];this.toolIcons={};this.canvas.dataset.artStatus='loading';
  const iconsReady=this.loadToolIcons();
  try{
   const response=await fetch(new URL('../assets/manifest.json',import.meta.url));
   if(!response.ok)throw new Error('asset manifest');
   this.artManifest=await response.json();
   await Promise.all(Object.entries(this.artManifest).map(async([name,meta])=>{
    const img=new Image();img.src=new URL('../'+meta.src,import.meta.url).href;
    try{await img.decode();this.art[name]={img,meta};}catch{this.assetErrors.push(name);}
   }));
   this.drawOffice(this.bg.getContext('2d'));
  }catch{this.assetErrors.push('manifest');}
  await iconsReady;
  this.canvas.dataset.artStatus=this.assetErrors.length?'degraded':'ready';
  return this.assetErrors;
 }
 async loadToolIcons(){
  // The toolbar SVG is the single source for both the button and map pickup.
  await Promise.all(['mirror','meeting'].map(async type=>{
   const source=document.querySelector(`#${type} svg`);if(!source)return;
   const svg=source.cloneNode(true);svg.setAttribute('width','32');svg.setAttribute('height','32');
   const img=new Image();img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(svg));
   try{await img.decode();this.toolIcons[type]=img;}catch{this.assetErrors.push(type+'-icon');}
  }));
 }
 asset(c,name,x,y,w,h){
  const asset=this.art[name];if(!asset)return false;
  const [l,t,r,b]=asset.meta.bounds;
  c.drawImage(asset.img,l,t,r-l,b-t,x,y,w,h);return true;
 }
  paintedOffice(c){
   if(!this.art.office||!this.art.desk)return false;
   c.clearRect(0,0,W,H);c.drawImage(this.art.office.img,0,0,W,H);
   this.officeSkin(c);
  // Side-door centers share the exact road exit coordinates from the simulation.
  for(const y of [115,350,585,820])for(const right of [false,true]){
   c.save();if(right){c.translate(W,0);c.scale(-1,1);}
  if(this.art['room-details'])c.drawImage(this.art['room-details'].img,26,190,34,138,0,y-32,27,64);
  else this.door(c,0,y-30,24,60);
  c.restore();
 }
 for(let row=0;row<3;row++)for(let col=0;col<2;col++){
   const x=col?390:100,y=136+row*235;
   this.box(c,x-8,y-7,236,193,12,'#9e88691a','#bfb29b80',1);
   this.box(c,x-4,y-3,228,185,10,'#fffcf315','#fffcf391',2);
   // Simple vector desks keep every workstation to just monitor plus keyboard.
   this.desk(c,x+16,y+17,row,col);
  }
  return true;
 }
 officeSkin(c){
  // Warm “paper floor” pass: keeps the original map topology, only clarifies
  // the walkways, doorways, and workstation islands.
  c.save();
  c.globalCompositeOperation='source-over';
  c.fillStyle='rgba(255,244,206,.10)';c.fillRect(0,0,W,H);
  c.lineCap='round';
  for(const x of [65,355,655])this.line(c,[[x,54],[x,866]],'rgba(255,241,200,.14)',58);
  for(const y of [115,350,585,820])this.line(c,[[30,y],[690,y]],'rgba(255,241,200,.14)',58);
  for(const x of [65,355,655])for(const y of [115,350,585,820])this.ellipse(c,x,y,28,13,'rgba(255,234,180,.05)','rgba(255,243,203,.20)');
  c.restore();
 }
 actorTint(a){
  // Player keeps the original artwork colors: the yellow shirt alone makes the
  // protagonist pop. Only NPCs get a muted wash so they never read as the hero.
  if(a.type.startsWith('npc')){
   const rgba=[[168,167,148],[154,166,160],[179,162,143]][a.color||0];
   return `rgba(${rgba.join(',')},.42)`;
  }
  return null;
 }
 sprite(c,name,row,frame,x,feet,height,flip=false,tint=null){
  const asset=this.art[name],frames=asset?.meta.frames?.[row];if(!frames)return false;
  const f=frames[frame%frames.length],scale=height/Math.max(...frames.map(f=>f.h));
  c.save();c.translate(x,feet);if(flip)c.scale(-1,1);
  c.drawImage(asset.img,f.x,f.y,f.w,f.h,-f.anchor*scale,-f.h*scale,f.w*scale,f.h*scale);
  if(tint){
   // Flat-color silhouette masked by the sprite's own alpha, drawn over it.
   const off=this.tintLayer??(this.tintLayer=document.createElement('canvas'));
   off.width=f.w;off.height=f.h;
   const o=off.getContext('2d');o.clearRect(0,0,f.w,f.h);
   o.drawImage(asset.img,f.x,f.y,f.w,f.h,0,0,f.w,f.h);
   o.globalCompositeOperation='source-in';o.fillStyle=tint;o.fillRect(0,0,f.w,f.h);
   c.drawImage(off,0,0,f.w,f.h,-f.anchor*scale,-f.h*scale,f.w*scale,f.h*scale);
  }
  c.restore();return true;
 }
 paintedPerson(c,a,pose,t){
  const name=a.type.startsWith('npc')?'npc':a.type;
  const y=a.y+(a.activity==='dance'?36:0);
  const tint=this.actorTint(a);
  if(pose.seated){
   if(!this.art.seated)return false;
   const row=a.type==='player'?0:1,frame=a.type==='player'?({work:0,joke:1,game:2}[a.activity]||0):0;
   this.sprite(c,'seated',row,frame,a.x,a.y+16,99,false,tint);
   this.chair(c,a.x,a.y,!!a.gold,'front');return true;
  }
  if(!this.art[name])return false;
  this.ellipse(c,a.x,y+1,17,6,'#4d463a2b');
  const row=pose.direction==='up'?2:pose.direction==='down'?1:0;
  let frame=pose.moving?[0,1,3,2][Math.floor(pose.travel/8.5)%4]:1;
  c.save();
  if(a.activity==='dance'){
   // Dance owns its own groove: body sways side to side and leans with the beat
   // instead of cycling through walk frames.
   const beat=Math.sin(t*5.2),beat2=Math.sin(t*5.2+.9);
   c.translate(a.x,y);c.rotate(beat*.16);c.translate(-a.x,-y+Math.abs(beat)*3);
   c.scale(1-beat2*.045,1+beat2*.045);
  }
  const characterColumn={player:0,boss:1,supervisor:2,npc:3}[name];
  const walkAtlas=row===2?'back_steps':row===1?'front_steps':'side_steps';
  if(!pose.moving&&a.activity!=='dance'&&this.art.idle)
   this.sprite(c,'idle',row,characterColumn,a.x,y,98,pose.direction==='left',tint);
  else if(pose.moving&&a.activity!=='dance'&&this.art[walkAtlas]&&this.art.idle){
   const phase=Math.floor(pose.travel/8.5)%4;
   if(phase%2===0)this.sprite(c,walkAtlas,phase/2,characterColumn,a.x,y,98,pose.direction==='left',tint);
   else this.sprite(c,'idle',row,characterColumn,a.x,y,98,pose.direction==='left',tint);
  }else this.sprite(c,name,a.activity==='dance'?1:row,frame,a.x,y,98,pose.direction==='left',tint);
  c.restore();
  if(a.activity==='dance'){
   // Raised hands and a turning head sell the dance beyond the body sway.
   const beat=Math.sin(t*5.2),sway=Math.sin(t*5.2+.9);
   const ph=this.palette(name==='player'?'player':name==='boss'?'boss':name==='supervisor'?'supervisor':'npc0');
   const lift=14+beat*10;
   for(const s of [-1,1]){
    const ex=a.x+s*16+sway*7,ey=y-52-lift+(s>0?beat*5:-beat*5);
    this.line(c,[[a.x+s*13,y-40],[a.x+s*22,y-50-lift*.3],[ex,ey]],ph.shade,9);
    this.line(c,[[a.x+s*13,y-41],[a.x+s*22,y-51-lift*.3],[ex,ey]],ph.shirt,6);
    this.ellipse(c,ex,ey-3,4.5,5.5,ph.skin,'#9a7559');
   }
   this.text(c,'♫',a.x-34,y-84+beat*6,23,'#d96098','800');
   this.text(c,'♪',a.x+35,y-102+sway*6,20,'#9866c8','800');
  }
  return true;
 }
 box(c,x,y,w,h,r,fill,stroke='#897d65',line=2){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.stroke();}}
 ellipse(c,x,y,rx,ry,fill,stroke){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
 line(c,pts,color,width=2){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();}
 text(c,t,x,y,size=16,color='#5e5749',weight='600'){c.font=`${weight} ${size}px "PingFang SC",sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillStyle=color;c.fillText(t,x,y);}
 plant(c,x,y,s=1){c.save();c.translate(x,y);c.scale(s,s);this.ellipse(c,0,7,23,9,'#554f3620');this.box(c,-14,-14,28,31,7,'#cfbea0','#8b8167');this.ellipse(c,0,-12,16,6,'#655a43','#958a6d');for(let i=0;i<9;i++){const a=i*2.4;const dx=Math.cos(a)*18,dy=-25+Math.sin(a)*15;c.save();c.translate(dx/2,dy/2-9);c.rotate(a);this.ellipse(c,0,0,8,21,['#77945b','#93ac70','#5f8451'][i%3],'#5c7549');c.restore();}this.line(c,[[0,-5],[0,-38]],'#617e48',2);c.restore();}
 door(c,x,y,w=65,h=62){this.box(c,x-5,y-5,w+10,h+10,3,'#bdc0b7','#8c9187');this.box(c,x,y,w,h,2,'#a5c0c5','#778c8e');this.line(c,[[x+w/2,y],[x+w/2,y+h]],'#70898d');this.line(c,[[x+8,y+8],[x+w-8,y+8]],'#cfe0df',3);this.box(c,x+w/2-10,y+h/2,4,13,1,'#dfe7db','#788d8b',1);this.box(c,x+w/2+6,y+h/2,4,13,1,'#dfe7db','#788d8b',1);}
 couch(c,x,y){this.ellipse(c,x+69,y+45,80,15,'#514a3220');this.box(c,x,y,140,46,8,'#86adb1','#668b91');this.box(c,x+7,y-12,126,31,6,'#a3c5c7','#6b969b');this.box(c,x+7,y+17,126,21,5,'#abc9c8','#73999a');this.line(c,[[x+69,y+18],[x+69,y+37]],'#7b9e9f');this.box(c,x-6,y+5,15,35,5,'#a2c4c5','#72999a');this.box(c,x+131,y+5,15,35,5,'#a2c4c5','#72999a');this.line(c,[[x+10,y+46],[x+10,y+52]],'#82765e',4);this.line(c,[[x+125,y+46],[x+125,y+52]],'#82765e',4);}
 drawOffice(c){drawMapBase(c,this.art);}
 desk(c,x,y,row,col){this.box(c,x+4,y+15,187,103,4,'#68553820',null);this.box(c,x,y+11,190,95,4,'#c8a878','#8d6d4d');this.box(c,x,y,190,83,4,'#f0d7a6','#9b7a54');this.line(c,[[x+4,y+4],[x+186,y+4]],'#fff0c6',2);
 for(let s=0;s<2;s++){const dx=x+21+s*90;this.box(c,dx+18,y+34,12,16,1,'#8d9a9a','#697a7b',1);this.box(c,dx,y+11,51,35,3,'#d5ded6','#687d81',2);const screen=c.createLinearGradient(dx,y+12,dx+50,y+46);screen.addColorStop(0,'#7bb4cb');screen.addColorStop(1,'#cce6e9');this.box(c,dx+4,y+15,43,25,1,screen,null);c.fillStyle='#f7ffff7a';c.beginPath();c.moveTo(dx+9,y+16);c.lineTo(dx+30,y+16);c.lineTo(dx+12,y+39);c.lineTo(dx+5,y+39);c.fill();this.box(c,dx+2,y+58,45,14,2,'#9aa5a1','#536269',1);}
}
 chair(c,x,y,gold=false,layer='all'){
  const texture=gold?'chair-gold':'chair';
  if(this.art?.[texture]){
   if(layer!=='base'){
    c.save();if(gold){c.filter='brightness(1.22) saturate(1.45)';c.shadowColor='#ffd449';c.shadowBlur=9;}
    const scale=gold&&layer==='all'?1.14:1;
    this.asset(c,texture,x-25*scale,y+40-58*scale,50*scale,58*scale);c.restore();
   }return;
  }
  const edge='#536d70', seat=gold?'#c5ad69':'#7faaa9', back=gold?'#ddc47d':'#a5c9c5';
  if(layer!=='front'){
   this.ellipse(c,x,y+25,28,9,'#534f3423');
   this.line(c,[[x,y+8],[x,y+27]],'#718184',5);
   for(const [dx,dy] of [[-21,30],[21,30],[-14,18],[14,18],[0,36]]){
    this.line(c,[[x,y+25],[x+dx,y+dy]],'#5c7073',3);
    this.ellipse(c,x+dx,y+dy+1,4,3,'#3e5157');
   }
   this.box(c,x-21,y-16,42,31,9,seat,edge,2);
   this.line(c,[[x-15,y-12],[x+14,y-12]],'#c8dfd5',2);
  }
  if(layer!=='base'){
   this.line(c,[[x-16,y+2],[x-16,y+21]],edge,3);
   this.line(c,[[x+16,y+2],[x+16,y+21]],edge,3);
   const shine=c.createLinearGradient(x,y-7,x,y+18);
   shine.addColorStop(0,back);shine.addColorStop(1,seat);
   this.box(c,x-23,y-9,46,29,8,shine,edge,2);
   this.line(c,[[x-15,y-5],[x+14,y-5]],gold?'#f6e1a2':'#d0e6dc',2);
   this.line(c,[[x-28,y-13],[x-28,y+7]],edge,3);
   this.line(c,[[x+28,y-13],[x+28,y+7]],edge,3);
   this.line(c,[[x-31,y-13],[x-25,y-13]],'#aec4be',4);
   this.line(c,[[x+25,y-13],[x+31,y-13]],'#aec4be',4);
  }
 }
 palette(type){
  const player=type==='player',boss=type==='boss',supervisor=type==='supervisor';
  return {skin:'#edc4a0',hair:boss?'#343333':supervisor?'#544037':player?'#684735':'#594b40',
   shirt:player?'#f0c451':boss?'#3e4854':supervisor?'#e2ece6':['#9eafa1','#9eafc5','#c5a7a0'][Number(type.slice(-1))||0],
   shade:player?'#c89532':boss?'#293440':supervisor?'#a6bbb7':'#778b8b'};
 }
 badge(c,a){
  // Light shoulder tab keeps the player readable in every pose and atlas path.
  c.save();c.fillStyle='#f6f3e8';c.strokeStyle='#fffdf2aa';c.lineWidth=1.5;
  c.beginPath();c.roundRect(a.x-20,a.y-46,9,9,2);c.fill();c.stroke();c.restore();
 }
 activityEffects(c,a,t){
  drawActivity(c,a,a.activity,t);
 }
 head(c,type,direction,cy=-63){
  const p=this.palette(type),back=direction==='up',side=direction==='left'||direction==='right';
  c.save();c.translate(0,cy);if(direction==='left')c.scale(-1,1);
  this.ellipse(c,0,0,side?15:18,20,p.skin,'#70503c');
  if(back){
   this.ellipse(c,-17,4,3,5,p.skin,'#8e694b');this.ellipse(c,17,4,3,5,p.skin,'#8e694b');
   this.ellipse(c,0,-3,18,20,p.hair,'#493a31');
   this.line(c,[[-12,-13],[-5,-19],[5,-18]],'#a17b59',2);
   this.line(c,[[-12,9],[-5,15],[7,14]],'#49392e',2);
  }else{
   c.beginPath();c.moveTo(-17,6);c.bezierCurveTo(-26,-20,-4,-29,13,-18);
   c.quadraticCurveTo(24,-11,side?14:17,side?-4:4);
   c.lineTo(side?8:12,-11);c.quadraticCurveTo(-1,-5,-12,-11);c.lineTo(-13,8);
   c.closePath();c.fillStyle=p.hair;c.fill();c.strokeStyle='#483b32';c.lineWidth=2;c.stroke();
   this.line(c,[[-13,-14],[-6,-19],[3,-19]],'#a07b5a',1.5);
   if(side){
    this.ellipse(c,15,4,5,3,p.skin,'#a97e5e');
    this.ellipse(c,-3,6,4,5,p.skin,'#a97e5e');
    if(type==='boss')this.box(c,7,-5,11,7,2,'#28343b','#202b30',1);
    else {this.ellipse(c,12,-1,1.8,2.2,'#3a3b36');if(type==='supervisor')this.box(c,6,-6,13,10,3,'#d4eeed66','#58666a',1);}
    this.line(c,[[12,12],[16,11]],'#ac795d',1.3);
   }else{
    this.ellipse(c,-18,4,3,5,p.skin);this.ellipse(c,18,4,3,5,p.skin);
    if(type==='boss'){
     this.box(c,-15,-5,13,8,2,'#26343d','#202a30',1);this.box(c,2,-5,13,8,2,'#26343d','#202a30',1);
     this.line(c,[[-2,-3],[2,-3]],'#27343b',2);
    }else{
     this.ellipse(c,-7,-1,2,2.4,'#383e39');this.ellipse(c,7,-1,2,2.4,'#383e39');
     if(type==='supervisor'){this.box(c,-15,-6,13,11,3,'#d4eeed44','#58666a',1);this.box(c,2,-6,13,11,3,'#d4eeed44','#58666a',1);this.line(c,[[-2,-3],[2,-3]],'#58666a',1);}
    }
    this.line(c,[[0,3],[-1,7],[2,7]],'#c39471',1);
    this.line(c,[[-4,12],[3,12]],'#a8755a',1.3);
   }
  }
  c.restore();
 }
 seatedPerson(c,x,y,type,time,activity='work',gold=false){
  const p=this.palette(type),tap=Math.sin(time*(activity==='game'?17:7));
  c.save();c.translate(x,y);
  // Bent legs go beside the cushion; the chair back occludes the hips.
  this.line(c,[[-14,-6],[-24,4],[-25,17]],'#465563',7);
  this.line(c,[[14,-6],[24,4],[25,17]],'#465563',7);
  this.ellipse(c,-25,20,6,4,'#35434c');this.ellipse(c,25,20,6,4,'#35434c');
  const cloth=c.createLinearGradient(-18,-43,19,-9);cloth.addColorStop(0,p.shirt);cloth.addColorStop(1,p.shade);
  this.box(c,-19,-43,38,38,10,cloth,'#655642',1.8);
  this.line(c,[[-12,-36],[-12,-16]],'#ffffff30',2);
  this.line(c,[[9,-34],[10,-13]],'#51473722',2);
  // Forearms reach the keyboard on the desk instead of hanging at the hips.
  for(const side of [-1,1]){
   const handY=activity==='joke'&&side===1?-51:-65+(side===1?tap:-tap)*1.2;
   this.line(c,[[side*15,-37],[side*24,-45],[side*19,handY+4]],p.shade,10);
   this.line(c,[[side*15,-38],[side*24,-46],[side*19,handY+3]],p.shirt,7);
   this.ellipse(c,side*19,handY,4,5,p.skin,'#9a7559');
  }
  if(activity==='joke'){
   this.box(c,17,-64,12,20,3,'#344c5a','#263844',1);
   this.box(c,19,-61,8,13,1,'#acd8df',null);this.line(c,[[21,-57],[25,-57]],'#f7ffff',1);
  }
  this.box(c,-6,-49,12,10,3,p.skin,'#8e6b4f',1);
  this.head(c,type,'up',-63+Math.sin(time*2)*.5);
  c.restore();
  this.chair(c,x,y,gold,'front');
 }
 person(c,x,y,type,time,moving=false,activity='work',direction='down'){
  const p=this.palette(type),side=direction==='left'||direction==='right',back=direction==='up';
  const phase=moving?Math.sin(time*11):0,bob=moving?-Math.abs(Math.cos(time*11))*1.8:0;
  c.save();c.translate(x,y+bob);if(direction==='left')c.scale(-1,1);
  if(activity==='dance')c.rotate(Math.sin(time*9)*.08);
  this.ellipse(c,0,0,19,6,'#353c3524');
  for(const leg of [-1,1]){
   const sx=side?leg*4:leg*8, stride=phase*leg*8;
   const fx=side?sx+stride:sx+phase*leg*2,fy=side?-2+Math.max(0,-phase*leg)*5:-2+stride*.45;
   this.line(c,[[sx,-26],[sx+stride*.5,-13],[fx,fy]],leg===-1?'#344450':'#4d5d68',8);
   this.ellipse(c,fx+(side?3:0),fy+1,side?8:6,3.5,'#303c45');
   this.line(c,[[fx-3,fy+2],[fx+5,fy+2]],'#6f7c7e',1);
  }
  const width=side?25:34,cloth=c.createLinearGradient(-18,-51,18,-22);
  cloth.addColorStop(0,p.shirt);cloth.addColorStop(1,p.shade);
  this.box(c,-width/2,-51,width,29,7,cloth,'#4e5148',1.7);
  this.line(c,[[-width/2+4,-46],[-width/2+4,-29]],'#ffffff28',2);
  if(!back&&!side){
   this.line(c,[[-5,-49],[0,-43],[5,-49]],type==='boss'?'#eff0e7':'#d8cbb0',2);
   if(type==='boss'||type==='supervisor')this.line(c,[[0,-44],[0,-30]],type==='boss'?'#d56e5e':'#5b8895',3);
   else this.box(c,6,-42,6,7,1,'#ffffff19','#ffffff35',1);
  }else if(back)this.line(c,[[-8,-47],[8,-47]],'#ffffff25',1);
  const arms=side?[-1,1]:[1,-1];
  for(const arm of arms){
   const ax=side?arm*7:arm*17,swing=phase*arm*7;
   const hx=activity==='dance'?arm*25:side?ax-swing:ax+arm*4;
   const hy=activity==='dance'?-65+(arm*phase*3):-30+(side?0:swing*.4);
   this.line(c,[[ax,-45],[side?ax-swing*.5:ax+arm*4,-36],[hx,hy]],arm===-1?p.shade:p.shirt,8);
   this.ellipse(c,hx,hy+3,4,5,p.skin,'#957052');
  }
  this.box(c,-5,-57,10,9,3,p.skin,'#8d6b50',1);
  // Mirror the complete side pose once, including face and stride.
  this.head(c,type,side?'right':direction,-69);
  if(type==='boss'){
   const bx=side?-13:23,by=-23+phase*2;
   this.box(c,bx-7,by,15,21,3,'#7d684d','#463d31',1.5);
   this.box(c,bx-3,by-4,7,5,1,'#0000','#463d31',1.5);
   this.line(c,[[bx-4,by+5],[bx+5,by+5]],'#b09a75',1);
  }
  if(type==='supervisor')this.box(c,side?-17:20,-32,15,22,2,'#81afbb','#4f7882',1.5);
  if(activity==='dance'){this.text(c,'♫',-32,-85,25,'#d76c9c','800');this.text(c,'♪',32,-95+Math.sin(time*5)*5,22,'#9e6bc5','800');}
  c.restore();
 }
 pose(actor,key){
  const previous=this.motion.get(key);
  const dx=previous?actor.x-previous.x:0,dy=previous?actor.y-previous.y:0;
  const distance=Math.hypot(dx,dy),hasMoved=distance>.01;
  const next=actor.route?.[0]||(actor.queue?.[0]?.kind==='move'?actor.queue[0]:null);
  const travelling=!actor.hold&&!!next;
  const seated=Number.isInteger(actor.seat)&&!actor.route?.length&&actor.activity!=='dance';
  let angle=actor.angle;
  // A wait command may change the inspection angle in the same simulation tick
  // as the final walking step. Actual movement owns the displayed walk direction.
  if(hasMoved)angle=Math.atan2(dy,dx);
  else if(travelling&&Math.hypot(next.x-actor.x,next.y-actor.y)>.01)
   angle=Math.atan2(next.y-actor.y,next.x-actor.x);
  let direction=this.facings.get(key)||'down';
  if(Number.isFinite(angle))direction=Math.abs(Math.cos(angle))>.7?
   (Math.cos(angle)>0?'right':'left'):(Math.sin(angle)>0?'down':'up');
  if(seated)direction='up';
  const travel=(previous?.travel||0)+distance;
  this.motion.set(key,{x:actor.x,y:actor.y,travel});this.facings.set(key,direction);
  return {direction,seated,travel,moving:!seated&&(hasMoved||travelling)};
 }

 chip(c,text,x,y,color='#fffaf0',ink='#5b5548',size=14){c.font=`bold ${size}px "PingFang SC",sans-serif`;const width=c.measureText(text).width+18,height=size+10;x=Math.max(width/2+5,Math.min(W-width/2-5,x));this.box(c,x-width/2,y-height/2,width,height,7,color,'#a69b8190',1);this.text(c,text,x,y,size,ink,'700');}
 goldGlow(c,seat,t){
  const x=seat.x,y=seat.y,pulse=.9+Math.sin(t*2.6)*.25;
  c.save();c.globalAlpha=Math.min(1,pulse);
  const glow=c.createRadialGradient(x,y-7,8,x,y-7,92);
  glow.addColorStop(0,'#ffe35faa');glow.addColorStop(.5,'#ffcf3455');glow.addColorStop(1,'#ffc53b00');
  c.fillStyle=glow;c.fillRect(x-94,y-100,188,188);
  const beam=c.createLinearGradient(x,y-120,x,y+26);beam.addColorStop(0,'#ffe88b00');beam.addColorStop(1,'#ffda5970');
  c.fillStyle=beam;c.beginPath();c.moveTo(x-54,y-120);c.lineTo(x+54,y-120);c.lineTo(x+34,y+26);c.lineTo(x-34,y+26);c.closePath();c.fill();c.restore();
 }
 goldBadge(c,seat,left,t=0){
  const x=seat.x,y=seat.y+64,urgent=left<=5;
  c.save();c.globalAlpha=.85+Math.sin(t*4)*.15;
  this.text(c,'▼',x,y-44,26,urgent?'#e88a3c':'#ffc93c','900');
  c.restore();
  c.save();c.shadowColor='#a66a2b66';c.shadowBlur=8;c.shadowOffsetY=3;
  this.box(c,x-79,y-21,158,42,13,urgent?'#c77438':'#b47a22','#fff0b1',2.5);c.restore();
  this.ellipse(c,x-51,y,13,13,'#ffd35c','#ffeaa0');
  this.ellipse(c,x-51,y,10,10,'#f5bc3b');this.text(c,'¥',x-51,y+1,18,'#9d681b','800');
  this.text(c,'×2',x-17,y,21,'#fff9de','800');
  this.line(c,[[x+14,y-11],[x+14,y+11]],'#ffe7a16b',1);
  this.text(c,`${Math.ceil(left)}s`,x+44,y,21,'#fff9de','800');
  c.beginPath();c.moveTo(x-6,y-21);c.lineTo(x,y-28);c.lineTo(x+6,y-21);c.fillStyle=urgent?'#c77438':'#b47a22';c.fill();
  for(const [dx,dy,phase] of [[-44,-30,0],[40,-4,1.6],[26,-48,3]]){
   const r=5+(Math.sin(t*3+phase)+1)*2.5,sy=seat.y+dy;
   c.save();c.shadowColor='#ffc739';c.shadowBlur=8;c.beginPath();c.moveTo(x+dx,sy-r);c.lineTo(x+dx+2.5,sy-2.5);c.lineTo(x+dx+r,sy);c.lineTo(x+dx+2.5,sy+2.5);c.lineTo(x+dx,sy+r);c.lineTo(x+dx-2.5,sy+2.5);c.lineTo(x+dx-r,sy);c.lineTo(x+dx-2.5,sy-2.5);c.closePath();c.fillStyle='#fff9d2';c.fill();c.strokeStyle='#e9b53c';c.lineWidth=1;c.stroke();c.restore();
  }
 }
 noiseLabel(source){return !source?.active?(source?.volume>0?'声音渐小':'安静'):source.volume<40?'轻声':source.volume<75?'声音传开':'很吵';}
 soundTarget(ins){
  if(ins.hidden||ins.leaving)return null;
  const point=ins.pendingSound||(ins.directed&&ins.evidenceKind==='sound'?ins.lastHeard:null)||ins.lastHeard;
  if(!point)return null;
  const age=ins.clock-point.time,fresh=age>=0&&age<1.6;
  if(!ins.pendingSound&&!(ins.directed&&ins.evidenceKind==='sound')&&!fresh)return null;
  return{point,age,fresh,pending:!!ins.pendingSound,current:ins.directed&&ins.evidenceKind==='sound'?ins.lastHeard:null};
 }
 soundSources(c,g,t){
  for(const source of g.soundField?.sources||[])if(source.active){
   const loud=source.volume>=40;
   for(let n=0;n<2;n++){const wave=(t*(loud?1.4:.8)+n/2)%1;c.save();c.globalAlpha=(1-wave)*(loud?.65:.3);this.ellipse(c,source.x,source.y-5,26+wave*(loud?58:24),15+wave*(loud?34:14),'#0000',loud?'#c57d98':'#9aaf9a');c.restore();}
  }
  for(const ins of g.inspectors){const cue=this.soundTarget(ins);if(!cue)continue;const p=cue.point;
   c.save();c.setLineDash([7,7]);c.lineDashOffset=-t*22;this.line(c,[[ins.x,ins.y-34],[p.x,p.y+10]],cue.pending?'#b19d6f99':'#d0873999',2.5);c.restore();
   this.ellipse(c,p.x,p.y+8,48+Math.sin(t*5)*3,27,'#ffc95b24','#d58b39',3);
   if(cue.current&&cue.current.seat!==p.seat){const old=cue.current;this.line(c,[[ins.x,ins.y-34],[old.x,old.y+10]],'#d0873999',2.5);this.ellipse(c,old.x,old.y+8,48,27,'#ffc95b24','#d58b39',3);}
  }
 }
 soundSignals(c,g,t){
  const marked=new Set();
  for(const ins of g.inspectors){const cue=this.soundTarget(ins);if(!cue)continue;const p=cue.point;
   if(!marked.has(p.seat)){marked.add(p.seat);this.chip(c,`${p.kind==='dance'?'♪':'⌨'} ${p.seat+1}号 · ${cue.pending?'待查看':p.seat===g.player.seat?'声源':'旧声源'}`,p.x,p.y+24,'#fff0ce','#9a6129',19);}
   if(cue.current&&cue.current.seat!==p.seat&&!marked.has(cue.current.seat)){const old=cue.current;marked.add(old.seat);this.chip(c,`${old.seat+1}号 · ${ins.queue?.[0]?.phase==='checking'?'正查':'调查中'}`,old.x,old.y+24,'#fff0ce','#9a6129',19);}
   if(cue.fresh){
    const x=Math.max(32,Math.min(W-32,ins.x+32)),y=Math.max(36,ins.y-154),pop=1+Math.max(0,1-cue.age/.3)*.65,bounce=Math.sin(Math.min(1,cue.age/.5)*Math.PI)*8;
    c.save();c.translate(x,y-bounce);c.scale(pop,pop);
    for(let k=0;k<6;k++){const a=k*Math.PI/3+t*.5;this.line(c,[[Math.cos(a)*29,Math.sin(a)*29],[Math.cos(a)*35,Math.sin(a)*35]],'#e4a445',3);}
    this.ellipse(c,0,0,23,25,'#d87344','#fff2c8',3);this.text(c,'!',0,1,33,'#fff9dc','900');c.restore();
   }
  }
 }
 noiseBadge(c,g,a){
  const source=g.soundField?.sources.find(s=>s.seat===a.seat),volume=source?.volume||0,label=a.warmup>0?'音箱启动中':this.noiseLabel(source),loud=source?.active&&volume>=40;
  const x=Math.max(140,Math.min(W-140,a.x)),y=a.y-140,ink=loud?'#9c627f':'#798771';
  this.box(c,x-133,y-17,266,34,9,loud?'#f6e6ed':'#f4f4e5',loud?'#c58ca8':'#b6c0a4',1.5);
  c.save();c.fillStyle=ink;c.beginPath();c.moveTo(x-119,y-4);c.lineTo(x-113,y-4);c.lineTo(x-106,y-10);c.lineTo(x-106,y+10);c.lineTo(x-113,y+4);c.lineTo(x-119,y+4);c.closePath();c.fill();c.restore();
  this.text(c,`${activities[a.activity].name} · ${label}`,x-6,y,19,ink,'750');
  const bars=Math.min(4,Math.ceil(volume/25));
  for(let k=0;k<4;k++)this.box(c,x+98+k*7,y+8-(5+k*4),4,5+k*4,1,k<bars?ink:'#d9d8ca',null);
 }
 inspectionCone(c,ins,activity,t){
  drawVision(c,ins,activity,t);
 }
 inspectionLabel(c,actor,pose){
  const command=actor.queue?.[0],phase=command?.phase;
  const left=Math.max(0,Number(command?.left)||0).toFixed(1);
  let label=actor.name,color=actor.name==='老板'?'#f6e6d8':'#e4eff0',ink='#5b5548';
  const sound=this.soundTarget(actor);
  if(actor.leaving)label+=' · 去开会';
  else if(sound?.fresh){label+=sound.point.kind==='dance'?' · 听到音乐！':' · 听到键盘声！';color='#ffe0ad';ink='#a6532d';}
  else if(sound?.pending){label+=`${sound.current?` · ${sound.current.seat+1}号`:''} · 稍后查${sound.point.seat+1}号`;color='#fff0ce';ink='#9a6129';}
  else if(sound){label+=phase?` · ${sound.point.seat+1}号`:` · 去查${sound.point.seat+1}号`;color=actor.threatensPlayer===false?'#edf0df':'#fff0ce';ink='#9a6129';}
  else if((phase==='warning'||phase==='checking')&&actor.threatensPlayer===false){label+=actor.evidenceKind==='sound'?' · 在查旧声源':' · 在查别处';color='#e9efe5';ink='#758b77';}
  else if(phase==='warning'){label+=` · ${left}秒后检查`;color='#fff0be';ink='#936527';}
  else if(phase==='checking'){label+=` · 检查 ${left}秒`;color='#fae0d5';ink='#a04f3c';}
  else if(actor.directed){label+=actor.evidenceKind==='sound'?(actor.lastHeard?.kind==='dance'?' · 听见音乐，去看看':' · 听见键盘声'):' · 去确认一下';color='#fff0be';ink='#936527';}
  else if(actor.suspicion>0){label+=' · 发现有动静了';color='#fff0be';ink='#936527';}
  else if(!pose.moving&&command?.kind==='wait')label+=` · 巡视 ${left}秒`;
  if(sound&&phase)label+=phase==='warning'?` · ${sound.pending?'当前':''}${left}秒后查`:` · 检查${left}秒`;
  this.chip(c,label,actor.x,Math.max(17,actor.y-110),color,ink,21);
 }
 playerStakes(c,g){
  const p=g.player,combo=Math.max(0,g.comboTime||0),pending=Math.max(0,g.pendingBonus||0);
  if(combo>0&&p.activity!=='work'&&!(g.feedback?.left>0)){
   const stage=combo>=9?60:combo>=6?40:combo>=3?20:0;
   const earned=pending.toFixed(1),label=stage?`连摸 +${stage}% · 待收 +${earned}`:`连摸蓄力 · 再摸 ${Math.ceil(3-combo)} 秒`;
   c.save();c.font='700 21px "PingFang SC",sans-serif';
   const width=Math.max(210,c.measureText(label).width+24),x=Math.max(width/2+5,Math.min(W-width/2-5,p.x)),y=Math.max(44,p.y-181);
   this.box(c,x-width/2,y-20,width,40,9,stage?'#fff0c8':'#fff8e8',stage?'#c39642':'#c7b68c',1.5);
   this.text(c,label,x,y-2,21,stage?'#946222':'#8c7b53','750');
   const progress=stage===60?1:(combo%3)/3;
   this.box(c,x-width/2+8,y+15,width-16,3,1.5,'#e5d8b8',null);
   if(progress>0)this.box(c,x-width/2+8,y+15,(width-16)*progress,3,1.5,stage?'#d19a36':'#aaa375',null);
   c.restore();
  }
  const exposure=Math.max(0,g.exposure||0),limit=Number(g.exposureLimit)||1;
  if(exposure>0){
   const ratio=Math.min(1,exposure/limit),x=Math.max(67,Math.min(W-67,p.x)),y=Math.max(19,p.y-225);
   c.save();this.box(c,x-82,y-15,164,30,8,'#583e37','#fff1de',1.5);
   if(ratio>0)this.box(c,x-80,y-13,160*ratio,26,6,ratio>.65?'#dd6950':'#d6a044',null);
   this.text(c,ratio>.65?'快收手！':'正在暴露',x,y,19,'#fff9e9','800');c.restore();
  }
 }
 momentFeedback(c,g){
  const f=g.feedback;if(!f||!(f.left>0))return;
  const p=g.player,x=Number.isFinite(f.x)?f.x:p.x,y=Number.isFinite(f.y)?f.y:p.y;
  const progress=Math.max(0,Math.min(1,1-f.left/1.4)),bank=f.kind==='bank',amount=Math.max(0,Number(f.amount)||0);
  const message=f.text||(bank?'稳稳收好！':'极限收手！');
  c.save();c.globalAlpha=Math.min(1,f.left/.3);
  this.chip(c,amount>0?`${message} +${amount.toFixed(1)}`:message,x,Math.max(19,y-181-progress*15),bank?'#fff0bf':'#e6f2df',bank?'#946324':'#527c4c',21);
  if(amount>0){
   for(let i=0;i<3;i++){
    const u=Math.max(0,Math.min(1,(progress-i*.09)/.75));if(u<=0||u>=1)continue;
    const ease=1-(1-u)*(1-u),cx=x+(62-x)*ease+Math.sin(u*Math.PI)*(i-1)*23,cy=y-95+(-22-(y-95))*ease-Math.sin(u*Math.PI)*44;
    this.ellipse(c,cx,cy,9,9,'#ffd665','#b6842d');this.text(c,'¥',cx,cy+1,11,'#aa7428','800');
   }
  }
  c.restore();
 }
 incomePop(c,a,t){
  const rate=a.warmup>0?0:activities[a.activity].rate*(a.gold?2:1);if(!rate)return;
  const side=a.seat%2===0?-1:1,phase=(t*1.05)%1,y=a.y-74-phase*18;
  c.save();c.globalAlpha=Math.min(1,phase/.12,(1-phase)/.24);
  c.font='800 24px "PingFang SC",sans-serif';c.textAlign='left';c.textBaseline='alphabetic';
  const label=`+${rate}`,metrics=c.measureText(label),width=26+metrics.width,x=Math.max(width/2+3,Math.min(W-width/2-3,a.x+side*76)),left=x-width/2,cx=left+10;
  const textY=y+((metrics.actualBoundingBoxAscent??18)-(metrics.actualBoundingBoxDescent??0))/2;
  this.ellipse(c,cx+1,y+1,9,9,'#bd8025','#a36c22');
  const gold=c.createLinearGradient(cx-7,y-9,cx+5,y+8);gold.addColorStop(0,'#ffe58b');gold.addColorStop(.45,'#f8cc4e');gold.addColorStop(1,'#eaaa29');
  this.ellipse(c,cx-1,y-1,9,9,gold,'#bf8427');this.ellipse(c,cx-1,y-1,6,6,'#f5c441','#e6aa30');
  c.beginPath();c.arc(cx-1,y-1,6,Math.PI*1.08,Math.PI*1.7);c.strokeStyle='#fff1b2';c.lineWidth=1.5;c.stroke();
  c.beginPath();c.moveTo(cx-1,y-4);c.lineTo(cx+1,y-1);c.lineTo(cx-1,y+2);c.lineTo(cx-3,y-1);c.closePath();c.fillStyle='#d69c2e';c.fill();
  c.lineWidth=3;c.lineJoin='round';c.strokeStyle='#fff8e8';c.strokeText(label,left+26,textY);c.fillStyle='#92601f';c.fillText(label,left+26,textY);c.restore();
 }
 mark(c,x,y,ang,color){
  c.save();c.translate(x,y);c.rotate(ang);
  c.beginPath();c.moveTo(-6,-6);c.lineTo(4,0);c.lineTo(-6,6);
  c.strokeStyle=color;c.lineWidth=3.5;c.lineCap='round';c.lineJoin='round';c.stroke();c.restore();
 }
 // Draws a route polyline up to `frac` of its length with direction chevrons.
 // Stops where the polyline stops: no end marker, nothing beyond is implied.
 drawRoute(c,points,frac,color,alpha=1,width=4){
  if(points.length<2||frac<=0)return;
  const lens=[];for(let k=1;k<points.length;k++)lens.push(Math.hypot(points[k].x-points[k-1].x,points[k].y-points[k-1].y));
  const total=lens.reduce((a,b)=>a+b,0);if(!total)return;
  const limit=frac*total,drawn=[points[0]];let acc=0;
  for(let k=1;k<points.length;k++){
   if(acc+lens[k-1]<=limit){drawn.push(points[k]);acc+=lens[k-1];continue;}
   const r=(limit-acc)/lens[k-1];drawn.push({x:points[k-1].x+(points[k].x-points[k-1].x)*r,y:points[k-1].y+(points[k].y-points[k-1].y)*r});break;
  }
  c.save();c.globalAlpha=alpha;c.setLineDash([12,9]);
  this.line(c,drawn.map(p=>[p.x,p.y]),color,width);c.setLineDash([]);
  let walked=0;
  for(let k=1;k<drawn.length;k++){
   const a=drawn[k-1],b=drawn[k],seg=Math.hypot(b.x-a.x,b.y-a.y),ang=Math.atan2(b.y-a.y,b.x-a.x);
   for(let pos=34-walked%40;pos<seg;pos+=40)this.mark(c,a.x+(b.x-a.x)*pos/seg,a.y+(b.y-a.y)*pos/seg,ang,color);
   walked+=seg;
  }
  c.restore();
 }
 mirrorShow(c,g,el){
  const s=g.show,fade=1-Math.max(0,(el-(s.total-.3))/.3);
  if(fade<=0)return;
  const fly=Math.min(1,el/.45),ease=1-(1-fly)*(1-fly);
  const mx=360,my=415,r=22+42*ease;
  // Fly from the mirror button at the bottom up to the map center while zooming.
  const sx=W/2-6,sy=H-92,cx=sx+(mx-sx)*ease,cy=sy+(my-sy)*ease;
  c.save();c.globalAlpha=fade;
  c.globalAlpha=fade*Math.min(1,el/.2);
  c.lineWidth=5;c.strokeStyle='#a08a55';
  c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);c.stroke();
  c.globalAlpha=fade*.35*Math.min(1,el/.2);
  c.fillStyle='#fffdf2';c.beginPath();c.arc(cx,cy,r-6,0,Math.PI*2);c.fill();
  c.globalAlpha=fade*Math.min(1,el/.2);
  this.line(c,[[cx+r*.72,cy+r*.72],[cx+r*.72+26,cy+r*.72+26]],'#a08a55',9);
  // One big status line only: the reveal carries no small print.
  c.globalAlpha=fade*Math.max(0,Math.min(1,(el-.65)/.25));
  const title=s.paths.length>1?'正在查看老板与主管接下来的路线':'正在查看老板接下来的路线';
  this.text(c,title,mx,my-r-36,27,'#5b4a2f','800');
  s.paths.forEach((path,k)=>{
   const local=el-(s.head+k*s.step);if(local<=0)return;
   const frac=Math.min(1,local/.65);
   if(path.points.length<2){
    this.chip(c,`${path.name} · 正在路口选择路线`,path.ins.x,Math.max(20,path.ins.y-88),'#fff8e9','#7a6a45',19);
    return;
   }
   this.drawRoute(c,path.points,frac,path.name==='主管'?'#d77c77':'#499dbb',fade*.95);
   this.chip(c,path.name,path.points[0].x,Math.max(20,path.points[0].y-20),'#fff8e9',path.name==='主管'?'#a45348':'#3d687a',19);
  });
  c.restore();
 }
 revealPaths(c,g){
  // Only the still-unwalked part of the revealed routes, from the inspector's
  // current position onward; everything walked is erased.
  for(const path of g.mirrorPaths||[]){
   const ins=path.ins,color=path.name==='主管'?'#d77c77':'#499dbb';
   let passed=-1;
   for(let k=1;k<path.points.length;k++)if(Math.hypot(ins.x-path.points[k].x,ins.y-path.points[k].y)<9)passed=k;
   const rest=path.points.slice(passed+1);
   this.drawRoute(c,[{x:ins.x,y:ins.y},...rest],1,color,.9);
  }
 }
 // Floor bands the discovery ring must never cross: walls, the lobby strip,
 // and each desk island's surface painted into the static background.
 furnitureBands(){
  const bands=[[0,-5,720,100],[-5,-5,33,930],[692,-5,33,930],[0,838,720,82]];
  for(let row=0;row<3;row++)for(let col=0;col<2;col++){
   const x=col?390:100,y=136+row*235;bands.push([x-10,y-9,240,168]);
  }
  return bands;
 }
 rangeHint(c,g,t){
  const hint=g.rangeHint;if(!hint||!(hint.left>0))return;
  const range=activities[hint.activity]?.range||0;if(!range)return;
  const p=g.player,alpha=Math.min(1,hint.left/.6)*Math.min(1,(2.5-hint.left)/.2);
  // Ground projection: the circle flattens into a floor ellipse and desks or
  // walls knock holes in it (even-odd clip), so it paints aisles only.
  const ry=range*.42,cx=p.x,cy=p.y+16;
  c.save();
  c.beginPath();c.ellipse(cx,cy,range,ry,0,0,Math.PI*2);
  for(const [mx,my,mw,mh] of this.furnitureBands())c.rect(mx,my,mw,mh);
  c.clip('evenodd');
  c.beginPath();c.ellipse(cx,cy,range,ry,0,0,Math.PI*2);
  c.globalAlpha=.09*alpha;c.fillStyle='#d99a3a';c.fill();
  c.globalAlpha=.55*alpha;
  c.setLineDash([9,7]);c.lineDashOffset=-t*14;c.strokeStyle='#d99a3a';c.lineWidth=2.5;c.stroke();c.setLineDash([]);
  c.restore();
  if(g.level===0)this.chip(c,'这是本次活动的被发现范围',p.x,Math.max(20,cy-ry-24),'#fff0c8','#946222',17);
 }
 draw(g,t){if(this.lastGame!==g){this.lastGame=g;this.facings=new Map();this.motion.clear();}const c=this.c;c.clearRect(0,0,W,H);c.drawImage(this.bg,0,0);this.soundSources(c,g,t);
 if(g.show)this.mirrorShow(c,g,performance.now()-g.show.t0);
 else if(g.mirror>0)this.revealPaths(c,g);
 const p=g.player;if(p.route.length){c.setLineDash([7,7]);this.line(c,[[p.x,p.y],...p.route.map(n=>[n.x,n.y])],'#bfa65c',3);c.setLineDash([]);}
 for(const ins of g.inspectors)if(!ins.hidden&&ins.queue[0]?.phase)this.inspectionCone(c,ins,p.activity==='work'?(p.riskActivity||'game'):p.activity,t);
 if(g.special)this.goldGlow(c,seats[g.special.seat],t);
 this.rangeHint(c,g,t);
 for(const s of seats){
  if([p,...g.npcs].some(a=>a.seat===s.id&&a.activity==='dance'))continue;
  const occupant=[p,...g.npcs].find(a=>a.seat===s.id&&a.activity!=='dance');
  const gold=g.special?.seat===s.id;
  const chairImg=this.art['map-chair-empty']?.img;
  if(chairImg)c.drawImage(chairImg,s.x-28,s.y-28,56,56);
  else this.chair(c,s.x,s.y,gold,occupant?'base':'all');
 }
 for(const d of g.drops){const s=seats[d.seat],y=s.y-74+Math.sin(t*3)*4;
  // Loud pickup cue: bobbing arrow over a bigger, brighter crate.
  this.text(c,'▼',s.x,y-42,23,'#c77438','900');
  this.ellipse(c,s.x,y+30,26,7,'#5c6d6c30');
  this.box(c,s.x-25,y-25,50,50,11,d.type==='mirror'?'#e1f2f1':'#fff0c9',d.type==='mirror'?'#4f95a0':'#c98f36',3);
  const icon=this.toolIcons?.[d.type];if(icon)c.drawImage(icon,s.x-19,y-19,38,38);
  if(d.type==='meeting')this.text(c,'开会',s.x,y+34,13,'#7c6234','800');
 }
 const actors=[...g.npcs.map((n,i)=>({...n,type:`npc${n.color}`,visualKey:`npc-${i}`})),...g.inspectors.filter(i=>!i.hidden).map((i,k)=>({...i,type:i.name==='老板'?'boss':'supervisor'})),{...p,type:'player'}].sort((a,b)=>a.y-b.y);
 for(const a of actors){
  a.gold=a.seat!=null&&g.special?.seat===a.seat;
  const pose=this.pose(a,a.visualKey||a.type),actorY=a.y+(a.activity==='dance'?35:0);
  let generated=false;
  if(a.type==='player'&&!a.route.length&&a.seat!==null&&['work','joke','game'].includes(a.activity)){
   const stateImg=this.art[`map-player-${a.activity}`]?.img;
   if(stateImg){c.drawImage(stateImg,a.x-44,a.y-70,88,106);generated=true;}
  }else if(a.type==='player'&&a.activity==='dance'&&!a.route.length){
   const stateImg=this.art['map-player-dance']?.img;
   if(stateImg){c.drawImage(stateImg,a.x-48,a.y-84,96,118);generated=true;}
  }else if(a.type.startsWith('npc')&&pose.seated){
   const npcImg=this.art['map-chair-occupied']?.img;
   if(npcImg)c.drawImage(npcImg,a.x-40,a.y-64,80,100),generated=true;
  }
  if(!generated&&!this.paintedPerson(c,a,pose,t)){
   if(pose.seated)this.seatedPerson(c,a.x,a.y,a.type,t,a.activity||'work',a.gold);
   else this.person(c,a.x,actorY,a.type,t,pose.moving,a.activity,pose.direction);
  }
  if(a.type==='player'){
   this.badge(c,a);this.activityEffects(c,a,t);
   this.text(c,'★',a.x,a.y-108,25,'#e9ad32','900');
   const greeting=g.greeting?.left>0?g.greeting:null;
   if(greeting)this.chip(c,`${greeting.who}好！借过一下～`,a.x,Math.max(18,a.y-134),'#edf4e5','#65805a');
   else if(a.route.length)this.chip(c,'去新工位',a.x,Math.max(18,a.y-134));
   else if(a.stopping>0)this.chip(c,'收手中…',a.x,a.y-134,'#fff1d0');
   else if(a.lock>0)this.chip(c,'认真工作…',a.x,a.y-134);
   else if(a.activity!=='work'){
    this.noiseBadge(c,g,a);
    this.incomePop(c,a,t);
   }
  }else if(a.name)this.inspectionLabel(c,a,pose);
 }
 if(g.special)this.goldBadge(c,seats[g.special.seat],g.special.left,t);
 this.playerStakes(c,g);this.momentFeedback(c,g);this.soundSignals(c,g,t);
 }
}
