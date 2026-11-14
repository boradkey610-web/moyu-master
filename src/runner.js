export const RUNNER_WIDTH = 480;
export const RUNNER_HEIGHT = 112;
const PLAYER_X = 66;
const PLAYER_WIDTH = 26;
const GROUND = 87;

export function createRunner() {
 return {started:false,clock:0,height:0,velocity:0,obstacle:{x:420,width:22,height:24},streak:0,cleared:0,hitLeft:0,feedback:'',feedbackLeft:0};
}

export function jumpRunner(runner) {
 if(runner.hitLeft>0||runner.height>0||runner.velocity>0)return false;
 runner.started=true;
 runner.velocity=180;
 return true;
}

export function stepRunner(runner,dt) {
 if(!runner.started)return 0;
 runner.clock+=dt;
 runner.feedbackLeft=Math.max(0,runner.feedbackLeft-dt);
 if(runner.hitLeft>0){runner.hitLeft=Math.max(0,runner.hitLeft-dt);return 0;}
 runner.height=Math.max(0,runner.height+runner.velocity*dt-200*dt*dt);
 runner.velocity=runner.height>0?runner.velocity-400*dt:0;
 const obstacle=runner.obstacle;
 obstacle.x-=(125+Math.min(runner.streak,5)*4)*dt;
 if(obstacle.x<PLAYER_X+PLAYER_WIDTH-3&&obstacle.x+obstacle.width>PLAYER_X+3&&runner.height<obstacle.height-3){
  runner.streak=0;runner.height=0;runner.velocity=0;runner.hitLeft=.65;
  runner.feedback='撞到啦 · 连击重来';runner.feedbackLeft=1.2;
  obstacle.x=RUNNER_WIDTH+32;
  return 0;
 }
 if(obstacle.x+obstacle.width<PLAYER_X){
  runner.streak++;runner.cleared++;
  const reward=4+Math.min(4,runner.streak-1);
  obstacle.x=PLAYER_X+260+(runner.cleared%3)*24;
  obstacle.height=20+(runner.cleared%3)*4;
  runner.feedback=`+${reward}`;runner.feedbackLeft=.8;
  return reward;
 }
 return 0;
}

export function drawRunner(canvas,runner,stopping,renderer) {
 const c=canvas.getContext('2d');
 c.clearRect(0,0,RUNNER_WIDTH,RUNNER_HEIGHT);
 const office=renderer.art.office;
 if(office)c.drawImage(office.img,45,0,1015,164,0,0,RUNNER_WIDTH,GROUND+1);
 else{c.fillStyle='#f3eadc';c.fillRect(0,0,RUNNER_WIDTH,GROUND+1);}
 c.fillStyle='#fff5df40';c.fillRect(0,0,RUNNER_WIDTH,GROUND+1);
 const wood=c.createLinearGradient(0,GROUND,0,RUNNER_HEIGHT);
 wood.addColorStop(0,'#d7b784');wood.addColorStop(1,'#bb9364');
 c.fillStyle=wood;c.fillRect(0,GROUND,RUNNER_WIDTH,RUNNER_HEIGHT-GROUND);
 c.strokeStyle='#a7855b';c.lineWidth=2;c.beginPath();c.moveTo(0,GROUND+1);c.lineTo(RUNNER_WIDTH,GROUND+1);c.stroke();
 c.strokeStyle='#f4dcb27a';c.lineWidth=1;
 for(let i=0;i<6;i++){
  const x=(i*100-runner.clock*125%100);c.beginPath();c.moveTo(x,GROUND+10);c.lineTo(x+65,GROUND+10);c.stroke();
 }
 const obstacle=runner.obstacle,x=obstacle.x,y=GROUND-obstacle.height;
 c.lineWidth=1.5;
 if(runner.cleared%2===0){
  c.fillStyle='#bd9a73';c.strokeStyle='#957654';
  c.beginPath();c.roundRect(x,y+2,obstacle.width,obstacle.height-2,2);c.fill();c.stroke();
  c.fillStyle='#f6edd6';c.strokeStyle='#b6a082';
  for(let i=0;i<3;i++){c.beginPath();c.roundRect(x+2-i,y+5+i*5,obstacle.width-2,4,1);c.fill();c.stroke();}
  c.fillStyle='#8ca88a';c.fillRect(x+5,y,10,4);
 }else{
  c.strokeStyle='#967d66';c.fillStyle='#f9f3e7';
  c.beginPath();c.ellipse(x+obstacle.width-1,y+12,5,7,0,0,Math.PI*2);c.stroke();
  c.beginPath();c.roundRect(x,y+4,obstacle.width-3,obstacle.height-4,3);c.fill();c.stroke();
  c.fillStyle='#876551';c.beginPath();c.ellipse(x+(obstacle.width-3)/2,y+4,(obstacle.width-4)/2,3,0,0,Math.PI*2);c.fill();
  c.strokeStyle='#c4ad8b';c.beginPath();c.moveTo(x+6,y-2);c.quadraticCurveTo(x+10,y-6,x+7,y-10);c.stroke();
 }
 const feet=GROUND-runner.height;
 c.fillStyle='#715b4230';c.beginPath();c.ellipse(PLAYER_X+13,GROUND+2,16,3,0,0,Math.PI*2);c.fill();
 c.save();
 if(runner.hitLeft>0&&Math.floor(runner.hitLeft*14)%2)c.globalAlpha=.45;
 const phase=Math.floor(runner.clock*7)%4;
 if(!runner.started)renderer.sprite(c,'idle',0,0,PLAYER_X+13,feet,40);
 else if(runner.height>0||phase%2===0)renderer.sprite(c,'side_steps',phase<2?0:1,0,PLAYER_X+13,feet,40);
 else renderer.sprite(c,'idle',0,0,PLAYER_X+13,feet,40);
 c.restore();
 c.textAlign='center';c.textBaseline='middle';
 if(!runner.started){
  c.fillStyle='#fffaf0e8';c.strokeStyle='#cbb89a';c.lineWidth=1;
  c.beginPath();c.roundRect(174,25,174,37,18);c.fill();c.stroke();
  c.fillStyle='#76614c';c.font='bold 16px "PingFang SC",sans-serif';c.fillText('点按起跳，越障加薪',261,44);
 }else if(runner.feedbackLeft>0){
  c.font='bold 18px "PingFang SC",sans-serif';c.lineWidth=4;c.strokeStyle='#fff9eb';c.strokeText(runner.feedback,258,29);
  c.fillStyle=runner.hitLeft>0?'#b5735c':'#a87735';c.fillText(runner.feedback,258,29);
 }else if(runner.height===0&&obstacle.x<140&&obstacle.x>110){
  c.fillStyle='#9f7540';c.font='bold 14px "PingFang SC",sans-serif';c.fillText('跳！',145,45);
 }
 if(stopping){
  c.fillStyle='#f5f0e5d9';c.fillRect(0,0,RUNNER_WIDTH,RUNNER_HEIGHT);
  c.fillStyle='#89755c';c.font='bold 17px "PingFang SC",sans-serif';c.fillText('正在收好游戏…',RUNNER_WIDTH/2,RUNNER_HEIGHT/2);
 }
}
