import {Game,activities,levels} from './engine.js';
import {Renderer} from './render.js';
import {drawRunner} from './runner.js';
import {GameAudio} from './audio.js';
import {CaughtScene,caughtAssets,caughtLines} from './caught-scene.js';
import {installUiArt,loadUiArt,uiAssets} from './ui-assets.js';
const $=s=>document.querySelector(s),canvas=$('#office'),renderer=new Renderer(canvas);
installUiArt();
let save={unlocked:1,best:{}},g=new Game(),screen='loading',lastModal=null,lastTime=0,visualTime=0,sound=true;
const audio=new GameAudio();
let audioGame=null,audioFeedback=null,audioCleared=0;
let caughtScene=null;
const jokePosts=[
 '老板说工作要有回响。\n我敲了两下空格。',
 '今天也很忙。\n忙着等下班。',
 '问：我的职业规划？\n答：工位离门再近一点。',
 '电脑可以休眠。\n我不可以，合理吗？',
 '老板：你在忙什么？\n我：忙着显得很忙。',
 '开会要带脑子。\n我带了本子，先记着。',
 '同事问我怎么这么准时。\n我说的是下班。',
 '下班不是结束。\n是我今天正式开机。',
 '我把需求写进了愿望清单。\n希望它自己实现。',
 '老板问我有没有大局观。\n我说已经看到周五了。',
 '我的工作状态很稳定。\n稳定地想下班。',
 '领导说要多一点弹性。\n我把椅背往后调了一格。',
 '今天的待办只有两项。\n上班，和下班。',
 '我不是在发呆。\n我在给脑子放缓存。',
 '会议结束得很突然。\n因为下一场会议开始了。',
 '工作让我学会了耐心。\n尤其是等待电梯的时候。',
 '同事问我怎么总喝水。\n我说给灵感留条水路。',
 '我最擅长的时间管理。\n是把午休管理得很准。',
 '周五的进度条很慢。\n但我一直没有退出。',
 '领导说这是个小改动。\n我先把周末收起来了。',
 '我的键盘有个梦想。\n每天六点准时关灯。',
 '我给文件取名“最终版”。\n它又多了三个弟弟。',
 '今日成就：保持在线。\n实际操作：移动鼠标。',
 '我在等一个重要通知。\n下班铃。'
];
const SAVE_KEY='moyu-master-save-v7-mechanic-progression';
function readStoredSave(key){try{const data=JSON.parse(localStorage.getItem(key));return data&&typeof data==='object'&&!Array.isArray(data)?data:null;}catch{return null;}}
const shortSave=readStoredSave(SAVE_KEY),savedProgress=shortSave||readStoredSave('moyu-master-save-v6-ripple-office')||readStoredSave('moyu-master-save-v5-runner')||readStoredSave('moyu-master-save-v4-sound')||readStoredSave('moyu-master-save-v3-patrol')||readStoredSave('moyu-master-save-v2-short')||readStoredSave('moyu-master-save-v1');
if(savedProgress){
 save.unlocked=Math.max(1,Math.min(levels.length,Math.floor(Number(savedProgress.unlocked)||1)));
 // Preserve unlocked days; records from older patrol rules are not comparable.
 if(shortSave&&shortSave.best&&typeof shortSave.best==='object'&&!Array.isArray(shortSave.best)){
  for(const [key,value]of Object.entries(shortSave.best))if(/^\d+-(clean|assisted)$/.test(key)&&Number.isFinite(value)&&value>=0)save.best[key]=value;
 }
}
if(!shortSave){try{localStorage.setItem(SAVE_KEY,JSON.stringify(save));}catch{}}
function beep(kind='tap'){audio.play(kind);}
function syncAudio(){
 const field=g.soundField,mode=!screen&&g.player.activity==='dance'?'disco':'office',paused=document.hidden||!!g.modal||(g.paused&&!['menu','levels'].includes(screen));
 const printer=!screen&&!g.modal&&!!field.office?.printer&&field.clock<field.office.printer.activeUntil-1e-8;
 audio.update({enabled:sound,paused,mode,printer});
 const cleared=g.runner?.cleared||0;
 if(audioGame===g&&!paused&&((g.feedback&&g.feedback!==audioFeedback)||cleared>audioCleared))audio.play('coin');
 audioGame=g;audioFeedback=g.feedback;audioCleared=cleared;
 const title=!sound?'音乐与音效已关闭':paused?'音乐与音效已暂停':audio.ctx?.state!=='running'?'点击后播放音乐与音效':mode==='disco'?'正在播放：摸鱼迪斯科':'正在播放：办公室轻爵士';
 for(const b of document.querySelectorAll('.sound-toggle'))b.title=title;
 $('#pause').title=title;
}
function formatTime(t){return `${String(Math.floor(Math.max(0,t)/60)).padStart(2,'0')}:${String(Math.floor(Math.max(0,t)%60)).padStart(2,'0')}`;}
function coinAmount(value){return Math.floor(value+1e-8);}
function button(text,fn,kind=''){const el=document.createElement('button');el.textContent=text;el.className=kind;el.addEventListener('click',()=>{beep();fn();syncAudio();});return el;}
const dialogIcons={
 clock:'<circle cx="24" cy="25" r="15"/><path d="M24 15v11l7 4M9 9l5-4m20 0 5 4M12 39l-3 4m27-4 3 4"/>',
 cup:'<path d="M15 7h18v12c0 10-18 10-18 0V7Zm0 3H8v7c0 5 5 8 9 8m16-15h7v7c0 5-5 8-9 8M24 28v9m-9 5h18m-14-5h10"/>',
 pause:'<rect x="13" y="10" width="7" height="28" rx="2"/><rect x="28" y="10" width="7" height="28" rx="2"/>',
 calendar:'<rect x="8" y="11" width="32" height="29" rx="5"/><path d="M16 7v9m16-9v9M8 21h32m-24 8h5m6 0h5m-16 6h5"/>',
 chat:'<path d="M10 8h28a5 5 0 0 1 5 5v19a5 5 0 0 1-5 5H22l-11 7v-7h-1a5 5 0 0 1-5-5V13a5 5 0 0 1 5-5Z"/><path d="M14 19h20m-20 8h13"/>',
 help:'<circle cx="24" cy="24" r="18"/><circle cx="24" cy="24" r="9"/><path d="m11 11 7 7m12 12 7 7m-26 0 7-7m12-12 7-7"/>',
 briefcase:'<rect x="6" y="15" width="36" height="26" rx="5"/><path d="M16 15V8h16v7M6 25q18 10 36 0m-18-1v9"/>'
};
function panelHead(icon,kicker,title){const art=uiAssets[icon];return `<div class="memo-heading"><span class="memo-label">${kicker}</span><svg class="memo-mark${art?' paper-icon':''}" ${art?`style='background-image:url("${art}")'`:''} viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${dialogIcons[icon]}</svg><h2 id="dialog-title">${title}</h2></div>`;}
function portrait(type){return `<canvas class="story-portrait" width="144" height="170" data-person="${type}" aria-label="${type==='player'?'玩家':type==='boss'?'老板':'主管'}半身像"></canvas>`;}
function activitySummary(){return `<div class="payroll-lines"><span class="payroll-section">摸鱼流水</span>${['joke','game','dance'].map(a=>`<div><span>${$('.activity.'+a+' svg').outerHTML}${activities[a].name}</span><b>${Math.floor(g.stats.activityTime[a])}<small> 秒</small></b></div>`).join('')}</div>`;}
function statement(){
 const won=g.modal.kind==='win',stamp=won?'准点溜走':g.modal.kind==='timeout'?'未达标':'摸鱼翻车';
 return `<div class="payroll-top"><span>摸鱼大师 · 薪酬结算处</span><span>员工联 / ${String(g.level+1).padStart(2,'0')}</span></div><div class="payroll-heading"><div><span class="payroll-day">${g.config.name}</span><h2 id="dialog-title">摸鱼工资条</h2></div><div class="payroll-portrait">${portrait('player')}</div><span class="payroll-stamp ${won?'approved':'rejected'}">${stamp}<small>摸鱼专用章</small></span></div><div class="shift-score"><span>本局到账</span><div class="payroll-total"><strong>${coinAmount(g.coins)}</strong><small>金币</small></div><footer><span>目标 ${g.config.target} 金币</span><span>${g.ads?'助力挑战':'独立挑战'}</span></footer></div>`;
}
function modalBackground(inert){for(const el of document.querySelectorAll('.hud,.scene,.controls'))el.inert=inert;}
function show(html,buttons=[]){clearCaughtScene();modalBackground(true);$('#overlay').dataset.page=['menu','levels','guide'].includes(screen)?screen:'';$('#overlay').classList.remove('hidden');$('#dialog').dataset.kind=screen==='result'?g.modal?.kind||'result':screen||'';$('#dialog').classList.toggle('office-result',['win','timeout','lose'].includes($('#dialog').dataset.kind));$('#dialog').classList.toggle('office-note',['pause','help','instructions','guide','tutorial','fine','meeting','reward'].includes($('#dialog').dataset.kind));$('#dialog').innerHTML=html;for(const b of buttons)$('#dialog').append(button(...b));g.paused=true;syncAudio();queueMicrotask(()=>{const dialog=$('#dialog');if(dialog.dataset.kind==='menu'){dialog.tabIndex=-1;dialog.focus({preventScroll:true});}else dialog.querySelector('button:not(:disabled)')?.focus({preventScroll:true});});renderer.ready.then(()=>{paintHomeArt();for(const portrait of document.querySelectorAll('#dialog canvas[data-person]')){const c=portrait.getContext('2d');c.clearRect(0,0,144,170);renderer.portrait(c,portrait.dataset.person,72,300,286);}});}
function hide(){clearCaughtScene();lastTime=0;modalBackground(false);document.querySelector('.game-shell').append($('#overlay'));$('#overlay').dataset.page='';screen=null;$('#overlay').classList.add('hidden');g.paused=false;lastModal=null;syncAudio();}
function start(level){g=new Game(level);syncSeatButtons();lastModal=null;hide();beep('start');}
function paintHomeArt(){
 const art=$('#home-art');
 if(art){
  const c=art.getContext('2d');c.clearRect(0,0,360,430);
  c.drawImage(renderer.bg,0,0,720,860,0,0,360,430);
  const wash=c.createLinearGradient(0,0,0,430);wash.addColorStop(0,'#b9e4dadd');wash.addColorStop(.35,'#fff2c800');wash.addColorStop(1,'#d6a96766');c.fillStyle=wash;c.fillRect(0,0,360,430);
  // Foreground confrontation: the phone stays hidden behind the desk.
  renderer.ellipse(c,68,270,31,9,'#54412b35');renderer.sprite(c,'idle',1,1,68,270,154);
  renderer.asset(c,'desk',110,205,253,160);
  renderer.sprite(c,'seated',0,1,251,363,157);renderer.chair(c,251,347,false,'front');
 }
 for(const tile of document.querySelectorAll('canvas[data-level-art]')){
  const c=tile.getContext('2d'),i=Number(tile.dataset.levelArt);c.clearRect(0,0,100,100);
  if(i===1){renderer.portrait(c,'boss',43,98,92);renderer.box(c,68,18,24,24,3,'#fff8d6','#b88a4e',1.5);renderer.text(c,'会',80,35,13,'#94764e');}
  else if(i===2){renderer.printer(c,50,59,74,false,0);}
  else if(i===3){renderer.asset(c,'chair-gold',15,12,72,82);}
  else if(i===4){renderer.portrait(c,'supervisor',37,98,86);renderer.asset(c,'chair-gold',62,10,27,32);renderer.printer(c,77,72,35,false,0);}
  else if(i===5){renderer.sprite(c,'seated',0,2,49,97,86);renderer.asset(c,'chair-gold',2,7,27,32);renderer.printer(c,80,28,30,false,0);}
  else{renderer.portrait(c,'boss',50,98,92);}
 }
}
function menu(){
 screen='menu';
 show(`<div class="home-title"><h2 id="dialog-title"><span class="home-accessible-title">摸鱼大师</span><img src="${uiAssets['home-logo']}" alt="" aria-hidden="true" draggable="false"></h2><p>上班可以，认真就输了！</p></div><div class="home-illustration"><img src="${uiAssets['home-scene']}" alt="黄衣玩家坐在工位偷偷看手机，西装老板从左侧走来" draggable="false"></div>`);
 const actions=document.createElement('div');actions.className='home-actions';
 const play=button('',selectLevel,'primary home-start');
 play.innerHTML='<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M9 5Q6 3 6 7v18q0 4 3 2l18-10q3-2 0-4Z"/></svg><span>开始摸鱼</span>';
 actions.append(play);
 const utilities=document.createElement('div');utilities.className='home-utilities';
 const guide=button('玩法说明',()=>instructions(menu));guide.innerHTML='<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M16 7Q9 2 3 6v21q6-4 13 0 7-4 13 0V6q-6-4-13 1Zm0 0v20"/></svg><span>玩法说明</span>';
 const audioButton=button(sound?'声音已开':'声音已关',()=>{sound=!sound;syncAudio();if(sound)audio.unlock();menu();},'sound-toggle');audioButton.setAttribute('aria-pressed',String(sound));
 audioButton.innerHTML=`<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h6l7-6v20l-7-6H5z"/>${sound?'<path d="M23 11q5 5 0 10m3-14q8 9 0 18"/>':'<path d="m23 12 6 8m0-8-6 8"/>'}</svg><span>${sound?'声音已开':'声音已关'}</span>`;
 utilities.append(guide,audioButton);actions.append(utilities);$('#dialog').append(actions);
}
function selectLevel(){
 screen='levels';
 show(`<div class="level-heading"><h2 id="dialog-title"><span aria-hidden="true">✦</span>选择关卡<span aria-hidden="true">✦</span></h2><img class="level-wall-clock" src="${uiAssets['wall-clock']}" alt="" aria-hidden="true"></div>`);
 const list=document.createElement('div');list.className='level-list adventure-map';list.dataset.count=levels.length;
 levels.forEach((l,i)=>{
  const clean=save.best[`${i}-clean`],assisted=save.best[`${i}-assisted`];
  const hasClean=Number.isFinite(clean)&&clean>=0,hasAssisted=Number.isFinite(assisted)&&assisted>=0;
  const completed=hasClean||hasAssisted;
  const record=hasClean?`最佳 ${formatTime(clean)}`:hasAssisted?`助力最佳 ${formatTime(assisted)}`:'';
  const b=button('',()=>start(i),'level-card');
  b.dataset.state=completed?'complete':'available';
  b.title=`${completed?'再玩一次':'开始挑战'}：${l.name} · 目标 ${l.target} 金币 · ${formatTime(l.time)}${record?' · '+record:''}`;
  b.innerHTML=`<span class="level-art"><img src="${uiAssets['level-'+(i+1)]}" alt="" aria-hidden="true" draggable="false"></span><span class="level-number">${String(i+1).padStart(2,'0')}</span><span class="level-copy"><strong>${l.name}</strong></span><span class="level-bottom"><span class="level-meta"><span><img src="${uiAssets.coin}" alt="金币">${l.target}</span><span><img src="${uiAssets.clock}" alt="时间">${formatTime(l.time)}</span></span><span class="level-state" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M9 5Q6 3 6 7v18q0 4 3 2l18-10q3-2 0-4Z"/></svg></span></span>${record?`<span class="level-record">${record}</span>`:''}`;
  list.append(b);
 });
 const back=button('',menu,'secondary home-back');
 back.innerHTML='<svg viewBox="0 0 32 32" aria-hidden="true"><path d="m3 15 13-11 13 11h-5v13h-6v-9h-4v9H8V15Z"/></svg><span>返回首页</span>';
 $('#dialog').append(list,back);
}
function instructions(back=()=>hide()){
 screen=back===menu?'guide':'instructions';
 const rules=[
  '三种玩法从第1关可用。打游戏点按跳障碍；看段子点击卡片看下一条。',
  '互动窗口在下方，办公室照常巡逻；段子安静，蹦迪更吵。空格或绿色按钮收手。',
  '检查前有预告。可降档继续摸鱼，藏不住就一键工作；收手需要时间。',
  '头顶的“收手领”是额外奖金，按一键工作或换座后到账，被抓就丢。连玩越久，奖金越多。',
  '喇叭显示声音能传多远；出现感叹号时，才是检查者真的听到了。',
  '点空椅子换座，移动不赚钱。第四关起金椅限时×2，道具坐下拾取。',
  '感叹号表示听到声音，连线和工位号标调查位置；换座后仍查旧声源。',
  '反光镜看全员10秒路线；第二关起可捡开会通知，支走一人。首次抓包警告，之后扣50。'
 ];
 show(panelHead('briefcase','入职手册','摸鱼要有分寸')+'<ul>'+rules.map(rule=>'<li>'+rule+'</li>').join('')+'</ul>',[['知道了，稳稳拿捏',back,'primary']]);
}
function pause(){
 if(g.modal||screen)return;
 screen='pause';
 const icon=paths=>`<svg viewBox="0 0 32 32" aria-hidden="true">${paths}</svg>`;
 show(`<div class="pause-heading"><h2 id="dialog-title">${icon('<rect x="6" y="4" width="7" height="24" rx="2"/><rect x="19" y="4" width="7" height="24" rx="2"/>')}<span>歇一会儿，再摸</span></h2><p>金币和倒计时已暂停</p></div><div class="pause-actions"></div><div class="pause-options"></div>`);
 // Escape the game's size containment so the pause card fits short viewports.
 document.body.append($('#overlay'));$('#overlay').dataset.page='pause';
 const resume=button('',hide,'primary');
 resume.innerHTML=icon('<path d="M9 4q-3-2-3 2v20q0 4 3 2l18-10q3-2 0-4Z"/>')+'<span>继续摸鱼</span>';
 const restart=button('',()=>start(g.level)),levelsButton=button('',()=>{document.querySelector('.game-shell').append($('#overlay'));selectLevel();});
 restart.innerHTML=icon('<path d="M26 12a11 11 0 1 0 0 10M26 4v8h-8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>')+'<span>重开本关</span>';
 levelsButton.innerHTML=icon('<rect x="3" y="3" width="11" height="11" rx="2"/><rect x="18" y="3" width="11" height="11" rx="2"/><rect x="3" y="18" width="11" height="11" rx="2"/><rect x="18" y="18" width="11" height="11" rx="2"/>')+'<span>返回关卡</span>';
 $('#dialog .pause-actions').append(resume);
 $('#dialog .pause-options').append(restart,levelsButton);
 const audioToggle=button('',()=>{
  sound=!sound;syncAudio();if(sound)audio.unlock();audioToggle.setAttribute('aria-checked',String(sound));
  audioToggle.querySelector('.pause-sound-state').textContent=sound?'已开':'已关';
 },'pause-audio sound-toggle');
 audioToggle.setAttribute('role','switch');audioToggle.setAttribute('aria-label','声音');audioToggle.setAttribute('aria-checked',String(sound));
 audioToggle.innerHTML=`<span class="pause-sound-label">${icon('<path d="M3 12h6l8-7v22l-8-7H3Z"/><path d="M22 10q6 6 0 12m4-16q10 10 0 20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>')}<span>声音</span></span><span class="pause-sound-control"><span class="pause-sound-state">${sound?'已开':'已关'}</span><i aria-hidden="true"></i></span>`;
 $('#dialog').append(audioToggle);
}
function help(){
 if(g.modal||screen)return;
 screen='help';
 show(`<div class="assist-heading"><span class="assist-eyebrow">办公室互助站 · 已暂停</span><h2 id="dialog-title">同事，搭把手</h2><span class="assist-stamp" aria-hidden="true">支援单</span></div>${g.level===0?'<p class="assist-intro">入职第一天先熟悉巡逻。<br>其余关卡可借用道具，每局 2 次。</p>':`<div class="assist-budget"><span>本局还可借用</span><b>${Math.max(0,2-g.ads)}<small> / 2 次</small></b></div>`}`);
 if(g.level===0){$('#dialog').append(button('第一天先熟悉玩法',()=>instructions(hide),'assist-tutorial'));}
 else for(const [type,title,description] of [
  ['mirror','反光镜','查看全员未来 10 秒路线'],
  ['meeting','开会通知','请一位检查者离场 10 秒'],
  ['extend','加时 15 秒','下班前，再争取一点时间']
 ]){
  const reason=g.ads>=2?'次数用完':type==='extend'?(g.extended?'已加过时':g.time>30?'最后 30 秒可借':''):g.inventory[type]?'已持有':'';
  const b=button('',()=>{hide();if(!g.reward(type))g.notify('当前无法领取这个奖励');},'assist-option');
  const icon=$(type==='extend'?'.hud-clock svg':'#'+type+' svg').outerHTML;
  b.innerHTML=`<span class="assist-icon" aria-hidden="true">${icon}</span><span class="assist-copy"><strong>${title}</strong><small>${description}</small></span><span class="assist-action">${reason||'借用'}</span>`;
  b.disabled=!!reason;$('#dialog').append(b);
 }
 const note=document.createElement('p');note.className='assist-note';note.innerHTML=g.level===0?'查看玩法不会消耗支援次数':'使用后记为助力成绩<br><span>试玩支援 · 无需看广告</span>';$('#dialog').append(note,button('返回办公室',hide,'primary assist-return'));
}
function meeting(){if(g.modal||screen)return;if(!g.inventory.meeting){g.notify('空工位拾取开会通知，或在求助中领取');return;}screen='meeting';show(panelHead('briefcase','会议邀请','请谁去开会？')+'<p>对方会步行离场，离场后 10 秒再返回。<br>先收手，再发通知更稳妥。</p>');for(const [i,ins]of g.inspectors.entries()){const b=button(`请${ins.name}去开会`,()=>{hide();g.useMeeting(i);});b.disabled=ins.hidden||ins.leaving;$('#dialog').append(b);}$('#dialog').append(button('先不发了',hide,'secondary'));}
function record(){const key=`${g.level}-${g.ads?'assisted':'clean'}`,used=g.config.time+(g.extended?15:0)-g.time;save.unlocked=Math.max(save.unlocked,Math.min(levels.length,g.level+2));save.best[key]=Math.min(save.best[key]??Infinity,used);try{localStorage.setItem(SAVE_KEY,JSON.stringify(save));}catch{}}
function rewardConfirm(type){screen='reward';show(panelHead('help','本地试玩','领取测试奖励')+'<p>这是本地试玩中的奖励模拟。<br>确认后消耗一次助力机会；取消不消耗。</p>',[['确认领取测试奖励',()=>{screen=null;g.paused=false;g.reward(type);lastModal=null;if(!g.modal)hide();},'primary'],['取消',()=>{screen=null;lastModal=null;},'secondary']]);}
function clearCaughtScene(){
 caughtScene=null;$('#dialog').classList.remove('caught-dialog','caught-phone','caught-static');
 const overlay=$('#overlay');if(overlay.classList.contains('caught-overlay')){overlay.classList.remove('caught-overlay');$('.game-shell').append(overlay);}
}
const formatCaughtLine=text=>text?text.replace(/([，？！])/g,'$1\n').trim():'…';
function updateCaughtScene(){
 if(!caughtScene)return;
 const state=caughtScene.timeline.state(),reply=$('#caught-actions'),wasHidden=reply.hidden;
 $('#caught-speaker').textContent=state.speaker;$('#caught-line').textContent=formatCaughtLine(state.text);
 reply.hidden=!state.ready;$('#caught-skip').hidden=state.ready;$('#caught-prompt').hidden=state.ready;
 if(state.ready&&wasHidden){$('#caught-line').setAttribute('aria-live','polite');reply.querySelector('button')?.focus({preventScroll:true});}
}
function showCaughtScene(m){
 if(!['warning','fine'].includes(m.kind)||(m.activity==='game'&&!m.runnerSnapshot)||caughtAssets(m.activity).some(name=>!renderer.art[name]))return false;
 const fine=m.kind==='fine',negative=fine&&g.coins<0;
 const note=(fine?`本次扣除 50 金币 · 当前余额 ${Math.floor(g.coins)} 金币`:'首次提醒不扣金币 · 再被抓到扣 50')+(m.lostBonus>0?`<br>未收手奖金 ${m.lostBonus} 金币已清空`:'');
 show(`<div class="caught-stage"><canvas id="caught-canvas" width="480" height="450" aria-label="被检查者抓包后的第一人称演出"></canvas><div class="caught-top"><span class="caught-status"><strong>被抓包了</strong><span>Ⅱ 对局已暂停</span></span><button id="caught-skip" class="secondary" type="button">跳过动画 <span aria-hidden="true">›</span></button></div></div><div class="caught-copy"><div class="caught-dialogue"><span class="caught-kicker">办公室小插曲</span><h2 id="dialog-title"><span id="caught-speaker">${m.who}</span></h2><div class="caught-lines"><div class="caught-line-size" aria-hidden="true"></div><p id="caught-line"></p></div></div><div class="caught-outcome">${note}</div><div class="caught-footer"><div id="caught-actions" hidden></div><p id="caught-prompt">演出结束后，点击回应继续</p></div></div>`);
 $('#dialog').classList.add('caught-dialog');$('#dialog').classList.toggle('caught-phone',m.activity==='joke');$('#overlay').classList.add('caught-overlay');document.body.append($('#overlay'));
 // Reserve the full dialogue and response layout before the first animated frame.
 const lines=caughtLines(m.who,m.activity);
 for(const text of ['糟了，被看到了……','糟了，被发现了。','完了……他们在看我。',...lines]){
  const slot=document.createElement('p');slot.textContent=formatCaughtLine(text);$('.caught-line-size').append(slot);
 }
 const actions=$('#caught-actions');
 actions.append(button(negative?'重新挑战':caughtLines(m.who,m.activity)[1],()=>{if(negative)start(g.level);else{g.dismiss();hide();}},'primary reply'));
 if(fine){
  if(g.level>0&&g.ads<2)actions.append(button('请同事帮忙解释 · 测试助力',()=>rewardConfirm('explain'),'outlined'));
  actions.append(button('返回关卡',selectLevel,'secondary'));
 }
 const sceneModal=m.activity==='joke'?{...m,jokeText:jokePosts[(g.level*6+g.joke.post)%jokePosts.length]}:m;
 caughtScene=new CaughtScene($('#caught-canvas'),renderer,sceneModal,{reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches});
 $('#caught-skip').onclick=()=>{caughtScene?.skip();updateCaughtScene();};caughtScene.draw();updateCaughtScene();
 return true;
}
function showCaughtNote(html,buttons){
 show(html,buttons);$('#dialog').classList.add('caught-static');
 $('#overlay').classList.add('caught-overlay');document.body.append($('#overlay'));
}
function processModal(){if(!g.modal||screen==='reward'||g.modal===lastModal)return;lastModal=g.modal;screen='result';const m=g.modal;if(['game','joke','dance'].includes(m.activity)&&typeof showCaughtScene==='function'&&showCaughtScene(m))return;
 if(m.kind==='tutorial'){
  show(`${panelHead('clock','入职练习 · 时间已暂停','先看预告，再收手')}<div class="speech">看到「即将检查」，就准备切回工作。</div><ul><li>检查者正常巡视，看见可疑行为才靠近；正式检查前有 2 秒预告。</li><li>点击「一键工作」收手；打游戏和蹦迪需要更久，别等检查开始才点。</li><li>检查时留意暴露条，涨满就会被抓。</li><li>连续摸鱼的额外奖励，要安全收手才能拿到。</li></ul>`,[['记住了，开始练习',()=>{g.dismiss();hide();},'primary']]);
 }else if(m.kind==='warning'){
  const who=m.who==='老板'?'boss':'supervisor';
  showCaughtNote(`<div class="story-top"><span>办公室小插曲</span><span class="story-paused"><svg viewBox="0 0 48 48" fill="currentColor" aria-hidden="true"><rect x="13" y="10" width="7" height="28" rx="2"/><rect x="28" y="10" width="7" height="28" rx="2"/></svg>时间已暂停</span></div><div class="story-scene">${portrait(who)}<div class="story-bubble"><h2 id="dialog-title">${m.who}</h2><div class="story-line">${m.lines[0]}</div></div></div><div class="story-note">首次提醒不扣金币 · 再被抓到扣 50${m.lostBonus>0?`<br>未收手奖金 ${m.lostBonus} 金币已清空`:''}</div><div class="reply-label">你的回应</div>`,[[m.lines[1].replaceAll('老板',m.who),()=>{g.dismiss();hide();},'primary reply']]);
 }else if(m.kind==='fine'){
  showCaughtNote(`${panelHead('chat','被抓包了',g.coins<0?'今天有点不顺':'老板的提醒升级了')}<div class="speech">“上班时间，收敛一点。”</div><div class="fine-amount">−50 <small>金币</small></div><p>当前余额 ${Math.floor(g.coins)} 金币${g.coins<0?'，请同事帮忙解释或重新挑战。':'，下次记得早点收手。'}${m.lostBonus>0?`<br>未收手奖金 ${m.lostBonus} 金币已清空`:''}</p>`,[[g.coins<0?'重新挑战':'知道了，继续工作',()=>{if(g.coins<0)start(g.level);else{g.dismiss();hide();}},'primary']]);
  if(g.level>0&&g.ads<2)$('#dialog').append(button('请同事帮忙解释 · 测试助力',()=>rewardConfirm('explain'),'outlined'));$('#dialog').append(button('返回关卡',selectLevel,'secondary'));
 }else if(m.kind==='win'){
  record();const used=g.config.time+(g.extended?15:0)-g.time;
  show(`${statement()}${activitySummary()}<div class="result-facts"><span>用时 <b>${formatTime(used)}</b></span><span>抓包 <b>${g.catches} 次</b></span><span>换位 <b>${g.stats.moves} 次</b></span></div><div class="best-record">${g.ads?'助力':'无助力'}最佳用时 <b>${formatTime(save.best[`${g.level}-${g.ads?'assisted':'clean'}`])}</b></div>`,[[g.level<levels.length-1?'下一天，继续 →':'再摸一局',()=>start(Math.min(levels.length-1,g.level+1)),'primary'],['选择关卡',selectLevel,'secondary']]);beep('win');
 }else{
  const timeout=m.kind==='timeout';
  show(`${statement()}${activitySummary()}<p>${m.reason||`还差 <b>${Math.ceil(g.config.target-g.coins-1e-8)} 金币</b>。下回趁老板转身，再摸一把。`}${g.catches?`<br>本局抓包 ${g.catches} 次，提前收手能保住奖金。`:""}</p>`,[['再摸一局',()=>start(g.level),'primary']]);
  if(timeout&&g.level>0&&g.ads<2&&!g.extended)$('#dialog').append(button('借我 15 秒 · 测试助力',()=>rewardConfirm('extend'),'outlined'));
  $('#dialog').append(button('选择关卡',selectLevel,'secondary'));
 }}
