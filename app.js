(() => {
'use strict';
const $=id=>document.getElementById(id), clamp=n=>Math.max(0,Math.min(100,Math.round(n))), now=()=>Date.now(), rand=a=>a[Math.floor(Math.random()*a.length)];
const DATA_KEY='little-wanderer-v1',CONFIG_KEY='little-wanderer-config',THEME_KEY='little-wanderer-theme-v2';
const topics=['wildflowers','the moon','butterflies','forests','mushrooms','stars','birds','oceans','bees','clouds','foxes','seashells'];
const statMeta=[['hunger','▤','Full tummy'],['energy','☾','Energy'],['social','✉','Social'],['joy','✧','Happiness'],['curiosity','✦','Curiosity']];
const safeText=s=>String(s||'').slice(0,2000);
const makeWorld=()=>({version:1,name:'Pip',created:now(),lastTick:now(),stats:{hunger:78,energy:81,social:74,joy:84,curiosity:68},skills:{exploring:3,reading:2,friendship:4,gardening:1},interests:Object.fromEntries(topics.map((t,i)=>[t,i<4?2:1])),location:'meadow',lastOutdoor:'meadow',activity:'Admiring the flowers',x:57,y:64,night:false,messages:[{id:'hello',from:'pet',text:"Oh! Hello there. I'm Pip. I found a cosy cottage and some very interesting flowers. Do you think we could be friends?",at:now()}],journal:[{id:'first',at:now(),title:'A new beginning',text:"Today I arrived in a little meadow. There's a cottage, a pond, and enough curiosity to fill a whole library. I wonder who I'll meet?"}],discoveries:[],pending:[],nextAction:now()+65000,nextResearch:now()+1000*60*12,unread:false,memories:[],decisions:[],plan:{action:'explore',reason:'I want to discover something new.'}});
let state;try{state={...makeWorld(),...JSON.parse(localStorage.getItem(DATA_KEY))};}catch{state=makeWorld()}
let config;try{config=JSON.parse(localStorage.getItem(CONFIG_KEY))||{};}catch{config={}}
let uiNight;try{const theme=localStorage.getItem(THEME_KEY);uiNight=theme===null?Boolean(state.night):theme==='dark';}catch{uiNight=Boolean(state.night)}
const setTheme=(night)=>{uiNight=Boolean(night);state.night=uiNight;document.body.classList.toggle('dark',uiNight);document.documentElement.style.colorScheme=uiNight?'dark':'light';$('nightButton').setAttribute('aria-pressed',String(uiNight));$('nightButton').setAttribute('aria-label',uiNight?'Enable light mode':'Enable dark mode');$('themeGlyph').textContent=uiNight?'☼':'☾';$('themeLabel').textContent=uiNight?'Light mode':'Dark mode';const m=document.querySelector('meta[name="theme-color"]');if(m)m.content=uiNight?'#241d25':'#f8f1f1';try{localStorage.setItem(THEME_KEY,uiNight?'dark':'light')}catch{}};
const save=()=>{state.lastTick=now();try{localStorage.setItem(DATA_KEY,JSON.stringify(state));}catch(e){console.warn('Could not save state:',e)}};
const toast=t=>{const el=$('toast');el.textContent=t;el.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.hidden=true,3300)};
const date=t=>new Date(t).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});
const journal=(title,text)=>{state.journal.unshift({id:crypto.randomUUID(),at:now(),title,text});state.journal=state.journal.slice(0,120)};
const skill=(key,amount=1)=>state.skills[key]=Math.min(100,(state.skills[key]||0)+amount);
const topic=()=>{const entries=Object.entries(state.interests||{});const pool=entries.flatMap(([name,weight])=>Array(Math.max(1,Math.min(8,weight))).fill(name));return rand(pool.length?pool:topics)};
const say=text=>{const b=$('bubble');b.textContent=text;b.classList.add('show');clearTimeout(say.timer);say.timer=setTimeout(()=>b.classList.remove('show'),6000)};
const mood=()=>{const {hunger,energy,social,joy}=state.stats;return hunger<25?'hungry':energy<25?'sleepy':social<25?'lonely':joy<30?'gloomy':'content'};
function updateStats(){for(const [k,emoji,title] of statMeta){const val=clamp(state.stats[k]);let node=document.querySelector('[data-stat="'+k+'"]');if(!node){node=document.createElement('div');node.className='stat';node.dataset.stat=k;node.innerHTML='<div class="stat-label"><span></span><strong></strong></div><div class="bar"><div class="bar-fill"></div></div>';$('stats').append(node)}node.querySelector('span').textContent=emoji+' '+title;node.querySelector('strong').textContent=val+'%';const fill=node.querySelector('.bar-fill');fill.style.width=val+'%';fill.classList.toggle('low',val<30);const slider=document.querySelector('[data-slider="'+k+'"]');if(slider)slider.value=val;}
$('petTitle').textContent=state.name+' ♡';const m=mood();$('mood').textContent=({hungry:'My tummy is rumbling',sleepy:'Could use a little nap',lonely:'Hoping for a chat',gloomy:'Feeling a bit quiet',content:'Feeling rather content'})[m];$('moodPill').textContent=({hungry:'Hungry',sleepy:'Sleepy',lonely:'A little lonely',gloomy:'Thoughtful',content:'Quite cosy'})[m];}
for(const [k,,title] of statMeta){const wrap=document.createElement('div');const label=document.createElement('label');label.textContent=title;label.htmlFor='range-'+k;const input=document.createElement('input');input.type='range';input.id='range-'+k;input.min=0;input.max=100;input.dataset.slider=k;input.addEventListener('input',()=>{state.stats[k]=Number(input.value);updateStats();save()});input.addEventListener('change',async()=>{if(config.url&&config.token){try{const r=await api('/api/stats',{method:'POST',body:JSON.stringify({stat:k,value:Number(input.value)})});if(!r.ok)throw Error();await sync()}catch{toast('Unable to update this need on the brain server.')}}});wrap.append(label,input);$('sliders').append(wrap)}
function renderMessages(){const el=$('messages');el.replaceChildren();for(const m of (state.messages||[]).slice(-80)){const div=document.createElement('div');div.className='msg'+(m.from==='you'?' mine':'');const body=document.createElement('div');body.textContent=m.text;const time=document.createElement('time');time.textContent=date(m.at);div.append(body,time);el.append(div)}el.scrollTop=el.scrollHeight}
function renderJournal(){const el=$('journal');el.replaceChildren();for(const e of state.journal.slice(0,70)){const box=document.createElement('article');box.className='journal-entry';const t=document.createElement('time');t.textContent=date(e.at);const h=document.createElement('h4');h.textContent=e.title;const p=document.createElement('p');p.textContent=e.text;box.append(t,h,p);el.append(box)}}
function renderDiscoveries(){const el=$('discoveries');el.replaceChildren();if(!state.discoveries.length){const p=document.createElement('p');p.className='muted';p.textContent='No discoveries just yet. I wonder what the first one will be?';el.append(p)}for(const d of state.discoveries.slice(0,40)){const box=document.createElement('article');box.className='discovery';const h=document.createElement('h4');h.textContent='✦ '+d.title;const p=document.createElement('p');p.textContent=d.summary;box.append(h,p);if(d.url&&/^https:\/\/[a-z-]+\.wikipedia\.org\/wiki\//.test(d.url)){const a=document.createElement('a');a.href=d.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Read the source ↗';box.append(a)}el.append(box)}}
function renderInterests(){$('interests').replaceChildren();Object.entries(state.interests||{}).sort((a,b)=>b[1]-a[1]).slice(0,6).forEach(([name])=>{const chip=document.createElement('span');chip.className='chip';chip.textContent='✿ '+name;$('interests').append(chip)})}
function renderSkills(){$('skills').replaceChildren();for(const [name,val] of Object.entries(state.skills)){const r=document.createElement('div');r.className='skill';const label=document.createElement('span');label.textContent=name[0].toUpperCase()+name.slice(1);const bar=document.createElement('div');bar.className='bar';const fill=document.createElement('div');fill.className='bar-fill';fill.style.width=val+'%';bar.append(fill);const n=document.createElement('b');n.textContent=val+' xp';r.append(label,bar,n);$('skills').append(r)}}
function renderWorld(){
 const isHome=state.location==='cottage';
 const zone=state.location==='grove'?'grove':'meadow';
 $('room').hidden=!isHome;
 $('outside').hidden=!isHome;
 $('cottage').hidden=isHome||zone==='grove';
 $('location').textContent=isHome?'Inside the cottage':zone==='grove'?'Exploring the woodland':'Wandering outside';
 $('worldHeading').textContent=isHome?'Little Cottage':zone==='grove'?'Whispering Woods':'Rosewood Meadow';
 $('activity').textContent=state.activity;
 $('worldNote').textContent=isHome?'A warm room with books and a crackling fireplace.':zone==='grove'?'A little stream winds between the woodland trees.':'Sunshine drifts across the meadow.';
 $('visitButton').textContent=isHome?'Return outside ↗':zone==='grove'?'Head to the meadow ↗':'Visit the cottage ↗';
 for(const button of document.querySelectorAll('[data-scene]')){
   const selected=(isHome?state.lastOutdoor||'meadow':state.location)===button.dataset.scene;
   button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));
 }
 state.night=uiNight;setTheme(uiNight);
 if(window.PixelWorld)window.PixelWorld.setState(state,!renderWorld.hasRendered);
 renderWorld.hasRendered=true;
}
function renderMemories(){const host=$('memoryNotes');host.replaceChildren();for(const [i,item] of (state.memories||[]).entries()){const row=document.createElement('div');row.className='memory-row';const t=document.createElement('span');t.textContent=typeof item==='string'?item:item.text||'';const b=document.createElement('button');b.type='button';b.textContent='×';b.title='Forget this';b.setAttribute('aria-label','Forget memory');b.addEventListener('click',async()=>{if(config.url&&config.token){try{const response=await api('/api/memories/'+i,{method:'DELETE'});if(!response.ok)throw Error();await sync();return}catch{return toast('Unable to forget while brain server is connected.')}}state.memories.splice(i,1);save();renderMemories()});row.append(t,b);host.append(row)}if(!state.memories?.length){const p=document.createElement('p');p.className='tiny';p.textContent='A fresh shelf, ready for little things worth remembering.';host.append(p)}}
function renderDecisions(){const el=$('decisions');el.replaceChildren();for(const d of (state.decisions||[]).slice(0,45)){const row=document.createElement('article');row.className='journal-entry';const time=document.createElement('time');time.textContent=date(d.at);const h=document.createElement('h4');h.textContent=d.action;const p=document.createElement('p');p.textContent=d.reason;row.append(time,h,p);el.append(row)}if(!state.decisions?.length)el.textContent='My first decisions will appear here soon.';const plan=state.plan||{action:'explore',reason:'I feel curious.'};$('nextPlan').textContent=plan.action;$('planReason').textContent=plan.reason}
function render(){updateStats();renderMemories();renderDecisions();renderWorld();renderInterests();renderSkills();renderMessages();renderJournal();renderDiscoveries();$('petName').value=state.name;$('typing').textContent=state.pending.length?state.name+' has a letter to think about...':'✿ '+state.name+' is enjoying a quiet moment.';$('unread').hidden=!state.unread}
const move=()=>{const oldX=Number(state.x)||57,oldY=Number(state.y)||64;state.x=Math.max(10,Math.min(79,oldX+(Math.random()-.5)*30));state.y=Math.max(53,Math.min(76,oldY+(Math.random()-.5)*17))};
function act(force){const s=state.stats;let action=force||'wander';if(!force){if(s.energy<24)action='rest';else if(s.hunger<25)action='feed';else if(s.social<30)action='reflect';else if(s.curiosity<35)action='read';else action=rand(['wander','wander','garden','explore','reflect','read','rest']);}
const notes={wander:['Walking through the meadow','The air smells like wildflowers','A little stroll clears my head'],garden:['Checking the little seedlings','I think the garden looks happier today'],explore:['Investigating something shiny','I saw a curious little bug'],reflect:['Thinking about my day','I wonder what you are doing'],read:['Reading under a tree','Learning something new'],rest:['A well-earned little nap','Resting in my cottage'],feed:['Having something tasty','A snack sounds lovely'],play:['Chasing a fluttering leaf','Playing in the grass']};
const reasons={rest:'I was running low on energy, so a little rest seemed sensible.',feed:'My tummy was getting empty, and I wanted a snack.',reflect:'I wanted to think about my day and our letters.',read:'I felt curious and wanted a quiet moment with a book.',garden:'The flowers might need tending, and gardening makes me happy.',explore:'I felt curious about the meadow around me.',wander:'A bit of wandering sounded fun.',play:'I wanted to have some fun.'};state.decisions=state.decisions||[];state.decisions.unshift({at:now(),action:action[0].toUpperCase()+action.slice(1),reason:reasons[action]||'It felt like a good idea.'});state.decisions=state.decisions.slice(0,100);state.plan={action:'Explore my interests',reason:'I will choose again after checking my needs.'};state.activity=rand(notes[action]||notes.wander);state.location=action==='rest'||action==='read'?'cottage':(state.lastOutdoor==='grove'?'grove':'meadow');if(state.location==='cottage'){state.lastOutdoor=state.lastOutdoor||'meadow';}else{state.location=state.lastOutdoor==='grove'?'grove':'meadow';move();}
if(action==='feed')s.hunger=clamp(s.hunger+36);if(action==='rest')s.energy=clamp(s.energy+33);
if(action==='wander'||action==='explore'){s.joy=clamp(s.joy+5);s.curiosity=clamp(s.curiosity-3);skill('exploring',2)}
if(action==='garden'){s.joy=clamp(s.joy+8);skill('gardening',3)}
if(action==='read'){s.curiosity=clamp(s.curiosity+16);skill('reading',3)}
if(action==='reflect')s.social=clamp(s.social+2);
if(action==='play'){s.joy=clamp(s.joy+17);s.energy=clamp(s.energy-6);skill('exploring',1)}
if(Math.random()<.28){journal('A little '+(action==='rest'?'rest':action==='garden'?'garden visit':action==='read'?'reading time':'adventure'),state.activity+'. '+rand(['I wonder what tomorrow will bring.','It felt nice to take my time.','Perhaps I will tell you about it later.','There is so much more I want to learn.']))}
state.nextAction=now()+55000+Math.floor(Math.random()*50000);renderWorld();updateStats();}
function applyTime(){let minutes=Math.min(120,Math.max(0,(now()-(state.lastTick||now()))/60000));if(minutes>.1){const d=Math.min(minutes,120);state.stats.hunger=clamp(state.stats.hunger-.17*d);state.stats.energy=clamp(state.stats.energy-(state.location==='cottage'?-0.3:.12)*d);state.stats.social=clamp(state.stats.social-.1*d);state.stats.joy=clamp(state.stats.joy-.07*d);state.stats.curiosity=clamp(state.stats.curiosity+.04*d);}}
function response(input){
 const text=input.toLowerCase().trim();
 const activity=(state.activity||'wandering through the meadow').toLowerCase();
 const recent=state.discoveries?.[0];
 const topInterests=Object.entries(state.interests||{}).sort((a,b)=>b[1]-a[1]).map(x=>x[0]);
 const interest=topInterests.length?rand(topInterests.slice(0,5)):'the little things in the woodland';
 const zone=state.location==='grove'?'the woodland':state.location==='cottage'?'my cottage':'the meadow';
 const approved=state.memories||[];
 if(/how are you|how was your day|what did you do|how.s your day/.test(text)){
   return rand([
     "I've been "+activity+". "+(state.stats.energy<35?"I think I'm ready for a little nap.":"It's a rather nice day for taking things slowly.")+" How has your day been?",
     "I was "+activity+" in "+zone+". I keep getting distracted by tiny things that seem much more interesting up close.",
     "Quite good, thank you. I've been keeping busy in "+zone+", although I do sometimes forget what I was originally doing."
   ]);
 }
 if(/\b(hello|hi pip|hey pip|good morning|good evening|goodnight)\b/.test(text)){
   return rand([
     "Hello! I was "+activity+" and nearly lost track of time.",
     "Oh, there you are. I've found a nice quiet spot to read your letter.",
     "Hello again! I was thinking about "+interest+" just before you wrote."
   ]);
 }
 if(/remember|memory|forgot/.test(text)){
   return approved.length
    ?"I keep the things you've put on my memory shelf. You can check or change them whenever you want."
    :"My memory shelf is still rather empty. If there's something important to you, you can leave a note there.";
 }
 if(/research|learn|discover|read about|interesting fact/.test(text)){
   return recent
    ?"I recently discovered something about "+recent.title+". I've saved the article in my discoveries so we can read it together. I've also been curious about "+interest+"."
    :"I've been wondering about "+interest+". I haven't found a reliable article yet, but I could go exploring the library.";
 }
 if(/friend|love you|miss you/.test(text)){
   return rand([
     "I like having someone to share these quiet little days with. It makes the cottage feel less empty.",
     "That's kind of you to say. I might keep this letter nearby for a little while.",
     "It's lovely to have you here. I was just thinking of going for a wander, but I'm happy to sit and talk."
   ]);
 }
 if(text.includes('?')){
   return rand([
     "I don't know the answer for certain, and I don't want to make one up. Perhaps it's something we could explore?",
     "That's made me curious too. I was "+activity+" when your letter arrived, and now I have something new to think about.",
     "I'm still figuring lots of things out. What made you think of that?"
   ]);
 }
 return rand([
   "I've been thinking about what you said. I like hearing the ordinary details of your day.",
   "Thank you for the letter. I was "+activity+", so it was lovely to have a reason to sit down for a bit.",
   "I was just wondering about "+interest+". Sometimes I think I could spend a whole afternoon asking questions.",
   "It's nice to hear from you. I was going to go for a walk through "+zone+" after this.",
   "I read your message twice. It's funny how even a short letter can give me a lot to think about."
 ]);
}
function sendMessage(){const field=$('message');const text=field.value.trim();if(!text)return;if(text.length>500)return toast('That letter is a little too long.');field.value='';state.messages.push({id:crypto.randomUUID(),from:'you',text,at:now()});state.stats.social=clamp(state.stats.social+9);skill('friendship',2);state.pending.push({id:crypto.randomUUID(),text,due:now()+20000+Math.random()*55000});journal('A letter arrived','You wrote to me today. I want to take a moment to think before I reply.');save();render();}
function deliver(){if(!state.pending.length)return;const due=state.pending.filter(p=>p.due<=now());state.pending=state.pending.filter(p=>p.due>now());for(const p of due){state.messages.push({id:crypto.randomUUID(),from:'pet',text:response(p.text),at:now()});state.stats.social=clamp(state.stats.social+13);say('A letter for you!');state.unread=true;}if(due.length){save();renderMessages();$('typing').textContent=state.name+' has written back!';$('unread').hidden=false}}
let busy=false;
async function lookupResearch(){if(busy)return;busy=true;const interest=topic();$('researchStatus').textContent=state.name+' is researching '+interest+'...';say('I wonder...');try{let data;if(config.url&&config.token){const r=await api('/api/research',{method:'POST',body:JSON.stringify({topic:interest})});if(!r.ok)throw Error('Brain research unavailable');data=await r.json()}else{const search=await fetch('https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch='+encodeURIComponent(interest)+'&gsrlimit=1&prop=extracts&exintro=1&explaintext=1&format=json&origin=*');if(!search.ok)throw Error('Research unavailable');const json=await search.json();const page=Object.values(json.query?.pages||{})[0];if(!page||!page.extract)throw Error('No article');data={title:page.title,summary:page.extract.slice(0,550),url:'https://en.wikipedia.org/wiki/'+encodeURIComponent(page.title.replaceAll(' ','_'))};}
if(!state.discoveries.some(d=>d.url===data.url)){state.discoveries.unshift({...data,at:now(),topic:interest});journal('Something I learned about '+interest,'I read about '+data.title+'. '+data.summary.slice(0,180));state.interests[interest]=Math.min(8,(state.interests[interest]||1)+1);skill('reading',5);state.stats.curiosity=clamp(state.stats.curiosity+16);say('I found something!')}else say('I remember this one!');$('researchStatus').textContent='Last explored: '+data.title;}catch(e){$('researchStatus').textContent='The library is quiet right now. I can try again later.';journal('A research attempt','I tried to explore '+interest+', but could not reach a source this time. I will try again.');}finally{state.nextResearch=now()+1000*60*(12+Math.floor(Math.random()*18));busy=false;save();render();}}
const api=(route,options={})=>fetch(config.url.replace(/\/$/,'')+route,{...options,headers:{'Content-Type':'application/json','Authorization':'Bearer '+config.token,...options.headers},signal:AbortSignal.timeout(12000)});
async function connect(){const url=$('backendUrl').value.trim().replace(/\/$/,'');const token=$('backendToken').value.trim();if(!url||!token){config={};localStorage.removeItem(CONFIG_KEY);$('backendStatus').textContent='Browser-only mode.';return toast('Using browser-only mode.')}if(!/^https:\/\//.test(url)&&!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(url))return toast('Use an HTTPS URL or local localhost server.');try{config={url,token};const r=await api('/api/state');if(!r.ok)throw Error('Server rejected connection');const data=await r.json();localStorage.setItem(CONFIG_KEY,JSON.stringify(config));$('backendStatus').textContent='Connected to persistent brain (checking reply mode...)';
try{
 const h=await fetch(config.url+'/health',{signal:AbortSignal.timeout(7000)});
 if(h.ok){
   const mode=(await h.json()).mode;
   $('backendStatus').textContent=mode==='openai'?'Connected · AI-generated letters enabled':mode==='ollama'?'Connected · local model letters enabled':'Connected · scripted fallback letters (no model configured)';
 }
}catch{
 $('backendStatus').textContent='Connected to persistent brain. Reply mode unavailable.';
}$('connectionLabel').textContent='Connected to my brain ✦';toast('Connected to the brain server!');await sync();}catch{config={};toast('Could not connect. Check URL, token and CORS.');$('backendStatus').textContent='Connection failed; browser mode remains available.';}}
let syncLock=false;
async function sync(){if(!config.url||!config.token||syncLock)return;syncLock=true;try{const r=await api('/api/state');if(!r.ok)throw Error('Server unavailable');const server=await r.json();const place=state.location,lastOutdoor=state.lastOutdoor;Object.assign(state,server);if(place==='grove'||(place==='cottage'&&lastOutdoor==='grove')){state.location=place;state.lastOutdoor=lastOutdoor;}state.night=uiNight;save();render();$('connectionLabel').textContent='Brain is online ✦';}catch{$('connectionLabel').textContent='Brain is offline · browser mode';}finally{syncLock=false}}
function switchTab(which){for(const b of document.querySelectorAll('.tab')){const selected=b.dataset.tab===which;b.classList.toggle('selected',selected);b.setAttribute('aria-selected',selected)}for(const v of ['chat','journal','discoveries','activity'])$(v+'View').hidden=v!==which;if(which==='chat'){state.unread=false;$('unread').hidden=true;save()}}
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.tab)));
$('memoryForm').addEventListener('submit',async e=>{e.preventDefault();const input=$('memoryInput');const memory=input.value.trim();if(!memory)return;if(config.url&&config.token){try{const response=await api('/api/memories',{method:'POST',body:JSON.stringify({text:memory})});if(!response.ok)throw Error();input.value='';await sync();return}catch{return toast('Unable to save memory to brain server.')}}state.memories=state.memories||[];if(state.memories.length>=30)return toast('The memory shelf is full.');if(!state.memories.includes(memory))state.memories.push(memory);input.value='';save();renderMemories()});
document.querySelectorAll('[data-care]').forEach(b=>b.addEventListener('click',async()=>{const action=b.dataset.care;if(action==='talk'){switchTab('chat');$('message').focus();return}if(config.url&&config.token){try{const r=await api('/api/care',{method:'POST',body:JSON.stringify({action})});if(r.ok){await sync();return}}catch{}}act(action==='rest'?'rest':action==='feed'?'feed':'play');say(action==='feed'?'Yum, thank you!':action==='rest'?'Time for a nap!':'Hehe!');save();render()}));
$('chatForm').addEventListener('submit',async e=>{e.preventDefault();if(config.url&&config.token){const value=$('message').value.trim();if(!value)return;try{const r=await api('/api/message',{method:'POST',body:JSON.stringify({text:value})});if(!r.ok)throw Error();$('message').value='';await sync();return}catch{return toast('The brain is offline. Reconnect or switch to browser mode.')}}sendMessage()});
$('research').addEventListener('click',lookupResearch);
$('petInteract').addEventListener('click',()=>document.querySelector('[data-care="play"]').click());
function visitScene(scene){
 if(!['meadow','grove','cottage'].includes(scene))return;
 if(scene==='cottage')state.lastOutdoor=state.location==='grove'?'grove':state.lastOutdoor||'meadow';
 else state.lastOutdoor=scene;
 state.location=scene;
 state.activity=scene==='cottage'?'Enjoying a quiet moment at home':scene==='grove'?'Exploring the woodland':'Wandering across the meadow';
 if(scene!=='cottage')move();
 renderWorld();save();
}
document.querySelectorAll('[data-scene]').forEach(button=>button.addEventListener('click',()=>visitScene(button.dataset.scene)));
$('cottage').addEventListener('click',()=>visitScene('cottage'));
$('visitButton').addEventListener('click',()=>visitScene(state.location==='cottage'?(state.lastOutdoor||'meadow'):state.location==='grove'?'meadow':'cottage'));
$('outside').addEventListener('click',()=>visitScene(state.lastOutdoor||'meadow'));
$('nightButton').addEventListener('click',()=>{setTheme(!uiNight);renderWorld();save()});
$('rename').addEventListener('click',async()=>{const name=$('petName').value.trim().slice(0,18);if(!name)return;if(config.url&&config.token){try{const r=await api('/api/name',{method:'POST',body:JSON.stringify({name})});if(r.ok){await sync();return}}catch{}}state.name=name;toast('Your companion is now '+name);save();render()});
$('connect').addEventListener('click',connect);
$('export').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='little-wanderer-memories.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)});
$('import').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>2000000)throw Error('Too large');const val=JSON.parse(await file.text());if(!val||val.version!==1||!val.stats||!Array.isArray(val.messages))throw Error('Unsupported save');state={...makeWorld(),...val,lastTick:now()};if(!['meadow','grove','cottage'].includes(state.location))state.location='meadow';uiNight=state.night===true;save();render();toast('Memories restored!')}catch{toast('Could not read that save file.')}e.target.value=''});
$('reset').addEventListener('click',()=>{if(!confirm('Start a new little world? This clears this browser\'s pet memories. Export first if you wish to keep them.'))return;state=makeWorld();state.night=uiNight;save();render()});
$('backendUrl').value=config.url||'';$('backendToken').value=config.token||'';
if(config.url&&config.token){$('connectionLabel').textContent='Connecting to my brain...';sync()}else applyTime();
render();save();
setInterval(()=>{if(config.url&&config.token){sync();return}if(now()>=state.nextAction)act();deliver();if(now()>=state.nextResearch)lookupResearch();state.stats.hunger=clamp(state.stats.hunger-.025);state.stats.energy=clamp(state.stats.energy-(state.location==='cottage'?-.02:.018));state.stats.joy=clamp(state.stats.joy-.008);state.stats.social=clamp(state.stats.social-.011);save();updateStats()},5000);
window.addEventListener('beforeunload',save);
})();