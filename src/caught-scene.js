import {drawRunner} from './runner.js';

export const CAUGHT_ASSETS=['caught-desk','caught-background','caught-boss','caught-boss-speech','caught-supervisor','caught-supervisor-speech','caught-player'];
export const caughtLines=who=>who==='老板'
 ? ['键盘敲得挺忙，打到第几关了？','老板，我这就退。']
 : ['上班时间还在玩游戏？现在就关掉。','好的主管，我马上工作。'];

export class CaughtTimeline{
 constructor(who,reducedMotion=false){this.who=who;this.lines=caughtLines(who);this.talkEnd=2.15+this.lines[0].length*.065+.55;this.end=this.talkEnd+.85;this.time=reducedMotion?this.end:0;}
 advance(dt,hidden=false){if(!hidden&&Number.isFinite(dt)&&dt>0)this.time=Math.min(this.end,this.time+Math.min(dt,.1));return this.state();}
 skip(){this.time=this.end;return this.state();}
 state(){
  const t=this.time;
  if(t<.8)return{phase:'reflection',speaker:'你',text:'糟了，被看到了……',ready:false};
  if(t<1.25)return{phase:'look-up',speaker:'你',text:'',ready:false};
  if(t<1.75)return{phase:'approach',speaker:this.who,text:'',ready:false};
  if(t<2.15)return{phase:'gesture',speaker:this.who,text:'',ready:false};
  if(t<this.talkEnd){const n=Math.min(this.lines[0].length,Math.floor((t-2.15)/.065));return{phase:'talk',speaker:this.who,text:this.lines[0].slice(0,n),mouth:n<this.lines[0].length&&Math.floor((t-2.15)*7)%2?1:0,ready:false};}
  const ready=t>=this.end;
  return{phase:ready?'reply':'reaction',speaker:'你',text:this.lines[1],pose:ready?2:Math.min(2,Math.floor((t-this.talkEnd)/.28)),ready};
 }
}

// Drawing uses an independent clock; this module never steps or dismisses the game.
export class CaughtScene{
 constructor(canvas,renderer,modal,{reducedMotion=false}={}){
  this.canvas=canvas;this.renderer=renderer;this.timeline=new CaughtTimeline(modal.who,reducedMotion);this.character=modal.who==='老板'?'boss':'supervisor';
  this.desk=document.createElement('canvas');this.desk.width=this.desk.height=1024;
  const c=this.desk.getContext('2d');c.drawImage(renderer.art['caught-desk'].img,0,0);
  const runner=document.createElement('canvas');runner.width=480;runner.height=112;
  drawRunner(runner,modal.runnerSnapshot,false,renderer);
  // Letterbox the actual caught frame inside the reserved monitor surface.
  c.fillStyle='#283c3c';c.fillRect(242,229,543,307);c.drawImage(runner,242,319,543,127);
 }
 sprite(c,name,pose,scale=.86,y=8){const img=this.renderer.art[name].img;c.drawImage(img,pose*600,0,600,540,(480-600*scale)/2,y,600*scale,540*scale);}
 background(c){c.drawImage(this.renderer.art['caught-background'].img,0,0,480,450);}
 portrait(c,phase){
  this.background(c);
  if(phase==='approach'){const p=Math.min(1,Math.max(0,(this.timeline.time-1.25)/.5));this.sprite(c,'caught-'+this.character,0,.80+p*.06,32-p*24);}
  else this.sprite(c,'caught-'+this.character,0);
 }
 draw(){
  const c=this.canvas.getContext('2d'),state=this.timeline.state(),t=this.timeline.time;
  c.clearRect(0,0,480,450);
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
