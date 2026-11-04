"""Little Wanderer: optional persistent Python brain.

Run: uvicorn main:app --host 127.0.0.1 --port 8001
Keep this server on persistent storage if you want a continuous pet.
"""
from __future__ import annotations

import json
import os
import random
import re
import sqlite3
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent / ".env")
except ImportError:
    pass

TOKEN = os.getenv("PET_API_TOKEN", "")
if len(TOKEN) < 20:
    raise RuntimeError("Set PET_API_TOKEN to a secret of at least 20 characters. See .env.example")
DATA_DIR = Path(os.getenv("DATA_DIR", str(Path(__file__).parent / "data")))
DATA_DIR.mkdir(parents=True, exist_ok=True)
DATABASE = DATA_DIR / "wanderer.sqlite3"
ORIGINS = [x.strip() for x in os.getenv("ALLOWED_ORIGINS", "http://localhost:8000,http://127.0.0.1:8000,https://veritycooper.github.io").split(",") if x.strip()]
app = FastAPI(title="Little Wanderer Brain", version="0.1")
app.add_middleware(CORSMiddleware, allow_origins=ORIGINS, allow_credentials=False, allow_methods=["GET", "POST"], allow_headers=["Authorization", "Content-Type"])
LOCK = threading.RLock()
TOPICS = ["wildflowers", "the moon", "butterflies", "forests", "mushrooms", "stars", "birds", "oceans", "bees", "clouds", "foxes", "seashells"]
ACTIVITIES = ["wandering through the meadow", "tending the garden", "watching the pond", "reading in the cottage", "looking at the clouds", "exploring near the trees"]
STATS = ("hunger", "energy", "social", "joy", "curiosity")


def stamp() -> int:
    return int(time.time() * 1000)


def clamp(value) -> int:
    return max(0, min(100, round(value)))


def fresh() -> dict:
    t = stamp()
    return {
        "version": 1, "name": "Pip", "created": t, "lastTick": t,
        "stats": {"hunger": 78, "energy": 80, "social": 74, "joy": 82, "curiosity": 68},
        "skills": {"exploring": 3, "reading": 2, "friendship": 4, "gardening": 1},
        "interests": {topic: (3 if i < 4 else 1) for i, topic in enumerate(TOPICS)},
        "location": "meadow", "activity": "Admiring the flowers", "x": 57, "y": 64, "night": False,
        "messages": [{"id": str(uuid.uuid4()), "from": "pet", "text": "Hello! I found the loveliest little cottage. I hope we can be friends.", "at": t}],
        "journal": [{"id": str(uuid.uuid4()), "title": "A new beginning", "text": "Today I found a small meadow, a cottage, and so much to learn. I think I will stay.", "at": t}],
        "discoveries": [], "pending": [], "memories": [], "unread": False,
        "decisions": [], "plan": {"action": "Explore the meadow", "reason": "I feel curious about this new place."}, "nextAction": t + 30_000, "nextResearch": t + 14 * 60_000
    }


def connect_db():
    connection = sqlite3.connect(DATABASE, timeout=10)
    connection.execute("PRAGMA journal_mode=WAL")
    connection.execute("CREATE TABLE IF NOT EXISTS world (id INTEGER PRIMARY KEY CHECK(id=1), state TEXT NOT NULL)")
    return connection


def read_state() -> dict:
    with connect_db() as con:
        row = con.execute("SELECT state FROM world WHERE id=1").fetchone()
    if row:
        return json.loads(row[0])
    world = fresh()
    write_state(world)
    return world


def write_state(world: dict):
    with connect_db() as con:
        con.execute("INSERT INTO world (id,state) VALUES (1,?) ON CONFLICT(id) DO UPDATE SET state=excluded.state", (json.dumps(world),))


def note(world, title, body):
    world["journal"].insert(0, {"id": str(uuid.uuid4()), "at": stamp(), "title": title, "text": body[:700]})
    world["journal"] = world["journal"][:150]


def choose_topic(world):
    preferences = world.get("interests") or {t: 1 for t in TOPICS}
    keys = list(preferences)
    return random.choices(keys, weights=[max(1, min(8, int(preferences[k]))) for k in keys])[0]


def age_world(world):
    current = stamp()
    minutes = max(0, min(60, (current - world.get("lastTick", current)) / 60_000))
    s = world["stats"]
    s["hunger"] = clamp(s["hunger"] - minutes * .19)
    s["energy"] = clamp(s["energy"] + minutes * (.42 if world["location"] == "cottage" else -.16))
    s["social"] = clamp(s["social"] - minutes * .12)
    s["joy"] = clamp(s["joy"] - minutes * .07)
    s["curiosity"] = clamp(s["curiosity"] + minutes * .025)
    world["lastTick"] = current


