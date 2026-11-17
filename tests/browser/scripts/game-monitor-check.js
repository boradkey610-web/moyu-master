(()=>{
 const review=window.gameScreenReview;if(!review)return{passed:false,error:'not ready'};
 const {state,renderer:r,original}=review,saved={...state};
 const base=original.getContext('2d').getImageData(0,0,720,920).data,cases=[];
 try{
  state.gameScreen=true;state.time=1;
  for(let seat=0;seat<12;seat++){
   state.seat=seat;review.draw();const rect=review.monitorRect(),pixels=r.bg.getContext('2d').getImageData(0,0,720,920).data;
   let changed=0,outside=0;
   for(let i=0;i<pixels.length;i+=4){
    if(pixels[i]===base[i]&&pixels[i+1]===base[i+1]&&pixels[i+2]===base[i+2]&&pixels[i+3]===base[i+3])continue;
    changed++;const x=i/4%720,y=Math.floor(i/4/720);
    if(x<Math.floor(rect.x)||x>=Math.ceil(rect.x+rect.width)||y<Math.floor(rect.y)||y>=Math.ceil(rect.y+rect.height))outside++;
   }
   cases.push({seat:seat+1,changed,outside});
  }
  state.gameScreen=false;review.draw();const restored=r.bg.getContext('2d').getImageData(0,0,720,920).data;
  const originalRestored=restored.every((v,i)=>v===base[i]);
  const typing=review.typingAsset,hashes=[];
  if(typing){
   const cell=document.createElement('canvas');cell.width=384;cell.height=512;const c=cell.getContext('2d');
   for(let frame=0;frame<6;frame++){
    c.clearRect(0,0,384,512);c.drawImage(typing.img,frame*384,0,384,512,0,0,384,512);
    let hash=0;for(const v of c.getImageData(0,0,384,512).data)hash=(hash*31+v)>>>0;hashes.push(hash);
   }
  }
  const distinctTypingFrames=new Set(hashes).size;
  return{artStatus:r.canvas.dataset.artStatus,errors:r.assetErrors,cases,originalRestored,distinctTypingFrames,typingModel:typing?.meta.model,passed:r.canvas.dataset.artStatus==='ready'&&!r.assetErrors.length&&originalRestored&&cases.every(v=>v.changed>0&&v.outside===0)&&distinctTypingFrames===6};
 }finally{Object.assign(state,saved);review.draw();}
})()
