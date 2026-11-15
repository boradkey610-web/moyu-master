const W=720,H=920;
export const DANCE_ENTRY_SECONDS=.8;
const smooth=u=>{u=Math.max(0,Math.min(1,u));return u*u*(3-2*u);};
export function discoOpacity(state,stopSeconds){
 if(!state)return 0;
 if(state.stopping>0){
  const stoppedFor=stopSeconds-state.stopping;
  const initial=smooth((state.time-stoppedFor)/DANCE_ENTRY_SECONDS);
  return initial*(1-smooth(stoppedFor/stopSeconds));
 }
 return smooth(state.time/DANCE_ENTRY_SECONDS);
}

export class DiscoScene{
 constructor(renderer){
  this.r=renderer;this.background=document.createElement('canvas');this.background.width=W;this.background.height=H;
  this.layer=document.createElement('canvas');this.layer.width=W;this.layer.height=H;
  this.paintBackground(this.background.getContext('2d'));
 }
 paintBackground(b){
  const r=this.r,wall=b.createLinearGradient(0,0,0,H);wall.addColorStop(0,'#111b23');wall.addColorStop(.35,'#263536');wall.addColorStop(1,'#0d1b23');
  b.fillStyle=wall;b.fillRect(0,0,W,H);
  // This room is independent of the office, with no office pixels underneath.
  for(const right of [false,true]){
   b.save();if(right){b.translate(W,0);b.scale(-1,1);}
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
  for(let i=0;i<6000;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const x=seed%W;seed=(Math.imul(seed,1664525)+1013904223)>>>0;b.fillStyle=i%2?'#d6d5aa08':'#00080e16';b.fillRect(x,seed%H,1,1);}
 }
 glow(c,x,y,rx,ry,color,alpha=1){
  c.save();c.translate(x,y);c.scale(rx,ry);c.globalAlpha=alpha;
  const g=c.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,color);g.addColorStop(1,'transparent');
  c.fillStyle=g;c.fillRect(-1,-1,2,2);c.restore();
 }
 beam(c,sx,sy,tx,ty,radius,color,opacity){
  c.save();c.translate(sx,sy);c.rotate(Math.atan2(ty-sy,tx-sx)-Math.PI/2);
  const length=Math.hypot(tx-sx,ty-sy);
  for(let y=0;y<length;y+=3){
   const u=y/length,w=3+radius*u,g=c.createLinearGradient(-w,y,w,y);
   g.addColorStop(0,'transparent');g.addColorStop(.5,color);g.addColorStop(1,'transparent');
   c.globalAlpha=Math.sin(u*Math.PI)*opacity;c.fillStyle=g;c.fillRect(-w,y,w*2,3.5);
  }c.restore();
 }
 floor(c,t){
  const colors=['#82c6bd','#d6ad69','#728fba'],project=(col,row)=>[360+(col-4)*78*(.56+row*.095),320+row*52];
  for(let row=0;row<10;row++)for(let col=0;col<8;col++){
   c.beginPath();[project(col,row),project(col+1,row),project(col+1,row+1),project(col,row+1)].forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();
   c.globalAlpha=.035+(1+Math.sin(t*Math.PI+(row+col)*.8))*.0475;c.fillStyle=colors[(row+col)%3];c.fill();
   c.globalAlpha=.14;c.strokeStyle='#a2b7a9';c.lineWidth=1;c.stroke();
  }c.globalAlpha=1;
 }
 mirrorBall(c,t){
  const r=this.r;c.strokeStyle='#8a9a8b';c.lineWidth=2;c.beginPath();c.moveTo(360,0);c.lineTo(360,75);c.stroke();
  this.glow(c,360,104,94,80,'#9edac844',.7);
  const ball=c.createRadialGradient(348,89,1,360,108,33);ball.addColorStop(0,'#f4eccb');ball.addColorStop(.45,'#98bcb2');ball.addColorStop(1,'#304b4e');r.ellipse(c,360,106,32,32,ball);
  c.save();c.beginPath();c.arc(360,106,31,0,Math.PI*2);c.clip();
  for(let row=0;row<9;row++)for(let col=0;col<9;col++){
   c.globalAlpha=.2+.6*Math.max(0,Math.sin(col*.75+row*.4+t*.5));c.fillStyle=(row+col)%3?'#dce5cd':'#f7d296';c.fillRect(326+col*8,72+row*8,6,6);
  }c.restore();
  c.strokeStyle='#a5b5a077';c.lineWidth=1.5;c.beginPath();c.arc(360,106,32,0,Math.PI*2);c.stroke();
 }
 draw(output,state,opacity){
  if(!state||opacity<=0)return;
  const c=this.layer.getContext('2d'),r=this.r,{time:t,x,feet}=state;
  c.clearRect(0,0,W,H);c.drawImage(this.background,0,0);this.floor(c,t);
  c.save();c.globalCompositeOperation='screen';
  this.beam(c,130,75,430+Math.sin(t*.35)*105,740,145,'#75c8c1',.2);
  this.beam(c,620,75,240+Math.sin(t*.3+1)*90,760,130,'#e9b176',.17);
  this.glow(c,175,695,190,75,'#68c4c244',.6);this.glow(c,540,735,180,65,'#e0a36c44',.6);
  this.beam(c,x,feet-250,x,feet+8,66,'#ffe5ad',.33);this.glow(c,x,feet,83,25,'#ffe6b399',.85);c.restore();
  for(let i=0;i<26;i++)this.glow(c,40+(i*137)%640+Math.sin(t*.25+i)*14,160+(i*193)%620,3+i%3,2,'#eedeb699',.25+.25*Math.sin(t*.6+i));
  this.mirrorBall(c,t);
  c.fillStyle='#e5bd7980';c.fillRect(72,67,135,2);c.fillStyle='#78bfb580';c.fillRect(515,67,135,2);
  r.box(c,x-13,feet-256,26,10,3,'#30433e','#8b9e81',1);this.glow(c,x,feet-245,17,8,'#ffedbdaa');
  const scale=state.scale??1.3;
  c.save();c.translate(x,feet);c.scale(scale,scale);c.translate(-x,-feet);
  if(!r.paintedDance(c,{x,y:feet-36},t))r.person(c,x,feet,'player',t,false,'dance','down');c.restore();
  for(let i=0;i<5;i++){
   const phase=(t*.18+i*.2)%1;c.save();c.translate(x+Math.cos(i*2.4)*(66+phase*30),feet-25-phase*145);c.rotate(Math.sin(t+i)*.12);c.globalAlpha=Math.sin(phase*Math.PI)*.65;
   c.strokeStyle=i%2?'#83c9bf':'#efd498';c.lineWidth=2;r.ellipse(c,0,0,5,3,c.strokeStyle);c.beginPath();c.moveTo(4,0);c.lineTo(4,-18);c.lineTo(14,-14);c.stroke();c.restore();
  }
  const vignette=c.createRadialGradient(x,feet-60,180,360,460,650);vignette.addColorStop(0,'transparent');vignette.addColorStop(1,'#02090cb3');c.fillStyle=vignette;c.fillRect(0,0,W,H);
  output.save();output.globalAlpha=opacity;output.drawImage(this.layer,0,0);output.restore();
 }
}
