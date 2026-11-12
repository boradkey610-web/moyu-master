export class SceneFade{
 constructor(value=0){this.value=value;this.transition=null;}
 to(target,duration){
  const end=Math.max(0,Math.min(1,target));
  if(duration<=0||end===this.value){this.value=end;this.transition=null;return;}
  this.transition={from:this.value,to:end,duration,elapsed:0};
 }
 step(dt){
  const t=this.transition;if(!t)return this.value;
  t.elapsed=Math.min(t.duration,t.elapsed+Math.max(0,dt));
  const u=t.elapsed/t.duration,ease=u*u*(3-2*u);
  this.value=t.from+(t.to-t.from)*ease;
  if(t.elapsed>=t.duration){this.value=t.to;this.transition=null;}
  return this.value;
 }
}
