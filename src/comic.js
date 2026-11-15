export const COMIC_WIDTH=480,COMIC_HEIGHT=128;
export const comicScenes=[
 {title:'老板画饼',prompt:'点饼，看看老板能画多大',action:'戳大老板画的饼',steps:3,hit:{x:174,y:11,w:115,h:98}},
 {title:'六点下班',prompt:'点闹钟，宣布下班',action:'敲响六点下班闹钟',steps:1,hit:{x:327,y:2,w:92,h:104}},
 {title:'开会犯困',prompt:'点咖啡，抢救一下同事',action:'给犯困同事一杯咖啡',steps:1,hit:{x:295,y:22,w:98,h:100}}
];
export function createComic(post=0){return{post,clock:0,step:0,anim:0,phase:'ready',doneAt:0,reward:0};}
export function tapComic(comic){if(comic.phase!=='ready')return false;comic.step++;comic.anim=0;comic.phase='acting';return true;}
export function stepComic(comic,dt){
 comic.clock+=dt;
 if(comic.phase==='acting'){
  comic.anim+=dt;
  const scene=comic.post%3,duration=scene===0&&comic.step<3?.35:scene===2?2.6:2;
  if(comic.anim>=duration-1e-8){
   if(comic.step<comicScenes[scene].steps)comic.phase='ready';
   else{comic.phase='done';comic.doneAt=comic.clock;comic.reward=3;return 3;}
  }
 }else if(comic.phase==='done'&&comic.clock>=6-1e-8&&comic.clock-comic.doneAt>=2-1e-8)Object.assign(comic,createComic(comic.post+1));
 return 0;
}

