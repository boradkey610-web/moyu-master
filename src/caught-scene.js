import {drawRunner} from './runner.js';

export const CAUGHT_ASSETS=['caught-desk','caught-background','caught-boss','caught-boss-speech','caught-supervisor','caught-supervisor-speech','caught-player'];
export const PHONE_CAUGHT_ASSETS=['caught-phone-boss-discovery','caught-phone-boss-speech','caught-phone-supervisor-discovery','caught-phone-supervisor-speech'];
export const DANCE_CAUGHT_ASSETS=['caught-background','caught-boss-speech','caught-supervisor-speech','caught-dance-hands'];
export const caughtAssets=activity=>activity==='joke'?PHONE_CAUGHT_ASSETS:activity==='dance'?DANCE_CAUGHT_ASSETS:CAUGHT_ASSETS;
export const caughtLines=(who,activity='game')=>activity==='joke'
 ? (who==='老板'?['什么这么好笑？也给我讲讲？','老板，我马上工作。']:['上班时间看段子？先把手上的工作做完。','好的主管，我马上工作。'])
 : activity==='dance'
 ? (who==='老板'?['要不要把我的办公室腾出来，给你当舞池？','不用了老板，我这就坐下。']:['这里是办公室！音乐关掉，马上回工位。','好的主管，我马上回去工作。'])
 : who==='老板'
 ? ['键盘敲得挺忙，打到第几关了？','老板，我这就退。']
 : ['上班时间还在玩游戏？现在就关掉。','好的主管，我马上工作。'];

export class CaughtTimeline{
 constructor(who,reducedMotion=false,activity='game'){this.who=who;this.activity=activity;this.lines=caughtLines(who,activity);this.talkStart=activity==='joke'?.85:activity==='dance'?1.25:2.15;this.talkEnd=this.talkStart+this.lines[0].length*.065+.55;this.end=this.talkEnd+.85;this.time=reducedMotion?this.end:0;}
 advance(dt,hidden=false){if(!hidden&&Number.isFinite(dt)&&dt>0)this.time=Math.min(this.end,this.time+Math.min(dt,.1));return this.state();}
 skip(){this.time=this.end;return this.state();}
 state(){
  const t=this.time;
  if(this.activity==='dance'&&t<this.talkStart)return{phase:t<.45?'discovery':t<.65?'freeze':'lower-hands',speaker:'你',text:'完了……他们在看我。',ready:false};
  if(this.activity==='joke'&&t<.7)return{phase:'discovery',speaker:'你',text:'糟了，被发现了。',ready:false};
  if(this.activity==='game'&&t<.8)return{phase:'reflection',speaker:'你',text:'糟了，被看到了……',ready:false};
  if(this.activity==='game'&&t<1.25)return{phase:'look-up',speaker:'你',text:'',ready:false};
  if(this.activity==='game'&&t<1.75)return{phase:'approach',speaker:this.who,text:'',ready:false};
  if(this.activity==='game'&&t<2.15)return{phase:'gesture',speaker:this.who,text:'',ready:false};
  if(t<this.talkEnd){const n=Math.min(this.lines[0].length,Math.floor(Math.max(0,t-this.talkStart)/.065));return{phase:'talk',speaker:this.who,text:this.lines[0].slice(0,n),mouth:n<this.lines[0].length&&Math.floor(Math.max(0,t-this.talkStart)*7)%2?1:0,ready:false};}
  const ready=t>=this.end;
  if(this.activity==='dance')return{phase:ready?'reply':'reaction',speaker:this.who,text:this.lines[0],mouth:0,ready};
  return{phase:ready?'reply':'reaction',speaker:'你',text:this.lines[1],pose:ready?2:Math.min(2,Math.floor((t-this.talkEnd)/.28)),ready};
 }
}

