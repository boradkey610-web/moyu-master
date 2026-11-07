import {Game,seats,activities,levels} from './engine.js';
import {Renderer} from './render.js';
const $=s=>document.querySelector(s),canvas=$('#office'),renderer=new Renderer(canvas);
let save={unlocked:1,best:{}},g=new Game(),screen='menu',lastModal=null,lastTime=0,visualTime=0,sound=true,audio;
try{const data=JSON.parse(localStorage.getItem('moyu-master-save-v1'));if(data&&typeof data.best==='object')save={unlocked:Math.max(1,Math.min(4,Number(data.unlocked)||1)),best:data.best};}catch{}
function beep(freq=440){if(!sound)return;try{audio??=new (window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),v=audio.createGain();o.connect(v);v.connect(audio.destination);o.frequency.value=freq;v.gain.setValueAtTime(.025,audio.currentTime);v.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.09);o.start();o.stop(audio.currentTime+.1);}catch{}}
function formatTime(t){return `${String(Math.floor(Math.max(0,t)/60)).padStart(2,'0')}:${String(Math.floor(Math.max(0,t)%60)).padStart(2,'0')}`;}
function button(text,fn,kind=''){const el=document.createElement('button');el.textContent=text;el.className=kind;el.addEventListener('click',()=>{beep();fn();});return el;}
const dialogIcons={
 clock:'<circle cx="24" cy="25" r="15"/><path d="M24 15v11l7 4M9 9l5-4m20 0 5 4M12 39l-3 4m27-4 3 4"/>',
 cup:'<path d="M15 7h18v12c0 10-18 10-18 0V7Zm0 3H8v7c0 5 5 8 9 8m16-15h7v7c0 5-5 8-9 8M24 28v9m-9 5h18m-14-5h10"/>',
 pause:'<rect x="13" y="10" width="7" height="28" rx="2"/><rect x="28" y="10" width="7" height="28" rx="2"/>',
 calendar:'<rect x="8" y="11" width="32" height="29" rx="5"/><path d="M16 7v9m16-9v9M8 21h32m-24 8h5m6 0h5m-16 6h5"/>',
 chat:'<path d="M10 8h28a5 5 0 0 1 5 5v19a5 5 0 0 1-5 5H22l-11 7v-7h-1a5 5 0 0 1-5-5V13a5 5 0 0 1 5-5Z"/><path d="M14 19h20m-20 8h13"/>',
 help:'<circle cx="24" cy="24" r="18"/><circle cx="24" cy="24" r="9"/><path d="m11 11 7 7m12 12 7 7m-26 0 7-7m12-12 7-7"/>',
 briefcase:'<rect x="6" y="15" width="36" height="26" rx="5"/><path d="M16 15V8h16v7M6 25q18 10 36 0m-18-1v9"/>'
};
function panelHead(icon,kicker,title){return `<div class="panel-symbol ${icon}"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${dialogIcons[icon]}</svg></div><div class="panel-kicker">${kicker}</div><h2 id="dialog-title">${title}</h2>`;}
function portrait(type){return `<canvas class="story-portrait" width="144" height="170" data-person="${type}" aria-label="${type==='player'?'玩家':type==='boss'?'老板':'主管'}半身像"></canvas>`;}
function statement(){return `<div class="shift-score"><span>本局摸鱼收入</span><div><strong>${Math.floor(g.coins)}</strong><small> / ${g.config.target} 金币</small></div><div class="score-track"><i style="width:${Math.max(0,Math.min(100,g.coins/g.config.target*100))}%"></i></div><footer><span>${g.config.name}</span><span>${g.ads?'助力挑战':'独立挑战'}</span></footer></div>`;}
function modalBackground(inert){for(const el of document.querySelectorAll('.hud,.scene,.controls'))el.inert=inert;}
function show(html,buttons=[]){modalBackground(true);$('#overlay').classList.remove('hidden');$('#dialog').dataset.kind=screen==='result'?g.modal?.kind||'result':screen||'';$('#dialog').innerHTML=html;for(const b of buttons)$('#dialog').append(button(...b));g.paused=true;queueMicrotask(()=>$('#dialog button:not(:disabled)')?.focus({preventScroll:true}));renderer.ready.then(()=>{for(const portrait of document.querySelectorAll('#dialog canvas[data-person]')){const c=portrait.getContext('2d');c.clearRect(0,0,144,170);renderer.sprite(c,'idle',1,{player:0,boss:1,supervisor:2}[portrait.dataset.person],72,300,286);}});}
function hide(){modalBackground(false);screen=null;$('#overlay').classList.add('hidden');g.paused=false;lastModal=null;}
function start(level){g=new Game(level);lastModal=null;hide();beep(660);}
function menu(){screen='menu';show(`<div class="welcome-art">${portrait('player')}<span class="welcome-sticker">今日宜 · 准点下班</span></div><div class="panel-kicker">办公室生存小游戏</div><h2 id="dialog-title" class="hero-title">摸鱼<span>大师</span></h2><p>老板转身的空隙，都是你的好时光。<br>摸鱼赚金币，下班前完成今天的小目标。</p>`,[[save.unlocked===1?'开始第一天 →':'继续上班 →',()=>start(save.unlocked-1),'primary'],['选择关卡',selectLevel,'outlined'],['入职小贴士',()=>instructions(menu),'secondary']]);}
function selectLevel(){screen='levels';show(panelHead('calendar','一周挑战','本周摸鱼计划')+'<p>选一个工作日，开始今天的挑战。</p>');const grid=document.createElement('div');grid.className='level-grid';levels.forEach((l,i)=>{const b=button('',()=>start(i));b.innerHTML=`<b>${i<save.unlocked?`0${i+1}`:'🔒'}</b>${l.name}<br><span style="color:#a4906e">${l.target}金币 / ${l.time}秒</span>`;b.disabled=i>=save.unlocked;grid.append(b);});$('#dialog').append(grid,button('返回',menu,'secondary'));}
function instructions(back=()=>hide()){screen='instructions';show(panelHead('briefcase','入职手册','摸鱼要有分寸')+'<ul><li>看段子 +1、打游戏 +3、蹦迪 +6 金币/秒。</li><li>玩得越嗨，越容易被发现，收手也越慢。</li><li>点击空椅子换座；走路不赚钱，遇人要打招呼。</li><li>金色工位限时收益 ×2，坐下可捡工位道具。</li><li>反光镜看全员十秒路线；开会通知支走一人。</li><li>首次抓包只警告，之后扣50，负数就破产。</li><li>下班前达到目标，立即通关。蹦迪第三关解锁。</li></ul>',[['知道了，稳稳拿捏',back,'primary']]);}
function pause(){if(g.modal||screen)return;screen='pause';show(panelHead('pause','休息一下','喝口水，再继续')+'<p>时间停在这一刻。<br>准备好了，再回办公室。</p>',[['继续摸鱼',hide,'primary'],['重开本关',()=>start(g.level)],[sound?'音效：开':'音效：关',()=>{sound=!sound;screen=null;hide();pause();}],['返回关卡',selectLevel,'secondary']]);}
function help(){
 if(g.modal||screen)return;
 screen='help';
 show(`${panelHead('help','同事支援 · 时间已暂停','给自己留个后手')}<p>空工位也能捡到道具，坐下即可领取。</p><div class="assist-budget"><b>剩余 ${Math.max(0,2-g.ads)} 次助力</b><span>使用后记录为助力成绩</span></div>`);
 if(g.level===0){$('#dialog').append(button('第一天先熟悉玩法',()=>instructions(hide),'primary'));}
 else for(const [type,title,description] of [
  ['mirror','反光镜','显示所有检查者未来 10 秒路线'],
  ['meeting','开会通知','指定一位检查者离场 10 秒'],
  ['extend','多争取 15 秒','仅剩余时间不超过 30 秒时可领取']
 ]){
  const reason=g.ads>=2?'本局次数已用完':type==='extend'?(g.extended?'本局已延时':g.time>30?'最后 30 秒可领':''):g.inventory[type]?'已持有，先使用':'';
  const b=button('',()=>{hide();if(!g.reward(type))g.notify('当前无法领取这个奖励');},'assist-option');
  b.innerHTML=`<span class="assist-copy"><strong>${title}</strong><small>${description}</small></span><span class="assist-action">${reason||'领取 →'}</span>`;
  b.disabled=!!reason;$('#dialog').append(b);
 }
 const note=document.createElement('p');note.className='assist-note';note.textContent='试玩奖励模拟 · 不播放广告';$('#dialog').append(note,button('返回办公室',hide,'secondary'));
}
function meeting(){if(g.modal||screen)return;if(!g.inventory.meeting){g.notify('空工位拾取开会通知，或在求助中领取');return;}screen='meeting';show(panelHead('briefcase','会议邀请','请谁去开会？')+'<p>对方会走向最近的门，途中仍会检查。<br>先收手，再发通知更稳妥。</p>');for(const [i,ins]of g.inspectors.entries()){const b=button(`请${ins.name}去开会`,()=>{hide();g.useMeeting(i);});b.disabled=ins.hidden||ins.leaving;$('#dialog').append(b);}$('#dialog').append(button('先不发了',hide,'secondary'));}
function record(){const key=`${g.level}-${g.ads?'assisted':'clean'}`,used=g.config.time+(g.extended?15:0)-g.time;save.unlocked=Math.max(save.unlocked,Math.min(4,g.level+2));save.best[key]=Math.min(save.best[key]??Infinity,used);try{localStorage.setItem('moyu-master-save-v1',JSON.stringify(save));}catch{}}
function rewardConfirm(type){screen='reward';show(panelHead('help','本地试玩','领取测试奖励')+'<p>这是本地试玩中的奖励模拟。<br>确认后消耗一次助力机会；取消不消耗。</p>',[['确认领取测试奖励',()=>{screen=null;g.paused=false;g.reward(type);lastModal=null;if(!g.modal)hide();},'primary'],['取消',()=>{screen=null;lastModal=null;},'secondary']]);}
function processModal(){if(!g.modal||screen==='reward'||g.modal===lastModal)return;lastModal=g.modal;screen='result';const m=g.modal;
 if(m.kind==='greeting'||m.kind==='warning'){
  const greeting=m.kind==='greeting',who=m.who==='老板'?'boss':'supervisor';
  show(`<div class="story-top"><span>${greeting?'走廊偶遇':'办公室小插曲'}</span><span class="story-paused"><svg viewBox="0 0 48 48" fill="currentColor" aria-hidden="true"><rect x="13" y="10" width="7" height="28" rx="2"/><rect x="28" y="10" width="7" height="28" rx="2"/></svg>时间已暂停</span></div><div class="story-scene">${portrait(who)}<div class="story-bubble"><h2 id="dialog-title">${m.who}</h2><div class="story-line">${m.lines[0]}</div></div></div>${greeting?'':'<div class="story-note">首次提醒不扣金币 · 再被抓到扣 50</div>'}<div class="reply-label">你的回应</div>`,[[m.lines[1].replaceAll('老板',m.who),()=>{g.dismiss();hide();},'primary reply']]);
 }else if(m.kind==='fine'){
  show(`${panelHead('chat','被抓包了',g.coins<0?'今天有点不顺':'老板的提醒升级了')}<div class="speech">“上班时间，收敛一点。”</div><div class="fine-amount">−50 <small>金币</small></div><p>当前余额 ${Math.floor(g.coins)} 金币${g.coins<0?'，请同事帮忙解释或重新挑战。':'，下次记得早点收手。'}</p>`,[[g.coins<0?'重新挑战':'知道了，继续工作',()=>{if(g.coins<0)start(g.level);else{g.dismiss();hide();}},'primary']]);
  if(g.level>0&&g.ads<2)$('#dialog').append(button('请同事帮忙解释 · 测试助力',()=>rewardConfirm('explain'),'outlined'));$('#dialog').append(button('返回关卡',selectLevel,'secondary'));
 }else if(m.kind==='win'){
  record();const used=g.config.time+(g.extended?15:0)-g.time;
  show(`${panelHead('cup','今日业绩 · 已达成','准点下班！')}${statement()}<div class="result-facts"><span>用时 <b>${formatTime(used)}</b></span><span>抓包 <b>${g.catches} 次</b></span><span>换位 <b>${g.stats.moves} 次</b></span></div><div class="best-record">${g.ads?'助力':'无助力'}最佳用时 <b>${formatTime(save.best[`${g.level}-${g.ads?'assisted':'clean'}`])}</b></div>`,[[g.level<3?'下一天，继续 →':'再挑战一次',()=>start(Math.min(3,g.level+1)),'primary'],['选择关卡',selectLevel,'secondary']]);beep(880);
 }else{
  const timeout=m.kind==='timeout';
  show(`${panelHead(timeout?'clock':'briefcase',timeout?'今日业绩 · 尚未达成':'今日挑战结束',timeout?'下班铃响了':'明天再来一局')}${statement()}<p>${m.reason||`还差 <b>${Math.ceil(g.config.target-g.coins)} 金币</b>，下次抓准老板转身的空隙。`}</p>`,[['重新挑战',()=>start(g.level),'primary']]);
  if(timeout&&g.level>0&&g.ads<2&&!g.extended)$('#dialog').append(button('再争取 15 秒 · 测试助力',()=>rewardConfirm('extend'),'outlined'));
  $('#dialog').append(button('选择关卡',selectLevel,'secondary'));
 }}
