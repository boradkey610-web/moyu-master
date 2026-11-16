import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,levels,advanceInspectors,forecastAll} from '../src/engine.js';

test('前四关单机制入门，后两关混合，主管和抢座逐步增加',()=>{
 assert.deepEqual(levels.map(l=>l.seatCount),[8,8,12,12,16,16]);
 assert.deepEqual(levels.map(l=>l.bosses),[1,1,1,1,2,2]);
 assert.deepEqual(levels.map(l=>l.events),[[],['meeting'],['printer'],[],['meeting','printer'],['meeting','printer']]);
 assert.deepEqual(levels.map(l=>l.goldSeats),[0,0,0,1,2,2]);
 assert.deepEqual(levels.map(l=>!!l.rivals),[false,false,false,false,false,true]);
 for(let i=0;i<6;i++){
  const g=new Game(i,1);assert.equal(g.inspectors.length,i<4?1:2);
  assert.equal(g.npcs.some(n=>Number.isFinite(n.next)),i===5);
  assert.equal(g.setActivity('dance'),true,'三种摸鱼活动不随机制上锁');
 }
});
test('前三关计时和直接刷新都不出金椅，第四关一把，混合关两把',()=>{
 for(let level=0;level<6;level++){
  const g=new Game(level,100);g.inspectors=[];g.npcs=[];
  g.spawnSpecial();assert.equal(g.specials.length,[0,0,0,1,2,2][level]);
  g.step(30);assert.equal(g.specials.length,[0,0,0,1,2,2][level]);
 }
});
test('自然会议机会可复现且既可发生也可错过，首次有保底',()=>{
 const outcomes=new Set();
 for(let seed=1;seed<=30;seed++){
  const g=new Game(1,seed),field=g.soundField,meeting=field.office.meeting;
  g.inspectors[0].queue=[{kind:'wait',left:100,angle:0}];
  advanceInspectors(g.inspectors,meeting.nextAt+.01);outcomes.add(meeting.count);
  advanceInspectors(g.inspectors,30.01-field.clock);
  assert.equal(meeting.count,1,'老板在场可用时，首次会议不应一直不出现');
 }
 assert.deepEqual([...outcomes].sort(),[0,1]);
});
test('自然会议不读取玩家行为，老板正常步行离返且每局最多两场',()=>{
 const a=new Game(1,21),b=new Game(1,21);
 for(const [g,activity] of [[a,'work'],[b,'dance']]){
  const field=g.soundField;field.emitter={...g.layout.seats[0],seat:0,activity,seated:false};
  const boss=g.inspectors[0];boss.queue=[{kind:'wait',left:100,angle:0}];
  advanceInspectors(g.inspectors,30.02);
 }
 assert.deepEqual(a.soundField.office.meeting,b.soundField.office.meeting);
 const g=new Game(1,2),boss=g.inspectors[0],meeting=g.soundField.office.meeting;boss.x=65;
 meeting.nextAt=.01;meeting.seed=0;const before={x:boss.x,y:boss.y};
 advanceInspectors(g.inspectors,.02);assert.equal(boss.leaving,true);
 assert.ok(Math.hypot(boss.x-before.x,boss.y-before.y)<=boss.speed*.02+1e-6);
 assert.equal(boss.queue.find(q=>q.hidden).left,12);
 advanceInspectors(g.inspectors,180);assert.equal(meeting.count,2);assert.equal(boss.leaving,false);assert.equal(boss.hidden,false);
});
test('混合关会议和打印同时生效，暂停与联合预测保留独立随机状态',()=>{
 const g=new Game(4,100),field=g.soundField,{meeting,printer}=field.office;
 meeting.nextAt=printer.nextAt=1;meeting.seed=0;
 field.emitter={...g.layout.seats[7],seat:7,activity:'game',seated:true};
 advanceInspectors(g.inspectors,1.02);assert.equal(meeting.count,1);assert.equal(printer.count,1);
 assert.equal(g.inspectors[0].leaving,true);assert.equal(g.inspectors[1].leaving,false);
 assert.ok(field.sources[0].volume>4);assert.equal(field.sources[0].radius,0);
 g.paused=true;const paused=JSON.stringify(field);g.step(5);assert.equal(JSON.stringify(field),paused);
 const before=JSON.stringify({inspectors:g.inspectors,field}),prediction=forecastAll(g.inspectors,10);
 assert.equal(JSON.stringify({inspectors:g.inspectors,field}),before);
 advanceInspectors(g.inspectors,10);
 for(const [index,ins] of g.inspectors.entries()){
  const end=prediction[index].at(-1);assert.ok(Math.hypot(ins.x-end.x,ins.y-end.y)<1e-6);assert.equal(ins.hidden,end.hidden);
 }
 assert.ok(field.sources[0].volume>40);assert.ok(field.sources[0].radius>0,'打印机结束后恢复已有音量');
});

test('道具会议覆盖首次自然机会时，老板必须走回办公室才会再接会议',()=>{
 const g=new Game(1,1),boss=g.inspectors[0],meeting=g.soundField.office.meeting;meeting.seed=0;
 advanceInspectors(g.inspectors,14);g.inventory.meeting=1;assert.equal(g.useMeeting(0),true);
 let sawReturn=false;
 for(let step=0;step<5000&&!meeting.count;step++){
  const returning=boss.queue.some(q=>q.meetingReturn),count=meeting.count;
  sawReturn||=returning;advanceInspectors(g.inspectors,.01);
  if(returning)assert.equal(meeting.count,count,'尚未返回办公室时不能再次自然离场');
 }
 assert.equal(sawReturn,true);assert.equal(meeting.count,1,'回到办公室后仍可正常收到自然会议');
});
