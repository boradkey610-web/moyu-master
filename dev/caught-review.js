// Exercise the real app callbacks without adding debug controls to the release.
const html=await (await fetch('/index.html')).text();
const parsed=new DOMParser().parseFromString(html,'text/html');
parsed.querySelectorAll('script').forEach(node=>node.remove());
document.body.innerHTML=parsed.body.innerHTML;
const app=await (await fetch('/src/app.js')).text();
const instrumented=app.replace(/from '\.\//g,`from '${location.origin}/src/`)+`
window.caughtReview={
 get game(){return g;},get scene(){return caughtScene;},get renderer(){return renderer;},
 launch(who='老板',fine=false,coins=100){start(2);g.inspectors=[];g.npcs=[];g.tutorialSeen=true;g.setActivity('game');g.warned=fine;g.coins=coins;g.runner.obstacle.x=180;g.runner.height=18;g.catchPlayer(who);processModal();renderer.draw(g,visualTime);updateUI();},
 advance(dt){if(caughtScene){caughtScene.advance(dt,false);updateCaughtScene();}},
 ready:renderer.ready
};`;
const url=URL.createObjectURL(new Blob([instrumented],{type:'text/javascript'}));
await import(url);URL.revokeObjectURL(url);await window.caughtReview.ready;
const toolbar=document.createElement('nav');toolbar.setAttribute('aria-label','抓包预览切换');
toolbar.style.cssText='position:fixed;left:8px;top:4px;z-index:100;display:flex;gap:6px;flex-wrap:wrap;background:#fff8e9;padding:5px;border-radius:8px;font-size:12px;';
for(const [label,who,fine]of [['老板提醒','老板',false],['主管提醒','主管',false],['老板罚款','老板',true],['主管罚款','主管',true]]){
 const b=document.createElement('button');b.textContent=label;b.onclick=()=>window.caughtReview.launch(who,fine);toolbar.append(b);
}
document.body.append(toolbar);
const who=new URLSearchParams(location.search).get('who')==='supervisor'?'主管':'老板';
window.caughtReview.launch(who);
