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
    const sway=motion.matches?0:Math.round(Math.sin(t*.00125+x*.08)*3.4);

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
  function pondStone(p,x,y,w){
    r(x-2,y+2,w+4,5,p.grassShade);
    r(x,y-3,w,8,p.stone);
    r(x+3,y-4,Math.max(5,w-6),4,p.stoneLight);
    r(x+3,y+2,w-6,2,p.ground);
  }
  function pond(p,t){
    // An irregular basin with soft green banks and natural stone clusters.
    polygon([[288,184],[305,179],[338,180],[367,183],[386,191],
      [395,204],[386,221],[368,229],[326,231],[293,224],
      [279,211],[283,194]],p.grassShade);
    polygon([[292,188],[308,183],[342,184],[369,188],[383,196],
      [389,207],[380,219],[359,224],[326,226],[296,220],
      [285,211],[287,198]],p.waterDeep);
    polygon([[296,191],[310,187],[338,188],[367,191],[379,198],
      [382,208],[374,216],[352,221],[328,221],[298,216],
      [292,208],[294,198]],p.water);
    for(let i=0;i<5;i++){
      const x=304+i*15+Math.sin(t*.0006+i)*2,y=200+(i%3)*6;
      r(x,y,9+(i%2)*5,2,p.waterLight);
    }
    for(const [x,y,w] of [[284,187,13],[299,181,14],[332,181,11],
      [365,185,16],[384,191,12],[387,213,14],[368,229,15],
      [335,231,12],[307,226,17],[283,217,14]]){
      pondStone(p,x,y,w);
    }
    // Subtle reflections, lily pads and reeds on opposite banks.
    r(352,211,15,5,p.leaf);r(356,208,9,4,p.leaf2);
    r(360,208,4,3,p.flower2);
    r(300,195,12,4,p.leafDark);r(304,192,6,4,p.leaf2);
    for(const [x,y] of [[276,204],[282,195],[393,199],[386,229]]){
      r(x,y-12,2,12,p.leafDark);r(x+3,y-8,2,8,p.leaf2);
      r(x-2,y-8,2,6,p.leaf3);
    }
  }
  function garden(p,t){
    // Server-led plot: plants change size and develop blossoms/berries as
    // Pip waters them. The garden really grows while this page is closed.
    const beds=state.garden?.beds||[];
    r(3,197,92,34,p.grassShade);
    r(7,201,86,27,p.ground);
    const plots=[[11,204,23],[40,204,21],[67,204,22],
      [12,216,23],[42,216,20],[69,216,21]];
    for(const [index,[x,y,w]] of plots.entries()){
      const bed=beds[index%3];
      const growth=Math.max(0,Math.min(100,Number(bed?.growth??28)));
      const plantHeight=3+Math.round(growth/100*12);
      const thirsty=bed?Number(bed.water)<30:false;
      r(x,y,w,8,p.trunk);
      r(x+3,y+2,w-6,4,p.roof);
      for(let dx=5;dx<w-2;dx+=9){
        const bend=motion.matches?0:Math.sin(t*.002+x+dx)*(growth>40?1.3:.4);
        r(x+dx,y-plantHeight+bend,2,plantHeight+2,p.leafDark);
        r(x+dx-4+bend,y-plantHeight-2,6,5,thirsty?p.leaf:p.leaf2);
        if(growth>=35)r(x+dx,y-plantHeight-4+bend,6,6,p.leaf3);
        if(growth>=75){
          const bloom=bed?.plant==='berry'?'#d46f82':
            bed?.plant==='flower'?p.flower:p.flower2;
          r(x+dx-1,y-plantHeight-6+bend,4,4,bloom);
        }
      }
    }
    for(const x of [3,26,50,75,94]){
      r(x,190,4,39,p.trunk);r(x+1,187,2,7,p.woodLight);
    }
    r(0,197,97,4,p.woodLight);r(0,223,97,4,p.wood);
    r(5,231,91,3,p.grassShade);
    r(87,185,4,9,p.trunk);r(78,178,24,10,p.wood);
    r(80,180,20,6,p.woodLight);
    r(72,211,14,11,p.stone);r(74,208,11,3,p.waterLight);
    r(85,209,8,4,p.stoneLight);r(91,206,4,3,p.wood);
    r(8,234,26,8,p.wood);r(11,236,20,3,p.woodLight);
    flower(32,208,p,p.flower3);
  }
  function backgroundTrees(p,t,grove=false){
    // Softly layered distant evergreens, planted behind foreground scenery.
    const layout=grove?[[35,168,.38],[99,170,.36],[176,171,.40],
      [239,166,.34],[304,171,.36],[389,174,.33],[465,169,.39],
      [522,173,.37],[586,170,.38],[644,172,.37]]
      :[[12,173,.42],[44,176,.39],[235,174,.38],[265,175,.36],
        [405,176,.42],[458,175,.40],[502,176,.36],
        [558,173,.42],[604,172,.40],[647,175,.41]];
    for(const [x,y,scale] of layout){
      tree(x,y,scale,p,t);
    }
  }
  function meadow(p,t){
    sky(p,t);land(p);
    backgroundTrees(p,t);
    tree(21,183,.72,p,t);
    tree(536,191,.68,p,t);
    tree(647,192,.75,p,t);
    house(p,t);
    path(p);
    pond(p,t);
    garden(p,t);
    bushes(p,'meadow');
    berryBush(p,50,230,32);
    berryBush(p,461,220,37);
    berryBush(p,586,233,34);
    mailbox(p,237,216,t);
    for(const [x,y,w] of [[406,235,23],[437,238,27],[475,240,26],
      [509,237,31],[547,232,28],[581,231,28],[617,233,31],[647,236,30]]){
      r(x,y+2,w,8,p.ground);r(x+2,y,w-4,7,p.path);
      r(x+4,y+2,w-8,2,p.pathLight);
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
    backgroundTrees(p,t,true);

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
  // The entire cottage shares the same 400 x 250 pixel scale.
  // Pip is about 29px wide and 45px tall including her ears. All chairs,
  // desks, tables and beds use that scale rather than room-sized furniture.
  function roomShell(p){
    const wall=p.night?'#b8a393':'#f3e5d0';
    const panel=p.night?'#ae9788':'#f8ebd8';
    const trim=p.night?'#87685c':'#b68f77';
    const trimLight=p.night?'#b79b83':'#d6b396';
    const floor=p.night?'#937869':'#d4b69b';
    const floorLight=p.night?'#a18474':'#e3c9af';
    const seam=p.night?'#7f665b':'#bf9e86';
    r(0,0,400,250,wall);
    r(0,0,400,8,trim);
    r(0,8,400,3,trimLight);
    for(let x=30;x<400;x+=72){
      r(x,11,2,136,panel);
      r(x+3,11,1,136,trimLight);
    }
    // Narrow, quiet baseboard with furniture sitting in front of it.
    r(0,144,400,3,trimLight);
    r(0,147,400,8,trim);
    r(0,155,400,95,floor);
    // Offset timber floorboards rather than an oversized tiled/grid floor.
    for(let row=0;row<6;row++){
      const y=158+row*17,shift=(row%3)*17;
      r(0,y,400,1,seam);
      for(let x=-60+shift;x<430;x+=59){
        r(x,y+2,56,1,floorLight);
        r(x+57,y+1,1,16,seam);
        if((x+row*7)%4===0)r(x+19,y+9,8,1,trimLight);
      }
    }
    r(0,249,400,1,trim);
  }
  function roomWindow(p,x,y,w=75,h=65){
    const wood=p.night?'#795f57':'#a78169';
    r(x-5,y-6,w+10,h+13,wood);
    r(x-2,y-3,w+4,h+6,p.wall);
    r(x+2,y+1,w-4,h-4,p.night?'#496678':'#a7d7df');
    const cloudX=x+12,cloudY=y+18;
    if(p.night){
      r(x+w-24,y+12,10,10,p.glow);r(x+w-20,y+9,4,15,p.glow);
    }else{
      cloud(cloudX,cloudY,.35,p.cloud);
    }
    polygon([[x+2,y+h-13],[x+22,y+h-33],[x+44,y+h-17],
      [x+w-2,y+h-29],[x+w-2,y+h-3],[x+2,y+h-3]],p.hillFar);
    r(x+w*.48,y+2,3,h-4,wood);
    r(x+2,y+Math.round(h*.52),w-4,3,wood);
    r(x-7,y+h+6,w+14,5,p.woodLight);
    // Short fabric panels frame the window without hiding the scenery.
    r(x-6,y-7,8,h+6,p.leaf);
    r(x+w-2,y-7,8,h+6,p.leaf2);
    r(x-6,y-7,w+14,3,wood);
    r(x-5,y+Math.floor(h*.57),7,3,p.flower2);
    r(x+w-2,y+Math.floor(h*.57),7,3,p.flower2);
  }
  function plantPot(p,x,y,small=false){
    const width=small?11:17,height=small?9:13;
    r(x,y,width,height,p.trunkLight);
    r(x+2,y+2,width-4,2,p.woodLight);
    const cx=x+Math.floor(width/2);
    r(cx-1,y-15,3,16,p.leafDark);
    r(cx-7,y-12,9,7,p.leaf2);r(cx+1,y-14,9,7,p.leaf);
    r(cx-3,y-19,7,8,p.leaf3);
    r(x-3,y+height-1,width+6,2,p.grassShade);
  }
  function miniBooks(p,x,y,number=6){
    const hues=['#82a38b','#bd9a90','#a2b0be','#d6bd93','#a98fbc'];
    for(let i=0;i<number;i++){
      const h=13+(i*7)%8;
      r(x+i*6,y-h,5,h,hues[i%hues.length]);
      r(x+i*6+2,y-h+3,1,h-5,p.wall);
    }
  }
  function roomRug(p,x,y,w,h){
    const outside=p.night?'#8b6871':'#b98b92';
    const inside=p.night?'#b18d91':'#ecd2c7';
    oval(x+w/2,y+h/2,w/2,h/2,outside);
    oval(x+w/2,y+h/2,w/2-5,h/2-4,inside);
    r(x+15,y+h/2-1,w-30,2,p.flower);
    r(x+w/2-8,y+h/2-4,16,8,p.wall);
  }
  function hearth(p,t){
    // Recessed into the wall: a narrow fireplace, not a freestanding block.
    const stone=p.night?'#898c88':'#b7b5a6';
    const stoneLight=p.night?'#b0b0a2':'#dad4c3';
    r(335,84,46,63,stone);
    r(338,88,40,59,stoneLight);
    for(const [x,y] of [[340,95],[356,95],[343,108],[361,108]]){
      r(x,y,11,2,stone);
    }
    r(333,83,50,5,p.woodLight);
    r(345,111,26,36,p.dark);
    r(349,117,18,30,'#403734');
    r(346,143,25,3,p.trunk);
    const flicker=motion.matches?0:Math.sin(t*.008)*2;
    r(353,132,11,11,'#bf6744');
    r(355,126+flicker,8,14,'#e9a44c');
    r(358,133+flicker,4,7,'#ffebae');
    r(334,146,48,4,p.wood);
  }
  function interior(p,t){
    // Living room: one tiny bed, one properly sized armchair, an inset
    // fireplace and clear open space around Pip. Nothing overlaps.
    roomShell(p);
    roomWindow(p,32,52,83,69);
    // Small picture pair and shallow shelf.
    r(144,68,31,34,p.wood);
    r(147,71,25,28,p.wall);
    r(158,83,2,13,p.leafDark);
    r(151,82,10,7,p.flower);r(160,78,8,8,p.flower3);
    r(191,77,28,30,p.wood);
    r(194,80,22,24,p.wall);
    r(204,91,2,11,p.leafDark);
    r(198,88,7,6,p.leaf2);r(206,86,6,7,p.flower2);
    r(238,92,52,5,p.woodLight);
    miniBooks(p,244,92,6);
    plantPot(p,275,84,true);
    hearth(p,t);
    // Low bed fitted to Pip (roughly 2x her width).
    r(38,169,72,30,p.wood);
    r(41,164,67,26,p.woodLight);
    r(46,166,62,17,p.wallShadow);
    r(47,167,20,14,p.wall);
    r(69,168,36,19,'#c99ca6');
    r(71,179,34,4,'#efd1d6');
    r(36,158,6,45,p.trunk);
    r(109,161,5,40,p.trunk);
    r(37,155,5,5,p.woodLight);
    r(109,158,5,5,p.woodLight);
    // A single armchair, aligned along the room's right wall.
    r(263,163,41,34,p.wood);
    r(268,156,32,34,'#bd949b');
    r(272,161,24,26,'#dfb9bf');
    r(260,181,9,23,p.wood);
    r(300,181,8,23,p.wood);
    r(271,191,27,8,'#c79ba3');
    r(267,201,5,8,p.trunk);
    r(299,201,5,8,p.trunk);
    // Side table, proportionate to the chair, and a small mug.
    r(311,182,18,5,p.woodLight);
    r(315,187,3,19,p.trunk);
    r(325,187,3,19,p.trunk);
    r(317,175,8,8,p.wall);
    r(318,173,6,3,p.flower3);
    // Modest shelf of books beside the bed, grounded on the skirting.
    r(144,102,54,47,p.wood);
    r(148,106,46,39,p.trunkLight);
    r(147,122,48,4,p.woodLight);
    r(147,143,48,4,p.woodLight);
    miniBooks(p,152,122,6);
    miniBooks(p,153,143,5);
    r(158,147,5,6,p.trunk);
    r(185,147,5,6,p.trunk);
    roomRug(p,130,214,117,22);
    // A tiny folded floor cushion, NOT a giant second chair.
    r(232,195,22,9,'#c69fa7');
    r(236,193,14,3,'#f1d6d9');
    if(p.night&&Math.sin(t*.0017)>0)r(207,85,2,2,p.glow);
  }
  function study(p,t){
    // Study: a single-person desk, mini monitor and properly sized stool.
    roomShell(p);
    roomWindow(p,32,52,79,66);
    // Noticeboard for Pip's questions.
    r(139,56,67,45,p.wood);
    r(143,60,59,37,p.wallShadow);
    r(148,64,19,13,p.wall);
    r(172,68,23,15,p.flower2);
    r(152,84,38,4,p.wall);
    r(151,65,3,3,p.roof);
    r(183,67,3,3,p.roof);
    // Bookshelf is shorter and shallower, anchored to the back wall.
    r(313,67,57,80,p.wood);
    r(317,71,49,72,p.trunkLight);
    for(const y of [94,119,142]){
      r(316,y,51,4,p.woodLight);
    }
    miniBooks(p,322,94,7);
    miniBooks(p,322,119,7);
    miniBooks(p,322,142,7);
    r(317,147,6,8,p.trunk);
    r(360,147,6,8,p.trunk);
    // Worktop sits at Pip's torso height, not above her ears.
    r(166,150,92,7,p.woodLight);
    r(170,157,5,40,p.trunk);
    r(250,157,5,40,p.trunk);
    r(178,157,3,33,p.wood);
    // Computer: a compact 40x30 monitor with keyboard and a glowing screen.
    r(192,113,45,34,p.dark);
    r(196,117,37,25,p.window);
    r(200,121,27,3,p.glow);
    r(200,127,20,3,p.leaf3);
    r(200,134,29,2,p.roofLight);
    r(210,147,7,4,p.wood);
    r(203,151,21,2,p.trunkLight);
    r(193,157,40,5,p.wall);
    r(197,158,30,1,p.stone);
    // Lamp, letter tray and plant in their own little spaces.
    r(174,125,2,24,p.trunk);
    r(169,122,13,5,p.flower2);
    r(174,119,6,4,p.glow);
    r(236,146,18,4,p.wall);
    r(239,141,14,5,'#f0d6d2');
    plantPot(p,276,141,true);
    // One small chair tucked under the desk.
    r(196,181,24,7,'#bb939d');
    r(199,165,18,18,'#d7b3b9');
    r(200,188,4,15,p.trunk);
    r(214,188,4,15,p.trunk);
    roomRug(p,155,215,116,21);
    r(38,175,45,12,p.woodLight);
    r(42,187,5,15,p.trunk);
    r(75,187,5,15,p.trunk);
    r(44,168,14,7,p.flower3);
    r(59,170,16,6,p.flower);
  }
  function kitchen(p,t){
    // Breakfast nook: a two-place table, small stove, window herbs and
    // open shelves. All furnishings are roughly Pip-sized.
    roomShell(p);
    roomWindow(p,33,52,81,68);
    // Dried herbs and two shallow shelves instead of huge wall cupboards.
    for(const y of [74,107]){
      r(145,y,96,5,p.woodLight);
    }
    for(const [x,y,c] of [[150,60,p.flower],[171,60,p.flower3],
      [197,60,p.flower2],[218,60,p.leaf2],
      [152,93,p.flower3],[181,93,p.flower],[213,93,p.flower2]]){
      r(x,y,10,14,p.wall);
      r(x+2,y-3,6,4,p.woodLight);
      r(x+2,y+5,6,5,c);
    }
    for(const x of [165,199,225]){
      r(x,112,2,11,p.leafDark);
      r(x-4,120,10,6,p.leaf2);
    }
    // A shallow kitchen counter, flush against the back wall.
    r(272,143,112,9,p.woodLight);
    r(277,152,102,30,p.wood);
    for(const x of [281,306,336,361]){
      r(x,155,23,23,p.trunkLight);
      r(x+19,164,2,4,p.wallShadow);
    }
    r(286,143,28,5,p.stoneLight);r(292,143,17,3,p.water);
    r(299,135,3,8,p.wood);
    r(299,133,15,3,p.woodLight);
    // Compact stove sized for Pip, not a full adult human range.
    r(340,135,37,7,p.dark);
    r(344,137,11,3,p.stone);
    r(362,137,11,3,p.stone);
    r(340,157,35,24,p.dark);
    r(344,161,27,17,p.stone);
    r(349,164,17,10,p.window);
    r(348,152,3,3,p.glow);
    r(367,152,3,3,p.glow);
    // Breakfast table has a half-width top and two small seats.
    oval(97,193,40,10,p.wood);
    oval(97,189,39,10,p.woodLight);
    r(93,198,8,25,p.trunk);
    r(85,181,26,7,p.wall);
    r(88,178,20,5,p.trunkLight);
    for(const [dx,dy,c] of [[-9,0,'#c4546f'],[-2,-4,'#aa4961'],
      [6,0,'#e98a91'],[1,2,'#bd6279']]){
      r(99+dx,184+dy,5,4,c);
    }
    r(42,190,19,7,p.trunkLight);
    r(45,197,4,19,p.trunk);
    r(56,197,4,19,p.trunk);
    r(137,190,19,7,p.trunkLight);
    r(140,197,4,19,p.trunk);
    r(151,197,4,19,p.trunk);
    // Tiny herb pots on the sill and a light, simple floor runner.
    for(const x of [49,71,93]){
      r(x,119,9,9,p.trunkLight);
      r(x+3,114,3,8,p.leafDark);
      r(x+1,112,7,5,p.leaf3);
    }
    roomRug(p,224,216,99,20);
    plantPot(p,260,166,true);
    // A small wicker basket instead of another large cabinet.
    r(247,196,22,12,p.woodLight);
    r(252,191,12,7,p.trunkLight);
    r(254,187,8,4,p.flower3);
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
  let state={location:'meadow',room:'living',night:false,x:57,y:64,unread:false};
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
      else if(state.room==='study')study(p,t);
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
    creature(home?(state.room==='kitchen'?184:state.room==='study'?281:188):position.x,
      home?(state.room==='kitchen'?206:207):position.y,p,t,walking,home);
    ctx.restore();
    moveHitboxes();
    if(!motion.matches)requestAnimationFrame(render);
  }
  function placeOverlay(id,x,y,width=28,height=30,area='meadow'){
    const b=document.getElementById(id);
    if(!b)return;
    b.style.left=((x-camera)/W*100)+'%';
    b.style.top=((y-16)/H*100)+'%';
    b.style.width=(width/W*100)+'%';
    b.style.height=(height/H*100)+'%';
    b.hidden=state.location!==area;
  }
  function moveHitboxes(){
    const b=document.getElementById('petInteract');
    const bubble=document.getElementById('bubble');
    const home=!isOutside(state.location);
    const x=home?(state.room==='kitchen'?184:state.room==='study'?281:188):position.x-camera;
    const y=home?(state.room==='kitchen'?206:207):position.y;
    if(b){b.style.left=x/W*100+'%';b.style.top=(y-9)/H*100+'%'}
    if(bubble){
      bubble.style.left=Math.max(16,Math.min(85,x/W*100))+'%';
      bubble.style.bottom=Math.max(17,Math.min(67,(H-y+40)/H*100))+'%';
    }
    placeOverlay('mailboxInteract',237,179,37,51);
    placeOverlay('berryInteract',state.location==='grove'?482:461,state.location==='grove'?175:189,43,51,state.location==='grove'?'grove':'meadow');
    const cottage=document.getElementById('cottage');
    if(cottage&&state.location==='meadow'){
      cottage.style.left=((55-camera)/W*100)+'%';
      cottage.style.top='23%';
      cottage.style.width=(159/W*100)+'%';
      cottage.style.height='48%';
      cottage.hidden=(55-camera>W||214-camera<0);
    }
    const computer=document.getElementById('computerInteract');
    if(computer&&home&&state.room==='study'){
      computer.style.left='45%';computer.style.top='40%';
      computer.style.width='16%';computer.style.height='25%';
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
    if(!['living','study','kitchen'].includes(state.room))state.room='living';
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