export function typingFrame(meta,time){
 const duration=meta.duration;
 const phase=((time%duration)+duration)%duration;
 return meta.sequence[Math.min(meta.sequence.length-1,Math.floor(phase/duration*meta.sequence.length))];
}
export function drawTyping(c,asset,actor,time){
 const m=asset.meta,frame=typingFrame(m,time),scale=99/m.bodyHeight;
 c.drawImage(asset.img,frame%m.columns*m.cellWidth,Math.floor(frame/m.columns)*m.cellHeight,m.cellWidth,m.cellHeight,
  actor.x-m.anchor*scale,actor.y+16-m.footBaseline*scale,m.cellWidth*scale,m.cellHeight*scale);
}
