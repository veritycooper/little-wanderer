/* Little Wanderer pixel world: two natural-coloured outdoor areas and a cosy cottage. */
(() => {
  'use strict';
  const canvas=document.getElementById('worldCanvas');
  if(!canvas) return;
  const ctx=canvas.getContext('2d',{alpha:false});
  if(!ctx) return;
  const W=400,H=250,WORLD_W=660;
  const transitionCanvas=document.createElement('canvas');
  transitionCanvas.width=W;transitionCanvas.height=H;
  const transitionCtx=transitionCanvas.getContext('2d');
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
    const g=ctx.createLinearGradient(0,0,0,170);
    g.addColorStop(0,p.sky);g.addColorStop(1,p.skyLow);
    ctx.fillStyle=g;ctx.fillRect(0,0,WORLD_W,H);
    if(p.night){
      r(324,24,22,24,p.sun);r(329,19,12,31,p.sun);r(341,25,10,19,p.sky);
      for(let i=0;i<58;i++){
        const x=hash(i,17)*(WORLD_W-10)+5,y=hash(i,33)*123+3;
        if(hash(i,45)>.5||Math.sin(t*.0009+i)>-.25)r(x,y,i%7?2:3,i%7?2:3,i%4?p.sun:'#d8d4fa');
      }
    }else{
      r(324,25,25,25,p.sun);r(319,31,35,13,p.sun);r(330,19,13,36,p.sun);
    }
    cloud((t*.0014+12)%720-90,27,1.05,p.cloud);
    cloud((t*.00085+240)%780-100,74,.6,p.cloud);
    cloud((t*.001+510)%760-90,48,.74,p.cloud);
  }
  function cloud(x,y,scale,c){
    ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(scale,scale);
    r(12,0,27,7,c);r(4,7,47,9,c);r(0,16,59,9,c);r(12,25,37,4,c);ctx.restore();
  }
  function land(p,grove=false){
    polygon([[0,136],[36,119],[83,127],[131,110],[187,128],[233,117],
      [298,133],[348,113],[400,126],[454,108],[509,127],[557,116],
      [606,134],[660,117],[660,250],[0,250]],p.hillFar);
    polygon([[0,160],[62,141],[118,155],[180,132],[249,156],
      [311,140],[400,154],[477,133],[555,155],[621,137],
      [660,150],[660,250],[0,250]],p.hill);
    r(0,160,WORLD_W,90,p.grass);r(0,204,WORLD_W,46,p.grassDeep);
    for(let i=0;i<112;i++){
      const x=Math.floor(hash(i,3)*(WORLD_W-4)),y=Math.floor(166+hash(i,8)*83);
      r(x,y,4+(i%3)*2,2,grove?p.grassShade:p.grassDeep);
      if(i%3===0){r(x+2,y-4,2,5,p.leaf3);r(x-2,y-1,3,3,p.leaf)}
    }
  }
  function tree(x,y,s,p,t,front=false){
    ctx.save();
    ctx.translate(Math.round(x),Math.round(y));
    ctx.scale(s,s);
    const sway=Math.round(Math.sin(t*.00045+x)*0.8);

    // The base of every tree is the actual ground point (x,y).
    oval(0,1,19,5,p.grassShade);
    r(-12,-3,24,5,p.ground);
    r(-8,-7,16,12,p.trunk);
    r(-4,-55,9,52,p.trunk);
    r(-1,-53,3,48,p.trunkLight);
    r(-13,-5,7,5,p.trunk);
    r(7,-5,8,5,p.trunk);
    r(-11,-21,6,4,p.trunk);
    r(5,-28,8,4,p.trunkLight);

    // Dark coherent silhouette, then overlapping mid-tone foliage clusters.
    r(-25+sway,-90,51,50,p.leafDark);
    r(-32+sway,-79,65,32,p.leafDark);
    r(-23+sway,-106,47,23,p.leafDark);
    r(-16+sway,-117,34,15,p.leafDark);
    r(-35+sway,-67,70,17,p.leafDark);
    r(-27+sway,-96,55,24,p.leaf);
    r(-32+sway,-78,64,23,p.leaf);
    r(-24+sway,-109,48,21,p.leaf2);
    r(-14+sway,-120,31,13,p.leaf2);
    r(-29+sway,-65,57,14,p.leaf2);
    r(-19+sway,-99,29,12,p.leaf3);
    r(9+sway,-90,18,12,p.leaf3);
    r(-30+sway,-75,16,8,p.leaf3);
    r(-4+sway,-115,13,6,p.leaf3);
    r(18+sway,-66,10,7,p.leaf);

    if(front){
      r(-35+sway,-60,15,11,p.leaf);
      r(20+sway,-62,15,11,p.leaf2);
      r(-27+sway,-54,12,6,p.leafDark);
    }
    // Tufts at ground level hide any otherwise hard "stuck on" trunk edge.
    r(-15,-4,6,6,p.leafDark);
    r(10,-5,7,7,p.leaf);
    r(-21,-2,9,3,p.grassDeep);
    r(14,-2,9,3,p.grassDeep);
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
  function shrub(p,x,y,w,berries=false){
    const left=x-Math.floor(w/2);
    // The silhouette begins at the dirt and grows upwards rather than floating.
    oval(x,y+1,Math.ceil(w*.64),4,p.grassShade);
    r(left-5,y-10,w+10,13,p.leafDark);
    r(left,y-16,w,15,p.leaf);
    r(left+4,y-21,w-8,11,p.leaf2);
    r(left-8,y-12,13,11,p.leaf2);
    r(left+w-4,y-13,12,11,p.leaf);
    r(left+10,y-26,Math.max(12,w-20),8,p.leaf3);
    r(left+2,y-17,9,6,p.leaf3);
    r(left+w-14,y-20,11,7,p.leaf3);
    r(left+w-10,y-4,7,4,p.leafDark);
    if(berries){
      // Rosy and crimson berries; distinct from ordinary green shrubs.
      const colours=['#c95b6d','#e99491','#a64565','#e6b6c6'];
      for(const [i,dx,dy] of [[0,-11,-12],[1,-1,-17],[2,10,-12],
        [3,-17,-7],[4,15,-6],[5,3,-8]]){
        r(x+dx,y+dy,4,4,colours[i%colours.length]);
        r(x+dx+1,y+dy,1,1,p.glow);
      }
    }
    // Little tufts of grass at the roots for a coherent ground contact.
    r(left-5,y+1,8,4,p.grassDeep);
    r(left+w-3,y+1,8,4,p.grassDeep);
  }
  function bushes(p,area){
    const clusters=area==='grove'
      ? [[48,215,29],[145,194,25],[264,199,28],[420,198,30],[595,215,31]]
      : [[24,214,28],[201,216,29],[414,215,30],[622,207,29]];
    for(const [x,y,w] of clusters)shrub(p,x,y,w);
  }
  function berryBush(p,x,y,w=32){shrub(p,x,y,w,true)}

  function fence(x,y,n,p){
    for(let i=0;i<n;i++){const xx=x+i*16;r(xx,y-12,5,23,p.trunk);r(xx+1,y-15,3,5,p.woodLight);r(xx-3,y-6,18,4,p.woodLight);r(xx-3,y+2,18,3,p.wood)}
  }
  function house(p,t){
    const x=64,y=89;
    r(x+3,y+13,131,88,p.dark);r(x+8,y+19,121,82,p.wall);
    r(x+13,y+32,112,7,p.wallShadow);
    r(x+13,y+47,112,4,p.wallShadow);
    r(x+16,y+63,107,4,p.wallShadow);

    // Chimney lives BEHIND the roof; no disconnected roof stamps.
    r(x+91,y-29,20,38,p.dark);
    r(x+94,y-26,14,34,p.trunk);
    r(x+89,y-32,24,5,p.roofLight);
    const rim=[[x-12,y+14],[x+43,y-32],[x+83,y-32],
      [x+146,y+14],[x+146,y+27],[x-12,y+27]];
    const roof=[[x-6,y+13],[x+45,y-27],[x+81,y-27],
      [x+141,y+13],[x+141,y+22],[x-6,y+22]];
    polygon(rim,p.dark);polygon(roof,p.roof);
    // Clip roof tiles to the roof polygon so none float over its edges.
    ctx.save();
    ctx.beginPath();ctx.moveTo(...roof[0]);
    for(let i=1;i<roof.length;i++)ctx.lineTo(...roof[i]);
    ctx.closePath();ctx.clip();
    for(let row=0;row<5;row++){
      for(let i=0;i<12;i++){
        const xx=x-19+row*5+i*14,yy=y-19+row*9;
        r(xx,yy,9,3,(i+row)%2?p.roofLight:p.roof);
      }
    }
    ctx.restore();
    r(x-12,y+22,158,7,p.roofLight);

    for(const dx of [22,110]){
      r(x+dx-3,y+43,22,28,p.dark);r(x+dx,y+46,16,22,p.window);
      r(x+dx+7,y+46,2,22,p.wood);r(x+dx,y+56,16,2,p.wood);
      r(x+dx-4,y+71,24,4,p.woodLight);
      if(p.night)r(x+dx+3,y+49,3,4,p.glow);
    }
    r(x+61,y+43,29,58,p.dark);r(x+64,y+46,23,55,p.wood);
    r(x+68,y+47,16,3,p.woodLight);r(x+82,y+76,3,3,p.glow);
    r(x+59,y+100,33,5,p.woodLight);
    r(x+53,y+105,46,5,p.path);
    r(x+13,y+72,31,7,p.wood);r(x+14,y+70,28,4,p.leaf2);
    r(x+17,y+66,3,4,p.flower);r(x+28,y+63,3,7,p.flower2);
    r(x+103,y+72,31,7,p.wood);r(x+106,y+68,3,4,p.flower3);
    r(x+138,y+43,3,10,p.dark);r(x+135,y+51,10,14,p.dark);
    r(x+137,y+53,6,10,p.glow);
    if(p.night){ctx.globalAlpha=.15;oval(x+140,y+61,25,25,p.glow);ctx.globalAlpha=1}
  }
  function mailbox(p,x,y,t){
    oval(x+11,y+1,17,4,p.grassShade);
    r(x+9,y-27,6,28,p.trunk);
    r(x+8,y-24,8,4,p.woodLight);
    // Mailbox body, dark outline and curved top.
    r(x,y-48,25,23,p.dark);
    r(x+3,y-51,19,5,p.roofLight);
    r(x+3,y-45,19,17,p.woodLight);
    r(x+5,y-43,15,12,'#eac7c3');
    r(x+9,y-39,6,3,p.wood);
    r(x+1,y-28,23,4,p.wood);
    const ready=Boolean(state.unread);
    r(x+22,y-47,3,17,p.trunk);
    r(x+23,y-(ready?59:51),9,9,ready?'#d36f86':p.roof);
    r(x+25,y-(ready?57:49),5,3,p.flower2);
    if(ready||t<mailPulse){
      r(x+7,y-57,11,8,p.wall);r(x+7,y-57,11,2,p.roofLight);
      r(x+12,y-52,3,2,p.roof);
      if(p.night)r(x+18,y-61,3,3,p.glow);
    }
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
    tree(21,183,.72,p,t);
    tree(536,191,.68,p,t);
    tree(647,192,.75,p,t);
    fence(14,177,6,p);
    house(p,t);
    path(p);
    // Pond is an inviting stopping point without overlapping the walking trail.
    pond(p,t);
    bushes(p,'meadow');
    r(27,190,68,7,p.wood);r(31,183,60,8,p.ground);
    for(let i=0;i<5;i++){
      const x=36+i*11;
      r(x,179,2,8,p.leafDark);r(x-4,176,10,5,p.leaf2);r(x,173,3,5,p.leaf3);
    }
    // Two berry patches, one beside the garden, another in the larger meadow.
    berryBush(p,50,230,32);
    berryBush(p,461,220,37);
    berryBush(p,586,233,34);

    // The cottage's little postbox is directly beside the path and driveway.
    mailbox(p,237,216,t);
    // Followable stones lead beyond the original postcard-size meadow.
    for(const [x,y,w] of [[406,235,23],[437,238,27],[475,240,26],
      [509,237,31],[547,232,28],[581,231,28],[617,233,31],[647,236,30]]){
      r(x,y+2,w,8,p.ground);r(x+2,y,w-4,7,p.path);r(x+4,y+2,w-8,2,p.pathLight);
    }
    for(const [x,y,c] of [[430,180,p.flower3],[492,221,p.flower],
      [555,219,p.flower2],[612,229,p.flower3]]){
      flower(x,y,p,c);
    }
    flowers(p,'meadow');
  }
  function log(p,x,y,w,h){r(x,y,w,h,p.trunk);r(x+4,y+2,w-8,h-4,p.trunkLight);r(x+6,y+2,3,h-4,p.wood)}
  function mushroom(x,y,p,colour){
    r(x-1,y+1,5,8,p.wall);r(x-7,y-6,17,8,colour);r(x-4,y-10,11,5,colour);
    r(x-3,y-6,3,3,p.flower2);r(x+4,y-3,2,2,p.flower2);
  }
  function riverStone(x,y,w,p){
    r(x-1,y+2,w+2,4,p.grassShade);
    r(x,y-4,w,8,p.stone);
    r(x+3,y-5,Math.max(5,w-6),4,p.stoneLight);
    r(x+2,y+1,w-4,2,p.ground);
  }
  function grove(p,t){
    sky(p,t);land(p,true);

    // A wider creek comes from behind the hill/trees and passes entirely
    // through the lower edge of the world. No cut-off stream sprites.
    const banks=[[303,151],[336,151],[335,167],[335,183],[345,199],
      [355,214],[365,229],[388,250],[321,250],[312,231],
      [298,214],[290,198],[295,181],[298,167]];
    const deep=[[309,153],[330,153],[329,170],[327,185],[338,200],
      [350,217],[357,234],[378,250],[332,250],[321,229],
      [306,212],[299,196],[304,181],[307,167]];
    const water=[[314,154],[326,154],[326,171],[323,186],[334,201],
      [346,216],[352,235],[369,250],[337,250],[326,229],
      [313,212],[306,196],[310,181],[312,165]];
    polygon(banks,p.grassShade);
    polygon(deep,p.waterDeep);
    polygon(water,p.water);
    for(const [x,y,w] of [[314,175,10],[313,189,11],[322,204,12],
      [333,223,14],[342,237,16],[350,248,13]]){
      r(x+Math.round(Math.sin(t*.0008+x)*2),y,w,3,p.waterLight);
    }
    // Irregular stones hug the banks, but leave a gap under the bridge.
    for(const [x,y,w] of [[289,177,12],[289,193,10],[280,206,13],
      [292,232,13],[306,245,17],[339,161,14],[339,182,11],
      [351,201,12],[373,235,15],[389,248,14]]){
      riverStone(x,y,w,p);
    }

    // Trees are planted after the creek so the upstream source is hidden
    // behind their foliage. Trunks visibly reach the ground.
    for(const [x,y,s] of [[66,174,.58],[147,175,.56],[251,179,.56],
      [318,176,.56],[455,174,.55],[575,177,.62]]){
      tree(x,y,s,p,t);
    }
    tree(20,205,.85,p,t,true);
    tree(624,205,.87,p,t,true);
    tree(393,186,.55,p,t);

    // The trail runs in from the LEFT edge, crosses the bridge and
    // continues all the way to the RIGHT edge of the expanded world.
    for(const [x,y,w] of [[-12,234,27],[20,234,27],[54,234,28],
      [89,228,26],[123,219,29],[157,215,29],[192,219,31],
      [226,223,33],[263,218,29],[359,215,24],[391,212,25],
      [421,213,25],[451,219,28],[484,226,30],[518,232,30],
      [551,237,30],[587,240,30],[620,239,28],[651,238,29]]){
      r(x-1,y+2,w+2,9,p.ground);
      r(x,y,w,8,p.stone);
      r(x+3,y+1,w-6,5,p.stoneLight);
      r(x+5,y+5,w-10,2,p.stone);
    }
    // Proper bridge: planked surface and side rails line up with BOTH banks.
    r(284,216,75,10,p.trunk);
    r(286,212,71,10,p.wood);
    for(let x=288;x<=350;x+=9){
      r(x,213,7,7,p.woodLight);r(x+2,216,2,3,p.trunkLight);
    }
    r(289,199,5,17,p.trunk);r(350,199,5,17,p.trunk);
    r(289,198,66,5,p.woodLight);r(294,206,56,3,p.wood);
    r(284,225,74,3,p.ground);

    // Ancient stones and a tiny mushroom glade are reachable from the path.
    for(const [x,y,h] of [[65,205,11],[80,197,15],[97,198,14],
      [113,205,11],[98,219,9],[76,220,10]]){
      r(x-5,y+2,13,5,p.grassShade);
      r(x-3,y-h+2,9,h,p.stone);
      r(x,y-h,4,8,p.stoneLight);
    }
    r(87,207,5,10,p.flower3);r(89,203,3,4,p.glow);
    // Forest sign is rooted rather than a suspended rectangle.
    r(48,191,5,22,p.trunk);r(37,181,38,16,p.trunk);
    r(39,183,34,12,p.woodLight);r(43,188,21,3,p.wall);
    r(48,212,7,3,p.grassShade);
    bushes(p,'grove');
    berryBush(p,482,204,34);
    berryBush(p,563,217,32);
    for(const [x,y,c] of [[37,213,p.flower3],[137,234,p.flower],
      [230,191,p.flower2],[450,190,p.flower3],[510,216,p.flower],
      [553,206,p.flower3],[602,225,p.flower2]]){
      mushroom(x,y,p,c);
    }
    for(const [x,y,c] of [[29,226,p.flower3],[137,239,p.flower2],
      [198,239,p.flower],[269,239,p.flower3],[408,231,p.flower2],
      [493,245,p.flower3],[584,241,p.flower]]){
      flower(x,y,p,c);
    }
    if(p.night)for(let j=0;j<10;j++){
      const x=60+hash(j,87)*570,y=175+hash(j,88)*60;
      if(Math.sin(t*.002+j*2.3)>.12)r(x,y,2,2,p.glow);
    }
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
    // Pip's research and letter-writing desk: a real computer, not just a book prop.
    r(181,168,104,12,p.furniture);
    r(186,176,8,35,p.wood);r(268,176,8,35,p.wood);
    r(184,164,99,6,p.furnitureLight);
    r(205,113,54,45,p.dark);
    r(209,117,46,36,p.woodLight);
    r(212,120,40,31,p.night?'#426875':'#a8d8d9');
    r(217,125,21,3,p.glow);r(217,132,30,3,p.leaf2);
    r(217,139,16,3,p.woodLight);
    r(228,158,7,8,p.furniture);r(220,165,24,4,p.furnitureLight);
    // Keyboard and a little lamp.
    r(210,170,44,7,p.dark);r(214,171,36,3,p.wall);
    r(191,133,4,34,p.furniture);r(184,129,19,7,p.glow);
    r(189,126,9,4,p.wall);
    r(270,145,8,21,p.wood);r(267,139,14,8,p.woodLight);
    r(267,135,4,5,p.flower3);
    if(state.activity&&/read|research|letter|computer|writing/i.test(state.activity)){
      r(215,125,7,3,p.glow);
      if(Math.sin(t*.002)>0)r(241,137,3,3,p.glow);
    }
    // Floating dust motes
    if(p.night)for(let i=0;i<8;i++){const x=160+hash(i,55)*116,y=18+hash(i,56)*125;if(Math.sin(t*.002+i)>.1)r(x,y,2,2,p.glow)}
  }
  function kitchen(p,t){
    // A separate room with warm cabinets, working stove, sink and a real table.
    r(0,0,400,250,p.indoorWall);
    for(let x=0;x<400;x+=45)r(x,0,2,164,p.indoorWall2);
    r(0,0,400,14,p.wood);r(0,151,400,13,p.wood);
    r(0,164,400,86,p.floor);
    for(let x=0;x<400;x+=36){r(x+2,166,2,84,p.furniture);r(x+8,180,26,2,p.floorLight)}
    for(let y=186;y<250;y+=22)r(0,y,400,2,p.furniture);
    // Kitchen window with curtains and hills behind.
    r(36,36,102,87,p.dark);r(40,40,94,78,p.woodLight);
    r(44,44,86,70,p.night?'#405c79':'#91cddd');
    polygon([[45,104],[78,77],[106,92],[129,78],[129,114],[45,114]],p.hillFar);
    r(84,44,5,74,p.wood);r(45,81,84,5,p.wood);
    r(37,35,10,85,p.leaf);r(129,35,10,85,p.leaf2);
    r(33,121,110,7,p.furnitureLight);

    // Upper cupboards, shelves, labelled jam jars.
    for(const x of [160,218,276]){
      r(x,34,52,57,p.furniture);
      r(x+4,38,44,49,p.woodLight);
      r(x+23,57,4,6,p.glow);
      r(x+8,40,31,4,p.wallShadow);
    }
    r(154,100,199,8,p.furnitureLight);
    for(const [x,c] of [[164,p.flower],[180,p.flower3],[198,p.leaf2],
      [218,p.flower],[237,p.flower2],[253,p.flower3]]){
      r(x,81,11,15,p.wall);r(x+2,78,7,4,p.wood);
      r(x+2,86,7,6,c);r(x+3,86,3,2,p.glow);
    }
    // Counter units with a sink and little cooking hob.
    r(152,128,222,48,p.furniture);
    for(let x=160;x<=341;x+=47){
      r(x,134,42,36,p.woodLight);r(x+35,146,3,7,p.furniture);
    }
    r(145,120,233,13,p.furnitureLight);
    r(166,121,65,6,p.stoneLight);
    r(181,121,40,5,p.water);r(195,111,3,10,p.furniture);
    r(195,110,17,3,p.furnitureLight);r(209,113,3,5,p.furnitureLight);
    r(270,111,79,9,p.dark);
    for(const x of [281,307,333]){r(x,113,13,5,p.wood);r(x+5,113,3,2,p.glow)}
    r(287,99,37,12,p.wallShadow);r(293,91,25,12,p.furnitureLight);
    // Hearth-oven with visible handle and knobs.
    r(272,137,76,38,p.dark);r(278,143,64,27,p.stone);
    r(289,147,43,17,p.window);r(285,136,52,3,p.woodLight);
    for(const x of [284,312,335])r(x,131,4,4,p.wall);
    // Small round table, bread and bowl of real berries.
    oval(105,203,61,17,p.furniture);
    oval(105,198,60,16,p.woodLight);
    r(98,207,13,36,p.furniture);
    oval(108,193,21,7,p.wall);
    for(const [dx,dy,c] of [[-9,0,'#c4546f'],[0,-3,'#aa4961'],
      [8,0,'#e98a91'],[-3,3,'#bd6279'],[12,3,'#a54762']]){
      r(108+dx,191+dy,6,5,c);
    }
    r(62,191,22,6,p.path);r(67,185,12,7,p.woodLight);
    // Dining chairs against table edge.
    r(47,208,14,31,p.wood);r(42,199,23,8,p.woodLight);
    r(154,206,14,31,p.wood);r(150,198,22,8,p.woodLight);
    // Houseplant by the back wall.
    r(368,143,22,22,p.wood);r(371,140,16,7,p.trunkLight);
    for(const dx of [-16,-7,1,12,19])r(378+dx,129-Math.abs(dx)*.35,8,16,p.leaf2);
    if(p.night)r(362,88,8,9,p.glow);
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
  let state={location:'meadow',room:'study',night:false,x:57,y:64,unread:false};
  let position={x:220,y:205},target={x:220,y:205};
  let route=[];
  let camera=0,mailPulse=0;
  let last=0,lastWander=0,walking=false;
  const worldPoint=(x,y)=>{
    const nx=Number.isFinite(Number(x))?Number(x):57;
    const ny=Number.isFinite(Number(y))?Number(y):64;
    const px=36+(Math.max(10,Math.min(150,nx))-10)*4;
    const py=132+(Math.max(50,Math.min(79,ny))-50)*3.3;
    if(state.location==='grove'){
      // Keep the stroll on the safe bank or the far-side footpath.
      const destX=Math.max(45,Math.min(625,px));
      return {x:destX,
        y:destX>=284&&destX<=359?202:Math.max(203,Math.min(231,py))};
    }
    if(state.location==='meadow'){
      const safeY=Math.max(205,Math.min(232,py));
      return {x:Math.max(47,Math.min(623,px)),
        y:px>272&&px<397?Math.max(229,safeY):safeY};
    }
    return {x:220,y:197};
  };
  function setCourse(point){
    route=[];
    // Walk over the real wooden bridge when travelling between forest banks.
    // The route uses two landings and planks at the correct y-coordinate.
    if(state.location==='grove'){
      const fromLeft=position.x<284;
      const fromRight=position.x>359;
      if(fromLeft&&point.x>=284){
        route=[{x:278,y:202},{x:355,y:202},{...point}];
      }else if(fromRight&&point.x<=359){
        route=[{x:367,y:202},{x:289,y:202},{...point}];
      }else if(position.x>=284&&position.x<=359){
        route=[{x:point.x>position.x?355:289,y:202},{...point}];
      }
    }
    target=route.length?route.shift():{...point};
    lastWander=performance.now();
  }
  function visit(x,y){
    const point=worldPoint(x,y);
    setCourse(point);
    return point;
  }
  function update(dt,t){
    if(!isOutside(state.location)){walking=false;return}
    const dx=target.x-position.x,dy=target.y-position.y,dist=Math.hypot(dx,dy);
    if(dist>.45&&!motion.matches){
      const step=Math.min(dist,dt*42);
      position.x+=dx/dist*step;position.y+=dy/dist*step;
      walking=true;
    }else{
      walking=false;
      if(route.length){
        target=route.shift();walking=true;lastWander=t;
      }
    }
    if(!walking&&!motion.matches&&t-lastWander>7500){
      const start=position.x;
      let nx=Math.max(46,Math.min(618,start+rand(-64,64)));
      if(state.location==='grove'){
        // Ordinary idle strolls stay on one bank; crossing uses deliberate route.
        if(start<284)nx=Math.min(nx,278);
        else if(start>359)nx=Math.max(nx,367);
        else nx=start;
      }
      const ny=Math.max(205,Math.min(230,position.y+rand(-14,14)));
      setCourse({x:nx,y:state.location==='grove'&&nx>=284&&nx<=359?202:ny});
    }
    const goal=Math.max(0,Math.min(WORLD_W-W,position.x-W*.47));
    camera+=(goal-camera)*Math.min(1,dt*3.3);
    if(Math.abs(goal-camera)<.12)camera=goal;
  }
  function scene(p,loc,t){
    if(loc==='cottage'){
      if(state.room==='kitchen')kitchen(p,t);
      else interior(p,t);
    }else if(loc==='grove')grove(p,t);
    else meadow(p,t);
  }
  function render(t){
    const dt=Math.min(.075,Math.max(0,(t-last)/1000||0));last=t;
    const p=state.night?colours.night:colours.day;
    update(dt,t);
    ctx.save();
    if(isOutside(state.location))ctx.translate(-Math.round(camera),0);
    scene(p,state.location,t);
    const home=!isOutside(state.location);
    creature(home?(state.room==='kitchen'?141:240):position.x,
      home?(state.room==='kitchen'?206:207):position.y,p,t,walking,home);
    ctx.restore();
    moveHitboxes();
    if(!motion.matches)requestAnimationFrame(render);
  }
  function placeOverlay(id,x,y,width=28,height=30){
    const b=document.getElementById(id);
    if(!b)return;
    b.style.left=((x-camera)/W*100)+'%';
    b.style.top=((y-16)/H*100)+'%';
    b.style.width=(width/W*100)+'%';
    b.style.height=(height/H*100)+'%';
    b.hidden=state.location!=='meadow';
  }
  function moveHitboxes(){
    const b=document.getElementById('petInteract');
    const bubble=document.getElementById('bubble');
    const home=!isOutside(state.location);
    const x=home?(state.room==='kitchen'?141:240):position.x-camera;
    const y=home?(state.room==='kitchen'?206:207):position.y;
    if(b){b.style.left=x/W*100+'%';b.style.top=(y-9)/H*100+'%'}
    if(bubble){
      bubble.style.left=Math.max(16,Math.min(85,x/W*100))+'%';
      bubble.style.bottom=Math.max(17,Math.min(67,(H-y+40)/H*100))+'%';
    }
    placeOverlay('mailboxInteract',237,179,37,51);
    const cottage=document.getElementById('cottage');
    if(cottage&&state.location==='meadow'){
      cottage.style.left=((55-camera)/W*100)+'%';
      cottage.style.top='23%';
      cottage.style.width=(159/W*100)+'%';
      cottage.style.height='48%';
      cottage.hidden=(55-camera>W||214-camera<0);
    }
    const world=document.getElementById('world');
    if(world)world.style.cursor=home?'default':'crosshair';
  }
  function setState(incoming,initial=false){
    if(!incoming)return;
    const previousLoc=state.location;
    const oldX=state.x,oldY=state.y;
    const oldRoom=state.room;
    state={...state,...incoming};
    if(!['meadow','grove','cottage'].includes(state.location))state.location='meadow';
    if(!['study','kitchen'].includes(state.room))state.room='study';
    const point=worldPoint(state.x,state.y);
    if(initial||!last){
      position={...point};target={...point};route=[];
      camera=Math.max(0,Math.min(WORLD_W-W,position.x-W*.47));
    }else if(previousLoc!==state.location){
      position={...point};target={...point};
      camera=Math.max(0,Math.min(WORLD_W-W,position.x-W*.47));
      lastWander=performance.now();
    }else if(state.x!==oldX||state.y!==oldY){
      setCourse(point);
    }
    if(oldRoom!==state.room)lastWander=performance.now();
    if(motion.matches)render(performance.now());
  }
  function letterSent(){
    mailPulse=performance.now()+2400;
    if(motion.matches)render(performance.now());
  }
  window.PixelWorld={
    setState,visit,letterSent,
    getPosition:()=>({...position}),
    getCamera:()=>camera,
    getScene:()=>state.location,
    worldSize:WORLD_W,
    toWorld:(screenX,screenY)=>({x:screenX+camera,y:screenY}),
    toStateX:worldX=>Math.max(10,Math.min(150,(worldX-36)/4+10))
  };
  if(motion.matches)render(0);
  else requestAnimationFrame(render);
})();