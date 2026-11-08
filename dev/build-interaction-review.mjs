// Produces a temporary browser harness from the exact current app source.
// No review controls, fixtures, or save writes are added to the shipped game.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const root=new URL('../',import.meta.url),read=p=>readFile(new URL(p,root),'utf8');
await mkdir(new URL('outputs/',root),{recursive:true});
let html=await read('index.html');html=html.replace('href="style.css"','href="../style.css"').replace('src="src/app.js"','src="interaction-review.js"');
html=html.replace('</head>','<style>@media(max-width:600px){body>aside{display:none!important}}</style></head>');
await writeFile(new URL('outputs/interaction-review.html',root),html);
let app=await read('src/app.js');app=app.replace("from './engine.js'","from '../src/engine.js'").replace("from './render.js'","from '../src/render.js'");
app=app.replaceAll('localStorage.setItem(SAVE_KEY,JSON.stringify(save))','void 0');
app+=`\nconst review=document.createElement('aside');review.style.cssText='position:fixed;left:6px;top:6px;z-index:1000;width:155px;padding:8px;background:#fffdf5;border:1px solid #ddd;font:11px system-ui;';review.innerHTML='<b>开发场景检查</b><div id="review-buttons"></div><pre id="review-state" style="white-space:pre-wrap"></pre>';document.body.append(review);
function base(){g=new Game(2,123);g.npcs=[];g.inspectors=[];g.specialAt=999;g.dropAt=999;g.coins=127;g.time=g.config.time;g.elapsed=12;g.toastLeft=0;g.special={seat:6,left:16};lastModal=null;hide();}
const fixture={
 '换位遇老板':()=>{base();g.inspectors=[{...new Game(2,123).inspectors[0],x:500,y:585,queue:[{kind:'wait',left:30,angle:-Math.PI/2}]}];},
 '老板招呼':()=>encounter('老板'), '主管招呼':()=>encounter('主管'),
 '双倍空椅':()=>{base();g.paused=true;},
 '玩家金椅':()=>{base();Object.assign(g.player,{...seats[6],seat:6});g.paused=true;},
 '同事金椅':()=>{base();g.npcs=[{...seats[6],seat:6,route:[],target:null,next:999,color:0}];g.paused=true;},
 '到期还原':()=>{base();g.special.left=.02;g.step(.04);g.paused=true;},
 '下班结算':()=>{base();g.time=0;g.modal={kind:'timeout'};},
 '通关结算':()=>{base();g.coins=g.config.target;g.modal={kind:'win'};},
 '首次警告':()=>{base();g.player.activity='dance';g.catchPlayer('老板');},
 '扣款提醒':()=>{base();g.warned=true;g.player.activity='game';g.catchPlayer('主管');},
 '破产提醒':()=>{base();g.warned=true;g.coins=20;g.catchPlayer('老板');},
 '拾取练习':()=>{base();g.inspectors=new Game(2,123).inspectors;g.drops=[{seat:6,type:'mirror'}];},
 '暴露练习':()=>{base();g.player.activity='dance';g.comboTime=8;g.pendingBonus=17.4;g.exposure=.31;g.exposureLimit=.5;g.inspectors=[{...new Game(2,123).inspectors[0],x:545,y:585,angle:-Math.PI/2,directed:true,queue:[{kind:'wait',phase:'checking',left:2,angle:-Math.PI/2}]}];g.paused=true;},
 '检查预告':()=>{base();g.player.activity='game';g.comboTime=10;g.pendingBonus=12.6;g.inspectors=[{...new Game(2,123).inspectors[0],x:545,y:585,angle:-Math.PI/2,directed:true,queue:[{kind:'wait',phase:'warning',left:1.2,angle:-Math.PI/2}]}];g.paused=true;},
 '极限到账':()=>{base();g.feedback={kind:'close',text:'差一点！',amount:18.6,left:1.1,x:g.player.x,y:g.player.y};g.paused=true;},
 '暂停面板':()=>{base();pause();}, '求助面板':()=>{base();help();}, '选择关卡':()=>selectLevel(), '开始页面':()=>menu()
};
function encounter(who){base();g.mirror=8;g.inspectors=[{...new Game(2,123).inspectors[0],name:who,x:355,y:540,queue:[{kind:'wait',left:20,angle:-Math.PI/2}]}];Object.assign(g.player,{x:355,y:565,seat:null,target:6,route:[{x:355,y:585},{x:455,y:585},{x:455,y:515}]});g.step(.02);}
for(const [label,fn]of Object.entries(fixture)){const b=button(label,fn);b.style.cssText='display:block;margin:4px 0;width:100%;font:11px system-ui;';review.querySelector('#review-buttons').append(b);}
function reviewFrame(){review.querySelector('#review-state').textContent=JSON.stringify({modal:g.modal?.kind||null,time:g.time.toFixed(2),gold:g.special?.left.toFixed(2)||null,mirror:g.mirror.toFixed(2),player:[g.player.x.toFixed(1),g.player.y.toFixed(1)],target:g.player.target,seat:g.player.seat,greetings:g.stats.greetings,coins:g.coins,warning:g.warned},null,1);requestAnimationFrame(reviewFrame);}reviewFrame();
`;
await writeFile(new URL('outputs/interaction-review.js',root),app);
