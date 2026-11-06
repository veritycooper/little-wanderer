# Free-tier Cloudflare AI brain for Little Wanderer

This is a **serverless alternative** to the existing Python FastAPI brain. GitHub Pages stays where it is. Cloudflare Workers runs the private API and scheduled jobs, D1 stores the pet's world and Workers AI writes letters. **No OpenAI API key is needed.**

The source is in the GitHub repository, but it is **not deployed in your Cloudflare account yet**. You need to authorise Cloudflare and supply a private access token.

## Before you begin

1. Create or sign into https://dash.cloudflare.com/ and choose **Workers Free**. Review any pricing or account prompts.
2. Install Node.js 20 or newer from https://nodejs.org/.
3. Download the latest repository at https://github.com/veritycooper/little-wanderer (Code → Download ZIP) or clone it.
4. Open a terminal in its **cloudflare/** folder.
5. On the existing Little Wanderer website, open Settings and **Export my memories**. Keep this file privately as a backup.

## 1. Create your private Cloudflare D1 database

In a terminal:

~~~sh
cd cloudflare
npm install
npx wrangler login
npx wrangler d1 create little-wanderer-db --location weur
~~~

Wrangler displays the new database's UUID. Edit **cloudflare/wrangler.toml** and replace the placeholder **REPLACE_WITH_YOUR_CLOUDFLARE_D1_DATABASE_UUID** with that UUID. This ID is not a secret.

Apply the migration to the remote Cloudflare D1 database:

~~~sh
npx wrangler d1 migrations apply little-wanderer-db --remote
~~~

Confirm if prompted. This creates the table that holds Pip's world.

## 2. Create your private brain token

~~~sh
npx wrangler secret put PET_API_TOKEN
~~~

When prompted, enter a new random secret of **at least 32 characters**. Save it privately for Step 4. Never put it in source code, GitHub, screenshots or chat. The example in cloudflare/.dev.vars.example is NOT a real token.

If Wrangler asks you to create a Worker at this stage, follow the prompt and keep the name **little-wanderer-brain**.

## 3. Deploy the Worker

~~~sh
npx wrangler deploy
~~~

Save the HTTPS URL Wrangler prints, typically something like:

~~~text
https://little-wanderer-brain.YOUR-SUBDOMAIN.workers.dev
~~~

Open your own URL followed by **/health**. It should return a JSON object with status **ok**, mode **workers-ai**, and persistent **true**. This shows that the AI binding is configured, not that every later reply will succeed: AI inference may fall back to scripted letters if the model or free allowance is temporarily unavailable.

## 4. Connect Pip on GitHub Pages

1. Open https://veritycooper.github.io/little-wanderer/.
2. Under **Settings & your saved world**, enter the genuine Cloudflare HTTPS URL in **Brain server URL**.
3. Paste your private PET_API_TOKEN into **Brain access token** and select **Connect brain**.
4. If you want to keep the existing browser pet, choose **Copy my saved world to the brain** AFTER connecting. This **replaces the cloud pet's current state**, so the site asks you to confirm. The original browser backup remains saved separately. Skip this if you want a new Pip.

Save an exported backup too. The connection token is stored in browser localStorage, so only use your private device/browser.

## What the free Cloudflare brain does

- **Scheduled autonomy:** a cron trigger runs every minute, adjusting needs, choosing activities, checking delayed letters and occasionally suggesting a question. The brain does **not** fetch Wikipedia until you approve the specific question. It does not run a 24/7 continuous process.
- **AI letters:** uses the documented Workers AI model **@cf/meta/llama-3.2-3b-instruct**, drawing on recent letters, approved memories, journal, discoveries and current activity. Replies are queued rather than instant, and may take a further cron cycle to arrive.
- **Daily AI cap:** 24 model attempts per UTC day by default, plus Cloudflare's separate free inference quota. If either allowance is exhausted or the model is down, fallback letters still work. Change DAILY_AI_LIMIT in wrangler.toml if desired.
- **Private persistence:** D1 stores state, research, journals, messages and manually approved memory shelf notes even when the site is closed.
- **Permission-first research:** Pip develops interest-specific questions on her own, then waits for you to approve or decline. An approved question fetches a short sourced Wikipedia excerpt, which is saved with Pip's question and personal observation. No general web crawling or code execution is involved.

The website remains free to use without a brain connection. Cloudflare has separate Workers, D1 and Workers AI quotas that can change; review their official pages before deploying:

- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.cloudflare.com/d1/platform/pricing/
- https://developers.cloudflare.com/workers-ai/platform/pricing/

Do not assume quotas imply unconditional zero billing. The project is designed for Workers Free without paid Cloudflare features.

## Test locally

~~~sh
npm test
npm run check
npx wrangler d1 migrations apply little-wanderer-db --local
npx wrangler dev
~~~

For local requests, copy cloudflare/.dev.vars.example to a private **.dev.vars**, replace the example token with a real local token, and serve the existing GitHub Pages frontend from the repo root on http://localhost:8000. The local Worker usually uses http://localhost:8787. Never commit .dev.vars.

## Security and data notes

- All private state endpoints require your bearer token. CORS permits only the configured GitHub Pages origin and local development origins. CORS restrictions do not replace authentication.
- The /health endpoint is public but reveals no personal pet data.
- Workers AI receives a bounded context including recent messages, selected journal entries, approved memories and sourced discoveries. No personal fact from a message is promoted to permanent memory without your action.
- The one-time browser backup import validates and truncates fields; it excludes untrusted queued jobs and AI usage counters.
- D1 is private to your Cloudflare account; back up important pet data periodically.
- You can rotate the token using the same Wrangler secret command if you suspect it was exposed.

## Troubleshooting

- **401:** wrong token.
- **503:** check database migration, D1 binding, deployment logs and free-tier limits.
- **No model replies:** inspect Workers AI usage, the AI binding and /health. Scripted fallback replies continue if inference fails.
- **Browser save missing after connecting:** the cloud database starts as a separate pet. Use the explicit copy button only if you want to replace its state.
- **CORS error:** connect from the live GitHub Pages origin or adjust ALLOWED_ORIGIN to the actual site origin.


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
