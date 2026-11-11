import {seats,activities,forecastAll} from './engine.js';
const W=720,H=920;
export class Renderer{
 constructor(canvas){this.canvas=canvas;this.c=canvas.getContext('2d');this.bg=document.createElement('canvas');this.bg.width=W;this.bg.height=H;this.drawOffice(this.bg.getContext('2d'));this.predictions=[];this.predictionTime=-1;this.art={};this.motion=new Map();this.ready=this.loadArt();}
 loadImage(src){
  // Some embedded webviews never settle decode(); the load event remains
  // reliable for these local PNG/SVG resources and drawImage decodes on use.
  return new Promise((resolve,reject)=>{
   const img=new Image();
   img.onload=()=>{img.onload=null;img.onerror=null;resolve(img);};
   img.onerror=()=>{img.onload=null;img.onerror=null;reject(new Error('image load'));};
   img.src=src;
  });
 }
 async loadArt(){
  this.assetErrors=[];this.toolIcons={};this.canvas.dataset.artStatus='loading';
  const iconsReady=this.loadToolIcons();
  try{
   const response=await fetch(new URL('../assets/manifest.json',import.meta.url));
   if(!response.ok)throw new Error('asset manifest');
   this.artManifest=await response.json();
   await Promise.all(Object.entries(this.artManifest).map(async([name,meta])=>{
    try{const img=await this.loadImage(new URL('../'+meta.src,import.meta.url).href);this.art[name]={img,meta};}catch{this.assetErrors.push(name);}
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
   const src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(svg));
   try{this.toolIcons[type]=await this.loadImage(src);}catch{this.assetErrors.push(type+'-icon');}
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
   this.asset(c,'desk',x-6,y-8,238,151);
  }
  return true;
 }
 sprite(c,name,row,frame,x,feet,height,flip=false){
  const asset=this.art[name],frames=asset?.meta.frames?.[row];if(!frames)return false;
  const f=frames[frame%frames.length];if(!f)return false;
  const scale=height/Math.max(...frames.map(f=>f.h));
  c.save();c.translate(x,feet);if(flip)c.scale(-1,1);
  c.drawImage(asset.img,f.x,f.y,f.w,f.h,-f.anchor*scale,-f.h*scale,f.w*scale,f.h*scale);
  c.restore();return true;
 }
 paintedPerson(c,a,pose,t){
  const name=a.type.startsWith('npc')?'npc':a.type;
  const characterAtlas=name,idleAtlas='idle';
  const y=a.y+(a.activity==='dance'?36:0);
  if(pose.seated){
   if(!this.art.seated)return false;
   const row=a.type==='player'?0:1,frame=a.type==='player'?({work:0,joke:1,game:2}[a.activity]||0):0;
   this.sprite(c,'seated',row,frame,a.x,a.y+16,99);
   this.chair(c,a.x,a.y,!!a.gold,'front');return true;
  }
  if(name==='supervisor')return this.paintedSupervisor(c,a,pose,t);
  if(!this.art[characterAtlas])return false;
  this.ellipse(c,a.x,y+1,17,6,'#4d463a2b');
  const row=pose.direction==='up'?2:pose.direction==='down'?1:0;
  let frame=pose.moving?[0,1,3,2][Math.floor(pose.travel/8.5)%4]:1;
  c.save();
  if(a.activity==='dance'){
   c.translate(a.x,y);c.rotate(Math.sin(t*6)*.10);c.translate(-a.x,-y);
   frame=[0,1,3,2][Math.floor(t*6)%4];
  }
  const characterColumn={player:0,boss:1,supervisor:2,npc:3}[name];
  const walkAtlas=row===2?'back_steps':row===1?'front_steps':'side_steps';
  if(!pose.moving&&a.activity!=='dance'&&this.art[idleAtlas])
   this.sprite(c,idleAtlas,row,characterColumn,a.x,y,98,pose.direction==='left');
  else if(pose.moving&&a.activity!=='dance'&&this.art[walkAtlas]&&this.art[idleAtlas]){
   const phase=Math.floor(pose.travel/8.5)%4;
   if(phase%2===0)this.sprite(c,walkAtlas,phase/2,characterColumn,a.x,y,98,pose.direction==='left');
   else this.sprite(c,idleAtlas,row,characterColumn,a.x,y,98,pose.direction==='left');
  }else this.sprite(c,characterAtlas,a.activity==='dance'?1:row,frame,a.x,y,98,pose.direction==='left');
  c.restore();
  if(a.activity==='dance'){
   this.text(c,'♫',a.x-34,y-80+Math.sin(t*5)*5,23,'#d96098','800');
   this.text(c,'♪',a.x+35,y-99+Math.sin(t*5+2)*5,20,'#9866c8','800');
  }
  return true;
 }
 paintedSupervisor(c,a,pose,t){
  // Independent left art keeps the folder in the anatomical right hand.
  const row={right:0,down:1,up:2,left:3}[pose.direction]??1;
  const phase=pose.moving?Math.floor(pose.travel/8.5)%4:1;
  const walking=pose.moving&&phase%2===0;
  const walkAtlas=row===1?'front-steps-supervisor-female':row===2?'back-steps-supervisor-female':'side-steps-supervisor-female';
  const choices=walking?[[walkAtlas,phase/2,row===3?1:0],['supervisor-female',row,phase]]:
   [['idle-supervisor-female',row,0],['supervisor-female',row,1]];
  const selected=choices.find(([atlas,r,f])=>this.art[atlas]?.meta?.frames?.[r]?.[f]);
  if(!selected)return false;
  this.ellipse(c,a.x,a.y+1,17,6,'#4d463a2b');
  return this.sprite(c,...selected,a.x,a.y,98);
 }
 portrait(c,type,x,feet,height){
  if(type==='supervisor'){
   if(this.sprite(c,'idle-supervisor-female',1,0,x,feet,height))return true;
   if(this.sprite(c,'supervisor-female',1,1,x,feet,height))return true;
   c.save();c.translate(x,feet);c.scale(height/90,height/90);
   this.person(c,0,0,'supervisor',0,false,'work','down');c.restore();return false;
  }
  return this.sprite(c,'idle',1,{player:0,boss:1,npc:3}[type]??0,x,feet,height);
 }
 box(c,x,y,w,h,r,fill,stroke='#897d65',line=2){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.stroke();}}
 ellipse(c,x,y,rx,ry,fill,stroke){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
 line(c,pts,color,width=2){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();}
 text(c,t,x,y,size=16,color='#5e5749',weight='600'){c.font=`${weight} ${size}px "PingFang SC",sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillStyle=color;c.fillText(t,x,y);}
 plant(c,x,y,s=1){c.save();c.translate(x,y);c.scale(s,s);this.ellipse(c,0,7,23,9,'#554f3620');this.box(c,-14,-14,28,31,7,'#cfbea0','#8b8167');this.ellipse(c,0,-12,16,6,'#655a43','#958a6d');for(let i=0;i<9;i++){const a=i*2.4;const dx=Math.cos(a)*18,dy=-25+Math.sin(a)*15;c.save();c.translate(dx/2,dy/2-9);c.rotate(a);this.ellipse(c,0,0,8,21,['#77945b','#93ac70','#5f8451'][i%3],'#5c7549');c.restore();}this.line(c,[[0,-5],[0,-38]],'#617e48',2);c.restore();}
 door(c,x,y,w=65,h=62){this.box(c,x-5,y-5,w+10,h+10,3,'#bdc0b7','#8c9187');this.box(c,x,y,w,h,2,'#a5c0c5','#778c8e');this.line(c,[[x+w/2,y],[x+w/2,y+h]],'#70898d');this.line(c,[[x+8,y+8],[x+w-8,y+8]],'#cfe0df',3);this.box(c,x+w/2-10,y+h/2,4,13,1,'#dfe7db','#788d8b',1);this.box(c,x+w/2+6,y+h/2,4,13,1,'#dfe7db','#788d8b',1);}
 couch(c,x,y){this.ellipse(c,x+69,y+45,80,15,'#514a3220');this.box(c,x,y,140,46,8,'#86adb1','#668b91');this.box(c,x+7,y-12,126,31,6,'#a3c5c7','#6b969b');this.box(c,x+7,y+17,126,21,5,'#abc9c8','#73999a');this.line(c,[[x+69,y+18],[x+69,y+37]],'#7b9e9f');this.box(c,x-6,y+5,15,35,5,'#a2c4c5','#72999a');this.box(c,x+131,y+5,15,35,5,'#a2c4c5','#72999a');this.line(c,[[x+10,y+46],[x+10,y+52]],'#82765e',4);this.line(c,[[x+125,y+46],[x+125,y+52]],'#82765e',4);}
 drawOffice(c){if(this.art&&this.paintedOffice(c))return;const floor=c.createLinearGradient(0,0,720,920);floor.addColorStop(0,'#f5f0e4');floor.addColorStop(1,'#eae2d1');c.fillStyle=floor;c.fillRect(0,0,W,H);for(let r=0;r<24;r++)for(let col=0;col<18;col++){c.fillStyle=(r+col)%3===0?'#fffaf129':'#b9a47b07';c.fillRect(col*43+(r%2)*21,r*42,42,41);}this.box(c,12,95,696,738,7,'#ffffff0a','#c9bfa8',2);this.box(c,0,0,720,89,0,'#dddcd0','#989f91',2);
 for(const x of [120,300,480]){this.box(c,x,0,162,65,1,'#c1d7d9','#a2b1ab');const g=c.createLinearGradient(x,0,x+162,65);g.addColorStop(0,'#f6ffffaa');g.addColorStop(1,'#7cbdcd11');c.fillStyle=g;c.fillRect(x+6,3,150,55);c.fillStyle='#effafa70';c.beginPath();c.moveTo(x+18,3);c.lineTo(x+68,3);c.lineTo(x+20,58);c.lineTo(x+4,58);c.fill();this.line(c,[[x+81,0],[x+81,64]],'#a0b2ad',4);}
 this.box(c,0,76,720,13,1,'#b7b4a4','#9d9b8d');this.door(c,33,12);this.door(c,621,12);this.couch(c,422,45);this.plant(c,242,70,.85);this.plant(c,599,70,.85);this.plant(c,694,70,1.1);
 this.box(c,164,27,34,55,5,'#e1e7df','#8b9e96');this.ellipse(c,181,25,15,7,'#c1e0e8','#83a5ae');this.box(c,167,5,28,23,7,'#abd3e4','#7b9aa8');this.line(c,[[174,38],[174,43]],'#e3a484',4);this.line(c,[[187,38],[187,43]],'#85b5d1',4);this.box(c,171,53,20,17,3,'#b8cbcd','#9bb0ab',1);
 // Doors at every road endpoint, matched to the route graph.
 for(const y of [115,350,585,820])for(const x of [0,698]){this.box(c,x,y-30,22,60,2,'#a5bfc0','#859c99',2);this.line(c,[[x+11,y-25],[x+11,y+25]],'#cce1da',2);this.box(c,x+6,y-4,4,10,1,'#e9e9d9','#889b91',1);}
 this.door(c,324,8,62,62);
 // Side wall cabinets, framed posters and small plants.
 for(const y of [185,420,655]){this.box(c,0,y,21,88,3,'#c2b294','#94896e');this.box(c,3,y+5,12,64,1,'#d8c7a6','#ab9879',1);this.plant(c,9,y+16,.65);this.box(c,703,y+15,17,76,2,'#d7c9ad','#9b8b71');this.plant(c,714,y+10,.7);}
 for(let row=0;row<3;row++)for(let col=0;col<2;col++){const x=col?406:116,y=153+row*235;this.box(c,x-13,y-17,218,188,10,'#c5baa927',null);this.box(c,x-18,y-22,226,188,9,'#e9e3d299','#c7bea8',2);this.box(c,x-11,y-15,212,174,6,'#f3eddf66','#f8f4e6',2);this.desk(c,x,y,row,col);}
 this.box(c,0,844,720,76,0,'#d5d2c2','#a29e8b');this.box(c,0,841,720,8,0,'#b7b09a','#9f9780');this.door(c,35,853,60,65);this.door(c,623,853,60,65);this.couch(c,427,866);this.plant(c,245,890,.95);this.plant(c,596,891,1);this.plant(c,11,856,1.3);this.box(c,123,856,77,64,3,'#bbab8f','#8c8069');this.line(c,[[161,857],[161,918]],'#8e816b',2);this.line(c,[[154,880],[154,891]],'#776b56',3);this.line(c,[[169,880],[169,891]],'#776b56',3);
 this.door(c,324,855,62,65);
 // Gentle paper flecks give flat colors an illustrated finish.
 let seed=818;for(let i=0;i<3200;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const x=seed%720;seed=(Math.imul(seed,1664525)+1013904223)>>>0;const y=seed%920;c.fillStyle=i%2?'#71613f08':'#fffdf219';c.fillRect(x,y,1,1);}}
 desk(c,x,y,row,col){this.box(c,x+4,y+15,187,103,4,'#68553820',null);this.box(c,x,y+11,190,95,4,'#bca27d','#847459');for(const dx of [10,108]){this.box(c,x+dx,y+78,68,27,3,'#c6ad86','#8f7f64');this.line(c,[[x+dx+5,y+88],[x+dx+63,y+88]],'#a38b67',1);this.line(c,[[x+dx+27,y+94],[x+dx+39,y+94]],'#796d55',2);}const g=c.createLinearGradient(x,y,x,y+92);g.addColorStop(0,'#e2c69b');g.addColorStop(1,'#c8ae85');this.box(c,x,y,190,83,4,g,'#89775a');this.line(c,[[x+4,y+4],[x+186,y+4]],'#f4dfb6',2);for(let i=0;i<5;i++)this.line(c,[[x+5,y+18+i*13],[x+185,y+19+i*13]],'#a68a6022',1);this.box(c,x+92,y-6,5,93,1,'#b9b79b','#8f9278',1);
 for(let s=0;s<2;s++){const dx=x+21+s*90;this.box(c,dx+7,y+47,30,6,2,'#a1a5a0','#66777a',1);this.box(c,dx+18,y+34,8,16,1,'#8d9a9a','#697a7b',1);this.box(c,dx,y+11,51,35,3,'#d5ded6','#687d81',2);const screen=c.createLinearGradient(dx,y+12,dx+50,y+46);screen.addColorStop(0,'#7bb4cb');screen.addColorStop(1,'#cce6e9');this.box(c,dx+4,y+15,43,25,1,screen,null);c.fillStyle='#f7ffff7a';c.beginPath();c.moveTo(dx+9,y+16);c.lineTo(dx+30,y+16);c.lineTo(dx+12,y+39);c.lineTo(dx+5,y+39);c.fill();this.box(c,dx+2,y+58,45,14,2,'#73818a','#536269',1);for(let r=0;r<3;r++)for(let k=0;k<9;k++){c.fillStyle='#b8c6c6';c.fillRect(dx+5+k*4.3,y+61+r*3,2.5,1.5);}this.box(c,dx+55,y+60,8,13,4,'#c8d1c9','#7d8982',1);}
 this.plant(c,x+177,y+12,.45);if((row+col)%2){for(let i=0;i<3;i++)this.box(c,x+5+i*7,y-5,6,29,1,['#9eb795','#d7ae72','#8eafb7'][i],'#8d8972',1);}else{this.box(c,x+5,y+27,9,21,3,'#e9d2ae','#aa9979',1);this.ellipse(c,x+9.5,y+27,5,3,'#e8ece1','#a29579');} }
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
  return {skin:'#edc4a0',hair:boss?'#343333':supervisor?'#3f312a':player?'#684735':'#594b40',
   shirt:player?'#f0c451':boss?'#3e4854':supervisor?'#2f5d4f':['#9eafa1','#9eafc5','#c5a7a0'][Number(type.slice(-1))||0],
   shade:player?'#c89532':boss?'#293440':supervisor?'#24473d':'#778b8b'};
 }
 head(c,type,direction,cy=-63){
  const p=this.palette(type),back=direction==='up',side=direction==='left'||direction==='right';
  c.save();c.translate(0,cy);if(direction==='left')c.scale(-1,1);
  if(type==='supervisor')this.ellipse(c,side?-16:back?0:14,13,7,11,p.hair,'#493a31');
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
  if(type==='supervisor')return this.supervisorFallback(c,x,y,time,moving,direction);
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
 supervisorFallback(c,x,y,time,moving,direction){
  const p=this.palette('supervisor'),side=direction==='left'||direction==='right',back=direction==='up';
  const facing=direction==='left'?-1:1,phase=moving?Math.sin(time*11):0;
  c.save();c.translate(x,y);
  this.ellipse(c,0,0,19,6,'#353c3524');
  for(const leg of [-1,1]){
   const sx=side?leg*4:leg*8,fx=sx+phase*leg*(side?8:2);
   this.line(c,[[sx,-27],[sx,-14],[fx,-4]],p.skin,6);
   this.line(c,[[fx,-8],[fx,-2]],'#343532',7);
   this.ellipse(c,fx+(side?facing*3:0),-1,side?7:5,3,'#30312e');
  }
  const folderX=side?(direction==='left'?-15:-11):back?19:-26;
  const folder=()=>this.box(c,folderX,-38,side?12:15,22,2,'#795a3b','#493e30',1.5);
  if(direction==='left')folder();
  this.box(c,side?-13:-18,-43,side?26:36,22,4,p.shade,'#41473b',1.5);
  this.box(c,side?-12:-17,-54,side?24:34,27,5,p.shirt,'#41473b',1.5);
  if(!back){
   this.line(c,[[-5,-51],[0,-43],[5,-51]],'#eee3cd',2);
   this.line(c,[[-5,-50],[0,-35],[5,-50]],'#b35c43',1.5);
   this.box(c,-3,-35,6,8,1,'#b35c43','#dccbb1',1);
  }
  const heldArm=side?-7:back?18:-18,freeArm=side?7:back?-18:18;
  this.line(c,[[heldArm,-48],[heldArm,-35],[heldArm,-24]],p.shade,7);
  if(direction!=='left'){
   folder();this.ellipse(c,heldArm,-22,3,4,p.skin,'#957052');
  }
  this.line(c,[[freeArm,-48],[freeArm+phase*3,-35],[freeArm+phase*5,-25]],p.shirt,7);
  this.ellipse(c,freeArm+phase*5,-23,3,4,p.skin,'#957052');
  this.box(c,-5,-60,10,9,3,p.skin,'#8d6b50',1);
  this.head(c,'supervisor',direction,-72);
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
  const x=seat.x,y=seat.y,pulse=.8+Math.sin(t*2.6)*.15;
  c.save();c.globalAlpha=pulse;
  const glow=c.createRadialGradient(x,y-7,4,x,y-7,63);
  glow.addColorStop(0,'#ffe35f99');glow.addColorStop(.5,'#ffcf343d');glow.addColorStop(1,'#ffc53b00');
  c.fillStyle=glow;c.fillRect(x-64,y-71,128,128);
  const beam=c.createLinearGradient(x,y-100,x,y+23);beam.addColorStop(0,'#ffe88b00');beam.addColorStop(1,'#ffda5945');
  c.fillStyle=beam;c.beginPath();c.moveTo(x-39,y-100);c.lineTo(x+39,y-100);c.lineTo(x+23,y+23);c.lineTo(x-23,y+23);c.closePath();c.fill();c.restore();
 }
 goldBadge(c,seat,left,t=0){
  const x=seat.x,y=seat.y+59,urgent=left<=5;
  c.save();c.shadowColor='#a66a2b42';c.shadowBlur=6;c.shadowOffsetY=3;
  this.box(c,x-67,y-18,134,36,11,urgent?'#c77438':'#b47a22','#fff0b1',2);c.restore();
  this.ellipse(c,x-43,y,11,11,'#ffd35c','#ffeaa0');
  this.ellipse(c,x-43,y,8,8,'#f5bc3b');this.text(c,'¥',x-43,y+1,15,'#9d681b','800');
  this.text(c,'×2',x-15,y,18,'#fff9de','800');
  this.line(c,[[x+11,y-9],[x+11,y+9]],'#ffe7a16b',1);
  this.text(c,`${Math.ceil(left)}s`,x+38,y,18,'#fff9de','800');
  c.beginPath();c.moveTo(x-6,y-18);c.lineTo(x,y-24);c.lineTo(x+6,y-18);c.fillStyle=urgent?'#c77438':'#b47a22';c.fill();
  for(const [dx,dy,phase] of [[-35,-25,0],[33,-2,1.6],[22,-42,3]]){
   const r=4+(Math.sin(t*3+phase)+1)*2,sy=seat.y+dy;
   c.save();c.shadowColor='#ffc739';c.shadowBlur=6;c.beginPath();c.moveTo(x+dx,sy-r);c.lineTo(x+dx+2,sy-2);c.lineTo(x+dx+r,sy);c.lineTo(x+dx+2,sy+2);c.lineTo(x+dx,sy+r);c.lineTo(x+dx-2,sy+2);c.lineTo(x+dx-r,sy);c.lineTo(x+dx-2,sy-2);c.closePath();c.fillStyle='#fff9d2';c.fill();c.strokeStyle='#e9b53c';c.lineWidth=1;c.stroke();c.restore();
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
  const range=activities[activity]?.range||100,phase=ins.queue?.[0]?.phase;
  const preview=phase==='warning'||ins.directed&&phase!=='checking';
  const checking=phase==='checking',slacking=activity!=='work',danger=checking&&slacking;
  c.save();c.beginPath();c.moveTo(ins.x,ins.y);
  c.arc(ins.x,ins.y,range,ins.angle-Math.PI/4,ins.angle+Math.PI/4);c.closePath();
  const gradient=c.createRadialGradient(ins.x,ins.y,0,ins.x,ins.y,range);
  gradient.addColorStop(0,preview?'#e5ad4b40':checking?'#e36e514f':danger?'#d8806330':'#b9aa7c2c');
  gradient.addColorStop(1,preview?'#e5ad4b10':checking?'#e36e511c':danger?'#df785006':'#d5bb720a');
  c.fillStyle=gradient;c.fill();
  c.strokeStyle=preview?'#cf963b9c':checking?'#cc654caa':danger?'#cd8d6266':'#a99a7155';
  c.lineWidth=checking?2.5:preview?2:1;
  if(preview)c.setLineDash([7,6]);c.stroke();c.restore();
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
  else if(actor.suspicion>0){label+=' · ? 有点动静';color='#fff0be';ink='#936527';}
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
 draw(g,t){if(this.lastGame!==g){this.lastGame=g;this.facings=new Map();this.motion.clear();this.predictionTime=-1;this.predictions=[];}const c=this.c;c.clearRect(0,0,W,H);c.drawImage(this.bg,0,0);this.soundSources(c,g,t);
 if(g.mirror>0){if(g.elapsed-this.predictionTime>.1||this.predictionTime<0){this.predictions=forecastAll(g.inspectors,g.mirror);this.predictionTime=g.elapsed;}this.predictions.forEach((points,i)=>{c.setLineDash([10,8]);this.line(c,points.filter(p=>!p.hidden).map(p=>[p.x,p.y]),i?'#d77c77':'#499dbb',4);c.setLineDash([]);const end=points.filter(p=>!p.hidden).at(-1);if(end){this.ellipse(c,end.x,end.y,8,8,i?'#d77c77':'#499dbb');this.text(c,'•',end.x,end.y,18,'#fff');}let last;for(const p of points)if(p.waiting&&(!last||Math.hypot(p.x-last.x,p.y-last.y)>5)){this.chip(c,'停',p.x,p.y-18,'#fff8e9');last=p;}});}
 const p=g.player;if(p.route.length){c.setLineDash([7,7]);this.line(c,[[p.x,p.y],...p.route.map(n=>[n.x,n.y])],'#bfa65c',3);c.setLineDash([]);}
 for(const ins of g.inspectors)if(!ins.hidden)this.inspectionCone(c,ins,p.activity==='work'?(p.riskActivity||'game'):p.activity,t);
 if(g.special)this.goldGlow(c,seats[g.special.seat],t);
 for(const s of seats){const occupant=[p,...g.npcs].find(a=>a.seat===s.id&&a.activity!=='dance');this.chair(c,s.x,s.y,g.special?.seat===s.id,occupant?'base':'all');}
 for(const d of g.drops){const s=seats[d.seat],y=s.y-70+Math.sin(t*3)*3;this.ellipse(c,s.x,y+24,19,6,'#5c6d6c20');this.box(c,s.x-18,y-18,36,36,9,d.type==='mirror'?'#e1f2f1':'#fff0c9',d.type==='mirror'?'#73a6ab':'#bf9d52',2);const icon=this.toolIcons?.[d.type];if(icon)c.drawImage(icon,s.x-14,y-14,28,28);if(d.type==='meeting')this.text(c,'开会',s.x,y+29,11,'#7c806e');}
 const actors=[...g.npcs.map((n,i)=>({...n,type:`npc${n.color}`,visualKey:`npc-${i}`})),...g.inspectors.filter(i=>!i.hidden).map((i,k)=>({...i,type:i.name==='老板'?'boss':'supervisor'})),{...p,type:'player'}].sort((a,b)=>a.y-b.y);
 for(const a of actors){
  a.gold=a.seat!=null&&g.special?.seat===a.seat;
  const pose=this.pose(a,a.visualKey||a.type),actorY=a.y+(a.activity==='dance'?35:0);
  if(!this.paintedPerson(c,a,pose,t)){
   if(pose.seated)this.seatedPerson(c,a.x,a.y,a.type,t,a.activity||'work',a.gold);
   else this.person(c,a.x,actorY,a.type,t,pose.moving,a.activity,pose.direction);
  }
  if(a.type==='player'){
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
