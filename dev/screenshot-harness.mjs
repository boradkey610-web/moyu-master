// 生成临时截图验证页：完全使用当前 src/app.js、src/render.js、src/engine.js。
// 仅替换模块路径为绝对路径并追加场景驱动代码，不改动游戏本体。
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const root=new URL('../',import.meta.url),read=p=>readFile(new URL(p,root),'utf8');
await mkdir(new URL('outputs/',root),{recursive:true});
let html=await read('index.html');
html=html.replace('href="style.css"','href="/style.css"').replace('src="src/app.js"','src="/outputs/shot-app.js"');
await writeFile(new URL('outputs/screenshot.html',root),html);
let app=await read('src/app.js');
app=app.replace("from './engine.js'","from '/src/engine.js'").replace("from './render.js'","from '/src/render.js'");
app=app.replace("new URL('../assets/manifest.json',import.meta.url)","new URL('/assets/manifest.json',import.meta.url)");
app=app.replaceAll('localStorage.setItem(SAVE_KEY,JSON.stringify(save))','void 0');
app+=`
// ---- 截图驱动（仅临时验证用） ----
const scene=new URLSearchParams(location.search).get('scene')||'menu';
const result={scene};
function basePlay(){start(2);g.toastLeft=0;g.specialAt=999;g.dropAt=999;g.elapsed=0;}
function freeze(){g.paused=true;}
if(scene==='menu'){/* 首页 */}
else if(scene==='work'){basePlay();freeze();}
else if(scene==='dance'){basePlay();g.setActivity('dance');g.step(.95);freeze();}
else if(scene==='game'){basePlay();g.setActivity('game');g.step(1.1);freeze();}
else if(scene==='range'){basePlay();g.setActivity('dance');g.step(.95);g.rangeHint={activity:'dance',left:2.2};freeze();}
else if(scene==='suspicion'){
 basePlay();g.setActivity('dance');g.step(.95);
 const boss=g.inspectors[0];
 Object.assign(boss,{x:355,y:350,angle:0,zone:null,directed:false,evidenceKind:'routine',suspicion:0,lastSeen:null,queue:[{kind:'move',x:455,y:350},{kind:'wait',left:6,angle:0}],checkedZones:{},avoidZones:[]});
 let ticks=0;while(!boss.directed&&ticks<2000){g.step(.01);ticks++;}
 result.simTicks=ticks;result.directed=boss.directed;result.bossPos=[Math.round(boss.x),Math.round(boss.y)];
 freeze();
}
else if(scene==='stopping'){basePlay();g.setActivity('game');g.step(1);g.setActivity('work');g.step(.02);freeze();}
else if(scene==='checking'){
 basePlay();g.setActivity('dance');g.step(1.2);
 const boss=g.inspectors[0];
 Object.assign(boss,{x:545,y:600,angle:-Math.PI/2,zone:3,directed:true,evidenceKind:'vision',suspicion:1,lastSeen:{x:545,y:515,seat:7,zone:3},threatensPlayer:true,queue:[{kind:'wait',phase:'checking',left:2.4,angle:-Math.PI/2}],checkedZones:{},avoidZones:[],hidden:false,leaving:false});
 g.exposure=.25;g.exposureLimit=.5;
 const sup=g.inspectors[1];if(sup)Object.assign(sup,{hidden:true});
 // 固定画面时间，让扫描环与扫描线停在可辨识的相位。
 g.paused=true;
}
else if(scene==='mirror'){basePlay();g.setActivity('game');g.step(1);g.inventory.mirror=1;
 // 首帧渲染后再触发动画并每帧钉住 t0：定格在老板路线绘制中段。
 let fired=false;const holdAt=1.25;
 (function pinShow(){
  if(g.show)g.show.t0=performance.now()-holdAt*1000;
  else if(!fired)fired=!!g.useMirror();
  requestAnimationFrame(pinShow);})();}
const wb=document.querySelector('#work'),cs=getComputedStyle(wb);
result.workButton={hiddenAttr:wb.hidden,display:cs.display,disabled:wb.disabled,activity:g.player.activity,stopping:g.player.stopping>0,title:wb.querySelector('strong').textContent};
const pre=document.createElement('pre');pre.id='verify-result';
pre.style.cssText='position:fixed;left:4px;bottom:2px;z-index:9999;margin:0;font:10px monospace;background:#fffdf5e0;padding:2px 5px;border-radius:4px;';
document.body.append(pre);
// 每帧刷新，保证读到 updateUI 之后的按钮状态。
(function verifyFrame(){
 const wb=document.querySelector('#work'),cs=getComputedStyle(wb);
 pre.textContent='VERIFY '+JSON.stringify({...result,workButton:{hiddenAttr:wb.hidden,display:cs.display,disabled:wb.disabled,activity:g.player.activity,stopping:g.player.stopping>0,title:wb.querySelector('strong').textContent}});
 requestAnimationFrame(verifyFrame);
})();
`;
await writeFile(new URL('outputs/shot-app.js',root),app);
console.log('harness ready: dev/outputs/screenshot.html');
