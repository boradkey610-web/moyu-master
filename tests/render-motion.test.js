import test from 'node:test';
import assert from 'node:assert/strict';
import {Renderer} from '../src/render.js';
import {readFileSync} from 'node:fs';
const manifest=JSON.parse(readFileSync(new URL('../assets/manifest.json',import.meta.url)));
const supervisorArt=()=>Object.fromEntries(Object.entries(manifest).filter(([name])=>name.includes('supervisor-female')).map(([name,meta])=>[name,{meta}]));

const renderer=()=>Object.assign(Object.create(Renderer.prototype),{motion:new Map(),facings:new Map()});
test('图片加载不依赖内嵌浏览器可能永久等待的decode，失败可进入回退',async()=>{
 const previous=globalThis.Image;
 try{
  globalThis.Image=class{set src(value){queueMicrotask(()=>value==='bad'?this.onerror():this.onload());}decode(){throw new Error('decode must not be called');}};
  const r=renderer();assert.ok(await r.loadImage('good'));
  await assert.rejects(r.loadImage('bad'),/image load/);
 }finally{if(previous===undefined)delete globalThis.Image;else globalThis.Image=previous;}
});
test('收益币面与数字墨迹垂直居中，单双位数保持相同间距',()=>{
 const r=renderer();
 for(const [activity,gold,width]of [['game',false,29],['dance',true,43]]){
  const coins=[],numbers=[],c={measureText(){return{width,actualBoundingBoxAscent:18,actualBoundingBoxDescent:0};},createLinearGradient(){return{addColorStop(){}};},strokeText(){},fillText(text,x,y){numbers.push({text,x,y,baseline:this.textBaseline,align:this.textAlign});}};
  for(const name of ['save','restore','beginPath','arc','stroke','fill','moveTo','lineTo','closePath'])c[name]=()=>{};
  r.ellipse=(c,x,y,rx,ry)=>coins.push({x,y,rx,ry});
  r.incomePop(c,{activity,gold,seat:7,x:545,y:515},.5);
  assert.equal(numbers.length,1);const n=numbers[0],centerY=(coins[0].y+coins[1].y)/2;
  assert.equal(n.baseline,'alphabetic');assert.ok(Math.abs(n.y-9-centerY)<1e-8,'数字实际墨迹中心必须与币面相同');
  const left=n.align==='left'?n.x:n.x-width/2,coinRight=Math.max(...coins.slice(0,2).map(p=>p.x+p.rx));
  assert.ok(Math.abs(left-coinRight-6)<1e-8,'币字间距必须固定为6');
 }
});
test('下行抵达检查点的最后一步，不能被检查朝向覆盖为背面',()=>{
 const r=renderer();
 r.pose({x:65,y:348,angle:Math.PI/2,queue:[{kind:'move',x:65,y:350}]},'boss');
 const pose=r.pose({x:65,y:350,angle:-Math.PI/2,queue:[{kind:'wait',left:3}]},'boss');
 assert.equal(pose.direction,'down');
 assert.equal(pose.moving,true);
});
test('下行后左右转弯以实际位移确定朝向，停步才切入站姿',()=>{
 for(const [dx,expected] of [[2,'right'],[-2,'left']]){
  const r=renderer();
  r.pose({x:355,y:348,angle:Math.PI/2,queue:[{kind:'move',x:355,y:350}]},'boss');
  r.pose({x:355,y:350,angle:-Math.PI/2,queue:[{kind:'wait',left:0}]},'boss');
  const turn={x:355+dx,y:350,angle:-Math.PI/2,queue:[{kind:'move',x:dx>0?655:65,y:350}]};
  assert.equal(r.pose(turn,'boss').direction,expected);
  const idle=r.pose({...turn,angle:dx>0?0:Math.PI,queue:[{kind:'wait',left:2}]},'boss');
  assert.equal(idle.direction,expected);assert.equal(idle.moving,false);
 }
});
test('刚解除招呼时使用下一段路线朝向，不复用旧检查朝向',()=>{
 const r=renderer();
 const actor={x:65,y:350,angle:-Math.PI/2,queue:[{kind:'move',x:65,y:585}],hold:2};
 r.pose(actor,'boss');
 const pose=r.pose({...actor,hold:0},'boss');
 assert.equal(pose.direction,'down');assert.equal(pose.moving,true);
});
test('坐姿素材未加载时必须进入坐姿回退，不能画成站在椅子上',()=>{
 const r=renderer();r.art={player:{}};
 const c=new Proxy({}, {get:()=>()=>{throw new Error('不应调用站姿绘制');}});
 assert.equal(r.paintedPerson(c,{type:'player',x:0,y:0,activity:'work'},{seated:true,direction:'up'},0),false);
});
test('主管默认使用女性主管图集，不回退到原男性主管素材',()=>{
 const r=renderer();
 r.art=supervisorArt();
 r.ellipse=()=>{};
 const c={save(){},restore(){}};
 const calls=[];r.sprite=(...args)=>{calls.push(args.slice(1,4));return true;};
 r.paintedPerson(c,{type:'supervisor',x:0,y:0,activity:'work'},{seated:false,moving:false,direction:'down',travel:0},0);
 assert.equal(calls.length,1);
 assert.deepEqual(calls[0],['idle-supervisor-female',1,0]);
});
test('女性主管四向行走引用实际注册的资源，向左使用独立列且绝不镜像',()=>{
 const r=renderer();r.art=supervisorArt();r.ellipse=()=>{};
 const calls=[];r.sprite=(...args)=>{calls.push(args.slice(1));return true;};
 for(const [direction,row,atlas,column] of [['right',0,'side-steps-supervisor-female',0],['left',3,'side-steps-supervisor-female',1],['down',1,'front-steps-supervisor-female',0],['up',2,'back-steps-supervisor-female',0]]){
  calls.length=0;
  for(let phase=0;phase<4;phase++)assert.equal(r.paintedPerson({}, {type:'supervisor',x:10,y:20,activity:'work'}, {direction,moving:true,travel:phase*8.5},0),true);
  assert.deepEqual(calls.map(call=>call.slice(0,3)),[[atlas,0,column],['idle-supervisor-female',row,0],[atlas,1,column],['idle-supervisor-female',row,0]]);
  assert.ok(calls.every(call=>!call[6]),'手持文件夹的主管不能水平翻转');
 }
});
test('女性主管动作素材缺失时用独立原始图集，全部缺失才进入女性矢量回退',()=>{
 const r=renderer();r.art={'supervisor-female':supervisorArt()['supervisor-female']};r.ellipse=()=>{};
 const calls=[];r.sprite=(...args)=>{calls.push(args.slice(1,4));return true;};
 assert.equal(r.paintedPerson({}, {type:'supervisor',x:0,y:0}, {direction:'left',moving:true,travel:17},0),true);
 assert.deepEqual(calls,[['supervisor-female',3,2]]);
 r.art={supervisor:{},idle:{}};
 assert.equal(r.paintedPerson({}, {type:'supervisor',x:0,y:0}, {direction:'left',moving:false},0),false);
 assert.equal(calls.length,1);
});
test('主管头像使用同一独立正面站姿入口，素材缺失时不会显示旧男性主管',()=>{
 const r=renderer(),calls=[];r.sprite=(...args)=>{calls.push(args.slice(1,4));return true;};
 r.portrait({},'supervisor',72,300,286);
 assert.deepEqual(calls,[['idle-supervisor-female',1,0]]);
 r.sprite=()=>false;let fallback;
 r.person=(...args)=>fallback=args[3];
 const c={save(){},restore(){},translate(){},scale(){}};
 r.portrait(c,'supervisor',72,300,286);assert.equal(fallback,'supervisor');
});
test('女性主管注册图片尺寸及每个裁片均有效，包含独立左向站姿和左右接触步',()=>{
 for(const [name,{meta}]of Object.entries(supervisorArt())){
  const png=readFileSync(new URL('../'+meta.src,import.meta.url));
  assert.equal(png.readUInt32BE(16),meta.width,name+' width');
  assert.equal(png.readUInt32BE(20),meta.height,name+' height');
  for(const row of meta.frames)for(const frame of row){
   assert.ok(frame.x>=0&&frame.y>=0&&frame.x+frame.w<=meta.width&&frame.y+frame.h<=meta.height,name+' crop');
   assert.equal(frame.h,420);assert.equal(frame.anchor,192);
  }
 }
 assert.equal(manifest['idle-supervisor-female'].frames.length,4);
 assert.equal(manifest['side-steps-supervisor-female'].frames[0].length,2);
});
test('上下行走的两个接触相位分别使用左腿和右腿素材，过渡帧不复用同侧抬脚',()=>{
 const r=renderer();r.art={boss:{},idle:{},back_steps:{},front_steps:{}};r.ellipse=()=>{};
 const c={save(){},restore(){}};let calls=[];r.sprite=(...args)=>{calls.push(args.slice(1,4));return true;};
 for(const [direction,atlas]of [['up','back_steps'],['down','front_steps']]){
  calls=[];
  for(const phase of [0,1,2,3])r.paintedPerson(c,{type:'boss',x:65,y:350,activity:'work'},{direction,seated:false,moving:true,travel:phase*8.5},0);
  assert.deepEqual(calls,[[atlas,0,1],['idle',direction==='up'?2:1,1],[atlas,1,1],['idle',direction==='up'?2:1,1]]);
 }
});
test('占座人物将金椅状态传入前层椅背，包含玩家与同事',()=>{
 const r=renderer();r.art={seated:{}};r.sprite=()=>true;let golds=[];r.chair=(c,x,y,gold)=>golds.push(gold);
 for(const type of ['player','npc0'])for(const gold of [true,false])r.paintedPerson({}, {type,x:0,y:0,activity:'work',gold},{seated:true},0);
 assert.deepEqual(golds,[true,false,true,false]);
});
test('声音目标与玩家新位置无关，停声消散后仍标记已知旧工位',()=>{
 const r=renderer(),point={x:545,y:515,seat:7,time:4,kind:'dance'},ins={clock:7,directed:true,evidenceKind:'sound',lastHeard:point};
 const g={player:{seat:1,x:255,y:280},inspectors:[ins],soundField:{sources:[]}},markers=[];
 r.chip=(c,text,x,y)=>markers.push({text,x,y});r.soundSignals({},g,7);
 assert.equal(markers.length,1);assert.match(markers[0].text,/8号 · 旧声源/);assert.equal(markers[0].x,545);
 ins.leaving=true;assert.equal(r.soundTarget(ins),null);
});
test('感叹号使用听见事件的模拟时间，已排队声音不会冒充立即检查',()=>{
 const r=renderer(),ins={clock:4.3,lastHeard:{seat:7,time:4,kind:'dance'}};
 assert.equal(r.soundTarget(ins).fresh,true);assert.deepEqual(r.soundTarget(ins),r.soundTarget(ins));
 ins.clock=6;assert.equal(r.soundTarget(ins),null);
 ins.pendingSound={seat:5,time:6,kind:'game'};const labels=[];r.chip=(c,text)=>labels.push(text);
 r.inspectionLabel({},ins,{moving:false});assert.match(labels[0],/听到键盘声/);
 ins.clock=8;r.inspectionLabel({},ins,{moving:false});assert.match(labels[1],/稍后查6号/);
});
test('听声动画结束或有待查声源时仍保留当前检查与预告倒计时',()=>{
 const r=renderer(),labels=[];r.chip=(c,text)=>labels.push(text);
 const ins={name:'老板',clock:6,directed:true,evidenceKind:'sound',lastHeard:{seat:7,time:3},queue:[{kind:'wait',phase:'checking',left:2.4}]};
 r.inspectionLabel({},ins,{moving:false});assert.match(labels[0],/8号/);assert.match(labels[0],/检查2.4秒/);
 ins.pendingSound={seat:5,time:3};ins.queue=[{kind:'wait',phase:'warning',left:.4}];
 r.inspectionLabel({},ins,{moving:false});assert.match(labels[1],/稍后查6号/);assert.match(labels[1],/当前0.4秒后查/);
});
test('待查新声源时仍显示正在检查的旧工位，不能只标未来目标',()=>{
 const r=renderer(),labels=[];r.chip=(c,text)=>labels.push(text);
 const ins={name:'老板',clock:8,directed:true,evidenceKind:'sound',lastHeard:{x:545,y:515,seat:7,time:1,kind:'dance'},pendingSound:{x:255,y:515,seat:5,time:5,kind:'game'},queue:[{kind:'wait',phase:'checking',left:1.2}]};
 r.soundSignals({}, {inspectors:[ins],player:{seat:5}},8);r.inspectionLabel({},ins,{moving:false});
 assert.ok(labels.some(s=>s.includes('8号 · 正查')));assert.ok(labels.some(s=>s.includes('6号 · 待查看')));
 assert.ok(labels.some(s=>s.includes('8号')&&s.includes('稍后查6号')&&s.includes('1.2秒')));
});
