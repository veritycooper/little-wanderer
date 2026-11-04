/* Little Wanderer pixel world — no external sprite assets or libraries. */
(() => {
  'use strict';
  const canvas = document.getElementById('worldCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', {alpha:false});
  if (!ctx) return;
  const W=400,H=250, unit=4, reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  ctx.imageSmoothingEnabled=false;
  const palette={
    light:{sky:'#e7c9cf',sky2:'#f1d8d5',far:'#cfafb8',hill:'#c297a4',grass:'#b7a0a3',grass2:'#ae9299',edge:'#735762',path:'#d5b5a5',path2:'#e8cabb',tree:'#7a5d67',leaf:'#91747e',leaf2:'#ad8991',roof:'#a46d7f',roof2:'#c48c98',house:'#ebc9bb',house2:'#f5ded0',window:'#f0d2a3',pond:'#98a6b7',pond2:'#c1bdc8',flower:'#f4d9d2',flower2:'#8e5a72',wood:'#8d6870',wood2:'#c5a3a2',cloud:'#f9e8e4',outline:'#69505b'},
    dark:{sky:'#302b43',sky2:'#514255',far:'#64556c',hill:'#70596c',grass:'#705866',grass2:'#644d5e',edge:'#403342',path:'#89737a',path2:'#a38a90',tree:'#493c51',leaf:'#64526b',leaf2:'#796378',roof:'#67475a',roof2:'#987184',house:'#967985',house2:'#b49a9e',window:'#ffe6af',pond:'#66788d',pond2:'#9294a6',flower:'#caa6b6',flower2:'#e3b6bb',wood:'#644959',wood2:'#a47a83',cloud:'#8f829b',outline:'#392d3f'}
  };
  let state={x:57,y:64,location:'meadow',night:false,activity:''};
  let position={x:57,y:64},destination={x:57,y:64},waypoint=null,walking=false;
  let last=0,elapsed=0,frame=0, pauseUntil=0,blinkAt=0, blinkUntil=0, face=-1, indoor=false;
  const rand=(a,b)=>a+Math.random()*(b-a);
  const rect=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h))};
  const line=(x1,y1,x2,y2,c,w=1)=>{ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x1+.5,y1+.5);ctx.lineTo(x2+.5,y2+.5);ctx.stroke()};
  const poly=(points,c)=>{ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);ctx.closePath();ctx.fill()};
  const ellipse=(x,y,rx,ry,c)=>{ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill()};
  function tiles(x,y,pattern,size=3){for(let row=0;row<pattern.length;row++){for(let col=0;col<pattern[row].length;col++){const color=pattern[row][col];if(color!=='.')rect(x+col*size,y+row*size,size,size,color)}}}
  const randHash=(a,b)=>{let n=Math.sin(a*127.1+b*311.7)*43758.5453;return n-Math.floor(n)};
  const meadowPatches=Array.from({length:90},(_,i)=>({x:Math.floor(randHash(i,7)*400),y:147+Math.floor(randHash(i,23)*104),type:i%7}));
  const petals=Array.from({length:24},(_,i)=>({x:randHash(i,59)*400,y:randHash(i,61)*210,phase:randHash(i,67)*6.28}));
  function cloud(x,y,scale,c){
    x=Math.round(x);y=Math.round(y);
    rect(x+12*scale,y,29*scale,6*scale,c);
    rect(x+5*scale,y+6*scale,48*scale,9*scale,c);
    rect(x,y+15*scale,61*scale,7*scale,c);
    rect(x+9*scale,y+22*scale,45*scale,3*scale,c);
  }
  function tree(x,y,s,p,t){
    const size=s;
    rect(x-5*size,y-17*size,10*size,20*size,p.tree);
    rect(x-2*size,y-12*size,3*size,15*size,p.wood);
    const drift=Math.sin(t*.0006+x)*1.3;
    rect(x-21*size+drift,y-48*size,42*size,9*size,p.leaf);
    rect(x-26*size+drift,y-39*size,52*size,22*size,p.leaf2);
    rect(x-24*size+drift,y-17*size,48*size,9*size,p.leaf);
    rect(x-12*size+drift,y-55*size,25*size,8*size,p.leaf2);
    rect(x-17*size+drift,y-37*size,9*size,12*size,p.leaf);
    rect(x+7*size+drift,y-44*size,12*size,8*size,p.leaf);
    rect(x-12*size+drift,y-44*size,7*size,6*size,p.flower);
  }
  function fence(x,y,count,p){for(let i=0;i<count;i++){let xx=x+i*15;rect(xx,y,5,24,p.wood);rect(xx+1,y-3,3,4,p.wood2);rect(xx-2,y+8,16,4,p.wood2);rect(xx-2,y+17,16,4,p.wood2)}}
  function cottage(p,night,t){
    const x=64,y=81;
    rect(x+7,y+7,129,103,p.outline);
    rect(x+11,y+11,121,94,p.house);
    rect(x+15,y+16,113,8,p.house2);
    // Chimney and chimney cap
    rect(x+90,y-29,18,29,p.outline);rect(x+94,y-27,11,27,p.wood);rect(x+87,y-33,24,7,p.roof2);
    // Pixel-tiled roof
    poly([[x-9,y+11],[x+50,y-32],[x+88,y-32],[x+148,y+11],[x+148,y+25],[x-9,y+25]],p.outline);
    poly([[x-5,y+10],[x+52,y-28],[x+86,y-28],[x+144,y+10],[x+144,y+20],[x-5,y+20]],p.roof);
    for(let row=0;row<3;row++)for(let i=0;i<12;i++){let xx=x+row*8+i*12-3,yy=y-12+row*10;if(xx>x+1&&xx<x+142)rect(xx,yy,7,3,(i+row)%2?p.roof2:p.roof)}
    rect(x-10,y+18,160,8,p.roof2);
    // Windows
    for(const wx of [x+22,x+108]){
      rect(wx-3,y+38,22,30,p.outline);
      rect(wx,y+41,16,22,p.window);
      rect(wx+7,y+41,2,22,p.wood);
      rect(wx,y+51,16,2,p.wood);
      rect(wx-5,y+66,26,5,p.wood2);
      if(night){rect(wx+3,y+44,2,3,'#fff8d8');rect(wx+10,y+55,3,2,'#fff8d8')}
    }
    // Door and stepping stone
    rect(x+60,y+52,31,54,p.outline);
    rect(x+64,y+57,23,49,p.wood);
    rect(x+78,y+81,4,4,p.window);
    rect(x+54,y+104,43,5,p.wood2);
    rect(x+58,y+109,35,5,p.path);
    // Tiny house plaque
    rect(x+60,y+25,32,15,p.outline);
    rect(x+63,y+28,26,9,p.house2);
    rect(x+68,y+31,17,3,p.wood);
    // hanging lantern
    rect(x+137,y+40,3,12,p.wood);
    rect(x+132,y+49,13,17,p.outline);
    rect(x+135,y+52,7,11,p.window);
    if(night){ctx.globalAlpha=.14+Math.sin(t*.001)*.03;ellipse(x+139,y+60,26,25,'#ffe7a7');ctx.globalAlpha=1}
  }
  function pond(p,t){
    // Rounded pixel pond
    for(let i=0;i<5;i++){const w=105-i*9,xx=284+i*4.5,yy=180+i*3;rect(xx,yy,w,39-i*5,i===0?p.edge:i===1?p.pond2:p.pond)}
    rect(295,181,82,36,p.pond);
    rect(301,178,65,3,p.pond2);
    for(let i=0;i<3;i++){let y=190+i*9,x=307+Math.sin(t*.0008+i)*5;rect(x,y,18,2,p.pond2)}
    rect(353,199,14,4,p.leaf);rect(358,194,5,6,p.leaf2);
    rect(344,212,7,3,p.flower2);
  }
  function flower(x,y,p,t,color){
    const sway=Math.sin(t*.0013+x)*1.5;
    rect(x,y-8,2,10,p.leaf);
    rect(x-4+sway,y-12,4,4,color);
    rect(x+3+sway,y-12,4,4,color);
    rect(x+sway,y-16,3,4,color);
    rect(x+sway,y-10,3,3,p.window);
    rect(x-3,y-4,4,3,p.leaf2);
  }
  function stones(p){
    const a=[[139,188,28,11],[161,202,29,11],[184,217,38,12],[212,230,44,13],[235,243,46,12]];
    for(const [x,y,w,h] of a){rect(x,y,w,h,p.edge);rect(x+2,y+1,w-4,h-3,p.path);rect(x+4,y+3,w-8,2,p.path2)}
  }
  function world(p,night,t){
    const grad=ctx.createLinearGradient(0,0,0,155);grad.addColorStop(0,p.sky);grad.addColorStop(1,p.sky2);ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
    if(night){
      rect(334,26,23,23,'#fff0c9');rect(343,21,16,13,'#fff0c9');rect(352,32,9,13,p.sky);
      for(let i=0;i<27;i++){const xx=randHash(i,5)*400,yy=randHash(i,9)*111;if(Math.sin(t*.001+i)*.5+.5>.17)rect(xx,yy,2,2,i%3?'#e2ccdc':'#ffe5cf')}
    }else{
      rect(327,25,25,25,'#f9e8c6');rect(331,20,17,35,'#f9e8c6');
      rect(324,31,31,14,'#f9e8c6');
    }
    cloud(26+(t*.0012)%485-65,26,0.68,p.cloud);
    cloud(225+(t*.0005)%510-70,52,.47,p.cloud);
    poly([[0,129],[45,109],[89,125],[135,100],[193,133],[253,111],[317,134],[366,109],[400,120],[400,250],[0,250]],p.far);
    poly([[0,154],[49,145],[103,159],[165,136],[242,154],[302,136],[375,150],[400,138],[400,250],[0,250]],p.hill);
    rect(0,162,400,88,p.grass);
    rect(0,196,400,54,p.grass2);
    for(let i=0;i<10;i++)rect(i*44+8,167+(i%3)*7,24,3,p.grass2);
    for(const patch of meadowPatches){const {x,y,type}=patch;if(type<3){rect(x,y,6,2,p.hill);rect(x+3,y-3,2,3,p.leaf)}else if(type<5){rect(x,y,2,5,p.leaf);rect(x-3,y+3,7,2,p.leaf2)}else rect(x,y,3,3,p.flower2)}
    fence(17,159,6,p);
    tree(35,155,.72,p,t);
    tree(363,148,.75,p,t);
    tree(394,190,.48,p,t);
    cottage(p,night,t);
    stones(p);
    rect(48,177,63,8,p.wood);rect(52,172,55,6,p.wood2);rect(53,169,6,6,p.edge);rect(103,169,6,6,p.edge);
    for(let i=0;i<6;i++)flower(33+i*13,182+(i%2)*4,p,t,i%3===0?p.flower2:p.flower);
    for(let i=0;i<9;i++)flower(207+i*9,163+(i%3)*7,p,t,i%3===0?p.flower2:p.flower);
    pond(p,t);
    for(let i=0;i<5;i++)flower(266+i*14,220+(i%3)*5,p,t,i%2?p.flower:p.flower2);
    // Wooden sign
    rect(241,168,5,30,p.wood);rect(226,164,35,17,p.outline);rect(228,166,31,13,p.wood2);rect(231,170,24,3,p.wood);
  }
  function drawPet(px,py,p,t,night,walk,isIndoors){
    const scale=1.0;
    const x=Math.round(px),y=Math.round(py+(walk?Math.sin(t*.009)*1.2:0));
    // shadow and ears
    ellipse(x,y+14,13,4,isIndoors?'#755664':p.edge);
    rect(x-10,y-22,7,16,'#a47f82');rect(x-8,y-20,4,13,'#edb5b8');
    rect(x+4,y-24,7,17,'#a47f82');rect(x+6,y-22,3,13,'#edb5b8');
    // body outline, cream fur, cheeks
    rect(x-14,y-7,28,20,'#a57d7d');
    rect(x-12,y-9,24,20,'#f0dccb');
    rect(x-9,y-12,18,5,'#f0dccb');
    rect(x-10,y+10,8,5,'#f0dccb');rect(x+3,y+10,8,5,'#f0dccb');
    rect(x-10,y+2,5,3,'#eab8b9');rect(x+6,y+2,5,3,'#eab8b9');
    if(!(t<blinkUntil)){rect(x-7,y-2,3,4,'#5d4650');rect(x+5,y-2,3,4,'#5d4650')}else{rect(x-7,y,4,1,'#5d4650');rect(x+4,y,4,1,'#5d4650')}
    rect(x,y+4,2,2,'#91666f');
    if(walk){rect(x-10,y+13,7,3,'#f0dccb');rect(x+3,y+11,7,5,'#f0dccb')}
    else{rect(x-11,y+12,7,3,'#f0dccb');rect(x+4,y+12,7,3,'#f0dccb')}
  }
  function interior(p,night,t){
    rect(0,0,400,250,night?'#56404e':'#d9b5b6');
    for(let i=0;i<10;i++){rect(i*42,0,3,166,p.house);rect(i*42+12,0,1,166,p.house2)}
    rect(0,168,400,82,p.wood);for(let i=0;i<13;i++){rect(i*34,169,2,81,p.outline);rect(0,183+i*7,400,1,p.wood2)}
    // framed window
    rect(34,35,91,88,p.outline);rect(40,41,79,76,night?'#51455b':'#dbb5c8');
    if(night){rect(88,52,18,17,'#f8dfb6');rect(92,50,9,20,'#f8dfb6')}
    else{cloud(51,59,.6,'#ffebe2')}
    rect(75,41,7,77,p.wood2);rect(40,77,79,6,p.wood2);
    rect(27,123,104,8,p.wood);
    // shelves and book spines
    rect(257,57,112,8,p.wood);rect(267,27,12,30,p.flower2);rect(282,38,11,19,p.house2);rect(298,30,10,27,p.rose||p.roof2);rect(314,22,15,35,p.leaf);rect(331,34,15,23,p.wood2);
    rect(255,117,112,8,p.wood);
    rect(278,89,19,28,p.wood2);rect(281,85,13,5,p.leaf2);rect(311,94,30,23,p.house2);
    // rug
    rect(130,198,148,38,p.roof2);rect(138,204,132,25,p.house);rect(150,210,105,13,p.roof2);
    // bed
    rect(25,167,110,56,p.outline);rect(29,157,105,49,p.wood);rect(38,160,89,38,p.flower);rect(40,164,29,20,p.house2);rect(75,169,51,33,p.roof2);rect(21,207,117,12,p.wood2);
    // cosy table
    rect(305,178,65,9,p.wood2);rect(312,186,7,43,p.wood);rect(357,186,7,43,p.wood);
    rect(326,155,20,22,p.outline);rect(328,158,16,17,p.house2);rect(330,151,12,9,p.leaf);
    // wall art
    rect(165,43,51,44,p.outline);rect(169,47,43,36,p.house2);rect(175,63,31,14,p.hill);rect(185,52,11,12,p.flower2);
    // cozy ambient pixels
    if(night){ctx.globalAlpha=.23;ellipse(327,167,45,35,'#ffe9b8');ctx.globalAlpha=1}
  }
  function update(dt,t){
    if(state.location==='cottage'){walking=false;return}
    const tx=36+destination.x*3.22,ty=126+destination.y*.93;
    let dx=tx-position.x,dy=ty-position.y;
    const distance=Math.hypot(dx,dy);
    const speed=9.3; // approximately 2.5 minutes to cross the full garden
    if(distance>.35){
      const step=Math.min(distance,dt*speed);
      position.x+=dx/distance*step;position.y+=dy/distance*step;
      walking=true;face=dx>=0?1:-1;
    }else walking=false;
    if(!walking&&t>pauseUntil&&t-lastWander>18000){
      // Gentle intermediate idle wandering that does not alter the recorded activity.
      lastWander=t;pauseUntil=t+rand(6000,16000);
      destination={x:Math.min(78,Math.max(11, (position.x-36)/3.22+rand(-5,5))),y:Math.min(77,Math.max(52,(position.y-126)/.93+rand(-3,3)))};
    }
  }
  let lastWander=0;
  function draw(t){
    const dt=Math.min((t-last)/1000||0,.08);last=t;elapsed+=dt;
    const p=state.night?palette.dark:palette.light;
    ctx.clearRect(0,0,W,H);
    const home=state.location==='cottage';
    update(reduced.matches?0:dt,t);
    if(home){interior(p,state.night,t);drawPet(209,191,p,t,state.night,false,true)}
    else{
      world(p,state.night,t);
      drawPet(position.x,position.y,p,t,state.night,walking,false);
    }
    if(t>blinkAt){blinkUntil=t+145;blinkAt=t+rand(2100,5200)}
    if(!reduced.matches)requestAnimationFrame(draw);
  }
  function setState(incoming,initial=false){
    if(!incoming)return;
    const previousLocation=state.location;
    const next={...state,...incoming};
    const px=36+(Math.max(5,Math.min(82,Number(next.x)||57)))*3.22;
    const py=126+(Math.max(45,Math.min(78,Number(next.y)||64)))*.93;
    if(initial){position={x:px,y:py};destination={x:next.x,y:next.y}}
    else if(next.x!==state.x||next.y!==state.y){destination={x:next.x,y:next.y};pauseUntil=performance.now()+20000;lastWander=performance.now()}
    state=next;
    if(previousLocation!==state.location){lastWander=performance.now();walking=false}
    if(reduced.matches)draw(performance.now());
  }
  function bubblePosition(){
    const bubble=document.getElementById('bubble');
    if(!bubble)return;
    if(state.location==='cottage'){bubble.style.left='53%';bubble.style.bottom='36%'}
    else{bubble.style.left=Math.max(16,Math.min(85,(position.x/W)*100))+'%';bubble.style.bottom=Math.max(18,Math.min(66,(H-position.y+28)/H*100))+'%'}
  }
  window.PixelWorld={setState,setNight:(night)=>{state.night=night},getPosition:()=>({...position}),getScene:()=>state.location};
  if(reduced.matches){draw(0)}else requestAnimationFrame((t)=>{lastWander=t;draw(t)});
  setInterval(bubblePosition,120);
})();