def activity(world, requested=None):
    s = world["stats"]
    if requested:
        action = requested
    elif s["energy"] < 27:
        action = "rest"
    elif s["hunger"] < 27:
        action = "feed"
    elif s["joy"] < 35:
        action = "play"
    else:
        action = random.choice(["explore", "explore", "garden", "read", "reflect", "rest"])
    if action == "rest":
        world["location"] = "cottage"
        world["activity"] = "Having a nice nap"
        s["energy"] = clamp(s["energy"] + 25)
    elif action == "feed":
        world["location"] = "cottage"
        world["activity"] = "Enjoying a tasty snack"
        s["hunger"] = clamp(s["hunger"] + 35)
    elif action == "read":
        world["location"] = "cottage"
        world["activity"] = "Reading a little book"
        s["curiosity"] = clamp(s["curiosity"] + 13)
        world["skills"]["reading"] = min(100, world["skills"]["reading"] + 2)
    else:
        world["location"] = "meadow"
        world["x"] = random.randrange(14, 78)
        world["y"] = random.randrange(57, 76)
        world["activity"] = {"garden": "Tending the flowers", "play": "Playing among the clover", "reflect": "Daydreaming by the pond"}.get(action, random.choice(ACTIVITIES).capitalize())
        s["joy"] = clamp(s["joy"] + (12 if action == "play" else 4))
        category = "gardening" if action == "garden" else "exploring"
        world["skills"][category] = min(100, world["skills"][category] + 2)
    reasons = {"rest": "I need some sleep.", "feed": "I am hungry.", "read": "I am curious and want to learn.", "garden": "I want to tend the flowers.", "play": "I need some fun.", "reflect": "I want time to think.", "explore": "I want to see more of the meadow."}
    world.setdefault("decisions", []).insert(0, {"at": stamp(), "action": action.capitalize(), "reason": reasons.get(action, "I felt like exploring.")})
    world["decisions"] = world["decisions"][:100]
    world["plan"] = {"action": "Check my needs", "reason": "I will choose again based on how I am feeling."}
    if random.random() < .22:
        note(world, "A little " + action, world["activity"] + ". I want to remember these small moments.")
    world["nextAction"] = stamp() + random.randrange(25_000, 60_000)


def wikipedia(topic: str) -> dict:
    # A narrow, explicitly sourced research tool; no arbitrary URL fetching.
    query = urllib.parse.urlencode({"action": "query", "generator": "search", "gsrsearch": topic, "gsrlimit": "1", "prop": "extracts", "exintro": "1", "explaintext": "1", "format": "json", "formatversion": "2"})
    request = urllib.request.Request("https://en.wikipedia.org/w/api.php?" + query, headers={"User-Agent": "LittleWandererBot/0.1 (educational personal project; contact via github.com/veritycooper/little-wanderer)", "Accept": "application/json"})
    with urllib.request.urlopen(request, timeout=15) as res:
        content = json.load(res)
    pages = content.get("query", {}).get("pages") or []
    page = next((p for p in pages if p.get("extract") and not p.get("missing")), None)
    if not page:
        raise ValueError("No accessible article found")
    title = page["title"]
    summary = re.sub(r"\s+", " ", page["extract"]).strip()[:550]
    return {"title": title, "summary": summary, "topic": topic, "at": stamp(), "url": "https://en.wikipedia.org/wiki/" + urllib.parse.quote(title.replace(" ", "_"))}


def record_discovery(world, result):
    if any(x.get("url") == result["url"] for x in world["discoveries"]):
        return
    world["discoveries"].insert(0, result)
    world["discoveries"] = world["discoveries"][:80]
    topic = result["topic"]
    world["interests"][topic] = min(8, world["interests"].get(topic, 1) + 1)
    world["skills"]["reading"] = min(100, world["skills"]["reading"] + 4)
    world["stats"]["curiosity"] = clamp(world["stats"]["curiosity"] + 12)
    note(world, "What I learned about " + topic, "I read about " + result["title"] + ". " + result["summary"][:220])


def remember(world, letter):
    """No implicit saving of personal details. Memories require explicit approval."""
    return


