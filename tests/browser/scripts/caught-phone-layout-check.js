(async()=>{
 const cases=[];
 for(const [width,height]of [[390,844],[360,640],[844,390],[1100,800]]){
  const frame=document.createElement('iframe');frame.style.cssText=`position:fixed;left:-12000px;top:0;border:0;width:${width}px;height:${height}px`;
  const loaded=new Promise((resolve,reject)=>{frame.onload=resolve;frame.onerror=reject;});
  frame.src='/dev/caught-review.html?who=supervisor&activity=joke';document.body.append(frame);await loaded;
  const deadline=performance.now()+10000;
  await new Promise((resolve,reject)=>{function check(){if(frame.contentWindow.caughtReview)return resolve();if(performance.now()>deadline)return reject(new Error('Preview boot timed out'));requestAnimationFrame(check);}check();});
  const win=frame.contentWindow,api=win.caughtReview;await api.ready;api.launch('主管',false,100,'joke');api.scene.skip();api.advance(0);
  const dialog=win.document.querySelector('#dialog'),canvas=win.document.querySelector('#caught-canvas'),rect=dialog.getBoundingClientRect();
  api.launch('主管',false,100,'joke');api.scene.timeline.time=api.scene.timeline.talkEnd-.1;api.advance(0);
  const skip=win.document.querySelector('#caught-skip'),status=win.document.querySelector('.caught-status'),line=win.document.querySelector('#caught-line');
  const skipWidth=skip.getBoundingClientRect().width,statusWidth=status.getBoundingClientRect().width,textWidth=line.getBoundingClientRect().width;
  const horizontalText=win.getComputedStyle(line).writingMode==='horizontal-tb',compactSkip=skipWidth<130,statusUnwrapped=status.scrollWidth<=status.clientWidth+1;
  api.scene.skip();api.advance(0);
  const reply=win.document.querySelector('#caught-actions button.primary');reply.scrollIntoView({block:'nearest'});
  const rb=reply.getBoundingClientRect(),cb=win.document.querySelector('#caught-canvas').getBoundingClientRect();
  const stage=win.document.querySelector('.caught-stage').getBoundingClientRect(),copy=win.document.querySelector('.caught-copy').getBoundingClientRect();
  const portraitCard=rect.width<=391&&copy.top>=stage.bottom-2,fullArtwork=Math.abs(cb.width/cb.height-480/540)<.02;
  const noOverflow=dialog.scrollWidth<=dialog.clientWidth+1,replyReachable=rb.top>=0&&rb.bottom<=height;
  cases.push({width,height,dialogWidth:Math.round(rect.width),dialogHeight:Math.round(rect.height),canvasWidth:Math.round(cb.width),canvasHeight:Math.round(cb.height),noOverflow,replyReachable,portraitCard,fullArtwork,skipWidth:Math.round(skipWidth),statusWidth:Math.round(statusWidth),textWidth:Math.round(textWidth),horizontalText,compactSkip,statusUnwrapped});
  frame.remove();
 }
 return{cases,passed:cases.every(x=>x.noOverflow&&x.replyReachable&&x.portraitCard&&x.fullArtwork&&x.canvasWidth>100&&x.canvasHeight>100&&x.textWidth>200&&x.horizontalText&&x.compactSkip&&x.statusUnwrapped)};
})()
