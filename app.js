(() => {
'use strict';
const $=id=>document.getElementById(id), clamp=n=>Math.max(0,Math.min(100,Math.round(n))), now=()=>Date.now(), rand=a=>a[Math.floor(Math.random()*a.length)];
const DEFAULT_BRAIN_URL='https://little-wanderer-brain.verity-cooper24.workers.dev';
const CONVERSATION_KEY='little-wanderer-conversation-mode';
let conversationMode=localStorage.getItem(CONVERSATION_KEY)==='chat'?'chat':'letter';
let chatBusy=false;
function setConversationMode(mode){
 conversationMode=mode==='chat'?'chat':'letter';
 localStorage.setItem(CONVERSATION_KEY,conversationMode);
 document.querySelectorAll('[data-conversation]').forEach(b=>{
   const active=b.dataset.conversation===conversationMode;
   b.classList.toggle('selected',active);
   b.setAttribute('aria-pressed',String(active));
 });
 $('chatHeadline').textContent=conversationMode==='chat'?'Talk to Pip':'Letters between us';
 $('chatIntro').textContent=conversationMode==='chat'
   ?'Talk whenever you like. Pip remembers the same life, garden, hobbies and letters.'
   :"No instant replies here. Pip writes back when there's a quiet moment.";
 $('message').placeholder=conversationMode==='chat'?'Say something to Pip...':'Write a little letter...';
 $('sendMessageButton').textContent=conversationMode==='chat'?'Chat ↗':'Send ↗';
}

const DATA_KEY='little-wanderer-v1',CONFIG_KEY='little-wanderer-config',THEME_KEY='little-wanderer-theme-v2',BACKUP_KEY='little-wanderer-before-cloud-brain-v1',IMPORTED_KEY='little-wanderer-cloud-brain-imported';
const topics=['wildflowers','the moon','butterflies','forests','mushrooms','stars','birds','oceans','bees','clouds','foxes','seashells'];
const statMeta=[['hunger','▤','Full tummy'],['energy','☾','Energy'],['social','✉','Social'],['joy','✧','Happiness'],['curiosity','✦','Curiosity']];
const safeText=s=>String(s||'').slice(0,2000);
const makeWorld=()=>({version:1,name:'Pip',created:now(),lastTick:now(),stats:{hunger:78,energy:81,social:74,joy:84,curiosity:68},skills:{exploring:3,reading:2,friendship:4,gardening:1},interests:Object.fromEntries(topics.map((t,i)=>[t,i<4?2:1])),location:'meadow',lastOutdoor:'meadow',room:'living',pendingResearch:null,activity:'Admiring the flowers',x:57,y:64,night:false,messages:[{id:'hello',from:'pet',text:"Oh! Hello there. I'm Pip. I found a cosy cottage and some very interesting flowers. Do you think we could be friends?",at:now()}],journal:[{id:'first',at:now(),title:'A new beginning',text:"Today I arrived in a little meadow. There's a cottage, a pond, and enough curiosity to fill a whole library. I wonder who I'll meet?"}],discoveries:[],pending:[],nextAction:now()+65000,nextResearch:now()+1000*60*12,unread:false,memories:[],decisions:[],plan:{action:'explore',reason:'I want to discover something new.'}});
let state;try{state={...makeWorld(),...JSON.parse(localStorage.getItem(DATA_KEY))};}catch{state=makeWorld()}
let config;try{config=JSON.parse(localStorage.getItem(CONFIG_KEY))||{};}catch{config={}}
const preserveBrowserSave=()=>{try{if(!localStorage.getItem(BACKUP_KEY))localStorage.setItem(BACKUP_KEY,JSON.stringify(state));}catch{toast('Unable to preserve a browser backup. Please export your memories first.');}};
const updateMigrationButton=()=>{const button=$('migrateToBrain');if(!button)return;let eligible=false;try{eligible=Boolean(config.url&&config.token&&localStorage.getItem(BACKUP_KEY)&&localStorage.getItem(IMPORTED_KEY)!==config.url)}catch{}button.disabled=!eligible;};

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
function renderDiscoveries(){
 const el=$('discoveries');el.replaceChildren();
 if(!state.discoveries?.length){
   const p=document.createElement('p');p.className='muted';
   p.textContent='No discoveries just yet. When Pip has a question, you can decide whether to let her look it up.';
   el.append(p);
 }
 for(const d of (state.discoveries||[]).slice(0,40)){
   const box=document.createElement('article');box.className='discovery';
   const h=document.createElement('h4');h.textContent='✦ '+(d.topic||d.title);
   box.append(h);
   if(d.question){
     const q=document.createElement('p');q.className='discovery-question';
     q.textContent='I wondered: '+d.question;box.append(q);
   }
   if(d.summary){
     const p=document.createElement('p');
     p.textContent='What I found: '+String(d.summary).slice(0,200).replace(/\s+\S*$/,'')+'…';
     box.append(p);
   }
   if(d.thought){
     const thought=document.createElement('p');
     thought.className='discovery-thought';thought.textContent='✧ '+d.thought;
     box.append(thought);
   }
   if(d.url&&/^https:\/\/[a-z-]+\.wikipedia\.org\/wiki\//.test(d.url)){
     const link=document.createElement('a');link.href=d.url;link.target='_blank';
     link.rel='noopener noreferrer';link.textContent='Where I read it ↗';box.append(link);
   }
   el.append(box);
 }
}
function renderInterests(){$('interests').replaceChildren();Object.entries(state.interests||{}).sort((a,b)=>b[1]-a[1]).slice(0,6).forEach(([name])=>{const chip=document.createElement('span');chip.className='chip';chip.textContent='✿ '+name;$('interests').append(chip)})}
function renderLife(){
 const garden=$('gardenProgress'),projects=$('projectProgress');
 garden.replaceChildren();projects.replaceChildren();
 const beds=state.garden?.beds||[];
 if(!beds.length){
   const p=document.createElement('p');p.className='tiny';
   p.textContent='Pip’s garden grows when her cloud brain is connected.';
   garden.append(p);
 }else{
   const heading=document.createElement('p');heading.className='life-subheading';
   heading.textContent='GARDEN BEDS';garden.append(heading);
   for(const bed of beds){
     const row=document.createElement('div');row.className='life-row';
     const name=document.createElement('span');
     const progress=Math.max(0,Math.min(100,Number(bed.growth)||0));
     name.textContent=(bed.plant==='flower'?'✿ ':bed.plant==='berry'?'❀ ':'♧ ')+bed.name;
     const status=document.createElement('span');
     status.textContent=Math.round(progress)+'% grown · '+(bed.water<35?'needs water':'watered');
     const wrap=document.createElement('div');wrap.className='life-bar';
     const fill=document.createElement('div');fill.style.width=progress+'%';
     wrap.append(fill);
     const labels=document.createElement('div');labels.className='life-row-labels';
     labels.append(name,status);row.append(labels,wrap);garden.append(row);
   }
   const harvests=document.createElement('p');harvests.className='tiny';
   harvests.textContent='Berry harvests: '+(state.garden.harvests||0);
   garden.append(harvests);
 }
 const heading=document.createElement('p');heading.className='life-subheading';
 heading.textContent='MY LITTLE PROJECTS';projects.append(heading);
 const current=(state.projects||[]).find(p=>!p.done);
 if(current){
   const name=document.createElement('strong');name.textContent=current.title;
   const next=document.createElement('p');next.className='tiny';
   next.textContent=current.steps?.[current.step]||'Almost finished!';
   const bar=document.createElement('div');bar.className='life-bar';
   const fill=document.createElement('div');fill.style.width=Math.max(0,Math.min(100,current.progress||0))+'%';bar.append(fill);
   projects.append(name,next,bar);
 }else{
   const p=document.createElement('p');p.className='tiny';
   p.textContent='Pip is deciding what she’d like to make next.';
   projects.append(p);
 }
 const completed=(state.projects||[]).filter(p=>p.done).slice(0,3);
 for(const p of completed){
   const item=document.createElement('p');item.className='tiny life-completed';
   item.textContent='✓ '+p.title;projects.append(item);
 }
 const experiences=(state.experiences||[]).slice(0,2);
 if(experiences.length){
   const line=document.createElement('p');line.className='tiny life-experience';
   line.textContent='Recently: '+experiences.map(e=>e.text).join(' ');
   projects.append(line);
 }
}
function renderSkills(){$('skills').replaceChildren();for(const [name,val] of Object.entries(state.skills)){const r=document.createElement('div');r.className='skill';const label=document.createElement('span');label.textContent=name[0].toUpperCase()+name.slice(1);const bar=document.createElement('div');bar.className='bar';const fill=document.createElement('div');fill.className='bar-fill';fill.style.width=val+'%';bar.append(fill);const n=document.createElement('b');n.textContent=val+' xp';r.append(label,bar,n);$('skills').append(r)}}
function renderWorld(){
 const isHome=state.location==='cottage';
 const room=['living','study','kitchen'].includes(state.room)?state.room:'living';
 $('roomControls').hidden=!isHome;
 $('computerInteract').hidden=!isHome||room!=='study';
 for(const button of document.querySelectorAll('[data-room]')){
   const active=room===button.dataset.room;
   button.classList.toggle('selected',active);
   button.setAttribute('aria-pressed',String(active));
 }
 $('roamControls').hidden=isHome;
 const zone=state.location==='grove'?'grove':'meadow';
 $('room').hidden=!isHome;
 $('outside').hidden=!isHome;
 $('cottage').hidden=isHome||zone==='grove';
 $('location').textContent=isHome?'Inside the cottage':zone==='grove'?'Exploring the woodland':'Wandering outside';
 $('worldHeading').textContent=isHome?(room==='kitchen'?'Cottage Kitchen':room==='study'?'Pip’s Little Study':'Cottage Living Room'):zone==='grove'?'Whispering Woods':'Rosewood Meadow';
 $('activity').textContent=state.activity;
 $('worldNote').textContent=isHome?(room==='kitchen'?'A little breakfast nook for snacks and berry picking.':room==='study'?'A quiet room for questions, writing letters and the computer.':'A place to rest by the fireplace.'):zone==='grove'?'A broad stream runs beneath the bridge and the forest path continues.':'A little garden, berry bushes and a mailbox outside the cottage.';
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
function render(){renderResearchPermission();renderLife();updateStats();renderMemories();renderDecisions();renderWorld();renderInterests();renderSkills();renderMessages();renderJournal();renderDiscoveries();$('petName').value=state.name;$('typing').textContent=conversationMode==='chat'
  ?(chatBusy?state.name+' is replying...':state.lastReplyMode==='fallback'
    ?'✧ Live chat is using a simpler fallback reply right now.':'✧ Pip is ready to talk.')
  :(state.pending.length?state.name+' has a letter to think about...':'✿ '+state.name+' is enjoying a quiet moment.');$('unread').hidden=!state.unread}
const move=()=>{const oldX=Number(state.x)||57,oldY=Number(state.y)||64;state.x=Math.max(10,Math.min(79,oldX+(Math.random()-.5)*30));state.y=Math.max(53,Math.min(76,oldY+(Math.random()-.5)*17))};
function act(force){const s=state.stats;let action=force||'wander';if(!force){if(s.energy<24)action='rest';else if(s.hunger<25)action='feed';else if(s.social<30)action='reflect';else if(s.curiosity<35)action='read';else action=rand(['wander','wander','garden','explore','reflect','read','rest']);}
const notes={wander:['Walking through the meadow','The air smells like wildflowers','A little stroll clears my head'],garden:['Checking the little seedlings','I think the garden looks happier today'],explore:['Investigating something shiny','I saw a curious little bug'],reflect:['Thinking about my day','I wonder what you are doing'],read:['Reading under a tree','Learning something new'],rest:['A well-earned little nap','Resting in my cottage'],feed:['Having something tasty','A snack sounds lovely'],play:['Chasing a fluttering leaf','Playing in the grass']};
const reasons={rest:'I was running low on energy, so a little rest seemed sensible.',feed:'My tummy was getting empty, and I wanted a snack.',reflect:'I wanted to think about my day and our letters.',read:'I felt curious and wanted a quiet moment with a book.',garden:'The flowers might need tending, and gardening makes me happy.',explore:'I felt curious about the meadow around me.',wander:'A bit of wandering sounded fun.',play:'I wanted to have some fun.'};state.decisions=state.decisions||[];state.decisions.unshift({at:now(),action:action[0].toUpperCase()+action.slice(1),reason:reasons[action]||'It felt like a good idea.'});state.decisions=state.decisions.slice(0,100);state.plan={action:'Explore my interests',reason:'I will choose again after checking my needs.'};state.activity=rand(notes[action]||notes.wander);state.location=['rest','read','feed'].includes(action)?'cottage':(state.lastOutdoor==='grove'?'grove':'meadow');
if(state.location==='cottage'){
  state.room=action==='feed'?'kitchen':action==='read'?'study':'living';
  state.lastOutdoor=state.lastOutdoor||'meadow';
}else{state.location=state.lastOutdoor==='grove'?'grove':'meadow';move();}
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
function sendMessage(){const field=$('message');const text=field.value.trim();if(!text)return;if(text.length>500)return toast('That letter is a little too long.');field.value='';state.messages.push({id:crypto.randomUUID(),from:'you',text,at:now()});state.stats.social=clamp(state.stats.social+9);skill('friendship',2);state.pending.push({id:crypto.randomUUID(),text,due:now()+20000+Math.random()*55000});window.PixelWorld?.letterSent();journal('A letter arrived','You wrote to me today. I want to take a moment to think before I reply.');save();render();}
function deliver(){if(!state.pending.length)return;const due=state.pending.filter(p=>p.due<=now());state.pending=state.pending.filter(p=>p.due>now());for(const p of due){state.messages.push({id:crypto.randomUUID(),from:'pet',text:response(p.text),at:now()});state.stats.social=clamp(state.stats.social+13);say('A letter for you!');state.unread=true;}if(due.length){save();renderMessages();$('typing').textContent=state.name+' has written back!';$('unread').hidden=false}}
const LOCAL_QUESTIONS={
 mushrooms:["Why do mushrooms appear so quickly after rain?","mushroom","I like that most of the mushroom stays hidden below the ground."],
 butterflies:["How do butterflies find the flowers they like?","butterfly","I keep watching them land on different flowers."],
 wildflowers:["Why do some flowers open only at certain times?","flower","It feels like every flower keeps a different schedule."],
 "the moon":["What makes the Moon change shape?","lunar phase","Sometimes I see it even when the sky is blue."],
 forests:["How are trees connected underground?","mycorrhizal network","I wonder what is happening beneath the roots."],
 stars:["Why do stars seem to twinkle?","scintillation astronomy","I like sitting outside and looking up."],
 bees:["How do bees tell one another where flowers are?","waggle dance","I wonder whether the bees are sharing directions."],
 clouds:["What makes clouds form different shapes?","cloud","They look different every time I visit the meadow."],
 foxes:["How can foxes hear little animals under the grass?","red fox","The forest sounds different to every creature."],
 oceans:["Why do some animals deep underwater glow?","bioluminescence","Imagine finding your way by a little light in the dark."],
 seashells:["How do sea snails make and grow their shells?","seashell","A portable little house sounds wonderful."],
 birds:["How do birds find their way home after migrating?","bird migration","There must be so many journeys above my cottage."]
};
function localCuriosity(){
 const subject=topic();
 const [question,searchTerm,thought]=LOCAL_QUESTIONS[subject]||[
   'What makes '+subject+' so interesting?',subject,
   "I'd like to notice something small that I have overlooked."
 ];
 return {id:crypto.randomUUID(),topic:subject,question,searchTerm,thought,at:now()};
}
function renderResearchPermission(){
 const proposal=state.pendingResearch;
 $('researchProposal').hidden=!proposal;
 $('research').textContent=proposal?'Pip has a question for you ✧':'Ask what Pip is curious about ↗';
 if(proposal){
   $('researchQuestion').textContent=proposal.question;
   $('researchInterest').textContent='On my mind: '+proposal.topic;
   $('researchStatus').textContent='Pip is curious, but is waiting for your permission to search.';
 }else{
   $('researchStatus').textContent=state.discoveries?.length?
     'Last explored: '+state.discoveries[0].topic:
     'Pip can daydream freely, but asks before searching for anything.';
 }
}
let busy=false;
async function proposeResearch(){
 if(busy)return;
 if(state.pendingResearch){renderResearchPermission();$('researchProposal').scrollIntoView({behavior:'smooth',block:'nearest'});return;}
 busy=true;
 try{
   if(config.url&&config.token){
     const response=await api('/api/research/propose',{method:'POST',body:'{}'});
     if(!response.ok)throw Error('Unable to ask Pip for a question.');
     await sync();
   }else{
     state.pendingResearch=localCuriosity();
     state.plan={action:'Ask before searching',reason:state.pendingResearch.question};
     save();render();
   }
   say('May I look something up?');
   $('researchProposal').scrollIntoView({behavior:'smooth',block:'nearest'});
 }catch{toast('Pip could not prepare a question yet. The brain might still be updating.')}
 finally{busy=false;}
}
async function decideResearch(approve){
 if(busy||!state.pendingResearch)return;
 busy=true;
 const idea=state.pendingResearch;
 $('approveResearch').disabled=true;$('declineResearch').disabled=true;
 try{
   if(config.url&&config.token){
     const response=await api('/api/research/decision',{method:'POST',
       body:JSON.stringify({id:idea.id,approve})});
     if(!response.ok){
       const err=await response.json().catch(()=>({}));
       throw Error(err.detail||'Research could not finish.');
     }
     await sync();
   }else if(!approve){
     state.pendingResearch=null;
     state.nextResearch=now()+4*3600000;
     state.plan={action:'Daydream some more',reason:'Perhaps another question another day.'};
     save();render();
   }else{
     const endpoint='https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch='+
       encodeURIComponent(idea.searchTerm)+'&gsrlimit=1&prop=extracts&exintro=1&explaintext=1&format=json&origin=*';
     const response=await fetch(endpoint);
     if(!response.ok)throw Error('The library could not be reached.');
     const data=await response.json();
     const page=Object.values(data.query?.pages||{}).find(p=>p.extract);
     if(!page)throw Error('Pip could not find a reliable article.');
     const url='https://en.wikipedia.org/wiki/'+encodeURIComponent(page.title.replaceAll(' ','_'));
     const entry={title:page.title,topic:idea.topic,question:idea.question,
       thought:idea.thought,summary:String(page.extract).slice(0,210),url,at:now()};
     if(!state.discoveries.some(d=>d.url===url)){
       state.discoveries.unshift(entry);
       state.interests[idea.topic]=Math.min(8,(state.interests[idea.topic]||1)+1);
       state.stats.curiosity=clamp(state.stats.curiosity+12);
       skill('reading',4);
       journal('A question about '+idea.topic,'I wondered: '+idea.question+' I found a source about '+page.title+'.');
     }
     state.pendingResearch=null;
     state.location='cottage';state.room='study';
     state.activity='Writing a short note about '+idea.topic;
     state.nextResearch=now()+8*3600000;
     save();render();
   }
   toast(approve?'Pip has explored the question and added a short discovery.':'Pip will leave that question for another time.');
   say(approve?'I found something!':'Another time, perhaps.');
 }catch(err){
   toast(err?.message||'The library is quiet right now; please try again.');
   if(config.url&&config.token)await sync();
 }finally{
   busy=false;$('approveResearch').disabled=false;$('declineResearch').disabled=false;
 }
}
const api=(route,options={})=>fetch(config.url.replace(/\/$/,'')+route,{...options,headers:{'Content-Type':'application/json','Authorization':'Bearer '+config.token,...options.headers},signal:options.signal||AbortSignal.timeout(route==='/api/chat'?35000:12000)});
async function connect(){
 const url=$('backendUrl').value.trim().replace(/\/$/,'');
 const token=$('backendToken').value.trim();
 if(!url||!token){
   config={};localStorage.removeItem(CONFIG_KEY);
   $('backendStatus').textContent='Browser-only mode.';
   updateMigrationButton();
   return toast('Using browser-only mode.');
 }
 if(!/^https:\/\//.test(url)&&!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(url)){
   return toast('Use an HTTPS URL or local localhost server.');
 }
 let host;
 try{host=new URL(url).hostname;}catch{return toast('Enter a valid brain server URL.')}
 if(host.endsWith('.workers.dev')&&token.length<32){
   $('backendStatus').textContent='Cloudflare needs an access token of at least 32 characters. Update its PET_API_TOKEN secret, then paste the new token here.';
   return toast('Your Cloudflare access token is too short (minimum 32 characters).');
 }
 try{
   config={url,token};
   const r=await api('/api/state');
   if(!r.ok){
     const details=await r.json().catch(()=>({}));
     if(r.status===401)throw Error('The brain is online, but your access token was rejected (401). Check PET_API_TOKEN.');
     if(r.status===503)throw Error('The brain is online but not ready (503): '+String(details.detail||'check the secret and D1 database.'));
     throw Error('The brain returned error '+r.status+'. Check Cloudflare Worker logs.');
   }
   await r.json();
   preserveBrowserSave();
   localStorage.setItem(CONFIG_KEY,JSON.stringify(config));
   $('backendStatus').textContent='Connected to persistent brain (checking reply mode...)';
   try{
     const h=await fetch(config.url+'/health',{signal:AbortSignal.timeout(7000)});
     if(h.ok){
       const mode=(await h.json()).mode;
       $('backendStatus').textContent=mode==='workers-ai'?'Connected · Cloudflare AI letters enabled':mode==='openai'?'Connected · AI-generated letters enabled':mode==='ollama'?'Connected · local model letters enabled':'Connected · scripted fallback letters (no model configured)';
     }
   }catch{
     $('backendStatus').textContent='Connected to persistent brain. Reply mode unavailable.';
   }
   $('connectionLabel').textContent='Connected to my brain ✦';
   toast('Connected to the brain server!');
   await sync();
   updateMigrationButton();
 }catch(err){
   config={};
   $('backendStatus').textContent=err?.message?.startsWith('The brain')
     ?err.message:'Connection failed. Check your Worker URL, token and browser console for CORS errors.';
   toast('Could not connect. See the explanation below.');
   updateMigrationButton();
 }
}
let syncLock=false;
async function sync(){if(!config.url||!config.token||syncLock)return;syncLock=true;try{const r=await api('/api/state');if(!r.ok)throw Error('Server unavailable');const server=await r.json();
 const beforeLetters=(state.messages||[]).filter(m=>m.from==='pet').at(-1)?.id;
 Object.assign(state,server);
 if(!['living','study','kitchen'].includes(state.room))state.room='living';
 state.night=uiNight;
 if(beforeLetters&&state.messages?.filter(m=>m.from==='pet').at(-1)?.id!==beforeLetters){
   window.PixelWorld?.letterSent();
   if(document.querySelector('[data-tab="chat"]').getAttribute('aria-selected')==='true'){
     state.unread=false;
     api('/api/read',{method:'POST',body:'{}'}).catch(()=>{});
   }
 }
 save();render();$('connectionLabel').textContent='Brain is online ✦';}catch{$('connectionLabel').textContent='Brain is offline · browser mode';}finally{syncLock=false}}
function switchTab(which){
 for(const b of document.querySelectorAll('.tab')){
   const selected=b.dataset.tab===which;
   b.classList.toggle('selected',selected);
   b.setAttribute('aria-selected',String(selected));
 }
 for(const v of ['chat','journal','discoveries','activity'])$(v+'View').hidden=v!==which;
 if(which==='chat'){
   state.unread=false;$('unread').hidden=true;save();
   if(config.url&&config.token){
     api('/api/read',{method:'POST',body:'{}'}).catch(()=>{});
   }
 }
}
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.tab)));
$('memoryForm').addEventListener('submit',async e=>{e.preventDefault();const input=$('memoryInput');const memory=input.value.trim();if(!memory)return;if(config.url&&config.token){try{const response=await api('/api/memories',{method:'POST',body:JSON.stringify({text:memory})});if(!response.ok)throw Error();input.value='';await sync();return}catch{return toast('Unable to save memory to brain server.')}}state.memories=state.memories||[];if(state.memories.length>=30)return toast('The memory shelf is full.');if(!state.memories.includes(memory))state.memories.push(memory);input.value='';save();renderMemories()});
document.querySelectorAll('[data-care]').forEach(b=>b.addEventListener('click',async()=>{const action=b.dataset.care;if(action==='talk'){switchTab('chat');$('message').focus();return}if(config.url&&config.token){try{const r=await api('/api/care',{method:'POST',body:JSON.stringify({action})});if(r.ok){await sync();return}}catch{}}act(action==='rest'?'rest':action==='feed'?'feed':'play');say(action==='feed'?'Yum, thank you!':action==='rest'?'Time for a nap!':'Hehe!');save();render()}));
$('chatForm').addEventListener('submit',async e=>{
 e.preventDefault();
 const value=$('message').value.trim();
 if(!value||chatBusy)return;
 if(conversationMode==='chat'){
   if(!config.url||!config.token)return toast('Connect your cloud brain to use live chat.');
   chatBusy=true;$('sendMessageButton').disabled=true;render();
   try{
     const r=await api('/api/chat',{method:'POST',body:JSON.stringify({text:value})});
     const payload=await r.json().catch(()=>({}));
     if(!r.ok){
       if(r.status===404)throw Error('Live chat is still deploying to Cloudflare.');
       if(r.status===429)throw Error('Pip needs a little moment between messages.');
       throw Error(payload.detail||'Pip could not answer right now.');
     }
     $('message').value='';
     await sync();
     if(payload.mode==='fallback')toast('Pip replied using her simpler fallback; the AI limit may have been reached.');
   }catch(err){toast(err?.message||'Unable to chat. Please try again.')}
   finally{chatBusy=false;$('sendMessageButton').disabled=false;render();}
   return;
 }
 if(config.url&&config.token){
   try{
     const r=await api('/api/message',{method:'POST',body:JSON.stringify({text:value})});
     if(!r.ok)throw Error();
     $('message').value='';window.PixelWorld?.letterSent();await sync();return;
   }catch{return toast('The brain is offline. Reconnect or switch to browser mode.')}
 }
 sendMessage();
});
document.querySelectorAll('[data-conversation]').forEach(b=>
 b.addEventListener('click',()=>{setConversationMode(b.dataset.conversation);render();}));
setConversationMode(conversationMode);
$('research').addEventListener('click',proposeResearch);
$('approveResearch').addEventListener('click',()=>decideResearch(true));
$('declineResearch').addEventListener('click',()=>decideResearch(false));
$('petInteract').addEventListener('click',()=>document.querySelector('[data-care="play"]').click());
async function goTo(location,x=state.x||57,y=state.y||70,room=state.room||'study'){
 if(!['meadow','grove','cottage'].includes(location))return;
 x=Math.max(10,Math.min(150,Number(x)||57));
 y=Math.max(50,Math.min(79,Number(y)||70));
 room=['living','study','kitchen'].includes(room)?room:'living';
 if(config.url&&config.token){
   try{
     const r=await api('/api/travel',{method:'POST',
       body:JSON.stringify({location,x,y,room})});
     if(!r.ok)throw Error('The brain could not update this journey.');
     await sync();
   }catch{
     toast('Could not save this journey to the cloud brain. Try again.');
   }
 }else{
   state.location=location;
   if(location==='cottage'){
     state.room=room;
   }else{
     state.lastOutdoor=location;
     state.x=x;state.y=y;
   }
   state.activity=location==='cottage'
     ?room==='kitchen'?'Making something in the kitchen':room==='study'?'Reading and writing in the study':'Resting in the living room'
     :location==='grove'?'Wandering through the woodland':'Exploring the meadow';
   render();save();
 }
}
function visitScene(scene){
 if(scene==='cottage')return goTo('cottage',state.x,state.y,'living');
 return goTo(scene,57,73);
}
document.querySelectorAll('[data-scene]').forEach(button=>button.addEventListener('click',()=>visitScene(button.dataset.scene)));
$('cottage').addEventListener('click',()=>visitScene('cottage'));
document.querySelectorAll('[data-room]').forEach(button=>
 button.addEventListener('click',()=>goTo('cottage',state.x,state.y,button.dataset.room)));
$('computerInteract').addEventListener('click',()=>{
 say('I have a question in mind...');
 proposeResearch();
});
$('berryInteract').addEventListener('click',async()=>{
 if(config.url&&config.token){
   try{
     const r=await api('/api/forage',{method:'POST',body:'{}'});
     if(!r.ok){
       if(r.status===429)return toast('The berry bushes need a little time to grow back.');
       throw Error('Could not collect berries');
     }
     await sync();
     say('Fresh berries!');
     toast('Pip picked a handful of berries. Look in My Day and Journal!');
   }catch{toast('The brain could not collect berries just now.')}
 }else{
   if(!state.lastForageAt||now()-state.lastForageAt>120000){
     state.lastForageAt=now();
     state.x=state.location==='grove'?122:116;
     state.y=75;
     state.activity='Picking ripe berries from the bushes';
     state.stats.hunger=clamp(state.stats.hunger+9);
     state.stats.joy=clamp(state.stats.joy+4);
     skill('gardening',2);
     journal('A handful of berries','I picked a few ripe berries from the bushes by the path.');
     state.decisions.unshift({at:now(),action:'Forage',reason:'The berry bushes looked ready to pick.'});
     render();save();
     say('Fresh berries!');
   }else toast('The berry bushes need time to grow back.');
 }
});
$('mailboxInteract').addEventListener('click',()=>{
 window.PixelWorld?.letterSent();
 switchTab('chat');
 $('messages').scrollTop=$('messages').scrollHeight;
 $('message').focus({preventScroll:true});
 say('A letter for you!');
});
$('roamLeft').addEventListener('click',()=>{
 const x=(window.PixelWorld?.getPosition().x||220)-137;
 goTo(state.location,window.PixelWorld?.toStateX(x)||57,75);
});
$('roamRight').addEventListener('click',()=>{
 const x=(window.PixelWorld?.getPosition().x||220)+137;
 goTo(state.location,window.PixelWorld?.toStateX(x)||57,75);
});
$('worldCanvas').addEventListener('click',event=>{
 if(state.location==='cottage')return;
 const bounds=$('worldCanvas').getBoundingClientRect();
 const sceneX=(event.clientX-bounds.left)*400/bounds.width;
 const sceneY=(event.clientY-bounds.top)*250/bounds.height;
 if(sceneY<163)return;
 const worldX=window.PixelWorld?.toWorld(sceneX,sceneY)?.x??sceneX;
 if(worldX<0||worldX>660)return;
 if(state.location==='meadow'&&worldX>60&&worldX<215&&sceneY<205){
   visitScene('cottage');return;
 }
 // Only target safe ground-level walking paths.
 const x=window.PixelWorld?.toStateX(worldX)||57;
 const y=Math.max(67,Math.min(79,50+(sceneY-132)/3.3));
 goTo(state.location,x,y);
});

$('visitButton').addEventListener('click',()=>visitScene(state.location==='cottage'?(state.lastOutdoor||'meadow'):state.location==='grove'?'meadow':'cottage'));
$('outside').addEventListener('click',()=>visitScene(state.lastOutdoor||'meadow'));
$('nightButton').addEventListener('click',()=>{setTheme(!uiNight);renderWorld();save()});
$('rename').addEventListener('click',async()=>{const name=$('petName').value.trim().slice(0,18);if(!name)return;if(config.url&&config.token){try{const r=await api('/api/name',{method:'POST',body:JSON.stringify({name})});if(r.ok){await sync();return}}catch{}}state.name=name;toast('Your companion is now '+name);save();render()});
$('connect').addEventListener('click',connect);
$('generatePairCode').addEventListener('click',async()=>{
 const el=$('generatedPairCode');
 el.hidden=true;
 if(!config.url||!config.token){
   $('pairStatus').textContent='Connect Pip on this device first, then generate a code for your other device.';
   return;
 }
 try{
   const response=await api('/api/device/pair/start',{method:'POST',body:'{}'});
   if(!response.ok){
     if(response.status===404)throw Error('Your Cloudflare Worker has not deployed the pairing update yet.');
     throw Error('The brain could not create a pairing code.');
   }
   const data=await response.json();
   el.textContent=data.code;
   el.hidden=false;
   $('pairStatus').textContent='Enter this code on your other device within ten minutes. It can be used once.';
 }catch(e){$('pairStatus').textContent=e?.message||'Unable to create a code.'}
});
$('claimPairCode').addEventListener('click',async()=>{
 const code=$('pairCodeInput').value.trim().toUpperCase().replace(/[\s-]/g,'');
 if(!/^[A-HJ-NP-Z2-9]{10}$/.test(code)){
   $('pairStatus').textContent='Enter the ten characters shown by your connected device.';
   return;
 }
 const button=$('claimPairCode');button.disabled=true;
 try{
   const response=await fetch(DEFAULT_BRAIN_URL+'/api/device/pair/claim',{
     method:'POST',headers:{'Content-Type':'application/json'},
     body:JSON.stringify({code}),signal:AbortSignal.timeout(12000)
   });
   const data=await response.json().catch(()=>({}));
   if(!response.ok){
     if(response.status===404)throw Error('Cloudflare has not deployed device pairing yet.');
     if(response.status===410)throw Error('The code has expired or already been used. Make a fresh one.');
     throw Error(data.detail||'Pairing failed. Check the code and try again.');
   }
   if(!data.token||!/^[0-9a-f]{64}$/.test(data.token))throw Error('The brain returned an invalid device session.');
   $('backendUrl').value=DEFAULT_BRAIN_URL;
   $('backendToken').value=data.token;
   await connect();
   if(!config.url||!config.token)throw Error('Pairing completed, but the new connection could not be saved.');
   $('pairStatus').textContent='This browser is paired! Pip’s cloud memories and projects are now shared here.';
   $('pairCodeInput').value='';
 }catch(e){$('pairStatus').textContent=e?.message||'Unable to connect this browser.'}
 finally{button.disabled=false}
});

$('migrateToBrain').addEventListener('click',async()=>{
 if(!config.url||!config.token)return toast('Connect your Cloudflare brain first.');
 const old=localStorage.getItem(BACKUP_KEY);
 if(!old)return toast('No browser backup is available. Please export a copy first.');
 if(!confirm('Copy the original browser world to your connected brain?\n\nThis REPLACES the brain server\'s current pet, letters, journal, discoveries and memories. It cannot be undone unless you have a separate backup. Your local browser backup will be kept.'))return;
 try{
   const r=await api('/api/import',{method:'POST',body:old});
   if(!r.ok){
     const error=await r.json().catch(()=>({}));
     throw Error(error.detail||'Brain rejected the import.');
   }
   localStorage.setItem(IMPORTED_KEY,config.url);
   updateMigrationButton();
   await sync();
   toast('Your saved world has been copied into the brain.');
 }catch(e){toast(e.message||'Unable to transfer the world. Your browser backup is safe.')}
});
$('export').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='little-wanderer-memories.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)});
$('import').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>2000000)throw Error('Too large');const val=JSON.parse(await file.text());if(!val||val.version!==1||!val.stats||!Array.isArray(val.messages))throw Error('Unsupported save');state={...makeWorld(),...val,lastTick:now()};if(!['meadow','grove','cottage'].includes(state.location))state.location='meadow';uiNight=state.night===true;save();render();toast('Memories restored!')}catch{toast('Could not read that save file.')}e.target.value=''});
$('reset').addEventListener('click',()=>{if(!confirm('Start a new little world? This clears this browser\'s pet memories. Export first if you wish to keep them.'))return;state=makeWorld();state.night=uiNight;save();render()});
$('backendUrl').value=config.url||DEFAULT_BRAIN_URL;$('backendToken').value=config.token||'';
if(config.url&&config.token){preserveBrowserSave();$('connectionLabel').textContent='Connecting to my brain...';sync()}else applyTime();
updateMigrationButton();
render();save();
setInterval(()=>{if(config.url&&config.token){sync();return}if(now()>=state.nextAction)act();deliver();if(now()>=state.nextResearch&&!state.pendingResearch){state.pendingResearch=localCuriosity();state.nextResearch=now()+8*3600000;renderResearchPermission();save();}state.stats.hunger=clamp(state.stats.hunger-.025);state.stats.energy=clamp(state.stats.energy-(state.location==='cottage'?-.02:.018));state.stats.joy=clamp(state.stats.joy-.008);state.stats.social=clamp(state.stats.social-.011);save();updateStats()},5000);
window.addEventListener('beforeunload',save);
})();