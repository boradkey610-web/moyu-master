import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};}
function harness(){
 const start=app.indexOf('async function boot(){');assert.ok(start>=0,'应用应有等待素材的启动入口');
 const pending=deferred(),retry=deferred(),calls=[],nodes={};
 for(const id of ['#boot-screen','#boot-title','#boot-note','#boot-retry','.game-shell'])nodes[id]={hidden:false,disabled:false,dataset:{},textContent:'',classList:{remove:name=>calls.push('reveal:'+name)},setAttribute(k,v){this[k]=v;}};
 const context={g:{paused:false},visualTime:0,renderer:{ready:pending.promise,loadArt:()=>retry.promise,draw:()=>calls.push('draw')},$:id=>nodes[id],menu:()=>calls.push('menu'),updateUI:()=>calls.push('ui'),modalBackground:()=>{},frame(){},requestAnimationFrame:()=>calls.push('raf')};
 vm.createContext(context);const initial=vm.runInContext(app.slice(start),context);
 return{context,nodes,calls,pending,retry,initial};
}
test('素材仍在加载时不显示首页、不启动对局循环',async()=>{
 const h=harness();assert.equal(h.context.g.paused,true);assert.deepEqual(h.calls,[]);assert.equal(h.nodes['#boot-screen'].hidden,false);
 h.pending.resolve([]);await h.initial;
 assert.deepEqual(h.calls,['menu','draw','ui','reveal:is-loading','raf']);assert.equal(h.nodes['#boot-screen'].hidden,true);assert.equal(h.nodes['.game-shell']['aria-busy'],'false');
});
test('加载失败保留阻挡及重试入口，不显示缺图首页',async()=>{
 const h=harness();h.pending.resolve(['office']);await h.initial;
 assert.deepEqual(h.calls,[]);assert.equal(h.nodes['#boot-screen'].hidden,false);assert.equal(h.nodes['#boot-screen'].dataset.state,'error');
 assert.equal(h.nodes['#boot-retry'].hidden,false);assert.equal(h.nodes['#boot-retry'].disabled,false);
});
test('重试等待完成才放行，并且只启动一次主循环',async()=>{
 const h=harness();h.pending.resolve(['desk']);await h.initial;
 const retrying=h.nodes['#boot-retry'].onclick();assert.equal(h.nodes['#boot-retry'].disabled,true);assert.deepEqual(h.calls,[]);
 h.retry.resolve([]);await retrying;
 assert.equal(h.calls.filter(c=>c==='raf').length,1);assert.equal(h.calls.filter(c=>c==='menu').length,1);
 assert.ok(h.calls.indexOf('draw')<h.calls.indexOf('reveal:is-loading'));
});
test('初始HTML加载页无需图片，游戏内容在脚本执行前即被遮挡',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8'),css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
 assert.match(html,/class="game-shell is-loading"/);assert.match(html,/aria-busy="true"/);
 const loading=html.slice(html.indexOf('id="boot-screen"'),html.indexOf('<header class="hud"'));
 assert.match(loading,/id="boot-retry"[^>]*hidden/);assert.doesNotMatch(loading,/<(?:img|canvas)\b/);
 assert.match(css,/\.is-loading>[^{}]*\.hud[^{}]*\.scene[^{}]*\.controls[^{}]*#overlay\s*\{[^}]*visibility:hidden/);
});