let seatButtons=[];
function syncSeatButtons(){
 seatButtons=g.layout.seats.map(s=>{const b=document.createElement('button');b.className='seat-hit';b.style.left=`${s.x/720*100}%`;b.style.top=`${s.y/920*100}%`;b.setAttribute('aria-label',`移动到${s.id+1}号工位`);b.onclick=()=>{if(!screen){if(g.moveTo(s.id))beep('tap');else g.notify('当前不能换到这个工位');}};return b;});
 $('#seat-buttons').replaceChildren(...seatButtons);
}
syncSeatButtons();
for(const b of document.querySelectorAll('[data-activity]'))b.onclick=()=>{if(!screen){g.setActivity(b.dataset.activity);beep('tap');}};
$('#joke-card').onclick=()=>{if(g.nextJoke())beep('tap');};
$('#runner-jump').onpointerdown=e=>{if(e.button===0&&e.isPrimary&&!screen&&g.jump())beep('jump');};
$('#runner-jump').onclick=e=>{if(e.detail===0&&!screen&&g.jump())beep('jump');};
$('#work').onclick=()=>{if(!screen){g.setActivity('work');beep('work');}};$('#mirror').onclick=()=>{if(!screen&&!g.useMirror())g.notify(g.inventory.mirror?'检查者暂时离场，回来后再用':'空工位拾取反光镜，或在求助中领取');};$('#meeting').onclick=meeting;$('#help').onclick=help;$('#pause').onclick=pause;
document.addEventListener('keydown',e=>{if(e.repeat)return;if(e.code==='Escape'){if(screen==='pause')hide();else if(!screen)pause();}if(screen)return;if(e.code==='ArrowUp'||e.code==='KeyJ'){e.preventDefault();if(g.jump())beep('jump');return;}const a={Digit1:'joke',Digit2:'game',Digit3:'dance',Space:'work'}[e.code];if(a){e.preventDefault();g.setActivity(a);}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&!screen&&!g.modal)pause();syncAudio();lastTime=0;});
for(const type of ['pointerdown','keydown'])document.addEventListener(type,()=>{syncAudio();audio.unlock();},{capture:true});
function updateUI(){
 const p=g.player,gold=g.specials.find(s=>s.seat===p.seat),boosted=!!gold&&p.seat!==null,multiplier=boosted?2:1,moving=!!p.route.length;
 const blocked=!!screen||!!g.modal,stopping=p.stopping>0,locked=p.lock>0;
 const checks=g.inspectors.filter(i=>!i.hidden).map(i=>{const q=i.queue[0];return `${i.name}${i.leaving?'正在去开会':i.queue.some(q=>q.meetingReturn)?'正在返回':q?.phase==='warning'?(i.threatensPlayer===false?'在查别处':`预告${Math.ceil(q.left)}秒`):q?.phase==='checking'?(i.threatensPlayer===false?'在查别处':`检查${Math.ceil(q.left)}秒`):i.directed?'调查旧位置':i.suspicion>0?'发现动静':'巡逻中'}`;}).join('；');
 const source=g.soundField.sources.find(s=>s.seat===p.seat),soundChecks=g.inspectors.flatMap(i=>{const cue=renderer.soundTarget(i);return cue?[`${i.name}${cue.fresh?'听到了'+(cue.point.kind==='dance'?'音乐':'手柄按键声'):'正在确认声音'}，${cue.pending?'稍后查看':'目标'}${cue.point.seat+1}号工位${cue.point.seat!==p.seat?'，旧声源':''}${cue.pending&&cue.current?`，当前仍查${cue.current.seat+1}号`:''}`]:[];}).join('；');
 const office=g.soundField.office,events=[];
 if(office?.printer)events.push(g.soundField.clock<office.printer.activeUntil-1e-8?`打印机正在运转，掩护剩余${Math.ceil(office.printer.activeUntil-g.soundField.clock-1e-8)}秒，按键声暂被盖住，视线检查照常`:'打印机待机，按键声正常传播');
 if(office?.meeting){
  const boss=g.inspectors[0],status=boss.hidden?'老板正在开会':boss.leaving?'老板正在步行去开会':boss.queue.some(q=>q.meetingReturn)?'老板正在步行返回':'会议机会等待中，老板当前在场';
  events.push(status+(g.inspectors.length>1?'，主管继续巡视':''));
 }
 const event=events.join('；');
 canvas.setAttribute('aria-label',`${g.layout.desks.length}组办公桌和${g.layout.seats.length}个工位`);
 canvas.setAttribute('aria-description',`${event?event+'；':''}${checks}；${renderer.noiseLabel(source)}${soundChecks?'；'+soundChecks:''}；连续摸鱼${Math.floor(g.comboTime)}秒，收手可领${coinAmount(g.pendingBonus)}金币；${g.exposure>0?'正在暴露':'安全'}${g.feedback?'；'+g.feedback.text:''}`);
 $('#money').innerHTML=`${coinAmount(g.coins)} <em>/ ${g.config.target}</em>`;
 $('#time').textContent=formatTime(g.time);$('#time').classList.toggle('low-time',g.time<30);
 $('#progress').style.width=`${Math.max(0,Math.min(100,g.coins/g.config.target*100))}%`;
 $('#level-label').textContent=`0${g.level+1} · ${g.config.name}`;
 $('#mirror-status').textContent=g.mirror>0?`全员路线 · ${Math.ceil(g.mirror)} 秒`:'';
 $('#toast').textContent=g.toast;$('#toast').hidden=p.activity==='dance';$('#toast').style.opacity=g.toastLeft>0?1:0;
 let status='认真工作中',detail='选一种摸鱼方式',tone='work';
 if(stopping){status='正在收手…';detail=`还需 ${p.stopping.toFixed(1)} 秒 · 仍会被发现`;tone='caution';}
 else if(moving){status=`前往 ${p.target+1} 号工位`;detail='途中暂无收益';tone='moving';}
 else if(p.seat===null){status='停在过道';detail='点一张空椅子入座';tone='caution';}
 else if(locked){status='检查还没结束';detail='先认真工作一会儿';tone='caution';}
 else if(p.activity==='game'){status='打游戏中';detail=`连过 ${g.runner.streak} 次 · 点按跳跃得金币`;tone='game';}
 else if(p.activity!=='work'){status=`${activities[p.activity].name}中`;detail=`+${activities[p.activity].rate*multiplier} 金币 / 秒${boosted?' · 双倍中':''}`;tone=p.activity;}
 else if(boosted){detail=`双倍剩 ${Math.ceil(gold.left)} 秒 · 选玩法开始`;tone='bonus';}
 $('.control-status').dataset.tone=tone;$('#state-label').textContent=status;$('#state-detail').textContent=detail;
 for(const b of document.querySelectorAll('[data-activity]')){
  const a=b.dataset.activity,active=p.activity===a&&!stopping;
  b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));
  b.disabled=blocked||p.seat===null||locked||stopping;
  const showRisk=p.activity!=='dance'&&a!=='dance',threats=showRisk?g.activityThreats(a):[],risk=threats.length>0;
  b.classList.toggle('is-risky',risk);b.setAttribute('aria-description',`${a==='joke'?'无声，会让先前的声音消散':a==='game'?'手柄按键声逐渐变大，附近的检查者可能听见':'音乐声增长更快，远处的检查者也可能听见'}${showRisk?'；'+(risk?'当前检查范围内：'+threats.join('、'):'当前检查范围外'):''}`);b.title=b.getAttribute('aria-description');

  b.querySelector('small').textContent=a==='game'?'点按闯关':`+${activities[a].rate*multiplier} / 秒`;
 }
 const jokeVisible=p.activity==='joke'&&p.seat!==null&&!moving;
 $('#joke-panel').hidden=!jokeVisible;$('.controls').classList.toggle('is-reading-joke',jokeVisible);
 if(jokeVisible){
  const j=g.joke,text=jokePosts[(g.level*6+j.post)%jokePosts.length];
  if($('#joke-text').textContent!==text)$('#joke-text').textContent=text;
  $('#joke-counter').textContent=`第 ${j.post+1} 条`;
  $('#joke-card').disabled=blocked||stopping||locked;
  $('#joke-card').setAttribute('aria-label',`${text.replace('\n',' ')} 点击看下一条。Enter也可换条，空格收手。`);
  $('#joke-hint').textContent=stopping?'正在收好段子…':'点一下，换个段子';
 }
 const runnerVisible=p.activity==='game'&&p.seat!==null&&!moving;
 $('#runner-panel').hidden=!runnerVisible;$('.controls').classList.toggle('is-playing-runner',runnerVisible);
 if(runnerVisible){
  $('#runner-jump').disabled=blocked||stopping||locked;
  const nextReward=(4+Math.min(4,g.runner.streak))*multiplier;
  $('#runner-score').textContent=stopping?'正在收手':g.runner.hitLeft>0?'失误了 · 再来一次':`${g.runner.streak} 连过 · 下个 +${nextReward}`;
  $('#runner-jump').setAttribute('aria-label',`${g.runner.height===0&&g.runner.obstacle.x<140&&g.runner.obstacle.x>110?'现在起跳。':''}跳跃躲障碍，连过${g.runner.streak}次，下个障碍奖励${nextReward}金币。空格或一键工作收手。`);
  drawRunner($('#runner-canvas'),g.runner,stopping,renderer);
 }
 const work=$('#work'),inAisle=p.seat===null&&!moving;work.disabled=blocked||stopping||locked||inAisle;
 work.classList.toggle('is-working',!inAisle&&!moving&&p.activity==='work'&&!stopping);
 work.classList.toggle('is-stopping',stopping);work.classList.toggle('has-context',stopping||moving||locked||inAisle);
 work.querySelector('strong').textContent=stopping?'正在收手…':moving?'停止移动':inAisle?'请先入座':'一键工作';
 work.querySelector('small').textContent=stopping?'等动作收好才安全':moving?'停在过道，重新选座':inAisle?'点击空椅子继续':locked?'等检查结束':'';
 for(const type of ['mirror','meeting']){
  const el=$('#'+type),count=g.inventory[type],running=type==='mirror'&&g.mirror>0,name=type==='mirror'?'反光镜':'开会';
  $('#'+type+'-count').textContent=running&&!count?`${Math.ceil(g.mirror)}s`:count;
  el.classList.toggle('is-empty',!count&&!running);el.classList.toggle('has-item',!!count);el.classList.toggle('is-running',running);
  const description=running?`全员路线生效中，还剩${Math.ceil(g.mirror)}秒，库存${count}个`:count?`库存${count}个，点击使用`:'0个，坐有道具的空工位拾取';
  el.setAttribute('aria-label',`${name}，${description}`);el.title=description;el.disabled=blocked||!count;
 }
 $('#help').disabled=blocked;$('#pause').disabled=blocked;
 seatButtons.forEach((b,i)=>{b.disabled=blocked||g.occupied(i)||locked||stopping;const drop=g.drops.find(d=>d.seat===i),gold=g.specials.find(s=>s.seat===i);b.setAttribute('aria-label',`移动到${i+1}号工位${gold?`，黄金工位 ×2，剩余${Math.ceil(gold.left)}秒`:''}${drop?`，可拾取${drop.type==='mirror'?'反光镜':'开会通知'}`:''}`);});
}
function frame(time){const dt=lastTime?Math.min(.1,(time-lastTime)/1000):0;lastTime=time;if(!g.paused&&!g.modal)visualTime+=dt;g.step(dt);processModal();renderer.draw(g,visualTime);if(caughtScene){caughtScene.advance(dt,document.hidden);updateCaughtScene();}updateUI();syncAudio();requestAnimationFrame(frame);}
async function boot(){
 g.paused=true;modalBackground(true);
 const loading=$('#boot-screen'),retry=$('#boot-retry'),shell=$('.game-shell');
 shell.setAttribute('aria-busy','true');loading.dataset.state='loading';retry.hidden=true;retry.disabled=true;
 $('#boot-title').textContent='办公室正在就位';$('#boot-note').textContent='桌椅、同事和摸鱼装备，马上到齐。';
 const [artErrors,uiErrors]=await Promise.all([renderer.ready,loadUiArt()]);
 const errors=[...artErrors,...uiErrors];
 if(errors.length){
  loading.dataset.state='error';shell.setAttribute('aria-busy','false');
  $('#boot-title').textContent='有些资料还没送到';$('#boot-note').textContent='部分画面没加载成功，重新加载后再进入。';
  retry.hidden=false;retry.disabled=false;return;
 }
 menu();renderer.draw(g,visualTime);updateUI();
 shell.classList.remove('is-loading');shell.setAttribute('aria-busy','false');loading.hidden=true;
 requestAnimationFrame(frame);
}
$('#boot-retry').onclick=()=>{renderer.ready=renderer.loadArt();return boot();};
boot();
