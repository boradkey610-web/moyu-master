(async()=>{
 const cases=[];
 for(const old of document.querySelectorAll('iframe'))if(old.style.left==='-12000px')old.remove();
 for(const activity of ['joke','game','dance']){
  let width=390,height=844;
  const frame=document.createElement('iframe');frame.style.cssText=`position:fixed;left:-12000px;top:0;border:0;width:${width}px;height:${height}px`;
  const loaded=new Promise((resolve,reject)=>{frame.onload=resolve;frame.onerror=reject;});frame.src='/dev/caught-review.html?activity='+activity;document.body.append(frame);await loaded;
  const win=frame.contentWindow,doc=win.document,deadline=performance.now()+15000;
  await new Promise((resolve,reject)=>{function check(){if(win.caughtReview)return resolve();if(performance.now()>deadline)return reject(Error('preview boot'));setTimeout(check,10);}check();});
  const api=win.caughtReview;await api.ready;
  try{for(const [index,size]of [[390,844],[360,640],[844,390],[1100,800]].entries()){
  [width,height]=size;frame.style.width=width+'px';frame.style.height=height+'px';
  const who=index%2?'主管':'老板',fine=index>=2;api.launch(who,fine,100,activity);
  if(api.scene){api.scene.skip();api.advance(0);}
  const dialog=doc.querySelector('#dialog'),rect=dialog.getBoundingClientRect();let vertical;
  if(api.scene){const art=doc.querySelector('.caught-stage').getBoundingClientRect(),copy=doc.querySelector('.caught-copy').getBoundingClientRect();vertical=copy.top>=art.bottom-2;}
  else if(!fine){const portrait=doc.querySelector('.story-portrait').getBoundingClientRect(),bubble=doc.querySelector('.story-bubble').getBoundingClientRect();vertical=bubble.top>=portrait.bottom-2;}
  else vertical=win.getComputedStyle(dialog).display!=='grid'||win.getComputedStyle(dialog).gridTemplateColumns.split(' ').length===1;
  const reply=doc.querySelector('#caught-actions button.primary')||doc.querySelector('#dialog button.primary');reply.scrollIntoView({block:'nearest'});const rb=reply.getBoundingClientRect();
  cases.push({activity,who,fine,width,height,dialogWidth:Math.round(rect.width),vertical,narrow:rect.width<=391,noOverflow:dialog.scrollWidth<=dialog.clientWidth+1,replyReachable:rb.top>=-1&&rb.bottom<=height+1,coins:api.game.coins,paused:api.game.paused&&!!api.game.modal,assetErrors:api.renderer.assetErrors});
  }}finally{frame.remove();}
 }
 return{cases,passed:cases.every(c=>c.vertical&&c.narrow&&c.noOverflow&&c.replyReachable&&c.paused&&c.coins===(c.fine?50:100)&&!c.assetErrors.length)};
})()
