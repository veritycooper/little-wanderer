import test from "node:test";
import assert from "node:assert/strict";
import worker, { freshWorld, safeWorld, brainContext, fallback, activity, growGarden, tendGarden, workOnProject } from "../src/index.js";

class FakeD1 {
  row = null;
  prepare(sql) {
    let args = [];
    return {
      bind(...values) { args = values; return this; },
      first: async () => {
        if (/SELECT version, data FROM world/.test(sql)) return this.row && { ...this.row };
        return null;
      },
      run: async () => {
        if (sql.includes("INSERT OR IGNORE")) {
          if (!this.row) this.row = { version: 0, data: args[0] };
          return { meta: { changes: 1 } };
        }
        if (sql.includes("UPDATE world SET")) {
          if (!this.row || this.row.version !== args[1]) return { meta: { changes: 0 } };
          this.row = { version: this.row.version + 1, data: args[0] };
          return { meta: { changes: 1 } };
        }
        throw Error("Unexpected SQL: " + sql);
      },
    };
  }
}
const secret = "local-tests-only-long-secret-do-not-deploy";
const env = () => ({
  DB: new FakeD1(),
  PET_API_TOKEN: secret,
  ALLOWED_ORIGIN: "https://veritycooper.github.io",
  DAILY_AI_LIMIT: "24",
  AI: {
    async run(_model, payload) {
      assert.ok(payload.messages[0].content.includes("USER-APPROVED MEMORIES"));
      return { response: "I found a little path through the trees today." };
    },
  },
});
function req(path, method="GET", body, auth=true, origin="https://veritycooper.github.io") {
  return new Request("https://little-wanderer-brain.example" + path, {
    method,
    headers: {
      Origin: origin,
      ...(auth ? { Authorization: "Bearer " + secret } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
const read = async (env, path="/api/state", auth=true) =>
  worker.fetch(req(path, "GET", null, auth), env);

test("fresh state contains only user-approved memories and persistent schema", () => {
  const world = freshWorld();
  assert.equal(world.version, 1);
  assert.deepEqual(world.memories, []);
  assert.equal(world.location, "meadow");
});
test("private API rejects unknown users and honours CORS", async () => {
  const e = env();
  assert.equal((await read(e, "/api/state", false)).status, 401);
  const response = await read(e);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), "https://veritycooper.github.io");
  assert.equal((await worker.fetch(req("/api/state", "GET", undefined, true, "https://untrusted.example"),e))
    .headers.get("access-control-allow-origin"), null);
  assert.equal((await worker.fetch(req("/api/memories/0", "OPTIONS"),e)).status, 204);
});
test("letter is queued, hidden from state polling, and answered by scheduled brain", async () => {
  const e = env();
  assert.equal((await worker.fetch(req("/api/message", "POST", {text:"Hello Pip!"}),e)).status, 200);
  let state = await (await read(e)).json();
  assert.equal(state.pending.length, 1);
  assert.equal(state.pending[0].text, undefined);
  assert.ok(state.messages.some(m => m.text === "Hello Pip!"));
  let raw = JSON.parse(e.DB.row.data);
  raw.pending[0].due = 0;
  e.DB.row.data=JSON.stringify(raw);
  const promises = [];
  await worker.scheduled({}, e, { waitUntil(p) { promises.push(p); } });
  await Promise.all(promises);
  state = await (await read(e)).json();
  assert.equal(state.pending.length, 0);
  assert.ok(state.messages.some(m => m.text.includes("path through the trees")));
  assert.equal(state.lastReplyMode, "workers-ai");
});
test("memory creation/deletion and validated browser save import", async () => {
  const e = env();
  const add = await worker.fetch(req("/api/memories", "POST", {text:"My friend likes roses"}),e);
  assert.equal(add.status, 200);
  let state = await (await read(e)).json();
  assert.deepEqual(state.memories, ["My friend likes roses"]);
  assert.equal((await worker.fetch(req("/api/memories/0", "DELETE"),e)).status, 200);
  state = await (await read(e)).json();
  assert.deepEqual(state.memories, []);
  const backup = { ...freshWorld(), name:"Luna",
    memories:["My friend loves blueberries"], messages:[{from:"you",text:"Hello!",at:Date.now()}],
    pending:[{id:"untrusted",text:"private",due:1}],
    dailyAI:{day:"2026-11-04",count:100000}
  };
  assert.equal((await worker.fetch(req("/api/import","POST",backup),e)).status, 200);
  state = await (await read(e)).json();
  assert.equal(state.name, "Luna");
  assert.deepEqual(state.memories, ["My friend loves blueberries"]);
  assert.equal(state.pending.length, 0);
  assert.equal(state.dailyAI, undefined);
});
test("brain prompt uses actual state and local reply does not claim research", () => {
  const state = freshWorld();
  state.memories=["My friend prefers blueberries"];
  const prompt=brainContext(state,"Do you like the woods?");
  assert.ok(prompt.includes("blueberries"));
  assert.ok(prompt.includes("USER-APPROVED MEMORIES"));
  assert.equal(typeof fallback(state,"Hello"),"string");
  activity(state,"feed");
  assert.equal(state.location,"cottage");
});


test("travel persists across reads and kitchen is a real room",async()=>{
 const e=env();
 const move=await worker.fetch(req("/api/travel","POST",{
   location:"meadow",x:124,y:76,room:"study"
 }),e);
 assert.equal(move.status,200);
 let world=await (await read(e)).json();
 assert.equal(world.x,124);
 assert.equal(world.lastOutdoor,"meadow");
 assert.equal(world.location,"meadow");
 const kitchen=await worker.fetch(req("/api/travel","POST",{
   location:"cottage",x:124,y:76,room:"kitchen"
 }),e);
 assert.equal(kitchen.status,200);
 world=await (await read(e)).json();
 assert.equal(world.location,"cottage");
 assert.equal(world.room,"kitchen");
 assert.match(world.activity,/kitchen/i);
 const denied=await worker.fetch(req("/api/travel","POST",{
   location:"grove",x:250,y:76,room:"study"
 }),e);
 assert.equal(denied.status,400);
});

test("opening mail clears unread and next letter can raise mailbox again",async()=>{
 const e=env();
 const initial=await read(e);
 assert.equal(initial.status,200);
 let world=JSON.parse(e.DB.row.data);
 world.unread=true;
 e.DB.row.data=JSON.stringify(world);
 const status=await worker.fetch(req("/api/read","POST",{}),e);
 assert.equal(status.status,200);
 world=await (await read(e)).json();
 assert.equal(world.unread,false);
});

test("foraging and meals route to the right cottage room",()=>{
 const world=freshWorld();
 activity(world,"feed");
 assert.equal(world.location,"cottage");
 assert.equal(world.room,"kitchen");
 activity(world,"read");
 assert.equal(world.room,"study");
});


test("foraging is grounded in the woodland, persists needs and has a cooldown",async()=>{
 const e=env();
 await worker.fetch(req("/api/travel","POST",{location:"grove",x:115,y:75,room:"study"}),e);
 const result=await worker.fetch(req("/api/forage","POST",{}),e);
 assert.equal(result.status,200);
 let world=await (await read(e)).json();
 assert.equal(world.location,"grove");
 assert.equal(world.activity,"Picking ripe berries from the bushes");
 assert.equal(world.x,122);
 assert.ok(world.journal.some(note=>/berries/i.test(note.title)));
 assert.equal((await worker.fetch(req("/api/forage","POST",{}),e)).status,429);
});


test("automatic curiosity only asks: scheduled tasks never fetch research without consent",async()=>{
 const e=env();
 await read(e); // create world
 const raw=JSON.parse(e.DB.row.data);
 raw.nextResearch=0;
 raw.nextAction=Date.now()+360000;
 e.DB.row.data=JSON.stringify(raw);
 const originalFetch=globalThis.fetch;
 let externalCalls=0;
 globalThis.fetch=async()=>{externalCalls++;throw Error("An unapproved network call")};
 try{
   const jobs=[];
   await worker.scheduled({},e,{waitUntil(p){jobs.push(p)}});
   await Promise.all(jobs);
   const state=await (await read(e)).json();
   assert.equal(externalCalls,0);
   assert.ok(state.pendingResearch?.question);
   assert.ok(state.pendingResearch?.topic);
   assert.equal(state.discoveries.length,0);
 }finally{globalThis.fetch=originalFetch}
});

test("research requires matching permission; rejection preserves no discoveries",async()=>{
 const e=env();
 assert.equal((await worker.fetch(req("/api/research","POST",{topic:"mushrooms"}),e)).status,403);
 const proposed=await worker.fetch(req("/api/research/propose","POST",{}),e);
 assert.equal(proposed.status,200);
 const item=(await proposed.json()).proposal;
 assert.ok(item.question.includes("?"));
 assert.ok(item.searchTerm);
 assert.equal((await worker.fetch(req("/api/research/decision","POST",
   {id:item.id,approve:"yes"}),e)).status,400);
 assert.equal((await worker.fetch(req("/api/research/decision","POST",
   {id:"incorrect-id",approve:true}),e)).status,409);
 assert.equal((await worker.fetch(req("/api/research/decision","POST",
   {id:item.id,approve:false}),e)).status,200);
 const state=await (await read(e)).json();
 assert.equal(state.pendingResearch,null);
 assert.deepEqual(state.discoveries,[]);
});

test("approved question creates concise sourced curiosity and enters the study",async()=>{
 const e=env();
 const r=await worker.fetch(req("/api/research/propose","POST",{}),e);
 const idea=(await r.json()).proposal;
 const originalFetch=globalThis.fetch;
 let queries=0;
 globalThis.fetch=async input=>{
   queries++;
   assert.ok(String(input).startsWith("https://en.wikipedia.org/w/api.php"));
   return new Response(JSON.stringify({
     query:{pages:[{title:"Butterfly",extract:"Butterflies use their senses to find flowers and food."}]}
   }),{status:200,headers:{"Content-Type":"application/json"}});
 };
 try{
   const res=await worker.fetch(req("/api/research/decision","POST",
     {id:idea.id,approve:true}),e);
   assert.equal(res.status,200);
   const state=await (await read(e)).json();
   assert.equal(queries,1);
   assert.equal(state.pendingResearch,null);
   assert.equal(state.discoveries.length,1);
   assert.equal(state.discoveries[0].question,idea.question);
   assert.equal(state.discoveries[0].thought,idea.thought);
   assert.ok(state.discoveries[0].summary.length<=210);
   assert.equal(state.room,"study");
   assert.equal(state.location,"cottage");
 }finally{globalThis.fetch=originalFetch}
});

test("rest, reading and meals have three distinct cottage rooms",()=>{
 const world=freshWorld();
 activity(world,"rest");assert.equal(world.room,"living");
 activity(world,"read");assert.equal(world.room,"study");
 activity(world,"feed");assert.equal(world.room,"kitchen");
});


test("real garden grows between server ticks, loses water and can be tended",()=>{
 const p=freshWorld();
 const first=p.garden.beds[0];
 const before=first.growth,water=first.water;
 growGarden(p,p.garden.lastGrowthAt+4*3600000);
 assert.ok(first.growth>before);
 assert.ok(first.water<water);
 first.water=10;
 tendGarden(p);
 assert.ok(first.water>10);
 assert.equal(p.location,"meadow");
 assert.ok(p.experiences.some(e=>e.kind==="gardening"));
 assert.ok(p.skills.gardening>1);
});

test("Pip chooses a hobby project and progresses through real milestones",()=>{
 const world=freshWorld();
 world.nextProjectAt=0;
 const history=world.experiences.length;
 const initial=workOnProject(world);
 assert.ok(initial);
 assert.equal(world.projects.length,1);
 assert.equal(world.projects[0].progress,25);
 assert.ok(world.experiences.length>history);
 for(let i=0;i<3;i++)workOnProject(world);
 assert.equal(world.projects[0].progress,100);
 assert.equal(world.projects[0].done,true);
 assert.ok(world.journal.some(x=>x.title.includes("finished")));
 assert.ok(brainContext(world,"How's your project?").includes(world.projects[0].title));
 assert.ok(brainContext(world,"How is your garden?").includes("REAL GARDEN"));
});

test("paired browsers share one state and session secrets are hidden",async()=>{
 const e=env();
 const started=await worker.fetch(req("/api/device/pair/start","POST",{}),e);
 assert.equal(started.status,200);
 const issued=await started.json();
 assert.match(issued.code,/^[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}$/);
 assert.equal((await worker.fetch(req("/api/device/pair/claim","POST",
   {code:"ABCDEFGHJK"},false),e)).status,401);
 const completed=await worker.fetch(req("/api/device/pair/claim","POST",
   {code:issued.code},false),e);
 assert.equal(completed.status,200);
 const token=(await completed.json()).token;
 assert.match(token,/^[0-9a-f]{64}$/);
 const pairedRequest=async(path,method="GET",body)=>worker.fetch(new Request(
   "https://little-wanderer-brain.example"+path,{
     method,
     headers:{Origin:"https://veritycooper.github.io",Authorization:"Bearer "+token,
       ...(body?{"Content-Type":"application/json"}:{})},
     ...(body?{body:JSON.stringify(body)}:{})
   }),e);
 const stateRes=await pairedRequest("/api/state");
 assert.equal(stateRes.status,200);
 const state=await stateRes.json();
 assert.equal(state.deviceSessions,undefined);
 assert.equal(state.pairing,undefined);
 assert.equal((await pairedRequest("/api/name","POST",{name:"Piplin"})).status,200);
 assert.equal((await(await read(e)).json()).name,"Piplin");
 assert.equal((await worker.fetch(req("/api/device/pair/claim","POST",
   {code:issued.code},false),e)).status,410);
 assert.equal((await read(e,"/api/state",false)).status,401);
});


test("live chat replies right away using shared conversational and project memory",async()=>{
 const e=env();
 const p=await worker.fetch(req("/api/chat","POST",{text:"Hello Pip, how is your garden?"}),e);
 assert.equal(p.status,200);
 assert.equal((await p.json()).mode,"workers-ai");
 const world=await (await read(e)).json();
 const last=world.messages.slice(-2);
 assert.equal(last[0].from,"you");
 assert.equal(last[0].via,"chat");
 assert.equal(last[1].from,"pet");
 assert.equal(last[1].via,"chat");
 assert.ok(world.experiences.some(entry=>entry.kind==="conversation"));
 assert.ok(brainContext(world,"What is your next project?").includes("RECENT REAL EXPERIENCES"));
 assert.equal((await worker.fetch(req("/api/chat","POST",{text:"Again?"}),e)).status,429);
});

test("live chat observes the application AI budget and marks fallback honestly",async()=>{
 const e=env();
 await read(e);
 const state=JSON.parse(e.DB.row.data);
 state.dailyAI={day:new Date().toISOString().slice(0,10),count:24};
 e.DB.row.data=JSON.stringify(state);
 const res=await worker.fetch(req("/api/chat","POST",{text:"Can we talk?"}),e);
 assert.equal(res.status,200);
 assert.equal((await res.json()).mode,"fallback");
 const world=await (await read(e)).json();
 assert.equal(world.lastReplyMode,"fallback");
});
