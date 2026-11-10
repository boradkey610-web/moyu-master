import {Game,seats,activities,levels} from '/src/engine.js';
import {Renderer} from '/src/render.js';
const $=s=>document.querySelector(s),canvas=$('#office'),renderer=new Renderer(canvas);
let save={unlocked:1,best:{}},g=new Game(),screen='menu',lastModal=null,lastTime=0,visualTime=0,sound=true,audio;
const SAVE_KEY='moyu-master-save-v4-sound';
function readStoredSave(key){try{const data=JSON.parse(localStorage.getItem(key));return data&&typeof data==='object'&&!Array.isArray(data)?data:null;}catch{return null;}}
const shortSave=readStoredSave(SAVE_KEY),savedProgress=shortSave||readStoredSave('moyu-master-save-v3-patrol')||readStoredSave('moyu-master-save-v2-short')||readStoredSave('moyu-master-save-v1');
if(savedProgress){
 save.unlocked=Math.max(1,Math.min(levels.length,Math.floor(Number(savedProgress.unlocked)||1)));
 // Preserve unlocked days; records from older patrol rules are not comparable.
 if(shortSave&&shortSave.best&&typeof shortSave.best==='object'&&!Array.isArray(shortSave.best)){
  for(const [key,value]of Object.entries(shortSave.best))if(/^\d+-(clean|assisted)$/.test(key)&&Number.isFinite(value)&&value>=0)save.best[key]=value;
 }
}
if(!shortSave){try{void 0;}catch{}}
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
function activitySummary(){return `<div class="result-facts activity-summary">${['joke','game','dance'].map(a=>`<span>${activities[a].name}<b>${Math.floor(g.stats.activityTime[a])} 秒</b></span>`).join('')}</div>`;}
function statement(){return `<div class="shift-score"><span>本局摸鱼收入</span><div><strong>${Math.floor(g.coins)}</strong><small> / ${g.config.target} 金币</small></div><div class="score-track"><i style="width:${Math.max(0,Math.min(100,g.coins/g.config.target*100))}%"></i></div><footer><span>${g.config.name}</span><span>${g.ads?'助力挑战':'独立挑战'}</span></footer></div>`;}
function modalBackground(inert){for(const el of document.querySelectorAll('.hud,.scene,.controls'))el.inert=inert;}
function show(html,buttons=[]){modalBackground(true);$('#overlay').dataset.page=['menu','levels','guide'].includes(screen)?screen:'';$('#overlay').classList.remove('hidden');$('#dialog').dataset.kind=screen==='result'?g.modal?.kind||'result':screen||'';$('#dialog').innerHTML=html;for(const b of buttons)$('#dialog').append(button(...b));g.paused=true;queueMicrotask(()=>$('#dialog button:not(:disabled)')?.focus({preventScroll:true}));renderer.ready.then(()=>{paintHomeArt();for(const portrait of document.querySelectorAll('#dialog canvas[data-person]')){const c=portrait.getContext('2d');c.clearRect(0,0,144,170);renderer.sprite(c,'idle',1,{player:0,boss:1,supervisor:2}[portrait.dataset.person],72,300,286);}});}
function hide(){modalBackground(false);$('#overlay').dataset.page='';screen=null;$('#overlay').classList.add('hidden');g.paused=false;lastModal=null;}
function start(level){g=new Game(level);lastModal=null;hide();beep(660);}
function paintHomeArt(){
 const art=$('#home-art');
 if(art){
  const c=art.getContext('2d');c.clearRect(0,0,360,430);
  c.drawImage(renderer.bg,0,0,720,860,0,0,360,430);
  const wash=c.createLinearGradient(0,0,0,430);wash.addColorStop(0,'#b9e4dadd');wash.addColorStop(.35,'#fff2c800');wash.addColorStop(1,'#d6a96766');c.fillStyle=wash;c.fillRect(0,0,360,430);
  // Foreground confrontation: the phone stays hidden behind the desk.
  renderer.ellipse(c,68,270,31,9,'#54412b35');renderer.sprite(c,'idle',1,1,68,270,154);
  c.save();c.translate(110,205);c.scale(1.33,1.33);renderer.desk(c,0,0,0,0);c.restore();
  renderer.sprite(c,'seated',0,1,251,363,157);renderer.chair(c,251,347,false,'front');
 }
 for(const tile of document.querySelectorAll('canvas[data-level-art]')){
  const c=tile.getContext('2d'),i=Number(tile.dataset.levelArt);c.clearRect(0,0,100,100);
  if(i===1){renderer.asset(c,'chair-gold',15,12,72,82);}
  else if(i===3){renderer.sprite(c,'seated',0,2,50,97,91);}
  else{renderer.sprite(c,'idle',1,i===2?2:1,50,98,92);}
 }
}
function menu(){
 screen='menu';
 show(`<div class="home-brand"><span class="office-tag">● 老板正在巡逻</span><span>MOYU MASTER</span></div><div class="home-title"><span class="home-stamp">打工人的快乐，自己赚！</span><h2 id="dialog-title">摸鱼<span>大师</span></h2><p>上班可以，认真就输了！</p></div><div class="home-illustration"><canvas id="home-art" width="360" height="430" aria-label="玩家在工位偷偷玩手机，老板正在巡逻"></canvas><span class="home-bubble boss-bubble">让我看看谁在摸鱼！</span><span class="home-bubble player-bubble">老板好！我在查资料…</span><span class="home-loot loot-one">¥ +6</span><span class="home-loot loot-two">¥ +3</span><span class="home-danger">!</span><span class="home-scene-caption"><b>躲开检查 · 偷偷赚钱</b><span>今日目标：快乐下班</span></span></div>`);
 const actions=document.createElement('div');actions.className='home-actions';
 actions.append(button('▶  开始摸鱼',selectLevel,'primary home-start'));
 const utilities=document.createElement('div');utilities.className='home-utilities';
 const guide=button('玩法说明',()=>instructions(menu));guide.innerHTML=`<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">${dialogIcons.briefcase}</svg><span>玩法说明</span>`;
 const audioButton=button(sound?'音效已开':'音效已关',()=>{sound=!sound;menu();});audioButton.setAttribute('aria-pressed',String(sound));
 audioButton.innerHTML=`<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h6l7-6v20l-7-6H5z"/>${sound?'<path d="M23 11q5 5 0 10m3-14q8 9 0 18"/>':'<path d="m23 12 6 8m0-8-6 8"/>'}</svg><span>${sound?'音效已开':'音效已关'}</span>`;
 utilities.append(guide,audioButton);actions.append(utilities);$('#dialog').append(actions);
}
function selectLevel(){
 screen='levels';
 show(`<div class="level-topline"><span>打工人闯关记</span><span>★ ${save.unlocked} / ${levels.length}</span></div><div class="level-heading"><span class="map-kicker">OFFICE ADVENTURE</span><h2 id="dialog-title">今天也要<span>快乐摸鱼</span></h2><p>选个工位，开始你的带薪冒险！</p></div>`);
 const list=document.createElement('div');list.className='level-list adventure-map';
 const descriptions=['熟悉老板的巡逻，抓住摸鱼时机','换个工位，抢一把双倍金椅','老板和主管，一起突击检查','同事也来抢座，考验手速和时机'];
 levels.forEach((l,i)=>{
  const unlocked=i<save.unlocked,clean=save.best[`${i}-clean`],assisted=save.best[`${i}-assisted`];
  const hasClean=Number.isFinite(clean)&&clean>=0,hasAssisted=Number.isFinite(assisted)&&assisted>=0;
  const completed=hasClean||hasAssisted;
  const record=hasClean?`最佳 ${formatTime(clean)}`:hasAssisted?`助力最佳 ${formatTime(assisted)}`:'';
  const b=button('',()=>start(i),'level-card');b.disabled=!unlocked;
  b.dataset.state=!unlocked?'locked':completed?'complete':'available';
  b.innerHTML=`<span class="level-art"><canvas width="100" height="100" data-level-art="${i}" aria-hidden="true"></canvas></span><span class="level-number">${String(i+1).padStart(2,'0')}</span><span class="level-copy"><strong>${l.name}</strong><small>${unlocked?descriptions[i]:`通关第 ${i} 关后解锁`}</small><span class="level-meta"><span><i class="mini-coin">¥</i>${l.target}</span><span>◷ ${formatTime(l.time)}</span>${record?`<span class="level-record">${record}</span>`:''}</span></span><span class="level-state">${unlocked?(completed?'再玩一次':'开始挑战')+' ▶':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>'}</span>`;
  list.append(b);
 });
 $('#dialog').append(list,button('‹  返回首页',menu,'secondary home-back'));
}
function instructions(back=()=>hide()){
 screen=back===menu?'guide':'instructions';
 const rules=[
  '选玩法赚钱：段子安静、游戏适中、蹦迪更吵。蹦迪第3关开放。',
  '检查前有预告。可降档继续摸鱼，藏不住就一键工作；收手需要时间。',
  '连摸有额外奖金，切玩法不断连；安全工作或换座时到账，被抓就丢奖金。',
  '点空椅子换座，移动不赚钱。金椅限时×2，道具坐下拾取。',
  '感叹号表示听到声音，连线和工位号标调查位置；换座后仍查旧声源。',
  '反光镜看全员10秒路线，开会支走一人。首次抓包警告，之后扣50。'
 ];
 show(panelHead('briefcase','入职手册','摸鱼要有分寸')+'<ul>'+rules.map(rule=>'<li>'+rule+'</li>').join('')+'</ul>',[['知道了，稳稳拿捏',back,'primary']]);
}
function pause(){if(g.modal||screen||g.show)return;screen='pause';show(panelHead('pause','休息一下','喝口水，再继续')+'<p>时间停在这一刻。<br>准备好了，再回办公室。</p>',[['继续摸鱼',hide,'primary'],['重开本关',()=>start(g.level)],[sound?'音效：开':'音效：关',()=>{sound=!sound;screen=null;hide();pause();}],['返回关卡',selectLevel,'secondary']]);}
function help(){
 if(g.modal||screen||g.show)return;
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
function meeting(){if(g.modal||screen||g.show)return;if(!g.inventory.meeting){g.notify('空工位拾取开会通知，或在求助中领取');return;}screen='meeting';show(panelHead('briefcase','会议邀请','请谁去开会？')+'<p>对方会步行离场，离场后 10 秒再返回。<br>先收手，再发通知更稳妥。</p>');for(const [i,ins]of g.inspectors.entries()){const b=button(`请${ins.name}去开会`,()=>{hide();g.useMeeting(i);});b.disabled=ins.hidden||ins.leaving;$('#dialog').append(b);}$('#dialog').append(button('先不发了',hide,'secondary'));}
function record(){const key=`${g.level}-${g.ads?'assisted':'clean'}`,used=g.config.time+(g.extended?15:0)-g.time;save.unlocked=Math.max(save.unlocked,Math.min(levels.length,g.level+2));save.best[key]=Math.min(save.best[key]??Infinity,used);try{void 0;}catch{}}
function rewardConfirm(type){screen='reward';show(panelHead('help','本地试玩','领取测试奖励')+'<p>这是本地试玩中的奖励模拟。<br>确认后消耗一次助力机会；取消不消耗。</p>',[['确认领取测试奖励',()=>{screen=null;g.paused=false;g.reward(type);lastModal=null;if(!g.modal)hide();},'primary'],['取消',()=>{screen=null;lastModal=null;},'secondary']]);}
function processModal(){if(!g.modal||screen==='reward'||g.modal===lastModal)return;lastModal=g.modal;screen='result';const m=g.modal;
 if(m.kind==='tutorial'){
  show(`${panelHead('clock','入职练习 · 时间已暂停','先看预告，再收手')}<div class="speech">看到「即将检查」，就准备切回工作。</div><ul><li>检查者正常巡视，看见可疑行为才靠近；正式检查前有 2 秒预告。</li><li>点击「一键工作」收手；打游戏和蹦迪需要更久，别等检查开始才点。</li><li>检查时留意暴露条，涨满就会被抓。</li><li>连续摸鱼的额外奖励，要安全收手才能拿到。</li></ul>`,[['记住了，开始练习',()=>{g.dismiss();hide();},'primary']]);
 }else if(m.kind==='warning'){
  const who=m.who==='老板'?'boss':'supervisor';
  show(`<div class="story-top"><span>办公室小插曲</span><span class="story-paused"><svg viewBox="0 0 48 48" fill="currentColor" aria-hidden="true"><rect x="13" y="10" width="7" height="28" rx="2"/><rect x="28" y="10" width="7" height="28" rx="2"/></svg>时间已暂停</span></div><div class="story-scene">${portrait(who)}<div class="story-bubble"><h2 id="dialog-title">${m.who}</h2><div class="story-line">${m.lines[0]}</div></div></div><div class="story-note">首次提醒不扣金币 · 再被抓到扣 50</div><div class="reply-label">你的回应</div>`,[[m.lines[1].replaceAll('老板',m.who),()=>{g.dismiss();hide();},'primary reply']]);
 }else if(m.kind==='fine'){
  show(`${panelHead('chat','被抓包了',g.coins<0?'今天有点不顺':'老板的提醒升级了')}<div class="speech">“上班时间，收敛一点。”</div><div class="fine-amount">−50 <small>金币</small></div><p>当前余额 ${Math.floor(g.coins)} 金币${g.coins<0?'，请同事帮忙解释或重新挑战。':'，下次记得早点收手。'}</p>`,[[g.coins<0?'重新挑战':'知道了，继续工作',()=>{if(g.coins<0)start(g.level);else{g.dismiss();hide();}},'primary']]);
  if(g.level>0&&g.ads<2)$('#dialog').append(button('请同事帮忙解释 · 测试助力',()=>rewardConfirm('explain'),'outlined'));$('#dialog').append(button('返回关卡',selectLevel,'secondary'));
 }else if(m.kind==='win'){
  record();const used=g.config.time+(g.extended?15:0)-g.time;
  show(`${panelHead('cup','今日业绩 · 已达成','准点下班！')}${statement()}${activitySummary()}<div class="result-facts"><span>用时 <b>${formatTime(used)}</b></span><span>抓包 <b>${g.catches} 次</b></span><span>换位 <b>${g.stats.moves} 次</b></span></div><div class="best-record">${g.ads?'助力':'无助力'}最佳用时 <b>${formatTime(save.best[`${g.level}-${g.ads?'assisted':'clean'}`])}</b></div>`,[[g.level<3?'下一天，继续 →':'再挑战一次',()=>start(Math.min(3,g.level+1)),'primary'],['选择关卡',selectLevel,'secondary']]);beep(880);
 }else{
  const timeout=m.kind==='timeout';
  show(`${panelHead(timeout?'clock':'briefcase',timeout?'今日业绩 · 尚未达成':'今日挑战结束',timeout?'下班铃响了':'明天再来一局')}${statement()}${activitySummary()}<p>${m.reason||`还差 <b>${Math.ceil(g.config.target-g.coins)} 金币</b>，下次抓准老板转身的空隙。`}${g.catches?`<br>本局抓包 ${g.catches} 次，提前收手能保住奖金。`:""}</p>`,[['重新挑战',()=>start(g.level),'primary']]);
  if(timeout&&g.level>0&&g.ads<2&&!g.extended)$('#dialog').append(button('再争取 15 秒 · 测试助力',()=>rewardConfirm('extend'),'outlined'));
  $('#dialog').append(button('选择关卡',selectLevel,'secondary'));
 }}
const seatButtons=seats.map(s=>{const b=document.createElement('button');b.className='seat-hit';b.style.left=`${s.x/720*100}%`;b.style.top=`${s.y/920*100}%`;b.setAttribute('aria-label',`移动到${s.id+1}号工位`);b.onclick=()=>{if(!screen&&!g.show){if(g.moveTo(s.id))beep(520);else g.notify('当前不能换到这个工位');}};$('#seat-buttons').append(b);return b;});
for(const b of document.querySelectorAll('[data-activity]'))b.onclick=()=>{if(!screen&&!g.show){g.setActivity(b.dataset.activity);beep(b.dataset.activity==='dance'?700:500);}};
$('#work').onclick=()=>{if(!screen&&!g.show){g.setActivity('work');beep(320);}};$('#mirror').onclick=()=>{if(!screen&&!g.show&&!g.useMirror())g.notify(g.inventory.mirror?'检查者暂时离场，回来后再用':'空工位拾取反光镜，或在求助中领取');};$('#meeting').onclick=meeting;$('#help').onclick=help;$('#pause').onclick=pause;
document.addEventListener('keydown',e=>{if(e.repeat)return;if(e.code==='Escape'){if(screen==='pause')hide();else if(!screen&&!g.show)pause();}if(screen||g.show)return;const a={Digit1:'joke',Digit2:'game',Digit3:'dance',Space:'work'}[e.code];if(a){e.preventDefault();g.setActivity(a);}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&!screen&&!g.modal)pause();lastTime=0;});
function updateUI(){
 const p=g.player,boosted=g.special?.seat===p.seat&&p.seat!==null,multiplier=boosted?2:1,moving=!!p.route.length;
 const blocked=!!screen||!!g.modal||!!g.show,stopping=p.stopping>0,locked=p.lock>0;
 const checks=g.inspectors.filter(i=>!i.hidden).map(i=>{const q=i.queue[0];return `${i.name}${q?.phase==='warning'?(i.threatensPlayer===false?'在查别处':`预告${Math.ceil(q.left)}秒`):q?.phase==='checking'?(i.threatensPlayer===false?'在查别处':`检查${Math.ceil(q.left)}秒`):i.directed?'调查旧位置':i.suspicion>0?'发现动静':'巡逻中'}`;}).join('；');
 const source=g.soundField.sources.find(s=>s.seat===p.seat),soundChecks=g.inspectors.flatMap(i=>{const cue=renderer.soundTarget(i);return cue?[`${i.name}${cue.fresh?'听到了'+(cue.point.kind==='dance'?'音乐':'键盘声'):'正在确认声音'}，${cue.pending?'稍后查看':'目标'}${cue.point.seat+1}号工位${cue.point.seat!==p.seat?'，旧声源':''}${cue.pending&&cue.current?`，当前仍查${cue.current.seat+1}号`:''}`]:[];}).join('；');
 canvas.setAttribute('aria-description',`${checks}；${renderer.noiseLabel(source)}${soundChecks?'；'+soundChecks:''}；连续摸鱼${Math.floor(g.comboTime)}秒，待结算${g.pendingBonus.toFixed(1)}金币；${g.exposure>0?'正在暴露':'安全'}${g.feedback?'；'+g.feedback.text:''}`);
 $('#money').innerHTML=`${Math.floor(g.coins+1e-8)} <em>/ ${g.config.target}</em>`;
 $('#time').textContent=formatTime(g.time);$('#time').classList.toggle('low-time',g.time<30);
 $('#progress').style.width=`${Math.max(0,Math.min(100,g.coins/g.config.target*100))}%`;
 $('#level-label').textContent=`0${g.level+1} · ${g.config.name}`;
 $('#mirror-status').textContent=g.show?'路线揭示中…':g.mirror>0?`全员路线 · ${Math.ceil(g.mirror)} 秒`:'';
 $('#toast').textContent=g.toast;$('#toast').style.opacity=g.toastLeft>0?1:0;
 let status='认真工作中',detail='选一种摸鱼方式',tone='work';
 if(stopping){status='正在收手…';detail=`还需 ${p.stopping.toFixed(1)} 秒 · 仍会被发现`;tone='caution';}
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
  const threats=g.activityThreats(a),risk=threats.length>0&&!unavailable;
  b.classList.toggle('is-risky',risk);b.setAttribute('aria-description',`${a==='joke'?'无声，可安静降低动静':a==='game'?'轻声，动静缓慢增加':'音乐声大，声源会留在原工位'}；${risk?'当前检查范围内：'+threats.join('、'):'当前检查范围外'}`);b.title=b.getAttribute('aria-description');

  b.querySelector('small').textContent=unavailable?'第 3 关解锁':`+${activities[a].rate*multiplier} / 秒`;
 }
 // 一键工作始终可见：默认在工作时置灰不可点，只有摸鱼/收手/恢复期才可操作。
 const work=$('#work'),inAisle=p.seat===null&&!moving,working=p.activity==='work';
 const canWork=!working||stopping||locked||inAisle||moving;
 work.hidden=false;
 work.disabled=blocked||p.seat===null||(working&&!stopping&&!locked);
 work.classList.toggle('is-working',!inAisle&&!moving&&working&&!stopping);
 work.classList.toggle('is-stopping',stopping);work.classList.toggle('has-context',stopping||moving||locked||inAisle);
 work.querySelector('strong').textContent=stopping?'正在收手…':moving?'停止移动':inAisle?'请先入座':'一键工作';
 work.querySelector('small').textContent=stopping?'等动作收好才安全':moving?'停在过道，重新选座':inAisle?'点击空椅子继续':locked?'等检查结束':(working&&!stopping)?'已在工作':'随时收手';
 for(const type of ['mirror','meeting']){
  const el=$('#'+type),count=g.inventory[type],running=type==='mirror'&&g.mirror>0,name=type==='mirror'?'反光镜':'开会';
  $('#'+type+'-count').textContent=running&&!count?`${Math.ceil(g.mirror)}s`:count;
  el.classList.toggle('is-empty',!count&&!running);el.classList.toggle('has-item',!!count);el.classList.toggle('is-running',running);
  const description=running?`全员路线生效中，还剩${Math.ceil(g.mirror)}秒，库存${count}个`:count?`库存${count}个，点击使用`:'0个，坐有道具的空工位拾取';
  el.setAttribute('aria-label',`${name}，${description}`);el.title=description;el.disabled=blocked||!count;
 }
 $('#help').disabled=blocked;$('#pause').disabled=blocked;
 seatButtons.forEach((b,i)=>{b.disabled=blocked||g.occupied(i)||locked||stopping;const drop=g.drops.find(d=>d.seat===i);b.setAttribute('aria-label',`移动到${i+1}号工位${g.special?.seat===i?`，黄金工位 ×2，剩余${Math.ceil(g.special.left)}秒`:''}${drop?`，可拾取${drop.type==='mirror'?'反光镜':'开会通知'}`:''}`);});
}
function frame(time){const dt=lastTime?Math.min(.1,(time-lastTime)/1000):0;lastTime=time;if(!g.paused&&!g.modal&&!g.show)visualTime+=dt;g.step(dt);if(g.show&&performance.now()-g.show.t0>=g.show.total)g.finishShow();processModal();renderer.draw(g,visualTime);updateUI();requestAnimationFrame(frame);}
renderer.ready.then(errors=>{if(errors.length)g.notify('部分画面素材未加载，可刷新重试');});
menu();requestAnimationFrame(frame);

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
