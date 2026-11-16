import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,levels,seats,advanceInspectors,forecastAll} from '../src/engine.js';
import {Renderer} from '../src/render.js';

test('打印机本体居中且纸签在其正下方，暂停冻结，结束回待机',()=>{
 const g=new Game(5,100),r=Object.create(Renderer.prototype),labels=[],states=[],boxes=[];
 const c=new Proxy({}, {get:(o,k)=>o[k]??(()=>{})});
 r.printer=(c,x,y,size,active,t)=>states.push({x,y,size,active,t});r.text=(c,text)=>labels.push(text);
 r.box=(c,x,y,w,h)=>boxes.push({x,y,w,h});r.line=()=>{};
 r.chip=()=>assert.fail('状态不再堆叠大文字条');
 const draw=()=>{labels.length=0;boxes.length=0;r.printerStatus(c,g);};
 draw();assert.ok(labels.includes('待机'));
 assert.ok(states.at(-1).size<=64,'打印机缩小，给工位留空间');
 assert.equal(states.at(-1).x,360,'打印机本体位于画面水平中心');
 assert.ok(boxes.filter(b=>b.w===176).every(b=>Math.abs(b.x+b.w/2-360)<=1),'纸签与打印机居中对齐');
 assert.ok(boxes.every(b=>b.y+b.h<=116),'状态纸签不压到第一排工位');
 assert.ok(boxes.filter(b=>b.w===176).every(b=>b.y>states.at(-1).y+35*states.at(-1).size/80),'纸签在打印机下方');
 advanceInspectors(g.inspectors,g.soundField.office.nextAt+.5);
 draw();assert.ok(labels.includes('打印中'));assert.ok(labels.includes('盖住按键声'));assert.ok(labels.includes('10s'));
 advanceInspectors(g.inspectors,4);draw();assert.ok(labels.includes('6s'));
 const before=states.at(-1);g.paused=true;g.step(3);draw();assert.deepEqual(states.at(-1),before);
 advanceInspectors(g.inspectors,6);draw();assert.ok(labels.includes('待机'));assert.equal(states.at(-1).active,false);
});

