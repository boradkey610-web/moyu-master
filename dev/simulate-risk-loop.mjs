import {Game,activities} from '../src/engine.js';
export function simulate(level,seed,careful,target,policy='mixed'){
 const g=new Game(level,seed),activity=level<2?'game':'dance';if(target)g.config={...g.config,target};let tick=0;
 while(tick++<3000){
  if(g.modal){if(['win','lose','timeout'].includes(g.modal.kind))break;g.dismiss();}
  if(careful){
   function safe(candidate){
    const a=activities[candidate],look=Math.max(a.stop,activities[g.player.activity].stop)+.25;
    return !g.inspectors.some(ins=>{
     if(ins.hidden)return false;const q=ins.queue[0];
     if(q?.phase==='warning')return q.left<=look&&Math.hypot(g.player.x-ins.x,g.player.y-ins.y)<=a.range+.001;
     if(q?.phase!=='checking')return false;
     const angle=Math.atan2(Math.sin(Math.atan2(g.player.y-ins.y,g.player.x-ins.x)-ins.angle),Math.cos(Math.atan2(g.player.y-ins.y,g.player.x-ins.x)-ins.angle));
     return Math.hypot(g.player.x-ins.x,g.player.y-ins.y)<=a.range+.001&&Math.abs(angle)<Math.PI/4;
    });
   }
   const choices=policy==='single'?[activity]:level<2?['game','joke']:['dance','game','joke'];g.setActivity(g.coins+g.pendingBonus>=g.config.target?'work':choices.find(safe)||'work');
  }else g.setActivity(activity);
  g.step(.05);
 }
 return {win:g.modal?.kind==='win',seconds:g.elapsed,catches:g.catches,closeCalls:g.stats.closeCalls,coins:g.coins,activities:g.stats.activityTime,heard:Object.keys(g.soundField.claimed).length};
}
if(process.argv[1]?.endsWith('simulate-risk-loop.mjs'))for(let level=0;level<4;level++)for(const careful of [false,true]){
 const runs=Array.from({length:30},(_,i)=>simulate(level,i+1,careful));console.log(JSON.stringify({level:level+1,strategy:careful?'warning-response':'stationary-greedy',wins:runs.filter(r=>r.win).length,seeds:30,averageSeconds:Math.round(runs.reduce((a,r)=>a+r.seconds,0)/30),averageCatches:runs.reduce((a,r)=>a+r.catches,0)/30,averageCloseCalls:runs.reduce((a,r)=>a+r.closeCalls,0)/30}));
}
