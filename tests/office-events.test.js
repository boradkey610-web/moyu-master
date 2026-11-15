import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,levels,seats,advanceInspectors,forecastAll} from '../src/engine.js';

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
 field.emitter={...seats[7],seat:7,activity:'game',seated:true};
 advanceInspectors(g.inspectors,2);
 assert.equal(field.sources.length,0);
 field.emitter.activity='dance';advanceInspectors(g.inspectors,.2);
 assert.ok(field.sources[0].volume>4);
});

test('打印机停止后游戏噪声恢复，已有调查记忆不被抹去',()=>{
 const g=new Game(5,100),field=g.soundField,ins=g.inspectors[0];
 advanceInspectors(g.inspectors,field.office.nextAt+.1);
 const heard={...seats[7],seat:7,zone:3,time:ins.clock,soundId:99,kind:'game'};
 Object.assign(ins,{directed:true,evidenceKind:'sound',lastHeard:heard,queue:[{kind:'wait',left:5,phase:'checking',angle:0}]});
 field.emitter={...seats[7],seat:7,activity:'game',seated:true};
 advanceInspectors(g.inspectors,.2);
 assert.deepEqual(ins.lastHeard,heard);assert.equal(ins.queue[0].phase,'checking');
 assert.equal(field.sources.length,0);
 advanceInspectors(g.inspectors,10);
 assert.ok(field.sources.some(s=>s.kind==='game'&&s.active&&s.volume>0));
});

test('打印机掩护不影响面对玩家的视觉检查',()=>{
 const g=new Game(5,100);g.step(g.soundField.office.nextAt+.1);
 Object.assign(g.inspectors[0],{x:545,y:585,angle:-Math.PI/2,directed:true,zone:3,queue:[{kind:'wait',left:4,phase:'checking',angle:-Math.PI/2}]});
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
