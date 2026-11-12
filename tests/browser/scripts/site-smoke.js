(async()=>{
 const canvas=document.querySelector('#office')||document.querySelector('canvas');
 const preview=location.pathname.endsWith('/dance-review.html');
 const text=document.body.innerText.trim();
 const root=preview?document.body:document.querySelector('main.game-shell');
 const resources=await Promise.all(['assets/manifest.json','src/app.js','src/engine.js','src/render.js','src/disco.js','style.css'].map(async file=>{
  const response=await fetch(new URL('/'+file,location.origin));
  return{file,status:response.status,type:response.headers.get('content-type')};
 }));
 const resourceOrigins=[...new Set(performance.getEntriesByType('resource').map(entry=>new URL(entry.name).origin))];
 return{
  title:document.title,path:location.pathname,hasRoot:!!root,rootChildren:root?.childElementCount||0,
  visibleTextLength:text.length,canvasSize:canvas?[canvas.width,canvas.height]:null,
  artStatus:canvas?.dataset.artStatus,previewErrors:window.danceReview?.renderer.assetErrors||[],
  resources,resourceOrigins,forms:document.forms.length,
  isBlank:!root||text.length<10||!canvas,
  passed:!!root&&text.length>10&&canvas?.dataset.artStatus==='ready'&&resources.every(resource=>resource.status===200)
 };
})()
