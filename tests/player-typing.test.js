import test from 'node:test';
import assert from 'node:assert/strict';
import {typingFrame,drawTyping} from '../dev/player-typing.js';
const meta={sequence:[0,1,2,3,4,5,4,3,2,1],duration:1,columns:6,cellWidth:384,cellHeight:512,anchor:192,footBaseline:500,bodyHeight:462};
test('typing loop uses every drawing and returns via adjacent frames without a hard reset',()=>{
 const sequence=Array.from({length:10},(_,i)=>typingFrame(meta,(i+.01)/10));
 assert.deepEqual(sequence,meta.sequence);
 for(let i=0;i<sequence.length;i++)assert.ok(Math.abs(sequence[i]-sequence[(i+1)%sequence.length])===1);
 assert.equal(typingFrame(meta,0),typingFrame(meta,1));assert.equal(typingFrame(meta,-.05),1);
});
test('typing sprites preserve source cells, foot anchor and body scale',()=>{
 const calls=[],c={drawImage(...args){calls.push(args);}},actor={x:545,y:515};
 drawTyping(c,{meta,img:{}},actor,.51);
 const call=calls[0];assert.equal(call[1],5*384);assert.equal(call[2],0);
 assert.equal(call[3],384);assert.equal(call[4],512);
 assert.ok(Math.abs(call[6]+meta.footBaseline*99/meta.bodyHeight-531)<1e-10);
});
