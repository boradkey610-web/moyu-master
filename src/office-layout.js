export function createOfficeLayout(seatCount){
 const rows=seatCount/4,scale=rows===4?.8:1,xs=[65,355,655];
 const seatYs=rows===2?[360,680]:rows===4?[240,420,600,780]:[280,515,750];
 const ys=rows===2?[145,465,785]:rows===4?[105,284,464,644,824]:[115,350,585,820];
 const seats=seatYs.flatMap((y,row)=>[210,500].flatMap((center,col)=>[-1,1].map((side,i)=>({id:row*4+col*2+i,x:center+side*45*scale,y,row,col}))));
 const desks=seatYs.flatMap((y,row)=>[210,500].map((center,col)=>({zone:row*2+col,row,col,center,x:center-116*scale,y:y-152*scale,w:238*scale,h:151*scale,seatY:y})));
 const nodes=ys.flatMap((y,row)=>xs.map((x,col)=>({x,y,id:row*3+col})));
 const patrolStops=desks.map(d=>({x:d.center,y:ys[d.row+1],zone:d.zone}));
 const exits=nodes.filter(n=>n.x===xs[0]||n.x===xs.at(-1)||n.y===ys[0]||n.y===ys.at(-1)).map(node=>({node,point:{x:node.x===65?12:node.x===655?708:node.x,y:node.x===65||node.x===655?node.y:node.y===ys[0]?55:885}}));
 return{seatCount,scale,seats,desks,xs,ys,nodes,patrolStops,exits};
}
