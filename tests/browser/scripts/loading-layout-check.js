(async()=>{
 const html=await(await fetch(new URL('/index.html',location.origin))).text();
 const source=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace('<head>',`<head><base href="${location.origin}/">`);
 const cases=[];
 const sizes=[[320,400],[320,568],[360,640],[390,844],[640,360],[844,390],[1100,800],[1440,900]];
 for(const [width,height] of sizes){
  const frame=document.createElement('iframe');
  frame.style.cssText=`position:fixed;left:-3000px;top:0;width:${width}px;height:${height}px;border:0`;
  try{
   await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Preview timeout')),5000);frame.onload=()=>{clearTimeout(timer);resolve();};frame.srcdoc=source;document.body.append(frame);});
   const doc=frame.contentDocument,win=frame.contentWindow;
   for(const state of ['loading','error']){
    const screen=doc.querySelector('#boot-screen'),title=doc.querySelector('#boot-title'),retry=doc.querySelector('#boot-retry');
    screen.dataset.state=state;title.hidden=state==='loading';retry.hidden=state==='loading';
    title.textContent=state==='error'?'有些资料还没送到':'加载中';
    doc.querySelector('#boot-note').textContent=state==='error'?'部分画面没加载成功，重新加载后再进入。':'正在准备办公室…';
    const bounds=screen.getBoundingClientRect(),shell=doc.querySelector('.game-shell'),shellBounds=shell.getBoundingClientRect();
    const visible=[...doc.querySelector('.boot-content').children].filter(el=>win.getComputedStyle(el).display!=='none');
    const inside=visible.every(el=>{const r=el.getBoundingClientRect();return r.left>=bounds.left&&r.right<=bounds.right&&r.top>=bounds.top&&r.bottom<=bounds.bottom&&el.scrollWidth<=el.clientWidth+1;});
    const retrySize=retry.getBoundingClientRect();
    const followsGame=Math.abs(bounds.width-shell.clientWidth)<1&&Math.abs(bounds.height-shell.clientHeight)<1&&bounds.left>=shellBounds.left&&bounds.right<=shellBounds.right&&bounds.top>=shellBounds.top&&bounds.bottom<=shellBounds.bottom;
    shell.classList.remove('is-loading');doc.querySelector('#overlay').dataset.page='menu';
    const homeBounds=shell.getBoundingClientRect();
    const stableHome=['left','top','width','height'].every(key=>Math.abs(homeBounds[key]-shellBounds[key])<1);
    delete doc.querySelector('#overlay').dataset.page;shell.classList.add('is-loading');
    const correctState=state==='loading'?title.hidden&&retry.hidden:!title.hidden&&!retry.hidden&&retrySize.height>=44;
    cases.push({width,height,state,inside,followsGame,stableHome,correctState,passed:inside&&followsGame&&stableHome&&correctState});
   }
  }catch(error){cases.push({width,height,error:String(error),passed:false});}
  finally{frame.remove();}
 }
 return{passed:cases.length===16&&cases.every(c=>c.passed),sizes:sizes.length,cases};
})()
