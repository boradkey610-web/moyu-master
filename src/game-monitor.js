const SCREENS=[{x:440,y:325,width:256,height:118},{x:902,y:325,width:255,height:118}];
export function monitorRect(meta,seat,layout){
 const desk=layout?.desks.find(d=>d.row===seat.row&&d.col===seat.col);
 if(layout&&!desk)return null;
 const source=SCREENS[seat.id%2],scaleX=(desk?.w??238)/(meta.bounds[2]-meta.bounds[0]),scaleY=(desk?.h??151)/(meta.bounds[3]-meta.bounds[1]);
 return{x:(desk?.x??(seat.col?384:94))+(source.x-meta.bounds[0])*scaleX,y:(desk?.y??(128+seat.row*235))+(source.y-meta.bounds[1])*scaleY,width:source.width*scaleX,height:source.height*scaleY};
}
export function paintMonitor(c,rect,time){
 c.save();c.beginPath();c.roundRect(rect.x,rect.y,rect.width,rect.height,1);c.clip();
 c.translate(rect.x,rect.y);c.scale(rect.width/256,rect.height/128);
 c.fillStyle='#78aaa0';c.fillRect(0,0,256,128);
 c.fillStyle='#c4c69a';c.fillRect(0,28,256,100);
 // A tiny looping racer: scrolling scenery, lane markers and a steering car.
 c.fillStyle='#71876b';
 for(let i=0;i<7;i++){
  const y=(i*27+time*38)%158-20;
  c.beginPath();c.arc(34+Math.sin(i*2)*8,y,12,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(221+Math.sin(i*3)*8,y+8,9,0,Math.PI*2);c.fill();
 }
 c.fillStyle='#445c62';c.beginPath();c.moveTo(111,0);c.lineTo(145,0);c.lineTo(208,128);c.lineTo(48,128);c.closePath();c.fill();
 c.strokeStyle='#edd7a5';c.lineWidth=3;c.beginPath();c.moveTo(111,0);c.lineTo(48,128);c.moveTo(145,0);c.lineTo(208,128);c.stroke();
 c.strokeStyle='#e6dfb9';c.lineWidth=2;
 for(let i=0;i<6;i++){const y=(i*27+time*65)%158-24;c.beginPath();c.moveTo(128,y);c.lineTo(128,y+11);c.stroke();}
 const x=128+Math.sin(time*1.8)*24,y=92;
 c.fillStyle='#253b41';c.fillRect(x-13,y-14,26,30);
 c.fillStyle='#df9d54';c.beginPath();c.roundRect(x-10,y-18,20,34,4);c.fill();
 c.fillStyle='#b5d6c7';c.fillRect(x-7,y-10,14,8);c.fillStyle='#f8d68d';c.fillRect(x-7,y+10,14,3);
 c.fillStyle='#1d3c49';c.fillRect(0,0,256,15);c.fillStyle='#e8d69e';
 for(let i=0;i<5;i++)c.fillRect(10+i*7,5,4,5);
 c.fillStyle='#85c1ae';c.fillRect(199,5,Math.round(25+Math.sin(time)*12),5);
 // A restrained glass highlight keeps the original monitor material.
 c.fillStyle='#f4ffff16';c.beginPath();c.moveTo(171,0);c.lineTo(189,0);c.lineTo(61,128);c.lineTo(43,128);c.closePath();c.fill();
 c.restore();
}
