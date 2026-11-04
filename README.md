# ✿ Little Wanderer

A small, evolving virtual companion with a cosy cottage, its own routines, memories, letters, a journal, and a curious mind.

**Made by Verity Cooper.** Built as an evolving personal software project.

## What is included

- An original dusty-rose pixel-art world with a cottage, pond, garden, stepping-stone path, moving clouds, stars, and a furnished cottage interior. Pip walks, idles, and can be clicked to play.
- Autonomous needs (hunger, energy, social, joy, curiosity), interests, routines, decisions, and activities, with relaxed pacing (about 55–105 seconds between main activities).
- A gentle conversation inbox: your pet doesn't answer instantly; its messages arrive after a realistic delay.
- A journal that records actual world events, plus discoveries with **real Wikipedia source links**.\n- An activity trail showing reasons for decisions and a visible next-step intention.\n- A manually managed memory shelf: you can add or delete memories; ordinary letters are not automatically saved as permanent personal memories.
- Meaningful progress in exploration, conversation, reading, and gardening; these counters are *not* presented as machine-learning model training.
- Browser-only mode (saves to `localStorage`, no account or API key required), with persistent dusty-plum dark mode.
- Optional Python FastAPI + SQLite backend with an always-running activity loop, private state and durable memories.
- Optional language-model conversations through OpenAI's Responses API or a locally running Ollama model.
- Export/import of browser-mode saves, pet renaming, and adjustable care needs.

## Get it on GitHub Pages

In **Settings → Pages**, select **GitHub Actions** as the build and deployment source. The included workflow checks the JavaScript and Python syntax and publishes the site on each push to `main`. You must enable Pages once from your account; the GitHub integration cannot enable the feature for you.

The browser version will be available at **https://veritycooper.github.io/little-wanderer/** once Pages is enabled and the deployment succeeds. If it is not yet live, check the latest **Actions → Publish Little Wanderer** run.

## Run it locally

For the browser-only version, run any local static server from the repository root:

```bash
python -m http.server 8000
```

Then visit http://localhost:8000. The browser version remains usable without a backend. Its scheduled activity and research happen only while the page is running (with modest catch-up on reopening).

### Run the advanced backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Update values in .env; set a long, random PET_API_TOKEN
uvicorn main:app --host 127.0.0.1 --port 8001
```

In the site's **Settings**, enter the backend URL `http://localhost:8001` and your `PET_API_TOKEN`, then choose **Connect**. To use the backend from GitHub Pages you must deploy it to an HTTPS host and configure `ALLOWED_ORIGINS` to your Pages origin.

- **Without an LLM key:** the backend handles genuine persistent state, movement, delays and research, but conversation uses simple fallback replies.
- **With OpenAI:** set `OPENAI_API_KEY` and a supported `OPENAI_MODEL` in the backend environment. Don't put API secrets into JavaScript or GitHub.
- **With Ollama:** set `OLLAMA_URL` and `OLLAMA_MODEL` for a local model.
- **24/7 activity:** keep the backend running on an always-on host with **persistent storage**; sleeping free services or ephemeral file systems do not preserve a continuously living world.

### Data and privacy

This project has no analytics or accounts. Browser-mode data stays in that browser unless you export it. The optional backend URL and access token are also stored in browser localStorage, so only configure an endpoint on a personal device you trust. Backend mode stores messages, memories and journal entries in a local SQLite database at `DATA_DIR`. The backend requires the `PET_API_TOKEN` for every pet endpoint. Do not publish a backend URL with a weak token, put tokens in the repo, or treat `ALLOWED_ORIGINS` as authentication. If you use a hosted language model, chat excerpts are sent to that provider for responses; Wikipedia research requests are sent to Wikipedia.

**Real research vs. learning:** Discoveries fetch real Wikipedia articles, cite their page URLs, and record what the pet read. Topic preferences and user-approved memory notes can change with experience. Skill meters count activities. This is adaptive agent behaviour, **not automatic retraining of the language model's weights**. There is no arbitrary web crawling or code execution.

## Project layout

```
index.html                  Accessible interface
style.css                   Dusty rose and dark mode design
pixel-world.js              Pixel-art environment, indoor cottage, walking animation
app.js                      Browser simulation, chat, saved world, research
backend/main.py             FastAPI, SQLite, autonomous scheduler, optional LLM
backend/requirements.txt    Python packages
backend/.env.example        Configuration template (never put real secrets here)
backend/Dockerfile          Container deployment option
.gitignore                  Ignore local data/secrets
```

## Next possible additions

Multiple map areas, gardening and collection inventory, richer scheduled activity, personality evolution, weather and seasons, explicit consent-based memory management, and a deployable persistent backend.

## Exploring the pixel world

The meadow is drawn on a 400×250 HTML canvas with nearest-neighbour pixel scaling. The cottage, path, flowers, trees, water and Pip are rendered together rather than relying on emoji or mismatched graphics. Click the cottage to go indoors; choose Outside to leave. Click Pip to play. The moon/sun switch toggles the entire interface and world between dusty-rose daylight and plum night mode, remembering your choice on that device.

Pip walks gradually between destinations and takes gentle idle strolls between major decisions. The interface respects reduced-motion preferences. Browser-mode activity happens while the page runs; the optional backend remains required for independent activity when the browser is closed.