const seatButtons=seats.map(s=>{const b=document.createElement('button');b.className='seat-hit';b.style.left=`${s.x/720*100}%`;b.style.top=`${s.y/920*100}%`;b.setAttribute('aria-label',`移动到${s.id+1}号工位`);b.onclick=()=>{if(!screen){if(g.moveTo(s.id))beep(520);else g.notify('当前不能换到这个工位');}};$('#seat-buttons').append(b);return b;});
for(const b of document.querySelectorAll('[data-activity]'))b.onclick=()=>{if(!screen){g.setActivity(b.dataset.activity);beep(b.dataset.activity==='dance'?700:500);}};
$('#work').onclick=()=>{if(!screen){g.setActivity('work');beep(320);}};$('#mirror').onclick=()=>{if(!screen&&!g.useMirror())g.notify(g.inventory.mirror?'检查者暂时离场，回来后再用':'空工位拾取反光镜，或在求助中领取');};$('#meeting').onclick=meeting;$('#help').onclick=help;$('#pause').onclick=pause;
document.addEventListener('keydown',e=>{if(e.repeat)return;if(e.code==='Escape'){if(screen==='pause')hide();else if(!screen)pause();}if(screen)return;const a={Digit1:'joke',Digit2:'game',Digit3:'dance',Space:'work'}[e.code];if(a){e.preventDefault();g.setActivity(a);}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&!screen&&!g.modal)pause();lastTime=0;});
function updateUI(){
 const p=g.player,boosted=g.special?.seat===p.seat&&p.seat!==null,multiplier=boosted?2:1,moving=!!p.route.length;
 const blocked=!!screen||!!g.modal,stopping=p.stopping>0,locked=p.lock>0;
 $('#money').innerHTML=`${Math.floor(g.coins+1e-8)} <em>/ ${g.config.target}</em>`;
 $('#time').textContent=formatTime(g.time);$('#time').classList.toggle('low-time',g.time<30);
 $('#progress').style.width=`${Math.max(0,Math.min(100,g.coins/g.config.target*100))}%`;
 $('#level-label').textContent=`0${g.level+1} · ${g.config.name}`;
 $('#mirror-status').textContent=g.mirror>0?`全员路线 · ${Math.ceil(g.mirror)} 秒`:'';
 $('#toast').textContent=g.toast;$('#toast').style.opacity=g.toastLeft>0?1:0;
 let status='认真工作中',detail='选一种摸鱼方式',tone='work';
 if(stopping){status='正在收手…';detail=`还需 ${p.stopping.toFixed(1)} 秒 · 仍会被发现`;tone='caution';}
 else if(g.modal?.kind==='greeting'){status='打招呼中';detail='时间已暂停';}
 else if(moving){status=`前往 ${p.target+1} 号工位`;detail='途中暂无收益';tone='moving';}
 else if(p.seat===null){status='停在过道';detail='点一张空椅子入座';tone='caution';}
 else if(locked){status='检查还没结束';detail='先认真工作一会儿';tone='caution';}
 else if(p.activity!=='work'){status=`${activities[p.activity].name}中`;detail=`+${activities[p.activity].rate*multiplier} 金币 / 秒${boosted?' · 双倍中':''}`;tone=p.activity;}
 else if(boosted){detail=`双倍剩 ${Math.ceil(g.special.left)} 秒 · 选玩法开始`;tone='bonus';}
 $('.control-status').dataset.tone=tone;$('#state-label').textContent=status;$('#state-detail').textContent=detail;
 for(const b of document.querySelectorAll('[data-activity]')){
  const a=b.dataset.activity,unavailable=a==='dance'&&g.level<2,active=p.activity===a&&!stopping;
  b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));
  b.disabled=blocked||p.seat===null||locked||stopping||unavailable;
  b.querySelector('small').textContent=unavailable?'第 3 关解锁':`+${activities[a].rate*multiplier} / 秒`;
 }
 const work=$('#work'),inAisle=p.seat===null&&!moving;work.disabled=blocked||stopping||locked||inAisle;
 work.classList.toggle('is-working',!inAisle&&!moving&&p.activity==='work'&&!stopping);
 work.classList.toggle('is-stopping',stopping);work.classList.toggle('has-context',stopping||moving||locked||inAisle);
 work.querySelector('strong').textContent=stopping?'正在收手…':moving?'停止移动':inAisle?'请先入座':'一键工作';
 work.querySelector('small').textContent=stopping?'等动作收好才安全':moving?'停在过道，重新选座':inAisle?'点击空椅子继续':locked?'等检查结束':'';
 for(const type of ['mirror','meeting']){
  const el=$('#'+type),count=g.inventory[type];
  $('#'+type+'-count').textContent=count||'无';
  el.classList.toggle('is-empty',!count);el.classList.toggle('has-item',!!count);
  el.disabled=blocked;
 }
 $('#help').disabled=blocked;$('#pause').disabled=blocked;
 seatButtons.forEach((b,i)=>{b.disabled=blocked||g.occupied(i)||locked||stopping;});
}
function frame(time){const dt=lastTime?Math.min(.1,(time-lastTime)/1000):0;lastTime=time;if(!g.paused&&!g.modal)visualTime+=dt;g.step(dt);processModal();renderer.draw(g,visualTime);updateUI();requestAnimationFrame(frame);}
renderer.ready.then(errors=>{if(errors.length)g.notify('部分画面素材未加载，可刷新重试');});
menu();requestAnimationFrame(frame);
