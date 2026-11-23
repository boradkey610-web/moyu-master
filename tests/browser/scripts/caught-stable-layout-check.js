(async()=>{
 const cases=[];
 for(const activity of ['game','joke','dance']){
  const frame=document.createElement('iframe');frame.style.cssText='position:fixed;left:-12000px;top:0;width:390px;height:844px;border:0';
  const loaded=new Promise(resolve=>frame.onload=resolve);frame.src='/dev/caught-review.html?activity='+activity;document.body.append(frame);await loaded;
  try{
   const win=frame.contentWindow,doc=win.document;
   await new Promise((resolve,reject)=>{const deadline=performance.now()+15000;function check(){if(win.caughtReview)return resolve();if(performance.now()>deadline)return reject(Error('preview boot'));setTimeout(check,10);}check();});
   const api=win.caughtReview;await api.ready;
   for(const [width,height]of [[390,844],[360,640],[844,390],[1100,800]])for(const who of ['老板','主管'])for(const fine of [false,true]){
    frame.style.width=width+'px';frame.style.height=height+'px';api.launch(who,fine,100,activity);
    const dialog=doc.querySelector('#dialog'),stage=doc.querySelector('.caught-stage'),outcome=doc.querySelector('.caught-outcome'),footer=doc.querySelector('.caught-footer');
    const bounds=()=>[dialog,stage,outcome,footer].flatMap(el=>{const r=el.getBoundingClientRect();return[r.top,r.height];});
    const initial=bounds();let maxShift=0;
    const hiddenActions=win.getComputedStyle(doc.querySelector('#caught-actions')).visibility==='hidden';
    for(let time=0;time<=api.scene.timeline.end+.1;time+=.065){api.scene.timeline.time=Math.min(time,api.scene.timeline.end);api.advance(0);bounds().forEach((value,i)=>maxShift=Math.max(maxShift,Math.abs(value-initial[i])));}
    const reply=doc.querySelector('#caught-actions button.primary');reply.scrollIntoView({block:'nearest'});const rb=reply.getBoundingClientRect();
    cases.push({activity,width,height,who,fine,maxShift,hiddenActions,ready:api.scene.timeline.state().ready,replyReachable:rb.top>=-1&&rb.bottom<=height+1,noOverflow:dialog.scrollWidth<=dialog.clientWidth+1});
   }
  }finally{frame.remove();}
 }
 return{cases,passed:cases.every(c=>c.maxShift<1&&c.hiddenActions&&c.ready&&c.replyReachable&&c.noOverflow)};
})()
