import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const code=app.slice(app.indexOf('let jokePress='),app.indexOf("for(const type of ['pointerdown'"));
function gesture(){
 const actions=[],context=vm.createContext({g:{jokeAction:a=>{actions.push(a);return true;}},beep(){}});
 vm.runInContext(code,context);
 const send=(type,x,y,time,pointerId=1)=>context.jokeGesture({type,clientX:x,clientY:y,timeStamp:time,pointerId,currentTarget:{setPointerCapture(){}}});
 return {actions,send};
}
test('上滑换一条，横滑和向下拖动不触发',()=>{
 const {actions,send}=gesture();
 send('pointerdown',100,100,1);send('pointerup',103,50,100);assert.deepEqual(actions,['next']);
 send('pointerdown',100,100,200);send('pointerup',150,95,300);
 send('pointerdown',100,100,400);send('pointerup',100,150,500);assert.deepEqual(actions,['next']);
});
test('单击不点赞，350毫秒内第二次点击点赞，慢点击不触发',()=>{
 const {actions,send}=gesture();
 send('pointerdown',100,100,10);send('pointerup',100,100,30);assert.deepEqual(actions,[]);
 send('pointerdown',100,100,100);send('pointerup',100,100,130);assert.deepEqual(actions,['like']);
 send('pointerdown',100,100,200);send('pointerup',100,100,220);
 send('pointerdown',100,100,700);send('pointerup',100,100,720);assert.deepEqual(actions,['like']);
});
test('滑动、取消和其他指针不会串成一次双击',()=>{
 const {actions,send}=gesture();
 send('pointerdown',100,100,10);send('pointerup',100,100,30);
 send('pointerdown',100,100,60);send('pointercancel',100,100,70);send('pointerup',100,100,80);
 send('pointerdown',100,100,100);send('pointerup',100,100,130,2);assert.deepEqual(actions,[]);
 send('pointercancel',100,100,140);
 send('pointerdown',100,100,200);send('pointerup',100,60,220);assert.deepEqual(actions,['next']);
 send('pointerdown',100,100,250);send('pointerup',100,100,270);assert.deepEqual(actions,['next']);
});
