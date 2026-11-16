import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {Game} from '../src/engine.js';
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
function ui(game){
 const start=app.indexOf('function syncAudio(){'),end=app.indexOf('function formatTime',start);assert.ok(start>=0&&end>start);
 const updates=[],sounds=[],title={},context={g:game,screen:null,sound:true,audioGame:null,audioFeedback:null,audioCleared:0,document:{hidden:false,querySelectorAll:()=>[]},$:()=>title,audio:{ctx:{state:'running'},update:s=>updates.push(s),play:s=>sounds.push(s)}};
 vm.createContext(context);vm.runInContext(app.slice(start,end),context);return{context,updates,sounds,sync:()=>context.syncAudio()};
}
test('音乐随蹦迪与收手切换，打印机10秒声源与实际掩护一致',()=>{
 const g=new Game(5,100),u=ui(g);u.sync();assert.equal(u.updates.at(-1).mode,'office');
 g.setActivity('dance');u.sync();assert.equal(u.updates.at(-1).mode,'disco');g.setActivity('work');u.sync();assert.equal(u.updates.at(-1).mode,'disco');
 u.context.screen='levels';u.sync();assert.equal(u.updates.at(-1).mode,'office');u.context.screen=null;
 g.inspectors=[];g.step(1.2);u.sync();assert.equal(u.updates.at(-1).mode,'office');
 g.soundField.office.printer.activeUntil=g.soundField.clock+3;u.sync();assert.equal(u.updates.at(-1).printer,true);
 g.soundField.clock+=3;u.sync();assert.equal(u.updates.at(-1).printer,false);
});
test('主页音乐允许播放，暂停、后台、弹窗和声音开关立即统一控制',()=>{
 const g=new Game(2,100),u=ui(g),c=u.context;g.paused=true;c.screen='menu';u.sync();assert.equal(u.updates.at(-1).paused,false);
 c.screen='pause';u.sync();assert.equal(u.updates.at(-1).paused,true);
 g.paused=false;c.screen=null;c.document.hidden=true;u.sync();assert.equal(u.updates.at(-1).paused,true);
 c.document.hidden=false;g.modal={kind:'warning'};u.sync();assert.equal(u.updates.at(-1).paused,true);
 c.sound=false;u.sync();assert.equal(u.updates.at(-1).enabled,false);
});
test('结算与越障收益只播一次，暂停或重开不补播旧收益',()=>{
 const g=new Game(2,100),u=ui(g);u.sync();g.feedback={kind:'bank',amount:3};u.sync();u.sync();assert.equal(u.sounds.length,1);
 g.runner={cleared:1};u.sync();u.sync();assert.equal(u.sounds.length,2);
 u.context.screen='pause';g.paused=true;g.feedback={kind:'bank',amount:4};u.sync();assert.equal(u.sounds.length,2);
 u.context.screen=null;g.paused=false;u.sync();assert.equal(u.sounds.length,2);
 u.context.g=new Game(2,101);u.sync();assert.equal(u.sounds.length,2);
});

test('会议不误开机器声，混合关老板离场时打印机仍独立播放',()=>{
 const meeting=new Game(1,100),m=ui(meeting);meeting.inspectors[0].leaving=true;m.sync();assert.equal(m.updates.at(-1).printer,false);
 const mixed=new Game(4,100),u=ui(mixed);mixed.inspectors[0].leaving=true;
 mixed.soundField.office.printer.activeUntil=10;u.sync();assert.equal(u.updates.at(-1).printer,true);
 mixed.soundField.clock=10;u.sync();assert.equal(u.updates.at(-1).printer,false);
});
