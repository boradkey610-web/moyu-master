import test from 'node:test';
import assert from 'node:assert/strict';
import {Renderer} from '../src/render.js';
import {Game} from '../src/engine.js';
import {readFileSync} from 'node:fs';
const manifest=JSON.parse(readFileSync(new URL('../assets/manifest.json',import.meta.url)));
const supervisorArt=()=>Object.fromEntries(Object.entries(manifest).filter(([name])=>name.includes('supervisor-female')).map(([name,meta])=>[name,{meta}]));

const renderer=()=>Object.assign(Object.create(Renderer.prototype),{motion:new Map(),facings:new Map()});
test('圆点引导覆盖全部转角和终点，不改变寻路点',()=>{
 const r=renderer(),p={x:545,y:515,route:[{x:545,y:585},{x:255,y:585},{x:255,y:515}]},curves=[],lines=[],rings=[],strokes=[];
 const before=JSON.stringify(p);r.ellipse=(c,...args)=>rings.push(args);let dash=[];
 const c=new Proxy({setLineDash:a=>{dash=a;},quadraticCurveTo:(...a)=>curves.push(a),lineTo:(...a)=>lines.push(a),stroke:()=>strokes.push([...dash])}, {get:(o,k)=>o[k]??(()=>{})});
 r.movePath(c,p,1);
 assert.deepEqual(curves,[[545,585,525,585],[255,585,255,565]]);assert.deepEqual(lines.at(-1),[255,515]);
 assert.deepEqual(strokes,[[1,14],[1,14]]);assert.deepEqual(rings[0].slice(0,4),[255,555,28,10]);assert.equal(JSON.stringify(p),before);
});
test('短段圆角有限，暂停时间一致时圆点不漂移，抵达后不画',()=>{
 const r=renderer(),p={x:10,y:10,route:[{x:10,y:16},{x:13,y:16},{x:13,y:160}]},draw=()=>{
  const curves=[];r.ellipse=()=>{};
  const c=new Proxy({quadraticCurveTo:(...a)=>curves.push(a)}, {get:(o,k)=>o[k]??(()=>{})});
  r.movePath(c,p,2);return{curves,phase:c.lineDashOffset};
 };
 assert.deepEqual(draw(),draw());assert.deepEqual(draw().curves[0],[10,16,11,16]);assert.ok(draw().curves.flat().every(Number.isFinite));
 assert.doesNotThrow(()=>r.movePath(new Proxy({}, {get(){throw new Error('arrived route must not draw');}}),{route:[]},2));
});
test('声音提示区分传出阈值和已停止的声源，不误报有人听见',()=>{
 const r=renderer();
 assert.equal(r.noiseLabel({active:true,volume:39.9}),'暂未传出');
 assert.equal(r.noiseLabel({active:true,volume:40}),'附近可听见');
 assert.equal(r.noiseLabel({active:true,volume:75}),'远处也可听见');
 assert.equal(r.noiseLabel({active:false,volume:90}),'余音在消散');
 assert.equal(r.noiseLabel(null),'没有声音');
});
test('蹦迪用音箱代替文字，音量增强时增加声波，暂停不推进绘制状态',()=>{
 const r=renderer(),g=new Game(3,1);g.inspectors=[];g.setActivity('dance');g.step(1);
 const labels=[],boxes=[],arcs=[],transforms=[],scales=[];
 r.text=(c,text)=>labels.push(text);r.box=(c,...args)=>boxes.push(args);r.ellipse=()=>{};
 const c=new Proxy({createLinearGradient:()=>({addColorStop(){}}),arc:(...a)=>arcs.push({a,alpha:c.globalAlpha}),rotate:a=>transforms.push(a),scale:(...a)=>scales.push(a)}, {get:(o,k)=>o[k]??(()=>{})});
 r.noiseBadge(c,g,g.player);assert.deepEqual(labels,[]);assert.ok(boxes.some(b=>b[2]===36&&b[3]===48));assert.equal(arcs.length,1);assert.deepEqual(scales[0],[1.65,1.65]);
 g.step(3);arcs.length=0;r.noiseBadge(c,g,g.player);assert.equal(arcs.length,3);
 transforms.length=0;r.noiseBadge(c,g,g.player);const before=transforms[0],state=JSON.stringify(g);
 g.paused=true;g.step(2);transforms.length=0;r.noiseBadge(c,g,g.player);
 assert.equal(transforms[0],before);g.paused=false;assert.equal(JSON.stringify(g),state);
 arcs.length=0;r.noiseBadge(c,g,g.player);const alphas=arcs.map(a=>a.alpha);
 g.setActivity('work');g.player.stopping=.5;arcs.length=0;r.noiseBadge(c,g,g.player);
 assert.deepEqual(arcs.map(a=>a.alpha),alphas.map(a=>a*.5),'声波和箱体必须一起按收手进度消退');
});
test('闻声转头朝记录的声源，身体继续原方向，事件过后及离场不再转头',()=>{
 const r=renderer(),ins={name:'老板',x:65,y:350,angle:Math.PI/2,clock:3.3,lastHeard:{x:545,y:515,time:3},queue:[{kind:'move',x:65,y:585}]};
 const pose=r.pose(ins,'boss');assert.equal(pose.direction,'down');assert.equal(pose.lookDirection,'right');assert.equal(pose.moving,true);
 ins.leaving=true;assert.equal(r.pose(ins,'boss').lookDirection,null);ins.leaving=false;
 ins.clock=4.1;assert.equal(r.pose(ins,'boss').lookDirection,'right');
 ins.clock=4.3;assert.equal(r.pose(ins,'boss').lookDirection,null);
});
test('游戏用手柄按键图形，无键盘底框或扩散声波，段子不显示手柄',()=>{
 const r=renderer(),g=new Game(3,1),curves=[],buttons=[];g.inspectors=[];g.setActivity('game');g.step(12);
 r.box=()=>assert.fail('手柄不应有键盘底框');r.ellipse=(c,...args)=>buttons.push(args);r.line=()=>{};r.text=()=>assert.fail('手柄不应有文字框');
 const c=new Proxy({bezierCurveTo:(...a)=>curves.push(a),arc:()=>assert.fail('手柄不再绘制扩散声波')}, {get:(o,k)=>o[k]??(()=>{})});
 r.noiseBadge(c,g,g.player);assert.ok(curves.length>0);assert.equal(buttons.length,2);
 curves.length=0;buttons.length=0;g.player.activity='joke';r.noiseBadge(c,g,g.player);assert.deepEqual(curves,[]);assert.deepEqual(buttons,[]);
});
test('放大的闻声感叹号在靠边过道也完整显示',()=>{
 const r=renderer(),ins={x:655,y:115,clock:3,lastHeard:{x:545,y:280,seat:3,time:3,kind:'game'}},positions=[],scales=[];
 for(const name of ['chip','line','ellipse','text'])r[name]=()=>{};
 const c=new Proxy({translate:(...a)=>positions.push(a),scale:(...a)=>scales.push(a)}, {get:(o,k)=>o[k]??(()=>{})});
 r.soundSignals(c,{inspectors:[ins],player:{seat:3}},3);
 const [x,y]=positions[0],pop=scales[0][0];
 assert.ok(x-38*pop>=0&&x+38*pop<=720);assert.ok(y-38*pop>=0&&y+38*pop<=920);
});
test('笑声调查的工位标记和检查者文案不误显示手柄',()=>{
 const r=renderer(),ins={name:'老板',x:655,y:585,clock:3,lastHeard:{x:545,y:515,seat:7,time:3,kind:'joke'},queue:[{kind:'wait'}]},labels=[];
 r.chip=(c,text)=>labels.push(text);r.line=()=>{};r.ellipse=()=>{};r.text=()=>{};
 const c=new Proxy({}, {get:()=>()=>{}});r.soundSignals(c,{inspectors:[ins],player:{seat:7}},3);
 assert.ok(labels.some(t=>t.startsWith('哈 ')));assert.ok(labels.every(t=>!t.includes('🎮')));
});
test('待收奖金为钱袋和对齐整数，无底框，不足1金币不绘制',()=>{
 const r=renderer(),labels=[];r.box=()=>assert.fail('奖金不应有底框');r.text=()=>assert.fail('奖金不应有说明文字');
 const c=new Proxy({createLinearGradient:()=>({addColorStop(){}}),measureText:()=>({actualBoundingBoxAscent:22,actualBoundingBoxDescent:2}),fillText:(text,x,y)=>labels.push({text,x,y})}, {get:(o,k)=>o[k]??(()=>{})});
 const g={player:{activity:'game',x:545,y:515},comboTime:4,pendingBonus:.8};
 r.playerStakes(c,g);assert.deepEqual(labels,[]);
 g.pendingBonus=14.8;r.playerStakes(c,g);assert.deepEqual(labels,[{text:'14',x:25,y:13}]);
 labels.length=0;g.pendingBonus=0;r.playerStakes(c,g);assert.deepEqual(labels,[]);
});
test('安全到账金额只显示整数，不足1金币时不显示加零',()=>{
 const r=renderer(),labels=[];r.chip=(c,text)=>labels.push(text);
 const c={save(){},restore(){}};
 const g={player:{x:545,y:515},feedback:{kind:'bank',text:'安全到账',amount:1.8,left:1.4}};
 r.momentFeedback(c,g);assert.deepEqual(labels,['安全到账 +1']);
 labels.length=0;g.feedback.amount=.8;r.momentFeedback(c,g);assert.deepEqual(labels,['安全到账']);
});
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
 for(const [activity,gold,width]of [['joke',false,29],['dance',true,43]]){
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
 r.inspectionLabel({},ins,{moving:false});assert.match(labels[0],/听到手柄按键声/);
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
 assert.ok(labels.some(s=>s.includes('8号 · 正查')));assert.ok(labels.some(s=>s.includes('6号 · 待查看')));assert.ok(labels.some(s=>s.includes('🎮')&&s.includes('6号')));
 assert.ok(labels.some(s=>s.includes('8号')&&s.includes('稍后查6号')&&s.includes('1.2秒')));
});

test('打游戏等待输入时不绘制旧版按秒收入',()=>{const c=new Proxy({}, {get(){throw new Error('runner income is shown after clearing an obstacle');}});assert.doesNotThrow(()=>renderer().incomePop(c,{activity:'game',gold:false,seat:7,x:545,y:515},.5));});
