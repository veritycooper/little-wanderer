/* Little Wanderer pixel world: two natural-coloured outdoor areas and a cosy cottage. */
(() => {
  'use strict';
  const canvas=document.getElementById('worldCanvas');
  if(!canvas) return;
  const ctx=canvas.getContext('2d',{alpha:false});
  if(!ctx) return;
  const W=400,H=250;
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  ctx.imageSmoothingEnabled=false;
  const colours={
    day:{
      sky:'#9ccfe9',skyLow:'#d6f0f7',sun:'#ffefd0',cloud:'#fcfaf2',hillFar:'#90c2a7',hill:'#72af86',
      grass:'#7fba78',grassDeep:'#6eaa69',grassShade:'#62995d',ground:'#456d50',
      leaf:'#57975f',leaf2:'#72b074',leaf3:'#91c37e',leafDark:'#39764c',trunk:'#806551',trunkLight:'#ac855d',
      roof:'#ad6e59',roofLight:'#cf9076',wall:'#f4e3c9',wallShadow:'#d8b99f',
      dark:'#554f4d',wood:'#8c654b',woodLight:'#bf9670',path:'#d3b99a',pathLight:'#eadbc1',
      water:'#6eafcc',waterLight:'#a8d8e8',waterDeep:'#4b8daf',
      flower:'#f2bfca',flower2:'#f2e7b3',flower3:'#d7c4ef',
      window:'#b8e0e5',glow:'#fff6bd',stone:'#a7a9a0',stoneLight:'#d5d1bd',
      indoorWall:'#edd9b7',indoorWall2:'#f7e7ca',floor:'#ad8667',floorLight:'#c9a17d',furniture:'#755742',furnitureLight:'#b8926a',
      night:false
    },
    night:{
      sky:'#20324c',skyLow:'#425b77',sun:'#fff0c9',cloud:'#65788a',hillFar:'#425d64',hill:'#3d6a5d',
      grass:'#416e57',grassDeep:'#355f4c',grassShade:'#2d5745',ground:'#283d35',
      leaf:'#385a4c',leaf2:'#48775e',leaf3:'#5c8067',leafDark:'#2b4c41',trunk:'#5d5148',trunkLight:'#826953',
      roof:'#784e4d',roofLight:'#9d6b65',wall:'#b9a38e',wallShadow:'#927e72',
      dark:'#394044',wood:'#735646',woodLight:'#ad8567',path:'#a49487',pathLight:'#c2b2a0',
      water:'#3f7193',waterLight:'#789eb2',waterDeep:'#2c5879',
      flower:'#c7a0b5',flower2:'#d0c19a',flower3:'#a996d0',
      window:'#ffe6a8',glow:'#ffe4a1',stone:'#767e7e',stoneLight:'#a3a9a0',
      indoorWall:'#927c70',indoorWall2:'#af9986',floor:'#705443',floorLight:'#957358',furniture:'#4e3e37',furnitureLight:'#8b6751',
      night:true
    }
  };
  const rand=(a,b)=>a+Math.random()*(b-a);
  const hash=(i,j)=>{const v=Math.sin(i*127.1+j*311.7)*43758.5453;return v-Math.floor(v)};
  const r=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))};
  function polygon(points,color){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(...points[0]);for(let i=1;i<points.length;i++)ctx.lineTo(...points[i]);ctx.closePath();ctx.fill()}
  function oval(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill()}
  function shapeOutline(x,y,w,h,c,inner,pad=2){r(x,y,w,h,c);r(x+pad,y+pad,w-pad*2,h-pad*2,inner)}
  function sky(p,t){
    const g=ctx.createLinearGradient(0,0,0,170);g.addColorStop(0,p.sky);g.addColorStop(1,p.skyLow);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    if(p.night){
      r(322,24,22,24,p.sun);r(327,19,12,31,p.sun);r(340,25,10,19,p.sky);
      for(let i=0;i<37;i++){const x=hash(i,17)*390+5,y=hash(i,33)*123+3;const shine=hash(i,45)>.5;if(shine||Math.sin(t*.0009+i)>-.25)r(x,y,i%7?2:3,i%7?2:3,i%4?p.sun:'#d8d4fa')}
    }else{
      r(324,25,25,25,p.sun);r(319,31,35,13,p.sun);r(330,19,13,36,p.sun);
    }
    cloud((t*.0014+12)%495-90,27,1.05,p.cloud);
    cloud((t*.00085+240)%520-100,74,.6,p.cloud);
  }
  function cloud(x,y,scale,c){
    ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(scale,scale);
    r(12,0,27,7,c);r(4,7,47,9,c);r(0,16,59,9,c);r(12,25,37,4,c);ctx.restore();
  }
  function land(p,grove=false){
    polygon([[0,136],[36,119],[83,127],[131,110],[187,128],[233,117],[298,133],[348,113],[400,126],[400,250],[0,250]],p.hillFar);
    polygon([[0,160],[62,141],[118,155],[180,132],[249,156],[311,140],[400,154],[400,250],[0,250]],p.hill);
    r(0,160,400,90,p.grass);r(0,204,400,46,p.grassDeep);
    for(let i=0;i<78;i++){
      const x=Math.floor(hash(i,3)*396),y=Math.floor(166+hash(i,8)*83);
      r(x,y,4+(i%3)*2,2,grove?p.grassShade:p.grassDeep);
      if(i%3===0){r(x+2,y-4,2,5,p.leaf3);r(x-2,y-1,3,3,p.leaf)}
    }
  }
  function tree(x,y,s,p,t,front=false){
    ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(s,s);
    const sway=Math.round(Math.sin(t*.0005+x)*1.1);
    r(-6,-67,13,71,p.trunk);r(-1,-64,4,65,p.trunkLight);
    r(-32+sway,-102,64,28,p.leafDark);r(-40+sway,-89,78,23,p.leaf);r(-35+sway,-72,70,23,p.leaf2);
    r(-24+sway,-116,50,18,p.leaf);r(-15+sway,-125,32,11,p.leaf2);
    r(-31+sway,-99,15,12,p.leaf3);r(10+sway,-112,15,11,p.leaf3);
    r(19+sway,-83,15,9,p.leaf3);r(-28+sway,-66,13,10,p.leaf);
    if(front){r(-32+sway,-75,11,9,p.leafDark)}
    ctx.restore();
  }
  function flowers(p,area){
    // Carefully placed on exposed grass, outside the cottage footprint, pond and walking path.
    const meadow=[[22,211],[39,222],[54,209],[75,234],[97,217],[248,168],[267,180],[277,174],[258,237],[300,238],[385,232]];
    const grove=[[20,229],[38,217],[61,233],[83,214],[110,234],[176,237],[226,214],[272,234],[359,229],[386,221]];
    for(const [i,xy] of (area==='grove'?grove:meadow).entries()) flower(xy[0],xy[1],p,[p.flower,p.flower2,p.flower3][i%3]);
  }
  function flower(x,y,p,c){
    r(x,y-9,2,10,p.leafDark);r(x-3,y-5,4,3,p.leaf);
    r(x-4,y-14,4,4,c);r(x+2,y-14,4,4,c);r(x-1,y-18,4,5,c);r(x-1,y-12,4,4,p.flower2);
  }
  function bushes(p,area){
    const clumps=area==='grove'?[[97,169],[184,159],[258,173],[329,170]]:[[20,174],[196,167],[387,168]];
    for(const [x,y] of clumps){
      r(x-13,y-6,25,13,p.leafDark);r(x-19,y-11,37,10,p.leaf);r(x-10,y-16,23,10,p.leaf2);
      r(x-5,y-16,8,4,p.leaf3);
    }
  }
  function fence(x,y,n,p){
    for(let i=0;i<n;i++){const xx=x+i*16;r(xx,y-12,5,23,p.trunk);r(xx+1,y-15,3,5,p.woodLight);r(xx-3,y-6,18,4,p.woodLight);r(xx-3,y+2,18,3,p.wood)}
  }
  function house(p,t){
    // Cottage: the main doorway is precisely aligned with the path.
    const x=64,y=89;
    r(x+3,y+13,131,88,p.dark);r(x+8,y+19,121,82,p.wall);
    r(x+13,y+32,112,7,p.wallShadow);
    r(x+13,y+47,112,4,p.wallShadow);
    r(x+16,y+63,107,4,p.wallShadow);
    r(x+88,y-25,20,33,p.dark);r(x+92,y-22,12,28,p.trunk);r(x+85,y-30,27,7,p.roofLight);
    polygon([[x-12,y+14],[x+43,y-32],[x+83,y-32],[x+146,y+14],[x+146,y+27],[x-12,y+27]],p.dark);
    polygon([[x-6,y+13],[x+45,y-27],[x+81,y-27],[x+141,y+13],[x+141,y+22],[x-6,y+22]],p.roof);
    for(let row=0;row<3;row++)for(let i=0;i<10;i++){
      const xx=x+row*5+i*13-4,yy=y-10+row*10;if(xx>x-5&&xx<x+140)r(xx,yy,8,3,(i+row)%2?p.roofLight:p.roof);
    }
    r(x-12,y+22,158,7,p.roofLight);
    // The windows sit on either side of the door, never overlap it.
    for(const dx of [22,110]){
      r(x+dx-3,y+43,22,28,p.dark);r(x+dx,y+46,16,22,p.window);
      r(x+dx+7,y+46,2,22,p.wood);r(x+dx,y+56,16,2,p.wood);
      r(x+dx-4,y+71,24,4,p.woodLight);
      if(p.night){r(x+dx+3,y+49,3,4,p.glow)}
    }
    r(x+61,y+43,29,58,p.dark);r(x+64,y+46,23,55,p.wood);
    r(x+68,y+47,16,3,p.woodLight);r(x+82,y+76,3,3,p.glow);
    r(x+59,y+100,33,5,p.woodLight);
    r(x+53,y+105,46,5,p.path);
    // Flower box and doorstep
    r(x+13,y+72,31,7,p.wood);r(x+14,y+70,28,4,p.leaf2);
    r(x+17,y+66,3,4,p.flower);r(x+28,y+63,3,7,p.flower2);
    r(x+103,y+72,31,7,p.wood);r(x+106,y+68,3,4,p.flower3);
    // Lantern
    r(x+138,y+43,3,10,p.dark);r(x+135,y+51,10,14,p.dark);r(x+137,y+53,6,10,p.glow);
    if(p.night){ctx.globalAlpha=.15;oval(x+140,y+61,25,25,p.glow);ctx.globalAlpha=1}
  }
  function path(p){
    // Pixel stepping stones centred on cottage door (x=139).
    const stones=[[128,203,27,10],[138,218,29,11],[153,234,37,10],[184,246,43,9]];
    for(const [x,y,w,h] of stones){r(x,y,w,h,p.ground);r(x+2,y+1,w-4,h-3,p.path);r(x+5,y+3,w-10,2,p.pathLight)}
  }
  function pond(p,t){
    // The complete pond occupies x 280–387, y 185–230. Reeds stay beyond the rim.
    r(292,184,79,6,p.grassShade);r(284,190,96,10,p.grassShade);r(279,200,108,17,p.grassShade);r(287,217,95,9,p.grassShade);
    r(295,189,76,4,p.waterLight);r(289,196,89,8,p.water);r(284,204,98,12,p.water);
    r(292,216,83,6,p.waterDeep);r(304,222,61,3,p.waterLight);
    for(let i=0;i<3;i++){const x=305+i*21+Math.sin(t*.0008+i)*3,y=198+i*7;r(x,y,13,2,p.waterLight)}
    r(301,181,2,12,p.leafDark);r(305,183,2,11,p.leaf);r(373,186,2,10,p.leafDark);
    r(356,216,15,5,p.leaf);r(361,211,6,6,p.leaf2);r(364,211,3,3,p.flower2);
    for(const [x,y] of [[284,232],[390,207],[379,236]]){r(x,y-10,2,11,p.leaf);r(x-2,y-7,3,4,p.leaf2)}
  }
  function meadow(p,t){
    sky(p,t);land(p);
    tree(23,157,.68,p,t);tree(382,160,.78,p,t);
    fence(14,177,6,p);
    house(p,t);path(p);
    bushes(p,'meadow');pond(p,t);
    // Raised kitchen garden, clearly separated from pond and footpath.
    r(27,185,68,7,p.wood);r(31,178,60,8,p.ground);
    for(let i=0;i<5;i++){const x=36+i*11;r(x,174,2,8,p.leafDark);r(x-4,171,10,5,p.leaf2);r(x,168,3,5,p.leaf3)}
    flowers(p,'meadow');
  }
  function log(p,x,y,w,h){r(x,y,w,h,p.trunk);r(x+4,y+2,w-8,h-4,p.trunkLight);r(x+6,y+2,3,h-4,p.wood)}
  function mushroom(x,y,p,colour){
    r(x-1,y+1,5,8,p.wall);r(x-7,y-6,17,8,colour);r(x-4,y-10,11,5,colour);
    r(x-3,y-6,3,3,p.flower2);r(x+4,y-3,2,2,p.flower2);
  }
  function grove(p,t){
    sky(p,t);land(p,true);
    // Forest framing: trees in the distance and darker upper canopy.
    for(const [x,y,s] of [[18,165,.9],[99,152,.75],[236,146,.73],[391,161,1.1]]){
      tree(x,y,s,p,t);
    }
    r(0,0,14,110,p.leafDark);r(0,0,95,18,p.leaf);r(77,0,68,13,p.leaf2);
    r(315,0,85,20,p.leafDark);r(357,0,43,67,p.leaf);
    r(0,158,400,5,p.grassShade);
    // Curving stone trail through the middle of the clearing.
    for(const [x,y,w] of [[168,166,24],[179,181,33],[168,200,30],[178,223,36],[181,245,45]]){
      r(x,y,w,10,p.ground);r(x+2,y+1,w-4,8,p.stone);r(x+5,y+2,w-9,3,p.stoneLight);
    }
    // Crystal circle: mystical but grounded in the woodland.
    for(const [x,y] of [[256,192],[275,202],[285,222],[253,229],[232,217]]){
      r(x-5,y+2,11,7,p.ground);r(x-3,y-12,7,17,p.stone);r(x-1,y-17,3,7,p.stoneLight);
    }
    r(266,204,4,13,p.flower3);r(259,211,2,5,p.glow);
    // A woodland creek instead of another pond.
    polygon([[303,162],[316,165],[311,183],[326,195],[330,213],[354,234],[383,250],[339,250],[318,232],[307,217],[301,201],[295,185]],p.grassShade);
    polygon([[307,168],[313,168],[307,185],[320,201],[323,218],[345,243],[364,250],[349,250],[320,227],[314,214],[302,199],[301,186]],p.water);
    for(const [x,y] of [[310,178],[312,198],[321,216],[336,237]])r(x,y,10,3,p.waterLight);
    // Log bridge crosses the creek close to lower right.
    log(p,286,214,56,10);r(292,208,4,6,p.trunk);r(331,208,4,6,p.trunk);
    for(const [x,y] of [[37,207],[65,232],[105,199],[142,221],[219,183],[346,232]])mushroom(x,y,p,(x%2)?p.flower3:p.flower);
    bushes(p,'grove');flowers(p,'grove');
    // Nearby cabin sign to give the second biome a sense of direction.
    r(116,170,4,29,p.wood);r(105,162,31,15,p.trunk);r(107,164,27,11,p.woodLight);
    r(113,169,12,3,p.wall);
  }
  function hearth(p,t){
    // Stone fireplace on the right with a gentle flicker at night.
    r(300,107,78,90,p.dark);r(305,112,68,84,p.stone);r(311,141,55,54,p.dark);
    r(299,107,80,10,p.stoneLight);r(302,115,74,5,p.stone);
    r(312,177,56,18,p.ground);r(318,180,44,6,p.wood);
    const flame=Math.sin(t*.006);
    r(327,165,25,22,'#b75c38');r(332,158+flame*2,15,23,'#e69b46');r(336,165+flame*2,8,14,'#ffe2a1');
    if(p.night){ctx.globalAlpha=.14;oval(338,169,64,65,'#ffe1a4');ctx.globalAlpha=1}
  }
  function bookshelf(p){
    r(174,41,91,117,p.dark);r(179,46,81,108,p.wood);
    for(const y of [76,112,145])r(178,y,83,6,p.woodLight);
    for(let row=0;row<3;row++){
      let x=185,y=54+row*35;
      for(let i=0;i<9;i++){
        const heights=[19,15,21,17,20,13,19,15,18];
        const colors=['#7e9b84','#af786a','#ddbe92','#a68ab0','#6a8797'];
        r(x,y+21-heights[i],6,heights[i],colors[(i+row)%5]);r(x+2,y+21-heights[i]+2,1,heights[i]-4,p.wall);
        x+=8;
      }
    }
  }
  function interior(p,t){
    // A completely new, layered room: wall beams, window, bookcase,
    // reading chair, proper bed, fireplace and a clear walking space.
    r(0,0,400,250,p.indoorWall);
    for(let i=0;i<10;i++)r(i*44,0,2,166,p.indoorWall2);
    r(0,0,400,15,p.wood);r(0,148,400,14,p.wood);r(17,0,9,165,p.wood);
    r(280,0,9,165,p.wood);
    r(0,163,400,87,p.floor);
    for(let i=0;i<12;i++){r(i*36+3,164,2,86,p.furniture);r(i*36+8,175,28,2,p.floorLight)}
    for(let y=185;y<250;y+=22)r(0,y,400,2,p.furniture);
    // View outside through an actual illuminated window.
    r(41,34,106,93,p.furniture);r(46,39,96,83,p.window);
    r(49,42,90,75,p.night?'#314a67':'#8ac9dc');
    if(p.night){r(100,57,14,16,p.glow);r(104,54,9,20,p.glow)}
    else{cloud(54,67,.53,p.cloud)}
    r(91,42,7,75,p.wood);r(49,83,90,6,p.wood);
    r(36,121,119,9,p.furnitureLight);
    // Soft green curtains frame the window.
    r(32,28,12,92,p.leaf);r(143,28,12,92,p.leaf);r(33,27,121,5,p.woodLight);
    r(34,70,10,5,p.flower2);r(144,70,10,5,p.flower2);
    bookshelf(p);
    hearth(p,t);
    // Left bed with wooden posts, pillows, blanket and quilt pattern.
    r(25,177,124,51,p.furniture);r(33,166,111,49,p.wood);
    r(39,172,100,36,p.wallShadow);r(44,174,28,20,p.wall);
    r(78,173,59,34,'#b98e97');
    r(80,184,55,5,'#d1abb2');r(80,200,55,4,p.wall);
    r(19,171,8,62,p.wood);r(143,172,8,60,p.wood);
    r(21,167,4,5,p.woodLight);r(145,167,4,5,p.woodLight);
    // A woven circular rug, placed in the open walking space.
    r(166,210,121,26,'#b58f81');r(171,207,111,25,'#d9bda3');r(181,215,91,12,'#d19a9b');
    r(198,220,55,3,p.wall);
    // Reading stool and floor lamp by the bookshelves.
    r(255,171,26,12,p.furnitureLight);r(259,182,4,27,p.wood);r(273,182,4,27,p.wood);
    r(283,105,4,71,p.furniture);r(273,105,25,8,p.glow);r(278,96,16,12,p.wall);
    // Potted fern
    r(155,129,19,20,p.wood);r(158,125,13,7,p.trunkLight);
    for(const dx of [-16,-8,0,9,17]){r(164+dx,119-Math.abs(dx)*.5,4,14,p.leaf);r(162+dx,111-Math.abs(dx)*.4,8,6,p.leaf2)}
    // Floating dust motes
    if(p.night)for(let i=0;i<8;i++){const x=160+hash(i,55)*116,y=18+hash(i,56)*125;if(Math.sin(t*.002+i)>.1)r(x,y,2,2,p.glow)}
  }
  function creature(x,y,p,t,walk,home){
    const yy=Math.round(y+(walk?Math.sin(t*.008)*1.2:Math.sin(t*.0018)*.8));
    const xx=Math.round(x);
    oval(xx,yy+15,13,3,home?p.floor:p.grassShade);
    // Fae ears and small, branchlike antlers.
    r(xx-12,yy-29,6,19,'#bda5a8');r(xx-10,yy-26,3,15,'#f1d2d5');
    r(xx+6,yy-30,6,20,'#bda5a8');r(xx+8,yy-27,3,15,'#f1d2d5');
    r(xx-4,yy-28,2,10,'#9b877a');r(xx-7,yy-25,4,2,'#9b877a');
    r(xx+2,yy-29,2,10,'#9b877a');r(xx+4,yy-25,4,2,'#9b877a');
    // Trailing, luminous tail; little particles rise from it.
    r(xx+10,yy+3,8,7,'#b1d5ce');r(xx+16,yy-1,6,5,'#d6f4ea');
    r(xx-14,yy-11,29,25,'#8b807f');
    r(xx-12,yy-13,25,25,'#f0e4d8');
    r(xx-8,yy-16,17,6,'#f0e4d8');
    r(xx-11,yy+7,24,4,'#e2d4ce');
    r(xx-10,yy+12,8,3,'#f3e9e0');r(xx+4,yy+12,8,3,'#f3e9e0');
    // Lilac fur and magical forehead mark.
    r(xx-12,yy-8,4,7,'#b9a6ca');r(xx+9,yy-8,4,7,'#b9a6ca');
    r(xx-3,yy-11,7,5,'#c5b4dd');r(xx-1,yy-10,3,3,p.glow);
    // Cyan eyes remain readable in daylight and nighttime.
    const blink=(t%4100)<125;
    r(xx-7,yy-4,3,blink?1:4,blink?'#786b73':'#4a8e93');
    r(xx+5,yy-4,3,blink?1:4,blink?'#786b73':'#4a8e93');
    r(xx-9,yy+2,4,3,'#eabdc1');r(xx+8,yy+2,4,3,'#eabdc1');
    r(xx,yy+3,2,2,'#927b7f');
    // A few glints follow the creature, restrained rather than emoji-heavy.
    if(!motion.matches){
      const f=Math.sin(t*.002);
      r(xx+18,yy-19+f*4,2,2,p.glow);
      if(f>0)r(xx-19,yy-14-f*4,2,2,'#d7f8e9');
    }
  }
  const isOutside=loc=>loc!=='cottage';
  let state={location:'meadow',night:false,x:57,y:64};
  let position={x:220,y:195},target={x:220,y:195};
  let last=0,lastWander=0,walking=false,sceneBefore=null,fadeStart=0;
  const screenPoint=(x,y)=>{
    let px=36+Math.max(10,Math.min(79,Number(x)||57))*3.22;
    let py=126+Math.max(50,Math.min(79,Number(y)||64))*.93;
    // Prevent standing inside the house or pond. Both biomes share walkable centre.
    if(px<184)py=Math.max(py,211);
    if(state.location==='meadow'&&px>279&&py<236){px=266;py=Math.max(py,205)}
    if(state.location==='grove'&&px>298){px=280}
    return {x:px,y:Math.min(239,py)};
  };
  function update(dt,t){
    if(!isOutside(state.location)){walking=false;return}
    const dx=target.x-position.x,dy=target.y-position.y,dist=Math.hypot(dx,dy);
    if(dist>.45&&!motion.matches){
      const step=Math.min(dist,dt*11.5);position.x+=dx/dist*step;position.y+=dy/dist*step;walking=true;
    }else walking=false;
    if(!walking&&!motion.matches&&t-lastWander>17000){
      lastWander=t;
      const nx=Math.max(187,Math.min(274,position.x+rand(-31,31)));
      const ny=Math.max(183,Math.min(237,position.y+rand(-15,15)));
      target={x:nx,y:ny};
    }
  }
  function scene(p,loc,t){
    if(loc==='cottage')interior(p,t);
    else if(loc==='grove')grove(p,t);
    else meadow(p,t);
  }
  function render(t){
    const dt=Math.min(.075,Math.max(0,(t-last)/1000||0));last=t;
    const p=state.night?colours.night:colours.day;
    update(dt,t);
    scene(p,state.location,t);
    if(sceneBefore&&t-fadeStart<1100&&!motion.matches){
      const progress=Math.min(1,(t-fadeStart)/1100);
      // Fade in the new location across the old one.
      const fresh=ctx.getImageData(0,0,W,H);
      scene(p,sceneBefore,t);
      ctx.save();ctx.globalAlpha=progress;
      const temp=document.createElement('canvas');temp.width=W;temp.height=H;
      temp.getContext('2d').putImageData(fresh,0,0);
      ctx.drawImage(temp,0,0);ctx.restore();
    }else sceneBefore=null;
    const home=state.location==='cottage';
    creature(home?221:position.x,home?198:position.y,p,t,walking,home);
    moveHitbox();
    if(!motion.matches)requestAnimationFrame(render);
  }
  function moveHitbox(){
    const b=document.getElementById('petInteract');
    const bubble=document.getElementById('bubble');
    const x=state.location==='cottage'?221:position.x;
    const y=state.location==='cottage'?198:position.y;
    if(b){b.style.left=x/W*100+'%';b.style.top=(y-9)/H*100+'%'}
    if(bubble){bubble.style.left=Math.max(16,Math.min(85,x/W*100))+'%';bubble.style.bottom=Math.max(17,Math.min(67,(H-y+40)/H*100))+'%'}
  }
  function setState(incoming,initial=false){
    if(!incoming)return;
    const previous=state.location;
    const updated={...state,...incoming};
    if(!['meadow','grove','cottage'].includes(updated.location))updated.location='meadow';
    state=updated;
    const point=screenPoint(state.x,state.y);
    if(initial||!last){position={...point};target={...point}}
    else if(point.x!==target.x||point.y!==target.y){
      target={...point};lastWander=performance.now();
    }
    if(previous!==state.location){
      sceneBefore=previous;fadeStart=performance.now();lastWander=fadeStart;
      if(previous==='cottage'||state.location==='cottage'){position={...point};target={...point}}
    }
    if(motion.matches)render(performance.now());
  }
  window.PixelWorld={setState,getPosition:()=>({...position}),getScene:()=>state.location};
  if(motion.matches)render(0);
  else requestAnimationFrame(render);
})();