(async()=>{
 const api=window.caughtReview;await api.ready;
 const cases=[];
 for(const who of ['老板','主管'])for(const fine of [false,true]){
  api.launch(who,fine,100,'dance');const g=api.game,m=g.modal,scene=api.scene;
  const stable=()=>JSON.stringify({time:g.time,elapsed:g.elapsed,coins:g.coins,runner:g.runner,field:g.soundField,lock:g.player.lock});
  const before=stable();
  for(let i=0;i<120;i++){api.advance(.1);g.step(.1);}
  const waiting=scene.timeline.state().ready,paused=stable()===before;
  const screenDrawn=!!api.renderer.art['caught-dance-hands']&&!scene.desk&&!scene.phoneFrames;
  scene.timeline.time=scene.timeline.talkStart+.29;scene.draw();
  const pixels=()=>Array.from(scene.canvas.getContext('2d').getImageData(0,0,480,450).data).join(',');
  const checker=pixels();scene.skip();const stableCamera=checker===pixels();
  const firstPerson=scene.activity==='dance'&&document.querySelector('#caught-canvas').dataset.caughtActivity==='dance';
  const phases=new Set();for(let time=0;time<=scene.timeline.end;time+=.1){scene.timeline.time=time;phases.add(scene.timeline.state().phase);}scene.skip();
  const noMiddle=[...phases].every(p=>['discovery','freeze','lower-hands','talk','reaction','reply'].includes(p));
  const reply=document.querySelector('#caught-actions button.primary');
  const visible=!document.querySelector('#caught-actions').hidden;
  reply.click();const dismissed=!g.modal&&!g.paused&&!api.scene;
  g.step(.1);const resumed=g.time<JSON.parse(before).time;
  cases.push({who,fine,waiting,paused,visible,screenDrawn,firstPerson,noMiddle,stableCamera,dismissed,resumed,coins:JSON.parse(before).coins,activity:m.activity});
 }
 api.launch('主管',true,20,'dance');document.querySelector('#caught-skip').click();
 const negativeBalance=api.game.coins===-30,skipWaits=!!api.game.modal&&api.scene.timeline.state().ready;
 document.querySelector('#caught-actions button.outlined').click();
 const cleanupForReward=!api.scene&&!!api.game.modal;
 document.querySelector('#dialog button.primary').click();
 const rewardRestores=api.game.coins===20&&!api.game.modal&&!api.game.paused;
 api.launch('主管',false,100,'dance');const scene=api.scene,t=scene.timeline.time;scene.advance(.1,true);
 const hiddenPauses=scene.timeline.time===t;
 document.querySelector('#caught-skip').click();
 const dialog=document.querySelector('#dialog'),bounds=dialog.getBoundingClientRect();
 const noHorizontalOverflow=dialog.scrollWidth<=dialog.clientWidth+1;
 const layout={width:innerWidth,height:innerHeight,dialogWidth:Math.round(bounds.width),dialogHeight:Math.round(bounds.height),noHorizontalOverflow};
 return{artStatus:api.renderer.canvas.dataset.artStatus,errors:api.renderer.assetErrors,cases,negativeBalance,skipWaits,cleanupForReward,rewardRestores,hiddenPauses,layout,passed:api.renderer.assetErrors.length===0&&cases.every(x=>x.waiting&&x.paused&&x.visible&&x.screenDrawn&&x.firstPerson&&x.noMiddle&&x.stableCamera&&x.dismissed&&x.resumed&&x.coins===(x.fine?50:100))&&negativeBalance&&skipWaits&&cleanupForReward&&rewardRestores&&hiddenPauses&&noHorizontalOverflow};
})()
