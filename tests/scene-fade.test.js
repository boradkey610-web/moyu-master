import test from 'node:test';
import assert from 'node:assert/strict';
import {SceneFade} from '../dev/scene-fade.js';
import {Game,activities} from '../src/engine.js';

test('dance fade uses actual warmup and work fade ends within stop time',()=>{
 const game=new Game(2,1);game.setActivity('dance');
 const fade=new SceneFade();fade.to(1,game.player.warmup);
 assert.equal(fade.value,0);
 assert.equal(fade.step(game.player.warmup/2),.5);
 assert.equal(fade.step(game.player.warmup/2),1);
 assert.equal(fade.transition,null);
 fade.to(0,activities.dance.stop);
 assert.equal(fade.step(activities.dance.stop/2),.5);
 assert.equal(fade.step(activities.dance.stop/2),0);
 assert.equal(fade.transition,null);
});
test('reversing an unfinished fade preserves current opacity',()=>{
 const fade=new SceneFade();fade.to(1,.8);fade.step(.3);
 const current=fade.value;fade.to(0,1);
 assert.equal(fade.value,current);
 assert.equal(fade.step(0),current);
 assert.ok(fade.step(.2)<current);
 const next=fade.value;fade.to(1,.8);assert.equal(fade.value,next);
 assert.ok(fade.step(.1)>next);assert.equal(fade.step(1),1);
});
test('paused fade and completed fade remain stable, values stay bounded',()=>{
 const fade=new SceneFade();fade.to(1,.8);
 assert.equal(fade.step(0),0);assert.equal(fade.step(-1),0);
 assert.equal(fade.step(2),1);assert.equal(fade.step(2),1);
 fade.to(-5,0);assert.equal(fade.value,0);
 fade.to(5,0);assert.equal(fade.value,1);
});
