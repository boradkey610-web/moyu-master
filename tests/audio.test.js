import test from 'node:test';
import assert from 'node:assert/strict';
import {GameAudio,composeMusic,composePrinter,composeEffect} from '../src/audio.js';

function metrics(data){let peak=0,sum=0,sq=0;for(const v of data){assert.ok(Number.isFinite(v));peak=Math.max(peak,Math.abs(v));sum+=v;sq+=v*v;}return{peak,rms:Math.sqrt(sq/data.length),dc:sum/data.length};}
function device(){
 const nodes=[],context={state:'suspended',currentTime:0,destination:{},nodes,
  resume(){this.state='running';return Promise.resolve();},suspend(){this.state='suspended';return Promise.resolve();},
  createBuffer(channels,length,sampleRate){const samples=new Float32Array(length);return{length,sampleRate,duration:length/sampleRate,getChannelData:()=>samples,copyToChannel:data=>samples.set(data)};},
  createGain(){const gain={value:1,cancelScheduledValues(){},setValueAtTime(v){this.value=v;},setTargetAtTime(v){this.value=v;}};return{gain,connect(){}};},
  createBufferSource(){const node={connect(){},start(){this.started=true;},stop(){this.stopped=true;this.onended?.();}};nodes.push(node);return node;}
 };return context;
}

test('两首原创循环有完整节拍、动态和余量，没有直流或异常跳变',()=>{
 const tracks=['office','disco'].map(mode=>composeMusic(mode));
 for(const data of tracks){const m=metrics(data);assert.ok(data.length>16000*12);assert.ok(m.rms>.025&&m.rms<.35,JSON.stringify(m));assert.ok(m.peak>.2&&m.peak<.95);assert.ok(Math.abs(m.dc)<.01);assert.ok(Math.abs(data[0]-data.at(-1))<.12,'循环边界不突跳');}
 assert.notEqual(tracks[0].length,tracks[1].length,'两种节奏不同');
 assert.deepEqual(composeMusic('office'),tracks[0],'旋律固定，不依赖运行随机状态');
});

test('机器循环与各操作音可辨识且无削波',()=>{
 const printer=composePrinter();assert.ok(metrics(printer).rms>.01);assert.ok(Math.abs(printer[0]-printer.at(-1))<.1);
 const effects=['tap','jump','coin','work','start','win'].map(composeEffect);
 for(const e of effects){const m=metrics(e);assert.ok(m.peak>.03&&m.peak<.95);assert.ok(Math.abs(e[0])<.01&&Math.abs(e.at(-1))<.01);}
 assert.notDeepEqual(effects[0],effects[1]);assert.notDeepEqual(effects[1],effects[2]);
});

test('首次手势前不创建音频，之后切换只混音、不叠加循环',()=>{
 const ctx=device();let created=0;const audio=new GameAudio(()=>{created++;return ctx;});
 audio.update({enabled:true,paused:false,mode:'office',printer:false});assert.equal(created,0);
 audio.unlock();assert.equal(created,1);assert.equal(ctx.state,'running');assert.equal(ctx.nodes.filter(n=>n.loop).length,3);
 audio.update({enabled:true,paused:false,mode:'disco',printer:true});
 for(let n=0;n<100;n++)audio.update({enabled:true,paused:false,mode:'disco',printer:true});
 assert.equal(created,1);assert.equal(ctx.nodes.length,3);assert.equal(audio.mode,'disco');assert.ok(audio.disco.gain.value>0);assert.equal(audio.office.gain.value,0);assert.ok(audio.machine.gain.value>0);
 audio.update({enabled:true,paused:false,mode:'office',printer:false});assert.equal(audio.disco.gain.value,0);assert.equal(audio.machine.gain.value,0);
});

test('暂停、静音及后台状态停止全部声音，恢复不补播旧短音',()=>{
 const ctx=device(),audio=new GameAudio(()=>ctx);audio.unlock();audio.play('jump');const old=ctx.nodes.at(-1);
 audio.update({enabled:true,paused:true,mode:'office',printer:true});assert.equal(ctx.state,'suspended');assert.equal(old.stopped,true);
 const count=ctx.nodes.length;audio.play('coin');assert.equal(ctx.nodes.length,count);
 audio.update({enabled:true,paused:false,mode:'office',printer:false});assert.equal(ctx.state,'running');assert.equal(old.stopped,true);
 audio.update({enabled:false,paused:false,mode:'disco',printer:true});assert.equal(ctx.state,'suspended');audio.unlock();assert.equal(ctx.state,'suspended','手势不能越过静音开关');
 audio.update({enabled:true,paused:false,mode:'disco',printer:true});assert.equal(ctx.state,'running');assert.equal(ctx.nodes.filter(n=>n.loop).length,3);
});

test('音频设备不可用或恢复失败时不影响游戏调用',async()=>{
 const unavailable=new GameAudio(()=>{throw new Error('audio unavailable');});assert.doesNotThrow(()=>{unavailable.unlock();unavailable.play('tap');unavailable.update({enabled:true,paused:false,mode:'office',printer:false});});
 const ctx=device();ctx.resume=()=>Promise.reject(new Error('blocked'));const audio=new GameAudio(()=>ctx);audio.unlock();await Promise.resolve();audio.update({enabled:true,paused:true,mode:'office',printer:false});
});

test('首次手势发生在暂停状态时也不会启动背景音乐',()=>{
 const ctx=device();ctx.state='running';const audio=new GameAudio(()=>ctx);
 audio.update({enabled:true,paused:true,mode:'office',printer:false});audio.unlock();
 assert.equal(ctx.state,'suspended');
});