// Drawing uses an independent clock; this module never steps or dismisses the game.
export class CaughtScene{
 constructor(canvas,renderer,modal,{reducedMotion=false}={}){
  this.canvas=canvas;this.renderer=renderer;this.activity=modal.activity||'game';this.timeline=new CaughtTimeline(modal.who,reducedMotion,this.activity);this.character=modal.who==='老板'?'boss':'supervisor';
  this.canvas.dataset.caughtActivity=this.activity;
  if(this.activity==='dance')return;
  if(this.activity==='joke'){this.canvas.height=540;this.makePhoneFrames(modal.jokeText||'');return;}
  this.desk=document.createElement('canvas');this.desk.width=this.desk.height=1024;
  const c=this.desk.getContext('2d');c.drawImage(renderer.art['caught-desk'].img,0,0);
  const runner=document.createElement('canvas');runner.width=480;runner.height=112;
  drawRunner(runner,modal.runnerSnapshot,false,renderer);
  // Letterbox the actual caught frame inside the reserved monitor surface.
  c.fillStyle='#283c3c';c.fillRect(242,229,543,307);c.drawImage(runner,242,319,543,127);
 }
 makePhoneFrames(text){
  this.phoneFrames=[];
  for(const [kind,index] of [['discovery',0],['speech',0],['speech',1]]){
   const frame=document.createElement('canvas');frame.width=682;frame.height=768;
   const c=frame.getContext('2d');c.drawImage(this.renderer.art['caught-phone-'+this.character+'-'+kind].img,index*682,0,682,768,0,0,682,768);
   const boss=this.character==='boss',points=kind==='discovery'
    ?(boss?[[292,326],[430,327],[436,570],[277,566]]:[[291,352],[427,352],[437,590],[273,588]])
    :(boss?[[220,702],[451,702],[451,768],[213,768]]:[[247,733],[451,735],[451,768],[230,768]]);
   const x=kind==='discovery'?300:points[0][0]+16,y=points[0][1]+30,width=kind==='discovery'?122:185;
   c.save();c.beginPath();points.forEach(([px,py],i)=>i?c.lineTo(px,py):c.moveTo(px,py));c.closePath();c.clip();
   c.fillStyle='#faf5e8';c.fillRect(0,0,682,768);c.fillStyle='#6b7c5c';c.font='17px sans-serif';c.fillText('打工人日常',x,y);
   c.fillStyle='#344c3e';c.font='18px sans-serif';let line='',row=0;
   for(const char of text){if(char==='\n'||(line&&c.measureText(line+char).width>width)){c.fillText(line,x,y+44+row++*28);line='';}if(char!=='\n')line+=char;}
   if(line)c.fillText(line,x,y+44+row*28);c.restore();this.phoneFrames.push(frame);
  }
 }
 sprite(c,name,pose,scale=.86,y=8){const img=this.renderer.art[name].img;c.drawImage(img,pose*600,0,600,540,(480-600*scale)/2,y,600*scale,540*scale);}
 background(c){c.drawImage(this.renderer.art['caught-background'].img,0,0,480,450);}
 dance(c,state,t){
  const background=this.renderer.art['caught-background'].img;
  // Same fixed camera and source geometry as the approved preview.
  c.drawImage(background,0,82,480,450,0,0,480,450);
  this.sprite(c,'caught-'+this.character+'-speech',state.mouth||0,.85,0);
  const smooth=value=>{value=Math.min(1,Math.max(0,value));return value*value*(3-2*value);};
  const drop=smooth((t-.65)/.65),sway=t<.45?Math.sin(t*12)*4:0;
  c.drawImage(this.renderer.art['caught-dance-hands'].img,Math.trunc(sway),158+Math.trunc(drop*330),480,408);
  const light=55/255*(1-smooth((t-.3)/.3));
  if(light>0){
   c.save();c.globalAlpha=light;
   c.fillStyle='#7944ba';c.beginPath();c.moveTo(0,0);c.lineTo(180,0);c.lineTo(380,450);c.lineTo(0,450);c.closePath();c.fill();
   c.fillStyle='#28abab';c.beginPath();c.moveTo(300,0);c.lineTo(480,0);c.lineTo(480,450);c.lineTo(160,450);c.closePath();c.fill();c.restore();
  }
  if(t<.45){c.save();c.fillStyle='#fff7e8';c.font='32px sans-serif';c.fillText('♪',401,130);c.restore();}
 }
 portrait(c,phase){
  this.background(c);
  if(phase==='approach'){const p=Math.min(1,Math.max(0,(this.timeline.time-1.25)/.5));this.sprite(c,'caught-'+this.character,0,.80+p*.06,32-p*24);}
  else this.sprite(c,'caught-'+this.character,0);
 }
 draw(){
  const c=this.canvas.getContext('2d'),state=this.timeline.state(),t=this.timeline.time;
  c.clearRect(0,0,this.canvas.width,this.canvas.height);
  if(this.activity==='dance'){
   this.dance(c,state,t);this.canvas.dataset.phase=state.phase;this.canvas.dataset.checker=this.character;return state;
  }
  if(this.activity==='joke'){
   const index=state.phase==='discovery'?0:1+(state.phase==='talk'?(state.mouth||0):0);
   c.drawImage(this.phoneFrames[index],0,0,682,768,0,0,480,540);
   this.canvas.dataset.phase=state.phase;this.canvas.dataset.checker=this.character;return state;
  }
  if(state.phase==='reflection'||state.phase==='look-up'){
   c.save();const tilt=state.phase==='look-up'?Math.min(1,(t-.8)/.45):0;
   c.drawImage(this.desk,0,0,1024,1024-tilt*230,0,-15,480,480);
   c.beginPath();c.rect(113,92,256,146);c.clip();c.globalAlpha=Math.min(.26,t*.6);
   c.drawImage(this.renderer.art['caught-'+this.character].img,130,25,340,245,184,99,116,84);c.restore();
   if(tilt>0){c.save();c.globalAlpha=tilt*tilt;this.portrait(c,'approach');c.restore();}
  }else if(state.phase==='reaction'||state.phase==='reply'){
   this.background(c);this.sprite(c,'caught-player',state.pose,.84,8);
  }else if(state.phase==='gesture'||state.phase==='talk'){
   this.background(c);this.sprite(c,'caught-'+this.character+'-speech',state.mouth||0);
  }else this.portrait(c,state.phase);
  this.canvas.dataset.phase=state.phase;this.canvas.dataset.checker=this.character;
  return state;
 }
 advance(dt,hidden){this.timeline.advance(dt,hidden);return this.draw();}
 skip(){this.timeline.skip();return this.draw();}
}
