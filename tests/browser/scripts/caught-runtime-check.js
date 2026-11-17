(async()=>{
 const api=window.caughtReview;await api.ready;
 const cases=[];
 for(const who of ['老板','主管'])for(const fine of [false,true]){
  api.launch(who,fine,100);const g=api.game,m=g.modal,scene=api.scene;
  const stable=()=>JSON.stringify({time:g.time,elapsed:g.elapsed,coins:g.coins,runner:g.runner,field:g.soundField,lock:g.player.lock});
  const before=stable();
  for(let i=0;i<120;i++){api.advance(.1);g.step(.1);}
  const waiting=scene.timeline.state().ready,paused=stable()===before;
  const screenDrawn=scene.desk.getContext('2d').getImageData(242,319,543,127).data.some((v,i)=>i%4!==3&&v!==0);
  const reply=document.querySelector('#caught-actions button.primary');
  const visible=!document.querySelector('#caught-actions').hidden;
  reply.click();const dismissed=!g.modal&&!g.paused&&!api.scene;
  g.step(.1);const resumed=g.time<JSON.parse(before).time;
  cases.push({who,fine,waiting,paused,visible,screenDrawn,dismissed,resumed,coins:JSON.parse(before).coins,activity:m.activity});
 }
 api.launch('主管',true,20);document.querySelector('#caught-skip').click();
 const negativeBalance=api.game.coins===-30,skipWaits=!!api.game.modal&&api.scene.timeline.state().ready;
 document.querySelector('#caught-actions button.outlined').click();
 const cleanupForReward=!api.scene&&!!api.game.modal;
 document.querySelector('#dialog button.primary').click();
 const rewardRestores=api.game.coins===20&&!api.game.modal&&!api.game.paused;
 api.launch('主管');const scene=api.scene,t=scene.timeline.time;scene.advance(.1,true);
 const hiddenPauses=scene.timeline.time===t;
 document.querySelector('#caught-skip').click();
 const dialog=document.querySelector('#dialog'),bounds=dialog.getBoundingClientRect();
 const noHorizontalOverflow=dialog.scrollWidth<=dialog.clientWidth+1;
 const layout={width:innerWidth,height:innerHeight,dialogWidth:Math.round(bounds.width),dialogHeight:Math.round(bounds.height),noHorizontalOverflow};
 return{artStatus:api.renderer.canvas.dataset.artStatus,errors:api.renderer.assetErrors,cases,negativeBalance,skipWaits,cleanupForReward,rewardRestores,hiddenPauses,layout,passed:api.renderer.assetErrors.length===0&&cases.every(x=>x.waiting&&x.paused&&x.visible&&x.screenDrawn&&x.dismissed&&x.resumed&&x.coins===(x.fine?50:100))&&negativeBalance&&skipWaits&&cleanupForReward&&rewardRestores&&hiddenPauses&&noHorizontalOverflow};
})()