export function drawComic(canvas,comic,stopping,r){
 const c=canvas.getContext('2d'),scene=comic.post%3,t=comic.anim,active=comic.step>0,ease=v=>{v=Math.max(0,Math.min(1,v));return 1-(1-v)**3;};
 c.clearRect(0,0,COMIC_WIDTH,COMIC_HEIGHT);
 if(r.art.office)c.drawImage(r.art.office.img,45,0,1015,164,0,0,480,104);
 else{c.fillStyle='#e7eee8';c.fillRect(0,0,480,104);}
 c.fillStyle='#fff9e74d';c.fillRect(0,0,480,104);c.fillStyle='#decaab';c.fillRect(0,104,480,24);
 r.line(c,[[0,105],[480,105]],'#b8a181',2);
 if(scene===0){
  const impact=comic.step===3?ease((t-.7)/.5):0;
  c.save();c.translate(134,125);c.scale(1,1-impact*.73);r.portrait(c,'boss',0,0,113);c.restore();
  r.portrait(c,'player',386,126,94);
  r.box(c,294,7,173,30,7,'#fff9e9','#b9a78a',1.3);r.text(c,comic.phase==='done'?'这饼……接不住啊！':'未来都是你们的！',380,22,14,'#786044','800');
  if(comic.step<3)r.line(c,[[151,77],[190,65],[217,65]],'#3f3c38',10);
  const size=comic.step===0?24:comic.step===1?24+14*ease(t/.35):comic.step===2?38+17*ease(t/.35):55+48*ease(t/.8);
  const fall=comic.step===3?ease(t/1.2):0,x=233-99*fall,y=61+22*fall;
  r.ellipse(c,x,y+9,size,size*.38,'#b47a35','#8c6239');r.ellipse(c,x,y,size,size*.38,'#ebbd67','#a67535');r.ellipse(c,x-3,y-2,size*.78,size*.25,'#f4cf85','#d6a24f');
  for(let n=-1;n<=1;n++)r.line(c,[[x+n*size*.36-5,y-5],[x+n*size*.36+6,y+4]],'#bf8a44',2.5);
  if(impact>.5){r.text(c,'咚！',261,96,27,'#bc7840','900');for(let n=0;n<4;n++)r.line(c,[[73+n*38,122],[70+n*38,114]],'#e8b35b',3);}
 }else if(scene===1){
  const motion=t+(comic.phase==='done'?comic.clock-comic.doneAt:0);
  for(let n=0;n<3;n++){
   const x=99+n*92,spin=active?Math.sin(Math.max(0,motion-.2)*10+n)*.14:0;
   c.save();c.translate(x,101);c.rotate(spin);c.scale(active?.65+.35*Math.cos(motion*8+n):1,1);r.asset(c,'chair',-19,-22,38,45);c.restore();
   const direction=n===0?-1:1,progress=active?ease((t-.12-n*.07)/1.25):0,personX=x+direction*progress*450;
   if(progress<1){if(active)r.sprite(c,'side_steps',Math.floor(t*10)%2,n===1?0:3,personX,126-Math.abs(Math.sin(t*13))*5,94,direction<0);else r.portrait(c,n===1?'player':'npc',personX,126,94);}
   if(active&&t<1.6)for(let k=0;k<2;k++)r.line(c,[[personX-direction*(23+k*8),75+k*13],[personX-direction*(40+k*8),75+k*13]],'#a99b80',2);
  }
  r.ellipse(c,374,40,31,31,'#fff7d8','#a58655');r.ellipse(c,374,40,26,26,'#fffdf1','#d6c7a3');
  const minute=-Math.PI/2+(active?ease(t/.6):0)*Math.PI*2,hour=Math.PI/2-.1+(active?.1:0);
  r.line(c,[[374,40],[374+Math.cos(minute)*22,40+Math.sin(minute)*22]],'#7a8e89',3);r.line(c,[[374,40],[374+Math.cos(hour)*14,40+Math.sin(hour)*14]],'#8b6842',4);
  r.text(c,'12',374,20,9,'#a48d65');r.text(c,active?'18:00':'17:59',374,87,17,'#98723d','900');
  if(active){r.text(c,'下班！',197,29,25,'#927148','900');r.line(c,[[338,10],[330,3]],'#d4a24f',3);r.line(c,[[409,9],[418,1]],'#d4a24f',3);}
 }else{
  r.box(c,235,37,72,45,3,'#e4ece4','#9eaa9c',1.5);r.text(c,'最后一页',271,53,12,'#859487');r.text(c,'99 / 999',271,70,12,'#859487');
  r.asset(c,'chair',164,78,43,50);
  const awake=active&&t<1.15,drop=active?ease((t-1.1)/.8):0;
  c.save();c.translate(190,124-drop*12);c.rotate(awake?-.05:.32+drop*.85);r.portrait(c,'npc',0,awake?-Math.sin(t*5)*15:0,104);c.restore();
  r.box(c,120,98,283,17,3,'#d7b37d','#aa8b65',1.5);r.line(c,[[137,114],[137,128]],'#a68c6b',8);r.line(c,[[387,114],[387,128]],'#a68c6b',8);
  const sip=active?Math.sin(Math.min(1,t/1.3)*Math.PI):0,cupX=343-sip*116,cupY=89-sip*21;
  c.save();c.translate(cupX,cupY);c.rotate(drop*.4);r.ellipse(c,19,-12,10,12,'#fff9e8','#9c8468');r.box(c,-19,-32,37,34,5,'#fff9e8','#9c8468',2);r.ellipse(c,-1,-31,17,5,'#8d6247','#a98d6f');r.line(c,[[-9,-13],[8,-13]],'#d4b78a',2);c.restore();
  if(!awake){r.text(c,'Z',161+drop*145,30+drop*20+Math.sin(comic.clock*2)*3,23,'#93aaa7','800');r.text(c,'z',139+drop*145,48+drop*20,16,'#93aaa7');}
  else{r.text(c,'！',191,22,25,'#d7a045','900');r.line(c,[[157,42],[149,35]],'#d7a045',3);r.line(c,[[217,42],[226,35]],'#d7a045',3);}
  if(drop>.8)r.text(c,'咖啡醒了，我没醒。',341,23,14,'#876648','800');
 }
 if(comic.phase==='ready'){
  const h=comicScenes[scene].hit,x=h.x+h.w/2,y=h.y+h.h/2,pulse=(Math.sin(comic.clock*4)+1)/2;
  c.save();c.globalAlpha=.25+pulse*.3;c.strokeStyle='#d3983d';c.lineWidth=2.5;c.setLineDash([3,6]);c.beginPath();c.ellipse(x,y,h.w/2-3,h.h/2-2,0,0,Math.PI*2);c.stroke();c.restore();
 }
 if(stopping){c.fillStyle='#f8f1e1db';c.fillRect(0,0,480,128);c.font='bold 19px "PingFang SC",sans-serif';c.textAlign='center';c.fillStyle='#8b795e';c.fillText('正在收起漫画…',240,70);}
}
