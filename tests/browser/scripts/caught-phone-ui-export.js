(async()=>{
 const previews=[];
 for(const [name,width,height,reply]of [['desktop',1100,800,false],['phone',390,844,true]]){
  const frame=document.createElement('iframe');frame.style.cssText=`position:fixed;left:-12000px;top:0;border:0;width:${width}px;height:${height}px`;frame.src='/dev/caught-review.html?who=supervisor&activity=joke';
  const loaded=new Promise(resolve=>frame.onload=resolve);document.body.append(frame);await loaded;
  const deadline=performance.now()+10000;await new Promise((resolve,reject)=>{function check(){if(frame.contentWindow.caughtReview)return resolve();if(performance.now()>deadline)return reject(Error('boot timeout'));requestAnimationFrame(check);}check();});
  const w=frame.contentWindow,d=w.document,api=w.caughtReview;await api.ready;api.launch('主管',false,100,'joke');api.scene.timeline.time=reply?api.scene.timeline.end:api.scene.timeline.talkEnd-.1;api.advance(0);
  const dialog=d.querySelector('#dialog'),base=dialog.getBoundingClientRect(),out=document.createElement('canvas');out.width=Math.ceil(base.width);out.height=Math.ceil(base.height);const c=out.getContext('2d');
  function rect(el){const r=el.getBoundingClientRect();return{x:r.x-base.x,y:r.y-base.y,w:r.width,h:r.height};}
  function shape(el){const r=rect(el),s=w.getComputedStyle(el);c.fillStyle=s.backgroundColor;c.beginPath();c.roundRect(r.x,r.y,r.w,r.h,parseFloat(s.borderRadius)||0);c.fill();if(parseFloat(s.borderWidth)){c.strokeStyle=s.borderColor;c.lineWidth=parseFloat(s.borderWidth);c.stroke();}}
  shape(dialog);shape(d.querySelector('.caught-stage'));const art=d.querySelector('#caught-canvas'),ar=rect(art);const ratio=ar.w/ar.h,sourceRatio=art.width/art.height;let sx=0,sy=0,sw=art.width,sh=art.height;if(ratio<sourceRatio){sw=sh*ratio;sx=(art.width-sw)/2;}else sh=sw/ratio;c.drawImage(art,sx,sy,sw,sh,ar.x,ar.y,ar.w,ar.h);
  for(const el of d.querySelectorAll('.caught-status,#caught-skip,#caught-actions button'))if(el.getBoundingClientRect().width)shape(el);
  const outcome=rect(d.querySelector('.caught-outcome'));c.strokeStyle='#e5dac6';c.beginPath();c.moveTo(outcome.x,outcome.y);c.lineTo(outcome.x+outcome.w,outcome.y);c.stroke();
  // Rasterize text at the browser's measured glyph positions; this is a layout
  // preview export, not a native screenshot of the surrounding game window.
  for(const el of d.querySelectorAll('.caught-status,#caught-skip,.caught-kicker,#caught-speaker,#caught-line,.caught-outcome,#caught-prompt,#caught-actions button')){
   if(!el.getBoundingClientRect().width)continue;const walker=d.createTreeWalker(el,4);let node;
   while(node=walker.nextNode()){
    const s=w.getComputedStyle(node.parentElement);c.font=`${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;c.fillStyle=s.color;c.textBaseline='alphabetic';
    for(let i=0;i<node.textContent.length;i++){const range=d.createRange();range.setStart(node,i);range.setEnd(node,i+1);const r=range.getBoundingClientRect();if(r.width)c.fillText(node.textContent[i],r.x-base.x,r.y-base.y+parseFloat(s.fontSize)*.88);}
   }
  }
  previews.push({name,image:out.toDataURL('image/png')});frame.remove();
 }
 return{previews};
})()