test('打印机每次开始和停止短暂提示，位置居中且随暂停冻结',()=>{
 const g=new Game(5,100),r=Object.create(Renderer.prototype),labels=[],icons=[],positions=[];
 const c=new Proxy({}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 c.translate=(x,y)=>positions.push([x,y]);r.box=r.ellipse=()=>{};
 r.text=(c,text)=>labels.push(text);r.printer=(...args)=>icons.push(args);
 const field=g.soundField,office=field.office;
 const draw=()=>{labels.length=0;icons.length=0;positions.length=0;r.officeEventCue(c,g);};
 draw();assert.equal(labels.length,0,'启动前不遮挡画面');
 advanceInspectors(g.inspectors,office.nextAt+.5);draw();
 assert.ok(labels.includes('打印机响了！'));assert.ok(labels.includes('按键声被盖住 · 视线检查照常'));
 assert.ok(positions[0][0]===360&&positions[0][1]>350&&positions[0][1]<460);
 assert.ok(icons[0][3]>=100,'图标比顶部常驻打印机更醒目');
 const state=JSON.stringify(field),still=JSON.stringify({labels,icons,positions});
 g.paused=true;g.step(5);draw();assert.equal(JSON.stringify(field),state);
 assert.equal(JSON.stringify({labels,icons,positions}),still,'暂停不推动提示消失');
 g.paused=false;advanceInspectors(g.inspectors,3);draw();assert.equal(labels.length,0,'运转期间不常驻遮挡');
 advanceInspectors(g.inspectors,7);draw();assert.ok(labels.includes('打印机停了'));
 assert.ok(labels.includes('按键声恢复正常传播'));
 advanceInspectors(g.inspectors,2.5);draw();assert.equal(labels.length,0);
 advanceInspectors(g.inspectors,office.nextAt-field.clock+.5);draw();assert.ok(labels.includes('打印机响了！'),'下一次运转也提示');
});

test('中央打印机提示不查询检查者，也不在其他主题出现',()=>{
 const r=Object.create(Renderer.prototype);
 for(const level of [0,4])r.officeEventCue({},new Game(level,100));
});

test('打印机不再重复底部首次通知，会议通知保留',()=>{
 for(const level of [4,5]){
  const g=new Game(level,100),messages=[];g.notify=text=>messages.push(text);
  g.step(g.soundField.office.nextAt+.1);
  if(level===5)assert.ok(messages.every(text=>!text.includes('打印机响了')));
  else assert.ok(messages.some(text=>text.includes('老板被叫去开会了')));
 }
});

test('六关开放，旧四关目标保持，新主题独立配置',()=>{
 assert.equal(levels.length,6);
 assert.deepEqual(levels.slice(0,4).map(l=>l.target),[90,170,400,440]);
 assert.equal(levels[4].event,'meeting');assert.equal(levels[5].event,'printer');
});

test('例会沿正常道路离场并返回，主管继续巡视',()=>{
 const g=new Game(4,100),boss=g.inspectors[0],supervisor=g.inspectors[1];
 const first=g.soundField.office.nextAt;
 advanceInspectors(g.inspectors,first-.02);
 assert.equal(boss.leaving,false);const before={x:boss.x,y:boss.y};
 advanceInspectors(g.inspectors,.04);
 assert.equal(boss.leaving,true);assert.equal(supervisor.leaving,false);
 assert.ok(Math.hypot(boss.x-before.x,boss.y-before.y)<=boss.speed*.04+1e-6);
 assert.equal(boss.queue.find(q=>q.hidden).left,12);
 advanceInspectors(g.inspectors,37);
 assert.equal(boss.hidden,false);assert.equal(boss.leaving,false);
 assert.equal(g.soundField.office.count,1);
});

test('打印机运转仅掩护游戏，蹦迪依然形成声源',()=>{
 const g=new Game(5,100),field=g.soundField;
 advanceInspectors(g.inspectors,field.office.nextAt+.1);
 field.emitter={...g.layout.seats[7],seat:7,activity:'game',seated:true};
 advanceInspectors(g.inspectors,2);
 assert.ok(Math.abs(field.sources[0]?.volume-8)<1e-6,'掩护期间按键声继续积累');
 assert.equal(field.sources[0].active,true);assert.equal(field.sources[0].radius,0);
 field.emitter.activity='dance';advanceInspectors(g.inspectors,2);
 assert.ok(field.sources[0].volume>40);assert.ok(field.sources[0].radius>0,'打印机盖不住蹦迪');
});

test('打印机停止后游戏噪声恢复，已有调查记忆不被抹去',()=>{
 const g=new Game(5,100),field=g.soundField,ins=g.inspectors[0];
 advanceInspectors(g.inspectors,field.office.nextAt+.1);
 const heard={...seats[7],seat:7,zone:3,time:ins.clock,soundId:99,kind:'game'};
 Object.assign(ins,{directed:true,evidenceKind:'sound',lastHeard:heard,queue:[{kind:'wait',left:5,phase:'checking',angle:0}]});
 field.emitter={...seats[7],seat:7,activity:'game',seated:true};
 advanceInspectors(g.inspectors,.2);
 assert.deepEqual(ins.lastHeard,heard);assert.equal(ins.queue[0].phase,'checking');
 assert.ok(field.sources[0]?.volume>0);assert.equal(field.sources[0].radius,0);
 advanceInspectors(g.inspectors,10);
 assert.ok(field.sources.some(s=>s.kind==='game'&&s.active&&s.volume>0));
});

test('打印机掩护不影响面对玩家的视觉检查',()=>{
 const g=new Game(5,100);g.step(g.soundField.office.nextAt+.1);
 Object.assign(g.inspectors[0],{x:g.player.x,y:g.player.y+70,angle:-Math.PI/2,directed:true,zone:3,queue:[{kind:'wait',left:4,phase:'checking',angle:-Math.PI/2}]});
 g.inspectors[1].queue=[{kind:'wait',left:20,hidden:true}];
 g.setActivity('game');g.step(.8);
 assert.equal(g.modal?.kind,'warning');assert.equal(g.catches,1);
});

test('暂停冻结两种环境事件',()=>{
 for(const level of [4,5]){
  const g=new Game(level,100);g.step(9);g.paused=true;
  const before=JSON.stringify({elapsed:g.elapsed,field:g.soundField,inspectors:g.inspectors});
  g.step(40);
  assert.equal(JSON.stringify({elapsed:g.elapsed,field:g.soundField,inspectors:g.inspectors}),before);
 }
});

test('反光镜跨事件开始和结束与实际一致，且不修改真实状态',()=>{
 for(const level of [4,5])for(const offset of [-2,8]){
  const g=new Game(level,100),field=g.soundField;
  field.emitter={...seats[7],seat:7,activity:'game',seated:true};
  advanceInspectors(g.inspectors,field.office.nextAt+offset);
  const before=JSON.stringify(g.inspectors),prediction=forecastAll(g.inspectors,10);
  assert.equal(JSON.stringify(g.inspectors),before);
  advanceInspectors(g.inspectors,10);
  g.inspectors.forEach((ins,k)=>{const end=prediction[k].at(-1);assert.ok(Math.hypot(ins.x-end.x,ins.y-end.y)<1e-6);assert.ok(Math.abs(ins.angle-end.angle)<1e-6);assert.equal(ins.hidden,end.hidden);});
 }
});

test('原开会道具仍能打断检查，会议时长保持十秒',()=>{
 const g=new Game(4,100);g.inventory.meeting=1;
 assert.equal(g.useMeeting(0),true);
 assert.equal(g.inventory.meeting,0);assert.equal(g.inspectors[0].queue.find(q=>q.hidden).left,10);
 assert.equal(g.soundField.office.count,0);
});

test('满音量游戏跨过打印机掩护，结束立即恢复原范围',()=>{
 const g=new Game(5,100),field=g.soundField;
 field.office.nextAt=30;field.emitter={...g.layout.seats[7],seat:7,activity:'game',seated:true};
 advanceInspectors([],25,field);
 assert.equal(field.sources[0].volume,100);assert.equal(field.sources[0].radius,170);
 field.office.nextAt=field.clock+.01;advanceInspectors([],.02,field);
 assert.equal(field.sources[0].volume,100);assert.equal(field.sources[0].radius,0);
 advanceInspectors([],9.98,field);
 assert.equal(field.sources[0]?.volume,100,'整段打印不消耗或清空音量');assert.equal(field.sources[0].radius,0);
 advanceInspectors([],.02,field);
 assert.equal(field.sources[0].volume,100);assert.equal(field.sources[0].radius,170,'停机后立即恢复满音量范围');
});

test('掩护期间开始打游戏也累积音量，停机后需实际听见才调查',()=>{
 const g=new Game(5,100),field=g.soundField,ins=g.inspectors[0],seat=g.layout.seats[7];
 field.office.nextAt=0;field.emitter={...seat,seat:7,activity:'game',seated:true};
 Object.assign(ins,{x:seat.x,y:g.layout.ys[2],angle:Math.PI/2,queue:[{kind:'wait',left:30,angle:Math.PI/2}]});
 advanceInspectors([ins],9.99,field);
 assert.ok(Math.abs(field.sources[0]?.volume-39.96)<1e-6);assert.equal(field.sources[0].radius,0);assert.equal(ins.lastHeard,null);
 advanceInspectors([ins],.04,field);
 assert.ok(field.sources[0].volume>40);assert.ok(field.sources[0].radius>=100);assert.equal(ins.lastHeard,null,'恢复传播不等于瞬间被听见');
 advanceInspectors([ins],.5,field);
 assert.equal(ins.lastHeard?.seat,7,'听够半秒后才记住声源工位');assert.equal(ins.evidenceKind,'sound');
});
