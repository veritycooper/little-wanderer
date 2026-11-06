# ✿ Little Wanderer

A small, evolving virtual companion with a cosy cottage, its own routines, memories, letters, a journal, and a curious mind.

**Made by Verity Cooper.** Built as an evolving personal software project.

## What is included

- An original dusty-rose pixel-art world with a cottage, pond, garden, stepping-stone path, moving clouds, stars, and a furnished cottage interior. Pip walks, idles, and can be clicked to play.
- Autonomous needs (hunger, energy, social, joy, curiosity), interests, routines, decisions, and activities, with relaxed pacing (about 55–105 seconds between main activities).
- A gentle conversation inbox: your pet doesn't answer instantly; its messages arrive after a realistic delay.
- A journal that records actual world events, plus discoveries with **real Wikipedia source links**.
- An activity trail showing reasons for decisions and a visible next-step intention.
- A manually managed memory shelf: you can add or delete memories; ordinary letters are not automatically saved as permanent personal memories.
- Meaningful progress in exploration, conversation, reading, and gardening; these counters are *not* presented as machine-learning model training.
- Browser-only mode (saves to `localStorage`, no account or API key required), with persistent dusty-plum dark mode.
- Optional Python FastAPI + SQLite backend with an always-running activity loop, private state and durable memories.
- Context-rich language-model conversations through OpenAI's Responses API or a locally running Ollama model; local scripted letters remain available without a model.
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
backend/main.py             FastAPI, SQLite and autonomous scheduler
backend/brain.py            Personality, context and model providers
backend/tests/             Local and API regression tests
backend/DEPLOY.md           Tested setup and deployment instructions
render.yaml                 Optional persistent HTTPS Render deployment template
backend/requirements.txt    Python packages
backend/.env.example        Configuration template (never put real secrets here)
backend/Dockerfile          Container deployment option
.gitignore                  Ignore local data/secrets
```


## Explorable world and cottage rooms

The meadow and Whispering Woods now stretch beyond the visible canvas. The
camera follows Pip smoothly as it walks, while the **Wander left/right**
buttons and clicks on safe outdoor ground set a new destination. Woodland
crossings follow the bridge instead of wading through the stream.

- The cottage's redesigned roof sits in a continuous silhouette. A planted garden now grows to the left of the cottage, and background trees sway subtly in the wind.
- Bushes are grounded in the grass; some are berry bushes you can click to
  forage for food and a journal entry, with a two-minute cooldown.
- The woodland stream is wider, runs off the lower edge, passes beneath the bridge and has stones and reeds along the banks. The meadow pond has an irregular edge and rock border.
- The stepping-stone path continues across the whole woodland area.
- The cottage has **three separate rooms**: a living room with a recessed fireplace, a dedicated study with a working computer hotspot, and a reworked asymmetrical kitchen with open shelves, sink, oven and a berry bowl.
- Pip automatically uses the kitchen when feeding, the study when reading, and the living room when resting.
  Clicking the computer asks Pip to research a topic.
- The meadow has a **little mailbox** with a flag and envelope indicator when
  a letter is waiting. Clicking it opens the Letters archive.
- Clicking the kitchen/study buttons, outdoor ground or roam buttons saves the
  location to Cloudflare when the cloud brain is connected, using authenticated
  travel endpoints. Browser-only mode retains local functionality.

Existing browser saves and Cloudflare D1 worlds use the same version-1 schema,
with an optional \`room\` field. Old saves still load and default to the study;
you do not need to reset Pip. The optional legacy Python backend remains a
separate alternative and does not implement the newer Cloudflare-only interactive
travel and berry-foraging endpoints.

## Free cloud brain (Cloudflare)

The project now includes an alternative **Cloudflare Workers + D1 + Workers AI** brain in the **cloudflare/** folder.

- Works within Cloudflare Free allocations subject to their current limits and model availability. **No OpenAI API key is required.**
- Stores Pip's world and approved memories in D1 and handles letters with Workers AI where available.
- Runs scheduled activity checks every minute, including research and queued responses.
- Keeps the current GitHub Pages front end and browser-only mode intact.
- Provides an explicit, confirmed **Copy my saved world to the brain** control for a one-time transfer from a browser backup.

The Cloudflare code is ready, but you must **create the database, set a private token and deploy the Worker** in your own Cloudflare account. Simply pushing to GitHub does not activate the service.

**[Cloudflare setup instructions](cloudflare/README.md)**

## Connect the private AI brain

The site itself is hosted by GitHub Pages, but Python models and SQLite require an independent service. A complete Python brain, tests and a ready-to-review Render Blueprint are now in this repo. Follow [the brain setup guide](backend/DEPLOY.md) for local testing, costs, privacy, hosting and connecting the website. **The AI service is not running until you explicitly deploy it.** Keep your API keys on the server, never in this public repo or the browser.

## Next possible additions

Multiple map areas, gardening and collection inventory, richer scheduled activity, personality evolution, weather and seasons, explicit consent-based memory management, and a deployable persistent backend.

## Exploring the pixel world

The meadow is drawn on a 400×250 HTML canvas with nearest-neighbour pixel scaling. The cottage, path, flowers, trees, water and Pip are rendered together rather than relying on emoji or mismatched graphics. Click the cottage to go indoors; choose Outside to leave. Click Pip to play. The moon/sun switch toggles the entire interface and world between dusty-rose daylight and plum night mode, remembering your choice on that device.

Pip walks gradually between destinations and takes gentle idle strolls between major decisions. The interface respects reduced-motion preferences. Browser-mode activity happens while the page runs; the optional backend remains required for independent activity when the browser is closed.

## Natural-colour worlds and enchanted companion

The interface continues to use its dusty-rose and plum colours, while the game itself has its own natural palette (blue sky, green grass, natural wooden cottage, bright water, warm indoor lighting). The toggle changes the interface to plum and also gives the natural-colour world a darker night atmosphere. Text-heavy sections now use a conventional, higher-contrast sans-serif font rather than the pixel display font.

Use **Meadow** and **Woodland** above the scene to explore two areas. The woodland has a winding creek, log bridge, mushroom patches, trees and a small magical stone circle. The redrawn cottage has a curtained window, reading shelf, bed, woven rug and fireplace. Pip is now a subtle fae creature with delicate antlers, luminous turquoise eyes and a glowing tail. The environment transitions are deliberately slow.

Existing saved letters, interests, journal and memories keep the original `little-wanderer-v1` storage key. Your last outdoor area is remembered in browser mode; for the optional backend, the scenery selector is a local viewing preference while the autonomous agent continues its backend routines.

## Permission-first research

Pip independently develops specific questions around interests such as mushrooms, wildflowers, stars and butterflies, but **never searches without your approval**. Open Little curiosities to approve or decline each pending question, or click the study computer to ask Pip what is on her mind. Approved source research writes a short question-centred note and Pip's own observation, not an encyclopedia dump. Existing D1 memories and journals are preserved.


## Pip's ongoing life — garden, projects and conversations

Pip has one **persistent cloud world**. While the browser is closed, her
Cloudflare scheduled job continues updating needs and garden growth, choosing
activities from weighted needs and learned preferences, working on projects
and writing down real milestones. No model is trained on the fly; the
simulation provides reliable state, and Workers AI uses it for conversation.

- **Real garden**: wildflowers, kitchen herbs and strawberries have saved water
  levels and growth values. Pip chooses to tend plants when they are thirsty.
  Strawberry harvests and gardening experiences are recorded.
- **Personal projects**: Pip independently chooses from hobbies like a
  botanical collection, bird journal, recipe book, star sketches and forest
  mapping, and works through persistent steps toward completion.
- **Honest conversation**: Slow letters remain. A separate **Live chat** mode
  responds without waiting for the next cron, uses the *same* cloud memories,
  garden, journal, interests and project details, and indicates when AI falls
  back because it is unavailable or its daily allowance is used.
- **Research permission**: Interests may generate questions but never fetch
  external research until you approve the particular question.

### One Pip on several devices

Once your main browser is connected to the Cloudflare Worker, open
**Settings & your saved world → Make a pairing code**. The code lasts
**10 minutes**, works only once and has limited guesses. Open the **same
GitHub Pages website** in a different browser or device, go to Settings,
enter the code in **Pair device**, and that browser receives its own
180-day access token to the *same* existing Pip.

Neither the master PET_API_TOKEN nor your private state is published in
the site code. Device session tokens are hashed in D1, and session secrets
are excluded from the public world-state API. The receiving browser stores
its own session locally. This is device pairing, **not yet automatic
cross-device sign-in**: you must pair each additional browser once.
Do not share codes or device tokens, and avoid using untrusted browsers.

The existing original browser will still automatically reconnect from its
saved settings. The Cloudflare Worker must finish its GitHub deployment for
new API routes such as /api/chat and /api/device/pair/start to work.
Cloudflare free-tier AI usage limits and the app's configured daily budget
still apply.
