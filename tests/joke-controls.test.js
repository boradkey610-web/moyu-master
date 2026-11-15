import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
function handlers(){
 const start=app.indexOf('const jokeHold='),end=app.indexOf("$('#runner-jump').onpointerdown",start);assert.ok(start>0&&end>start,'hold input block exists');
 const events={},held=[],joke={held:false},el={addEventListener:(key,fn)=>events[key]=fn,setPointerCapture:id=>{el.captured=id;},focus:()=>{el.focused=true;}};
 const context=vm.createContext({$:()=>el,g:{joke,holdLaugh:v=>{held.push(v);joke.held=v;}},screen:null});vm.runInContext(app.slice(start,end),context);return{events,held,el};
}
test('指针按下立即憋笑，抬手、取消、丢失捕获和失焦都释放',()=>{
 const {events,held,el}=handlers(),e={button:0,isPrimary:true,pointerId:7,preventDefault(){}};events.pointerdown(e);assert.deepEqual(held,[true]);assert.equal(el.captured,7);assert.equal(el.focused,true);
 for(const event of ['pointerup','pointercancel','lostpointercapture','blur']){events[event](e);assert.equal(held.at(-1),false);}
 events.pointerdown({...e,button:2});assert.equal(held.at(-1),false);
});
test('Enter按住松开，重复键不重复输入，原生无指针点击可切换',()=>{
 const {events,held}=handlers();let prevented=0;const e={code:'Enter',repeat:false,preventDefault(){prevented++;}};events.keydown(e);events.keydown({...e,repeat:true});events.keyup(e);assert.deepEqual(held,[true,false]);assert.equal(prevented,3);
 events.click({detail:0});events.click({detail:0});assert.deepEqual(held,[true,false,true,false]);events.click({detail:1});assert.equal(held.length,4);
});
