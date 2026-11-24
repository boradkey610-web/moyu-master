(async()=>{
 const cases=[];
 for(const [width,height] of [[390,844],[360,640],[320,568],[844,390],[1100,800],[320,400]]){
  const frame=document.createElement('iframe');
  frame.style.cssText=`position:fixed;left:-12000px;top:0;border:0;width:${width}px;height:${height}px`;
  const loaded=new Promise(resolve=>frame.onload=resolve);frame.src='/';document.body.append(frame);await loaded;
  try{
   const win=frame.contentWindow,doc=win.document;
   await new Promise((resolve,reject)=>{const end=performance.now()+15000;function check(){if(doc.querySelector('.home-start'))return resolve();if(performance.now()>end)return reject(Error('guide boot timeout'));setTimeout(check,20);}check();});
   doc.querySelector('.home-utilities button').click();
   const dialog=doc.querySelector('#dialog'),reader=doc.querySelector('.guide-reader'),details=doc.querySelector('.guide-advanced');
   const box=dialog.getBoundingClientRect(),footer=doc.querySelector('.guide-footer'),button=footer.querySelector('button');
   const footerBefore=footer.getBoundingClientRect();
   const collapsed=!details.open&&doc.querySelectorAll('.guide-rule').length===3&&doc.querySelectorAll('.guide-topics section').length===4;
   const fits=box.left>=0&&box.right<=width&&box.top>=0&&box.bottom<=height&&dialog.scrollWidth<=dialog.clientWidth+1;
   const readable=parseFloat(win.getComputedStyle(doc.querySelector('.guide-rule p')).fontSize)>=16;
   const reachable=button.getBoundingClientRect().bottom<=height&&button.getBoundingClientRect().height>=44;
   details.querySelector('summary').click();
   const expanded=details.open;
   reader.scrollTop=reader.scrollHeight;
   const last=doc.querySelector('.guide-topics section:last-child').getBoundingClientRect(),readerBox=reader.getBoundingClientRect();
   const lastReadable=last.bottom<=readerBox.bottom+1&&last.top>=readerBox.top-1;
   const footerAfter=footer.getBoundingClientRect();
   const stableFooter=Math.abs(footerAfter.top-footerBefore.top)<.1&&Math.abs(footerAfter.height-footerBefore.height)<.1;
   const noOverlap=readerBox.bottom<=footerAfter.top+1;
   details.querySelector('summary').click();
   const recollapsed=!details.open;
   button.click();
   const homeReturn=!!doc.querySelector('.home-start')&&doc.querySelector('#overlay').parentElement.classList.contains('game-shell');
   doc.querySelector('.home-start').click();doc.querySelector('.level-card').click();
   await new Promise(resolve=>win.requestAnimationFrame(resolve));
   doc.querySelector('#dialog button.primary')?.click();
   doc.querySelector('#help').click();doc.querySelector('.assist-tutorial')?.click();
   const gameGuide=doc.querySelector('#dialog').dataset.kind==='instructions';
   const hudBefore=doc.querySelector('.hud').textContent;
   await new Promise(resolve=>setTimeout(resolve,1100));
   const frozen=doc.querySelector('.hud').textContent===hudBefore;
   doc.querySelector('.guide-footer button').click();
   const gameReturn=doc.querySelector('#overlay').classList.contains('hidden')&&!doc.querySelector('.controls').inert&&doc.querySelector('#overlay').parentElement.classList.contains('game-shell');
   cases.push({width,height,collapsed,fits,readable,reachable,expanded,lastReadable,stableFooter,noOverlap,recollapsed,homeReturn,gameGuide,frozen,gameReturn});
  }finally{frame.remove();}
 }
 return {cases,passed:cases.every(c=>Object.entries(c).every(([k,v])=>k==='width'||k==='height'||v===true))};
})()