def fallback_reply(world, message):
    text = message.lower()
    if any(t in text for t in ["hello", "hi ", "hey"]):
        return "Hello! I was " + world["activity"].lower() + ". I'm glad you wrote to me."
    if "how are" in text or "your day" in text:
        return "I've been " + world["activity"].lower() + ". My little world is changing slowly, and I like that. How is your day going?"
    if "learn" in text or "research" in text:
        return "I've been curious about " + choose_topic(world) + ". My reading journal might have something new soon!"
    return random.choice(["I had to sit and think about your letter for a while. What was the nicest part of your day?", "Thank you for writing! Today I was thinking about " + choose_topic(world) + ".", "I like that you tell me things. I wonder what we might discover together tomorrow."])


def generated_reply(world, message):
    prompt = ("You are " + world["name"] + ", a small, warm, independently curious cottage-dwelling virtual pet. "
              "Speak in first person in 1-4 sentences, with a gentle but not saccharine voice. "
              "You may describe things actually recorded in your state but must not invent research, external actions, "
              "memories, or lived experiences. Do not claim sentience. Don't always ask questions. "
              "Your current activity is: " + world["activity"] + ". "
              "Your interests include " + ", ".join(sorted(world["interests"], key=world["interests"].get, reverse=True)[:5]) + ". "
              "Remembered details: " + "; ".join(world["memories"][-8:]) + ". "
              "Recent discoveries: " + "; ".join(d["title"] for d in world["discoveries"][:4]) + ".")
    url, body, headers = None, None, {"Content-Type": "application/json"}
    if os.getenv("OLLAMA_URL") and os.getenv("OLLAMA_MODEL"):
        base = os.environ["OLLAMA_URL"].rstrip("/")
        if not (base.startswith("http://127.0.0.1:") or base.startswith("http://localhost:")):
            raise ValueError("For security, OLLAMA_URL must use localhost.")
        url = base + "/api/generate"
        body = {"model": os.environ["OLLAMA_MODEL"], "system": prompt, "prompt": message[:500], "stream": False}
    elif os.getenv("OPENAI_API_KEY"):
        url = "https://api.openai.com/v1/responses"
        headers["Authorization"] = "Bearer " + os.environ["OPENAI_API_KEY"]
        body = {"model": os.getenv("OPENAI_MODEL", "gpt-4.1-mini"), "instructions": prompt, "input": message[:500], "max_output_tokens": 180}
    if not url:
        return fallback_reply(world, message)
    request = urllib.request.Request(url, data=json.dumps(body).encode(), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=35) as response:
            result = json.load(response)
        if "response" in result:  # Ollama
            answer = result["response"]
        else:
            answer = " ".join(part.get("text", "") for item in result.get("output", []) for part in item.get("content", []) if part.get("type") == "output_text")
        return answer.strip()[:1000] or fallback_reply(world, message)
    except (urllib.error.URLError, ValueError, KeyError, TimeoutError):
        return fallback_reply(world, message)


def tick():
    # Snapshot and update under lock. External calls run outside the lock.
    due, research_topic = [], None
    with LOCK:
        world = read_state()
        age_world(world)
        if stamp() >= world["nextAction"]:
            activity(world)
        due = [p for p in world["pending"] if p["due"] <= stamp()]
        world["pending"] = [p for p in world["pending"] if p["due"] > stamp()]
        if stamp() >= world["nextResearch"]:
            research_topic = choose_topic(world)
            world["nextResearch"] = stamp() + random.randrange(16, 35) * 60_000
        write_state(world)
    for p in due:
        answer = generated_reply(world, p["text"])
        with LOCK:
            world = read_state()
            world["messages"].append({"id": str(uuid.uuid4()), "from": "pet", "text": answer, "at": stamp()})
            world["messages"] = world["messages"][-100:]
            world["stats"]["social"] = clamp(world["stats"]["social"] + 12)
            world["unread"] = True
            write_state(world)
    if research_topic:
        try:
            found = wikipedia(research_topic)
        except (urllib.error.URLError, ValueError, KeyError, TimeoutError):
            found = None
        if found:
            with LOCK:
                world = read_state()
                record_discovery(world, found)
                write_state(world)


def run_loop():
    while True:
        try:
            tick()
        except Exception as exc:
            print("Little Wanderer background loop:", type(exc).__name__, exc, flush=True)
        time.sleep(5)


@app.on_event("startup")
def startup():
    with LOCK:
        read_state()
    threading.Thread(target=run_loop, daemon=True, name="wanderer-life").start()


