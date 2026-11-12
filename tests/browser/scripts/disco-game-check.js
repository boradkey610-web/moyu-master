(async()=>{
 const review=window.danceReview;if(!review)return{passed:false,error:'review not ready'};
 const r=review.renderer,{Game}=await import('/src/engine.js'),{discoOpacity}=await import('/src/disco.js');
 const g=new Game(2,1);g.inspectors=[];g.setActivity('dance');
 const opacity=()=>discoOpacity(r.danceState(g),1),pixel=()=>Array.from(r.c.getImageData(20,500,1,1).data);
 r.draw(g,0);const office=pixel(),start=opacity();g.step(.4);r.draw(g,g.elapsed);const middle=opacity(),mixed=pixel();
 const layer=Array.from(r.discoScene.layer.getContext('2d').getImageData(20,500,1,1).data);
 const crossfadeMatches=mixed.slice(0,3).every((v,i)=>Math.abs(v-(office[i]+layer[i])/2)<=2);
 g.step(.4);r.draw(g,g.elapsed);const full=opacity(),disco=pixel();
 const completeReplacement=disco.every((v,i)=>v===r.discoScene.layer.getContext('2d').getImageData(20,500,1,1).data[i]);
 const hashes=[];
 for(let i=0;i<28;i++){
  g.elapsed=4+(i+.01)*4/28;r.draw(g,g.elapsed);
  const pixels=r.c.getImageData(g.player.x-65,g.player.y-112,130,153).data;let hash=0;
  for(let j=0;j<pixels.length;j++)hash=(hash*31+pixels[j])>>>0;hashes.push(hash);
 }
 g.setActivity('work');g.step(.5);r.draw(g,g.elapsed);const stopping=opacity();
 g.paused=true;const frozen=r.danceState(g);g.step(2);const pauseFrozen=JSON.stringify(frozen)===JSON.stringify(r.danceState(g));
 g.paused=false;g.step(.5);r.draw(g,g.elapsed);const finished=opacity(),restored=pixel();
 g.setActivity('dance');g.step(1);r.draw(g,g.elapsed);g.catchPlayer('老板');r.draw(g,g.elapsed);const caughtOffice=opacity()===0;
 const result={artStatus:r.canvas.dataset.artStatus,errors:r.assetErrors,start,middle,full,stopping,finished,crossfadeMatches,completeReplacement,officeRestored:restored.every((v,i)=>v===office[i]),pauseFrozen,caughtOffice,distinctFrames:new Set(hashes).size,atlas:r.art['player-dance'].meta.src};
 result.passed=result.artStatus==='ready'&&!result.errors.length&&start===0&&Math.abs(middle-.5)<1e-8&&full===1&&Math.abs(stopping-.5)<1e-8&&finished===0&&crossfadeMatches&&completeReplacement&&result.officeRestored&&pauseFrozen&&caughtOffice&&result.distinctFrames>20;
 r.draw(review.game,review.game.elapsed);return result;
})()
