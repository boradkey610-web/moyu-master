import test from 'node:test';
import assert from 'node:assert/strict';
import * as comic from '../src/comic.js';
function draw(state,stop=false){
 const calls=[],r={art:{office:{img:{}}}};for(const name of ['portrait','sprite','asset','chair','box','ellipse','line','text'])r[name]=(...args)=>calls.push([name,...args.slice(1)]);
 const c=new Proxy({createLinearGradient:()=>({addColorStop(){}})}, {get:(o,k)=>o[k]??((...args)=>calls.push([k,...args]))});
 comic.drawComic({getContext:()=>c},state,stop,r);return calls;
}
test('三幕复用原办公室和人物，绘制只读且随模拟时钟冻结',()=>{
 assert.equal(typeof comic.drawComic,'function');
 for(let post=0;post<3;post++){
  const state=comic.createComic(post),before=JSON.stringify(state),first=draw(state);assert.equal(JSON.stringify(state),before);assert.deepEqual(draw(state),first);
  assert.ok(first.some(c=>c[0]==='drawImage'));assert.ok(first.some(c=>c[0]==='portrait'||c[0]==='sprite'));
 }
});
test('演出改变饼的尺寸、人员位置和咖啡状态，收手覆盖可见',()=>{
 assert.equal(typeof comic.drawComic,'function');
 for(let post=0;post<3;post++){
  const state=comic.createComic(post),before=draw(state);comic.tapComic(state);if(post===0){comic.stepComic(state,.36);comic.tapComic(state);comic.stepComic(state,.36);comic.tapComic(state);}comic.stepComic(state,1.6);
  assert.notDeepEqual(draw(state),before);assert.ok(draw(state,true).some(c=>c[0]==='fillText'&&String(c[1]).includes('收起')));
 }
});
test('同事已离场后的结果阶段椅子仍转动，使用模拟时钟',()=>{
 const state=comic.createComic(1);comic.tapComic(state);comic.stepComic(state,2);const first=draw(state);comic.stepComic(state,.3);assert.notDeepEqual(draw(state),first);
});
test('会议投影画在角色后方，不盖住睡倒的脸',()=>{
 const state=comic.createComic(2);comic.tapComic(state);comic.stepComic(state,2.6);const calls=draw(state),screen=calls.findIndex(c=>c[0]==='box'&&c[1]===235),person=calls.findIndex(c=>c[0]==='portrait');assert.ok(screen>=0&&screen<person);
});
