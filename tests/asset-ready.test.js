import test from 'node:test';
import assert from 'node:assert/strict';
import {Renderer} from '../src/render.js';

function deferred(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};}
test('真实素材加载器等待所有图片及工具图标，失败后重试清理错误',async()=>{
 const original=globalThis.fetch,images=[deferred(),deferred()],icons=deferred(),started=deferred();let count=0;
 const r=Object.create(Renderer.prototype);Object.assign(r,{art:{},canvas:{dataset:{}},bg:{getContext:()=>({})},drawOffice(){},loadToolIcons:()=>icons.promise});
 globalThis.fetch=async()=>({ok:true,json:async()=>({office:{src:'assets/office.png'},desk:{src:'assets/desk.png'}})});
 r.loadImage=()=>{const result=images[count++].promise;if(count===2)started.resolve();return result;};
 try{
  let settled=false;const loading=r.loadArt().then(errors=>{settled=true;return errors;});await started.promise;
  images[0].resolve({});images[1].reject(new Error('network'));await Promise.resolve();assert.equal(settled,false,'工具图标未完成不能就绪');
  icons.resolve();assert.deepEqual(await loading,['desk']);assert.equal(r.canvas.dataset.artStatus,'degraded');
  r.loadImage=async()=>({});r.loadToolIcons=async()=>{};
  assert.deepEqual(await r.loadArt(),[]);assert.equal(r.canvas.dataset.artStatus,'ready');assert.ok(r.art.desk);
 }finally{globalThis.fetch=original;}
});
test('工具图标先完成仍须等待运行图片，清单失败可重新加载',async()=>{
 const original=globalThis.fetch,image=deferred(),started=deferred(),r=Object.create(Renderer.prototype);
 Object.assign(r,{art:{},canvas:{dataset:{}},bg:{getContext:()=>({})},drawOffice(){},loadToolIcons:async()=>{},loadImage:()=>{started.resolve();return image.promise;}});
 try{
  globalThis.fetch=async()=>({ok:false});assert.deepEqual(await r.loadArt(),['manifest']);
  globalThis.fetch=async()=>({ok:true,json:async()=>({office:{src:'assets/office.png'}})});
  let settled=false;const loading=r.loadArt().then(errors=>{settled=true;return errors;});await started.promise;
  assert.equal(settled,false);image.resolve({});assert.deepEqual(await loading,[]);
 }finally{globalThis.fetch=original;}
});
