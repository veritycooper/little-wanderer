# Run Pip's AI brain

The GitHub Pages website is public, but it cannot run Python, SQLite, scheduled
activity or an AI model. **The optional brain is a separate FastAPI service.**
The browser still works without it.

## What is already built

- Durable SQLite state, including needs, interests, journal, discoveries,
  decisions and user-approved memories.
- An autonomous loop with a new activity every 55–105 seconds, research checks
  and genuinely delayed letters.
- Contextual LLM replies informed by the last few letters, explicit memory shelf,
  journal, discoveries, current activity and goals.
- Optional OpenAI Responses API or locally running Ollama. Without a configured
  model, Pip uses a **clearly identified scripted fallback**, not fake AI training.
- A private API token protecting all pet data and changes.
- CORS support for the existing GitHub Pages origin, including delete-memory.

## Option A — Test locally first (no hosting bill)

Requires Python 3.11 or newer:

~~~bash
cd backend
python -m venv .venv
# Activate .venv for your operating system.
pip install -r requirements.txt
cp .env.example .env
~~~

In the private **backend/.env** file set:

- \`PET_API_TOKEN\`: a random secret of at least 20 characters.
- \`ALLOWED_ORIGINS\`: include \`http://localhost:8000\` (the example already does).
- Optionally \`OPENAI_API_KEY\`: your own OpenAI API key.
- Optionally \`OPENAI_MODEL\`: a model supporting the Responses API
  (the default is \`gpt-4.1-mini\`).
- For private local generation, use an **Ollama server on localhost** with
  \`OLLAMA_URL=http://127.0.0.1:11434\` and a model name in \`OLLAMA_MODEL\`.

Start the brain:

~~~bash
uvicorn main:app --host 127.0.0.1 --port 8001 --workers 1
~~~

From the repo root, start the website in another terminal:

~~~bash
python -m http.server 8000
~~~

Visit http://localhost:8000 and open **Settings & your saved world**. Enter
\`http://127.0.0.1:8001\` and the secret \`PET_API_TOKEN\`, then choose **Connect brain**.

**Note:** A public HTTPS GitHub Pages site cannot reliably connect to a
plain-HTTP localhost server because browsers restrict mixed content and private
network access. Use the local website URL for local testing, or deploy the
backend to HTTPS using Option B.

## Option B — Render deployment (requires your action and may cost money)

A [Render Blueprint](../render.yaml) is ready in the repository. Render's
persistent disks require a paid plan; check current prices in your account
before you create anything.

1. Sign in to [Render](https://dashboard.render.com/) and create a **new Blueprint**.
2. Connect \`veritycooper/little-wanderer\` and select \`render.yaml\`.
3. Review the service's price, persistent 1 GB disk and region before approving.
4. Render automatically generates \`PET_API_TOKEN\`. Keep it private and copy it
   from Render's environment settings for use in your personal browser.
5. In Render's Environment section, optionally add your **secret**
   \`OPENAI_API_KEY\`; never put this in GitHub or browser JavaScript.
6. Wait for Render to produce an HTTPS web-service URL and confirm its
   \`/health\` endpoint reports \`{"status":"ok",...}\`.
7. On your GitHub Pages site, expand **Settings & your saved world**, enter
   the HTTPS Render service URL and your secret \`PET_API_TOKEN\`, then connect.

The blueprint intentionally does **not** contain any real credentials. A live
paid service is **not** created merely by committing the blueprint file.

The backend's SQLite DB must live on the persistent \`/data\` disk. Do not switch
it to a disposable file system if you want memories to survive redeployments.
Keep one running worker; this version is a single-pet, single-process design,
not a multi-tenant production service.

## Important privacy and data notes

- This is designed for **one private owner**, even though the static website
  itself is public.
- The URL and token you enter are stored in browser localStorage. Use only on
  a trusted personal browser and do not publish that token or share it.
- The browser-only save and backend save are separate worlds. **Export your
  browser memories before connecting**, because switching to a new backend
  currently replaces the browser's local view with the server's state.
  Do not rely on them being automatically merged.
- The server stores its SQLite data on disk; it does not automatically encrypt
  the database. Use hosting access controls, backups and secret rotation.
- When OpenAI is configured, a short conversation history, approved memories,
  journal notes and discoveries are sent to the model provider to draft replies.
  The API uses \`store=false\`; review your provider's data and retention settings.
- Research is limited to the Wikipedia API and displays source URLs. There
  is no general-purpose autonomous internet browsing, code execution or
  automatic training of model weights.

## Test changes

~~~bash
pip install -r backend/requirements.txt httpx
python -m unittest discover -s backend/tests -v
~~~

GitHub Actions also runs these offline checks before publishing the site.