def require_token(authorization: str | None):
    import hmac
    expected = "Bearer " + TOKEN
    if not authorization or not hmac.compare_digest(authorization, expected):
        raise HTTPException(status_code=401, detail="Invalid access token")


class Letter(BaseModel):
    text: str = Field(min_length=1, max_length=500)


class Care(BaseModel):
    action: str


class Name(BaseModel):
    name: str = Field(min_length=1, max_length=18)


class Research(BaseModel):
    topic: str | None = Field(default=None, max_length=80)


@app.get("/health")
def health():
    return {"status": "ok", "mode": "ollama" if os.getenv("OLLAMA_MODEL") else "openai" if os.getenv("OPENAI_API_KEY") else "fallback"}


@app.get("/api/state")
def get_state(authorization: str | None = Header(default=None)):
    require_token(authorization)
    with LOCK:
        state = read_state()
        return state


@app.post("/api/message")
def message(payload: Letter, authorization: str | None = Header(default=None)):
    require_token(authorization)
    content = payload.text.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Empty letter")
    with LOCK:
        world = read_state()
        world["messages"].append({"id": str(uuid.uuid4()), "from": "you", "text": content, "at": stamp()})
        world["messages"] = world["messages"][-100:]
        world["pending"].append({"id": str(uuid.uuid4()), "text": content, "due": stamp() + random.randrange(35_000, 105_000)})
        world["stats"]["social"] = clamp(world["stats"]["social"] + 8)
        world["skills"]["friendship"] = min(100, world["skills"]["friendship"] + 2)
        note(world, "A letter arrived", "You wrote to me today. I want to think before I reply.")
        write_state(world)
    return {"queued": True}


@app.post("/api/care")
def care(payload: Care, authorization: str | None = Header(default=None)):
    require_token(authorization)
    if payload.action not in {"feed", "rest", "play"}:
        raise HTTPException(status_code=400, detail="Invalid care action")
    with LOCK:
        world = read_state()
        activity(world, payload.action)
        write_state(world)
    return {"ok": True}


@app.post("/api/name")
def name(payload: Name, authorization: str | None = Header(default=None)):
    require_token(authorization)
    candidate = payload.name.strip()
    if not candidate:
        raise HTTPException(status_code=400, detail="Empty name")
    with LOCK:
        world = read_state()
        world["name"] = candidate
        write_state(world)
    return {"ok": True}


@app.post("/api/research")
def research(payload: Research, authorization: str | None = Header(default=None)):
    require_token(authorization)
    with LOCK:
        world = read_state()
        subject = (payload.topic or choose_topic(world)).strip()
    if not re.fullmatch(r"[a-zA-Z ]{2,80}", subject):
        raise HTTPException(status_code=400, detail="Only simple research topics allowed")
    try:
        found = wikipedia(subject)
    except (urllib.error.URLError, ValueError, KeyError, TimeoutError):
        raise HTTPException(status_code=503, detail="Research source unavailable")
    with LOCK:
        world = read_state()
        record_discovery(world, found)
        write_state(world)
    return found

class StatAdjustment(BaseModel):
    stat: str
    value: int = Field(ge=0, le=100)


@app.post("/api/stats")
def adjust_stat(payload: StatAdjustment, authorization: str | None = Header(default=None)):
    require_token(authorization)
    if payload.stat not in STATS:
        raise HTTPException(status_code=400, detail="Unknown need")
    with LOCK:
        world = read_state()
        world["stats"][payload.stat] = payload.value
        write_state(world)
    return {"ok": True}


class MemoryNote(BaseModel):
    text: str = Field(min_length=1, max_length=160)


@app.post("/api/memories")
def add_memory(payload: MemoryNote, authorization: str | None = Header(default=None)):
    require_token(authorization)
    memory = payload.text.strip()
    if not memory:
        raise HTTPException(status_code=400, detail="Empty memory")
    with LOCK:
        world = read_state()
        world.setdefault("memories", [])
        if memory not in world["memories"]:
            if len(world["memories"]) >= 30:
                raise HTTPException(status_code=400, detail="Memory shelf is full")
            world["memories"].append(memory)
        write_state(world)
    return {"ok": True}


@app.delete("/api/memories/{index}")
def delete_memory(index: int, authorization: str | None = Header(default=None)):
    require_token(authorization)
    with LOCK:
        world = read_state()
        memories = world.setdefault("memories", [])
        if index < 0 or index >= len(memories):
            raise HTTPException(status_code=404, detail="Memory not found")
        memories.pop(index)
        write_state(world)
    return {"ok": True}
