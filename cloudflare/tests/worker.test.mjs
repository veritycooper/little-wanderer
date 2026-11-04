import test from "node:test";
import assert from "node:assert/strict";
import worker, { freshWorld, safeWorld, brainContext, fallback, activity } from "../src/index.js";

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
