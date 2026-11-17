(async()=>{
 const api=window.caughtReview;await api.ready;const {Game}=await import('/src/engine.js');const cases=[];
 for(const warned of [false,true]){
  api.launch('老板');document.querySelector('#caught-skip').click();document.querySelector('#caught-actions button.primary').click();
  const g=api.game;g.inspectors=new Game(2,1).inspectors;g.npcs=[];g.soundField.office=null;g.warned=warned;g.catches=0;g.coins=100;g.time=90;g.elapsed=0;
  g.player.lock=0;g.player.checker=null;g.player.checkCommand=null;g.setActivity('game');
  for(let n=0;n<3000&&!g.modal;n++)g.step(.02);
  await new Promise(requestAnimationFrame);
  const modal=g.modal,scene=api.scene;
  cases.push({warned,catches:g.catches,kind:modal?.kind,who:modal?.who,activity:modal?.activity,coins:g.coins,elapsed:+g.elapsed.toFixed(2),animation:!!scene,phase:scene?.timeline.state().phase,paused:g.paused});
 }
 return{cases,passed:cases.every(c=>c.catches===1&&c.kind===(c.warned?'fine':'warning')&&c.coins===(c.warned?50:100)&&c.animation&&c.paused&&c.activity==='game')};
})()
