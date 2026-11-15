// Original eight-bar scores, synthesized locally. No music downloads or timers.
const RATE=16000,TAU=Math.PI*2;
export function composeMusic(mode){
 const disco=mode==='disco',beat=60/(disco?124:108),data=new Float32Array(Math.round(beat*32*RATE));
 const chords=[[62,65,69,72],[59,65,67,74],[60,64,67,71],[61,64,67,69]],roots=[38,43,36,33];
 let seed=211;
 const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1;};
 function note(midi,at,length,kind,volume){
  const frequency=440*2**((midi-69)/12),samples=Math.floor(length*RATE),start=Math.round(at*RATE);
  for(let i=0;i<samples;i++){
   const t=i/RATE,phase=TAU*frequency*t,attack=Math.min(1,t/.006),release=Math.min(1,(length-t)/.06);
   let value;
   if(kind==='bass')value=(Math.sin(phase)+.2*Math.sin(phase*2))*Math.exp(-t*5);
   else if(kind==='keys')value=Math.sin(phase+1.4*Math.exp(-t*7)*Math.sin(phase*2))*.75*Math.exp(-t*3)+Math.sin(phase*1.003)*.2*Math.exp(-t*5);
   else value=(Math.sin(phase)+.25*Math.sin(phase*2)+.1*Math.sin(phase*3))*Math.exp(-t*5);
   data[(start+i)%data.length]+=value*attack*release*volume;
  }
 }
 function drum(at,kind,volume){
  const length=kind==='kick'?.24:kind==='snare'?.13:.055,start=Math.round(at*RATE);
  let smooth=0;
  for(let i=0;i<length*RATE;i++){
   const t=i/RATE,n=noise();smooth=.7*smooth+.3*n;
   const wave=kind==='kick'?Math.sin(TAU*(49*t+2.2*(1-Math.exp(-t*30))))*Math.exp(-t*20):kind==='snare'?(n*.65+Math.sin(TAU*180*t)*.25)*Math.exp(-t*35):(n-smooth)*Math.exp(-t*75);
   data[(start+i)%data.length]+=wave*volume*Math.min(1,t/.002)*Math.min(1,(length-t)/.008);
  }
 }
 const melody=[74,0,76,0,77,76,0,72,74,0,71,0,69,0,67,0];
 for(let bar=0;bar<8;bar++){
  const chord=chords[bar%4],root=roots[bar%4],start=bar*4*beat;
  for(const offset of (disco?[.5,1.5,2.5,3.5]:[0,1.65,3]))for(const n of chord)note(n,start+offset*beat,.72,'keys',disco?.055:.065);
  for(let b=0;b<4;b++){
   note(root+(b===2?12:b===3?7:0),start+(b+(disco?.0:b%2*.08))*beat,.36,'bass',.21);
   if(disco||b===0||b===2)drum(start+b*beat,'kick',disco?.28:.13);
   if(b%2)drum(start+b*beat,'snare',disco?.11:.055);
   for(let half=0;half<2;half++)drum(start+(b+half*(disco?.5:.64))*beat,'hat',disco?.065:.035);
  }
  for(let j=0;j<4;j++){
   const n=melody[(bar*2+j)%melody.length];
   if(n)note(n+(disco?12:0),start+(j*.85+.35)*beat,.28,disco?'lead':'keys',disco?.065:.085);
  }
  if(disco)for(let j=0;j<8;j++)note(chord[j%4]+12,start+(j*.5+.25)*beat,.13,'lead',.035);
 }
 // A soft limiter leaves headroom for input and environmental sounds.
 for(let i=0;i<data.length;i++)data[i]=Math.tanh(data[i]*1.5)*.8;
 return data;
}
export function composePrinter(){
 const data=new Float32Array(RATE),length=data.length;let seed=74,smooth=0;
 for(let i=0;i<length;i++){
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;const t=i/RATE,n=seed/2147483648-1;
  smooth=.8*smooth+.2*n;
  const feed=Math.sin(TAU*2*t)**8;
  data[i]=(Math.sin(TAU*96*t)*.035+Math.sin(TAU*192*t)*.02+smooth*(.06+feed*.38))*Math.sin(Math.PI*t)**.3;
 }
 return data;
}
export function composeEffect(kind){
 const notes={tap:[640,460],jump:[380,620,850],coin:[880,1174.66,1567.98],work:[520,330],start:[523.25,659.25,783.99],win:[523.25,659.25,783.99,1046.5]}[kind];
 const step=kind==='tap'?.025:kind==='work'?.045:.065,length=step*notes.length+.10,data=new Float32Array(Math.ceil(length*RATE));
 for(let n=0;n<notes.length;n++)for(let i=0;i<RATE*.12;i++){
  const t=i/RATE,index=Math.round(n*step*RATE)+i;if(index>=data.length)break;
  data[index]+=(Math.sin(TAU*notes[n]*t)+.15*Math.sin(TAU*notes[n]*2*t))*Math.min(1,t/.004)*Math.exp(-t*(kind==='tap'?65:32))*Math.max(0,1-t/.12)*.38;
 }
 return data;
}
export class GameAudio{
 constructor(factory=()=>{const Context=globalThis.AudioContext||globalThis.webkitAudioContext;return Context?new Context():null;}){
  this.factory=factory;this.ctx=null;this.enabled=true;this.paused=false;this.mode='office';this.printer=false;this.voices=new Set();this.effects=new Map();this.active=null;
 }
 unlock(){
  if(!this.enabled)return;
  if(!this.ctx){
   // Device creation is an external browser boundary; audio failure must not stop a game.
   try{this.ctx=this.factory();}catch{return;}
   if(!this.ctx)return;
   this.master=this.ctx.createGain();this.master.gain.value=.75;this.master.connect(this.ctx.destination);
   for(const [name,samples]of [['office',composeMusic('office')],['disco',composeMusic('disco')],['machine',composePrinter()]]){
    const bus=this.ctx.createGain();bus.gain.value=0;bus.connect(this.master);this[name]=bus;
    const source=this.ctx.createBufferSource();source.buffer=this.buffer(samples);source.loop=true;source.connect(bus);source.start();
   }
   this.fx=this.ctx.createGain();this.fx.gain.value=.38;this.fx.connect(this.master);
   this.update({enabled:this.enabled,paused:this.paused,mode:this.mode,printer:this.printer});
  }
  if(!this.paused&&this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});
 }
 buffer(samples){const b=this.ctx.createBuffer(1,samples.length,RATE);b.copyToChannel(samples,0);return b;}
 update({enabled,paused,mode,printer}){
  const changed=mode!==this.mode||printer!==this.printer;this.enabled=enabled;this.paused=paused;this.mode=mode;this.printer=printer;
  if(!this.ctx)return;
  const active=enabled&&!paused;
  if(changed||!this.mixed){
   const now=this.ctx.currentTime,duck=printer?.7:1;
   this.office.gain.setTargetAtTime(mode==='office'?.65*duck:0,now,.16);
   this.disco.gain.setTargetAtTime(mode==='disco'?.52*duck:0,now,.16);
   this.machine.gain.setTargetAtTime(printer?.65:0,now,.045);this.mixed=true;
  }
  if(active!==this.active){
   this.active=active;
   if(active)this.ctx.resume().catch(()=>{});
   else{for(const voice of this.voices)voice.stop();this.voices.clear();this.ctx.suspend().catch(()=>{});}
  }
 }
 play(kind){
  if(!this.ctx||!this.enabled||this.paused||this.ctx.state!=='running')return;
  if(!this.effects.has(kind))this.effects.set(kind,this.buffer(composeEffect(kind)));
  const source=this.ctx.createBufferSource();source.buffer=this.effects.get(kind);source.connect(this.fx);this.voices.add(source);source.onended=()=>this.voices.delete(source);source.start();
 }
}
