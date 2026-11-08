export const activities={work:{name:'工作',rate:0,range:0,stop:0},joke:{name:'看段子',rate:2,range:70,stop:.1},game:{name:'打游戏',rate:3,range:140,stop:.5},dance:{name:'蹦迪',rate:6,range:230,stop:1}};
export const levels=[{name:'入职第一天',target:90,time:60,npcs:2,bosses:1},{name:'找个好工位',target:170,time:75,npcs:3,bosses:1},{name:'主管也来了',target:400,time:90,npcs:5,bosses:2},{name:'周五抢座大战',target:440,time:90,npcs:7,bosses:2}];
export const seats=Array.from({length:12},(_,id)=>{const row=Math.floor(id/4),col=Math.floor(id%4/2);return{id,x:(col?455:165)+(id%2)*90,y:280+row*235,row,col};});
const PLAYER_SPEED=110;
const xs=[65,355,655],ys=[115,350,585,820];
export const nodes=ys.flatMap((y,r)=>xs.map((x,c)=>({x,y,id:r*3+c})));
const neighbors=id=>[id%3? id-1:-1,id%3<2?id+1:-1,id>=3?id-3:-1,id<9?id+3:-1].filter(i=>i>=0);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const same=(a,b)=>dist(a,b)<.001;
function gridPath(a,b){const costs=nodes.map(()=>Infinity),prev={},todo=new Set(nodes.map(n=>n.id));costs[a]=0;while(todo.size){let u=[...todo].sort((i,j)=>costs[i]-costs[j])[0];todo.delete(u);if(u===b)break;for(const v of neighbors(u)){const d=costs[u]+dist(nodes[u],nodes[v]);if(d<costs[v]){costs[v]=d;prev[v]=u;}}}const result=[nodes[b]];while(result[0].id!==a)result.unshift(nodes[prev[result[0].id]]);return result;}
function anchors(p){if(p.seat!==undefined&&p.seat!==null)p=seats[p.seat];const row=ys.indexOf(p.y),col=xs.indexOf(p.x);if(row>=0)return xs.map((x,c)=>({node:row*3+c,point:{x:p.x,y:p.y},cost:Math.abs(p.x-x)}));if(col>=0)return ys.map((y,r)=>({node:r*3+col,point:{x:p.x,y:p.y},cost:Math.abs(p.y-y)}));const s=seats.find(s=>Math.abs(s.x-p.x)<.01&&p.y>=s.y&&p.y<=ys[s.row+1]);if(s)return xs.map((x,c)=>({node:(s.row+1)*3+c,point:{x:p.x,y:ys[s.row+1]},cost:ys[s.row+1]-p.y+Math.abs(x-p.x)}));return[{node:4,point:{x:355,y:p.y},cost:Math.abs(p.x-355)+Math.abs(p.y-350)}];}
export function pathBetween(a,b){let best=null;for(const aa of anchors(a))for(const bb of anchors(b)){if((aa.point.y===bb.point.y&&ys.includes(aa.point.y))||(aa.point.x===bb.point.x&&xs.includes(aa.point.x))){const direct=dist(a,aa.point)+dist(aa.point,bb.point)+dist(bb.point,b);if(!best||direct<best.len)best={len:direct,path:[aa.point,bb.point,{x:b.x,y:b.y}]};}const grid=gridPath(aa.node,bb.node);const len=aa.cost+bb.cost+grid.slice(1).reduce((sum,n,i)=>sum+dist(grid[i],n),0);if(!best||len<best.len)best={len,path:[aa.point,...grid,bb.point,{x:b.x,y:b.y}]};}let prev=a;return best.path.filter(p=>{if(same(p,prev))return false;prev=p;return true;}).map(p=>({x:p.x,y:p.y})).concat(best.path.length&&same(a,b)?[{x:b.x,y:b.y}]:[]);}
function rand(o){o.seed=(Math.imul(o.seed,1664525)+1013904223)>>>0;return o.seed/4294967296;}
const exitFor=n=>n.x===65?{x:12,y:n.y}:n.x===655?{x:708,y:n.y}:n.y===115?{x:n.x,y:55}:{x:n.x,y:885};
const patrolStops=Array.from({length:6},(_,zone)=>({x:zone%2?500:210,y:350+Math.floor(zone/2)*235,zone}));
const patrolOrder=[0,1,3,5,4,2];
const zoneFor=p=>p.seat!=null?Math.floor(p.seat/4)*2+Math.floor(p.seat%4/2):null;
function nearestAisle(p){return [...xs.map(x=>({x,y:p.y})),...ys.map(y=>({x:p.x,y}))].sort((a,b)=>dist(p,a)-dist(p,b))[0];}
function zoneAvailable(ins,zone,delay=0){return !(ins.avoidZones||[]).includes(zone)&&(ins.checkedZones[zone]==null||ins.clock+delay-ins.checkedZones[zone]>=20-1e-8);}
function schedulePatrol(ins){
 const order=ins.patrolOrder||patrolOrder;
 for(let n=0;n<order.length;n++){
  const zone=order[(ins.patrolIndex||0)%order.length];ins.patrolIndex=(ins.patrolIndex||0)+1;
  const point=patrolStops[zone];let previous=ins;const route=pathBetween(ins,point),travel=route.reduce((sum,p)=>{const d=dist(previous,p);previous=p;return sum+d;},0)/ins.speed;
  if(!zoneAvailable(ins,zone,travel))continue;
 ins.zone=zone;ins.directed=false;ins.evidenceKind='routine';
  ins.queue=route.map(p=>({kind:'move',...p}));
  ins.queue.push({kind:'wait',left:2,phase:'warning',angle:-Math.PI/2},{kind:'wait',left:3,phase:'checking',angle:-Math.PI/2});return;
 }
 // No eligible island: keep walking, rather than guard the player's old chair.
 const node=[...nodes].sort((a,b)=>dist(ins,b)-dist(ins,a))[0];ins.zone=null;
 ins.queue=pathBetween(ins,node).map(p=>({kind:'move',...p}));
 if(!ins.queue.length)ins.queue=[{kind:'wait',left:1,angle:ins.angle}];
}
function advanceSound(field,dt){
 field.respondedZones??={};field.clock+=dt;const emitter=field.emitter,rate=emitter?.seated?({game:4,dance:22}[emitter.activity]||0):0;
 if(rate&&!field.sources.some(s=>s.seat===emitter.seat))field.sources.push({seat:emitter.seat,x:emitter.x,y:emitter.y,zone:zoneFor(emitter),volume:0,kind:emitter.activity,pulseId:null,lastPulse:-Infinity});
 for(const source of field.sources){
  source.active=!!rate&&source.seat===emitter.seat;
  if(source.active){source.volume=Math.min(100,source.volume+rate*dt);source.kind=emitter.activity;}
  else source.volume=Math.max(0,source.volume-12*dt);
  source.radius=source.volume>=40-1e-8?180+(source.volume-40)/60*140:0;
  if(source.volume>=40-1e-8&&(source.pulseId===null||field.clock-source.lastPulse>=8-1e-8)){source.pulseId=field.nextId++;source.lastPulse=field.clock;}
 }
 field.sources=field.sources.filter(s=>s.volume>1e-8);
}
function hearSource(ins){
 const field=ins.soundField;if(!field||ins.hidden||ins.leaving||(ins.directed&&!ins.queue[0]?.phase)||ins.pendingSound){ins.hearingTime=0;return;}
 const source=field.sources.filter(s=>s.active&&s.radius>0&&!field.claimed[s.pulseId]&&(field.respondedZones[s.zone]==null||field.clock-field.respondedZones[s.zone]>=10-1e-8)&&zoneAvailable(ins,s.zone)&&dist(ins,s)<=s.radius).sort((a,b)=>dist(ins,a)-dist(ins,b))[0];
 if(!source){ins.hearingTime=0;ins.hearingId=null;return;}
 if(ins.hearingId!==source.pulseId){ins.hearingId=source.pulseId;ins.hearingTime=0;}
 ins.hearingTime+=.01;if(ins.hearingTime<.5-1e-8)return;
 const heard={x:source.x,y:source.y,seat:source.seat,zone:source.zone,time:ins.clock,soundId:source.pulseId,kind:source.kind};
 const q=ins.queue[0];
 field.claimed[source.pulseId]=ins.name;field.respondedZones[source.zone]=field.clock;ins.hearingTime=0;
 if(!(q?.phase&&ins.directed&&ins.evidenceKind==='sound'))ins.lastHeard=heard;
 if(q?.phase){if(ins.zone!==source.zone)ins.pendingSound=heard;return;}
 investigate(ins,heard,'sound');
}
function soundVantage(ins,p){
 if(dist(ins,p)<=220)return{x:ins.x,y:ins.y};
 const candidates=ys.flatMap(y=>[65,165,210,255,355,455,500,545,655].map(x=>({x,y}))).concat(xs.flatMap(x=>[115,280,350,515,585,750,820].map(y=>({x,y}))));
 const choices=candidates.filter(c=>dist(c,p)>=150&&dist(c,p)<=210).map(point=>{let prev=ins;const cost=pathBetween(ins,point).reduce((sum,next)=>{const d=dist(prev,next);prev=next;return sum+d;},0);return{point,cost};});
 return choices.sort((a,b)=>a.cost-b.cost)[0]?.point||nearestAisle(p);
}
function investigate(ins,p,kind='vision'){
 const point=kind==='sound'?soundVantage(ins,p):nearestAisle(p);ins.evidenceKind=kind;if(kind==='sound')ins.lastHeard={...p};else ins.lastSeen={x:p.x,y:p.y,seat:p.seat,zone:zoneFor(p),time:ins.clock};
 ins.zone=zoneFor(p);ins.directed=true;ins.suspicion=0;
 ins.queue=pathBetween(ins,point).map(p=>({kind:'move',...p}));
 const angle=Math.atan2(p.y-point.y,p.x-point.x);
 ins.queue.push({kind:'wait',left:2,phase:'warning',angle},{kind:'wait',left:3,phase:'checking',angle});
}
function visible(ins,p,range){const delta=Math.atan2(p.y-ins.y,p.x-ins.x)-ins.angle;return dist(ins,p)<=range+.001&&Math.abs(Math.atan2(Math.sin(delta),Math.cos(delta)))<Math.PI/4;}
function inspectorStep(ins,dt){
 if(ins.hold>0){const use=Math.min(dt,ins.hold);ins.hold-=use;ins.clock+=use;dt-=use;}
 while(dt>1e-8){
  if(!ins.queue.length)schedulePatrol(ins);const q=ins.queue[0];let use;
  if(q.kind==='wait'){
   ins.angle=q.angle??ins.angle;ins.hidden=!!q.hidden;use=Math.min(q.left,dt);q.left-=use;
   if(q.left<=1e-8){ins.queue.shift();ins.hidden=false;ins.leaving=false;
    if(q.phase==='checking'){if(ins.zone!=null&&(ins.evidenceKind!=='sound'||dist(ins,ins.lastHeard)<=140))ins.checkedZones[ins.zone]=ins.clock+use;ins.zone=null;ins.directed=false;ins.suspicion=0;}
   }
  }else{
   ins.hidden=false;const d=dist(ins,q);ins.angle=Math.atan2(q.y-ins.y,q.x-ins.x);use=Math.min(dt,d/ins.speed);
   if(d>0){ins.x+=(q.x-ins.x)*use*ins.speed/d;ins.y+=(q.y-ins.y)*use*ins.speed/d;}
   if(d<.001||use*ins.speed>=d-.0001){ins.x=q.x;ins.y=q.y;ins.queue.shift();}
  }
  ins.clock+=use;dt-=use;
 }
 if(ins.pendingSound&&!ins.queue[0]?.phase&&!ins.directed){
  const heard=ins.pendingSound;ins.pendingSound=null;
  if(ins.clock-heard.time<=8&&zoneAvailable(ins,heard.zone))investigate(ins,heard,'sound');
 }
 hearSource(ins);
 const p=ins.observation,q=ins.queue[0],zone=p?zoneFor(p):null;
 const canNotice=p?.seated&&p.activity!=='work'&&!ins.hidden&&!ins.leaving&&!ins.directed&&!q?.phase&&zone!==ins.zone&&zoneAvailable(ins,zone);
 if(canNotice&&visible(ins,p,activities[p.activity]?.range||0)){
  ins.suspicion=(ins.suspicion||0)+.01;
  if(ins.suspicion>=.45-1e-8)investigate(ins,p);
 }else ins.suspicion=0;
}
export function advanceInspectors(list,dt,field=list[0]?.soundField){
 for(const ins of list){ins.clock??=0;ins.checkedZones??={};ins.tickRemainder=(ins.tickRemainder||0)+dt;if(field)ins.soundField=field;}
 if(field)field.tickRemainder=(field.tickRemainder||0)+dt;
 while(list.some(i=>i.tickRemainder>=.01-1e-8)||(field&&field.tickRemainder>=.01-1e-8)){
  if(field&&field.tickRemainder>=.01-1e-8){field.tickRemainder=Math.max(0,field.tickRemainder-.01);advanceSound(field,.01);}
  const checked={};for(const i of list)for(const [zone,time]of Object.entries(i.checkedZones))checked[zone]=Math.max(checked[zone]??-Infinity,time);
  for(const ins of list){
   Object.assign(ins.checkedZones,checked);
   if(list.length>1)ins.avoidZones=list.filter(i=>i!==ins&&!i.leaving).flatMap(i=>[i.zone,i.pendingSound?.zone]).filter(z=>z!=null);
   if(ins.tickRemainder>=.01-1e-8){ins.tickRemainder=Math.max(0,ins.tickRemainder-.01);inspectorStep(ins,.01);for(const [zone,time]of Object.entries(ins.checkedZones))checked[zone]=Math.max(checked[zone]??-Infinity,time);}
  }
 }
}
export function advanceInspector(ins,dt){advanceInspectors([ins],dt);}
function forecastPoint(i,t){return{x:i.x,y:i.y,t,hidden:i.hidden,waiting:i.queue[0]?.kind==='wait',angle:i.angle,phase:i.queue[0]?.phase||(i.directed?'approach':'patrol')};}
export function forecastAll(inspectors,seconds=10){
 const clones=structuredClone(inspectors),points=clones.map(i=>[forecastPoint(i,0)]);
 for(let t=0;t<seconds-.0001;t+=.1){const step=Math.min(.1,seconds-t);advanceInspectors(clones,step);clones.forEach((i,k)=>points[k].push(forecastPoint(i,Math.min(seconds,t+step))));}return points;
}
export function forecast(ins,seconds=10){return forecastAll([ins],seconds)[0];}
export class Game{
 constructor(level=0,seed=Date.now()){this.level=level;this.config=levels[level];this.seed=seed>>>0;this.time=this.config.time;this.elapsed=0;this.coins=0;this.warned=false;this.catches=0;this.ads=0;this.extended=false;this.mirror=0;this.inventory={mirror:0,meeting:0};this.special=null;this.specialAt=10;this.dropAt=14;this.drops=[];this.modal=null;this.paused=false;this.toast='选一种摸鱼方式，留意老板的朝向';this.toastLeft=5;this.player={...seats[7],seat:7,activity:'work',riskActivity:'game',route:[],target:null,stopping:0,pending:null,hold:0,lock:0};this.comboTime=0;this.pendingBonus=0;this.exposure=0;this.exposureLimit=.7;this.feedback=null;this.greeting=null;this.tutorialSeen=false;this.stats={moves:0,moveTime:0,greetings:0,picked:0,closeCalls:0,banked:0,activityTime:{joke:0,game:0,dance:0,work:0}};this.soundField={clock:0,tickRemainder:0,nextId:1,emitter:null,sources:[],claimed:{},respondedZones:{}};this.inspectors=Array.from({length:this.config.bosses},(_,i)=>({x:i?708:12,y:i?350:585,name:i?'主管':'老板',seed:(seed+i*91)>>>0,speed:62,angle:i?-Math.PI/2:0,last:i?5:6,previous:-1,queue:[{kind:'wait',left:3+i*2,angle:i?Math.PI:0},{kind:'move',x:i?655:65,y:i?350:585}],hold:0,hidden:false,leaving:false,greeted:false,clock:0,tickRemainder:0,patrolOrder:i?((seed+i*91)%2?[3,1,0,2,4,5]:[3,5,4,2,0,1]):(level===0?[3,1,0,2,4,5]:(seed%2?[2,4,5,3,1,0]:[2,0,1,3,5,4])),patrolIndex:0,zone:null,checkedZones:{},avoidZones:[],lastSeen:null,suspicion:0,observation:null,lastHeard:null,pendingSound:null,hearingTime:0,hearingId:null,evidenceKind:'routine',soundField:this.soundField,directed:false,closeClaimed:false}));this.npcs=[0,3,8,10,4,1,11].slice(0,this.config.npcs).map((seat,i)=>({...seats[seat],seat,target:null,route:[],next:35+i*6,color:i%3}));}
 notify(text){this.toast=text;this.toastLeft=3.5;}
 occupied(id,except){return(this.player!==except&&this.player.seat===id)||this.npcs.some(n=>n!==except&&n.seat===id);}
 empty(){return seats.filter(s=>!this.occupied(s.id));}
 activityThreats(a){return this.inspectors.filter(i=>!i.hidden&&['warning','checking'].includes(i.queue[0]?.phase)&&visible(i,this.player,activities[a]?.range||0)).map(i=>i.name);}
 setActivity(a){const p=this.player;if(this.modal||this.paused||!activities[a]||(a==='dance'&&this.level<2)||p.lock>0)return false;if(p.route.length){if(a==='work'){p.route=[];p.target=null;p.activity='work';this.notify('停在过道 · 点击空座继续');}return false;}if(p.seat===null&&a!=='work')return false;if(p.stopping>0)return false;if(p.activity===a)return true;this.transition({type:'activity',activity:a});return true;}
 transition(action){const p=this.player;if(p.stopping>0)return false;const stop=activities[p.activity].stop;if(stop>0){p.stopping=stop;p.pending=action;}else this.perform(action);return true;}
 perform(action){const p=this.player;if(action.type==='activity'&&action.activity!=='work')p.riskActivity=action.activity;if(action.type==='move'||action.activity==='work')this.bankBonus();p.activity='work';if(action.type==='activity'){p.activity=action.activity;if(action.activity==='dance')p.warmup=.8;else p.warmup=0;}else{if(this.occupied(action.seat)){this.notify('这个工位被同事占了，换一个吧');return;}p.route=pathBetween(p,seats[action.seat]);p.target=action.seat;p.seat=null;this.stats.moves++;}}
 bankBonus(){
  let amount=this.pendingBonus,close=false;
  if(this.comboTime>=3-1e-8)for(const ins of this.inspectors){const q=ins.queue[0];if(q?.phase==='warning'&&q.left<=1+1e-8&&!q.closeClaimed&&visible(ins,this.player,activities[this.player.activity].range)){q.closeClaimed=true;ins.closeClaimed=true;amount+=5;this.stats.closeCalls++;close=true;}}
  if(amount>1e-8){this.coins+=amount;this.stats.banked+=amount;this.feedback={kind:close?'close':'bank',text:close?'差一点！':'安全到账',amount,left:1.4,x:this.player.x,y:this.player.y};}
  this.pendingBonus=0;this.comboTime=0;this.exposure=0;
 }
 remainingRoute(actor){let prev=actor;return actor.route.reduce((sum,p)=>{const d=dist(prev,p);prev=p;return sum+d;},0);}
 protectedSeat(id){const p=this.player;return p.target===id&&p.route.length&&this.remainingRoute(p)<=PLAYER_SPEED+1e-8;}
 moveTo(id){if(this.modal||this.paused||!seats[id]||this.occupied(id)||this.player.lock>0)return false;if(this.player.route.length){this.player.route=pathBetween(this.player,seats[id]);this.player.target=id;return true;}return this.transition({type:'move',seat:id});}
 spawnSpecial(){
  const choices=this.empty().map(seat=>{let previous=this.player;const distance=pathBetween(this.player,seat).reduce((sum,p)=>{const d=dist(previous,p);previous=p;return sum+d;},0);const stop=this.player.route.length?0:this.player.stopping>0?this.player.stopping:activities[this.player.activity].stop;return{seat,time:distance/PLAYER_SPEED+stop};});
  if(!this.special&&choices.length){const nearby=choices.filter(c=>c.time<=6),pool=nearby.length?nearby:[choices.sort((a,b)=>a.time-b.time)[0]],chosen=pool[Math.floor(rand(this)*pool.length)];this.special={seat:chosen.seat.id,left:Math.max(18,Math.ceil(chosen.time)+12)};this.notify('黄金工位出现！限时摸鱼收益 ×2');}
 }
 spawnDrop(){const choices=this.empty().filter(s=>!this.drops.some(d=>d.seat===s.id));if(this.drops.length<2&&choices.length){this.drops.push({seat:choices[Math.floor(rand(this)*choices.length)].id,type:this.level===0||rand(this)<.87?'mirror':'meeting'});this.notify('空工位出现了道具，坐下即可拾取');}}
 pickup(){const p=this.player;const d=this.drops.find(d=>d.seat===p.seat);if(d&&!this.inventory[d.type]){this.inventory[d.type]=1;this.drops=this.drops.filter(x=>x!==d);this.stats.picked++;this.notify(d.type==='mirror'?'拿到反光镜 · 可看全部检查者十秒路线':'拿到开会通知 · 可支走一名检查者');}}
 useMirror(){if(this.modal||this.paused||!this.inventory.mirror||!this.inspectors.some(i=>!i.hidden))return false;this.inventory.mirror=0;this.mirror=10;this.notify('情报生效 · 全员未来十秒路线');return true;}
 useMeeting(index){const ins=this.inspectors[index];if(!ins||ins.hidden||ins.leaving||!this.inventory.meeting||this.modal||this.paused)return false;const exits=nodes.filter(n=>n.x===65||n.x===655||n.y===115||n.y===820);let best;for(const e of exits){const door=exitFor(e);const path=pathBetween(ins,door);let prev=ins;const len=path.reduce((s,p)=>{const v=s+dist(prev,p);prev=p;return v;},0);if(!best||len<best.len)best={len,path,e};}ins.directed=false;ins.closeClaimed=true;ins.zone=null;ins.suspicion=0;ins.pendingSound=null;ins.queue=best.path.map(p=>({kind:'move',...p}));ins.queue.push({kind:'wait',left:10,hidden:true},{kind:'move',x:best.e.x,y:best.e.y});ins.last=best.e.id;ins.previous=-1;ins.leaving=true;this.inventory.meeting=0;this.notify(`${ins.name}去开会了，正在步行离场`);return true;}
 catchPlayer(who){if(this.modal)return;const activity=this.player.activity;this.pendingBonus=0;this.comboTime=0;this.exposure=0;const checker=this.inspectors.find(i=>i.name===who);this.player.checker=checker;this.player.checkCommand=checker?.queue[0];this.catches++;this.player.activity='work';this.player.stopping=0;this.player.pending=null;this.player.route=[];this.player.lock=2.5;const lines={joke:['什么这么好笑？也给我讲讲？','好的老板，我马上工作。'],game:['键盘敲得挺响，原来是在打团？','老板，我这就退。'],dance:['要不要把我的办公室腾出来，给你当舞池？','不用了老板，我坐下。'],work:['上班时间，专心一点。','好的老板。']};if(!this.warned){this.warned=true;this.modal={kind:'warning',who,activity,lines:lines[activity]};}else{const before=this.coins;this.coins-=50;this.modal={kind:'fine',who,before};}}
 dismiss(){if(!this.modal)return;const kind=this.modal.kind;if(kind==='fine'&&this.coins<0){this.modal={kind:'lose',reason:'破产了，下次早点收手'};return;}if(kind==='warning'||kind==='fine'||kind==='greeting'||kind==='tutorial')this.modal=null;}
 reward(type){if(this.level===0||this.ads>=2)return false;if(type==='explain'){if(this.modal?.kind!=='fine')return false;this.coins=this.modal.before;this.modal=null;this.player.lock=2.5;}else if(type==='extend'){if(this.extended||this.time>30||this.coins>=this.config.target||this.coins<0||this.modal&&this.modal.kind!=='timeout')return false;this.time+=15;this.extended=true;this.modal=null;}else{if(this.modal||!['mirror','meeting'].includes(type)||this.inventory[type])return false;this.inventory[type]=1;}this.ads++;this.notify('测试奖励已领取 · 本局记为助力成绩');return true;}
 step(dt){let left=dt;while(left>1e-8&&!this.modal&&!this.paused){const h=Math.min(left,.02,this.time);if(h<=0){this.modal={kind:'timeout'};break;}this.tick(h);left-=h;}}
 tick(dt){this.elapsed+=dt;this.time=Math.max(0,this.time-dt);this.toastLeft=Math.max(0,this.toastLeft-dt);this.mirror=Math.max(0,this.mirror-dt);const p=this.player;const boosted=this.special&&p.seat===this.special.seat;const boostTime=boosted?Math.min(dt,this.special.left):0;if(this.special){this.special.left-=dt;if(this.special.left<=1e-8)this.special=null;}if(this.elapsed>=this.specialAt){this.spawnSpecial();this.specialAt+=25;}if(this.elapsed>=this.dropAt){this.spawnDrop();this.dropAt+=22;}
 if(this.feedback){this.feedback.left-=dt;if(this.feedback.left<=0)this.feedback=null;}if(this.greeting){this.greeting.left-=dt;if(this.greeting.left<=0)this.greeting=null;}
 for(const ins of this.inspectors)ins.observation={x:p.x,y:p.y,seat:p.seat,activity:p.activity,seated:p.seat!==null&&!p.route.length};
 this.soundField.emitter={x:p.x,y:p.y,seat:p.seat,activity:p.activity,seated:p.seat!==null&&!p.route.length};
 const heardBefore=this.inspectors.map(i=>Math.max(i.lastHeard?.soundId||0,i.pendingSound?.soundId||0));
 advanceInspectors(this.inspectors,dt,this.soundField);
 this.inspectors.forEach((ins,k)=>{const heard=ins.pendingSound||ins.lastHeard;if((heard?.soundId||0)>heardBefore[k])this.notify(`${ins.name}听见了${heard.kind==='dance'?'音乐':'键盘声'}，${ins.pendingSound?'稍后':'会'}查看${heard.seat+1}号工位`);});
 if(this.level===0&&!this.tutorialSeen&&this.inspectors.some(i=>i.queue[0]?.phase==='warning')){this.tutorialSeen=true;this.modal={kind:'tutorial'};return;}

 for(const n of this.npcs){if(n.route.length){if(this.protectedSeat(n.target)){n.route=[];n.target=null;n.next=this.elapsed+1;}else this.walk(n,dt,62);}else if(this.elapsed>=n.next){const empty=this.empty().filter(s=>!this.npcs.some(o=>o.target===s.id)&&!this.protectedSeat(s.id));if(empty.length){n.target=empty[Math.floor(rand(this)*empty.length)].id;n.route=pathBetween(n,seats[n.target]);n.seat=null;}n.next=this.elapsed+40+rand(this)*20;}}
 p.lock=Math.max(0,p.lock-dt);if(p.checker&&p.checker.queue[0]===p.checkCommand&&dist(p,p.checker)<250)p.lock=Math.max(p.lock,.02);else{p.checker=null;p.checkCommand=null;}
 if(p.seat!==null&&p.lock===0&&!p.route.length)this.stats.activityTime[p.activity]+=dt;
 const warmup=p.warmup||0;p.warmup=Math.max(0,warmup-dt);
 if(p.seat!==null&&p.lock===0&&!p.route.length&&p.hold<=0&&warmup<=0){
  const earned=activities[p.activity].rate*(dt+boostTime);this.coins+=earned;
  if(p.activity!=='work'){const before=this.comboTime;this.comboTime+=dt;
   // Integrate tier boundaries exactly, including double-income expiry.
   for(let tier=1;tier<=3;tier++){const start=Math.max(before,tier*3),end=Math.min(this.comboTime,tier===3?Infinity:(tier+1)*3);if(end>start){const base=activities[p.activity].rate*(end-start);const boostedPart=boosted?Math.max(0,Math.min(end-before,boostTime)-Math.max(start-before,0)):0;this.pendingBonus+=(base+activities[p.activity].rate*boostedPart)*tier*.2;}}
  }
 }
 if(p.stopping>0){p.stopping=Math.max(0,p.stopping-dt);if(p.stopping<1e-8){p.stopping=0;const pending=p.pending;p.pending=null;this.perform(pending);}}
 else if(p.hold>0)p.hold=Math.max(0,p.hold-dt);
 else if(p.route.length){this.stats.moveTime+=dt;this.walk(p,dt,PLAYER_SPEED);}


 for(const ins of this.inspectors){ins.threatensPlayer=visible(ins,p,activities[p.riskActivity||p.activity]?.range||140);}
 let seenBy=null;
 for(const ins of this.inspectors){
  if(ins.hidden)continue;const d=dist(p,ins);
  if(d>110)ins.greeted=false;
  if(p.route.length&&d<52&&!ins.greeted){ins.greeted=true;this.stats.greetings++;this.greeting={who:ins.name,left:1.5,x:p.x,y:p.y};}
  const canCheck=ins.queue[0]?.phase==='checking';
  if(canCheck&&p.seat!==null&&p.activity!=='work'&&p.lock===0){const delta=Math.atan2(p.y-ins.y,p.x-ins.x)-ins.angle;const angle=Math.atan2(Math.sin(delta),Math.cos(delta));if(d<=activities[p.activity].range+.001&&Math.abs(angle)<Math.PI/4)seenBy??=ins;}
 }
 this.exposureLimit=({joke:.9,game:.7,dance:.5})[p.activity]||.7;
 this.exposure=seenBy?this.exposure+dt:0;
 if(seenBy&&this.exposure>=this.exposureLimit-1e-8)this.catchPlayer(seenBy.name);
 if(!this.modal&&this.coins>=this.config.target){this.coins=this.config.target;this.modal={kind:'win'};}if(!this.modal&&this.time<=1e-8)this.modal={kind:'timeout'};
 }
 walk(actor,dt,speed){if(actor.target!==null&&this.occupied(actor.target,actor)){actor.route=[];actor.target=null;if(actor===this.player)this.notify('座位被同事抢先了，重新选一个吧');return;}let budget=speed*dt;while(actor.route.length&&budget>0){const next=actor.route[0],d=dist(actor,next);if(d<=budget){actor.x=next.x;actor.y=next.y;actor.route.shift();budget-=d;}else{actor.x+=(next.x-actor.x)*budget/d;actor.y+=(next.y-actor.y)*budget/d;budget=0;}}if(!actor.route.length&&actor.target!==null){actor.seat=actor.target;actor.target=null;if(actor===this.player){this.pickup();this.notify(this.toastLeft>0&&this.toast.startsWith('拿到')?this.toast:'已入座 · 选择一种摸鱼方式');}else this.drops=this.drops.filter(d=>d.seat!==actor.seat);}}
}
