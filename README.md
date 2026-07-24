# testwithkevin

**[testwithkevin.com](https://testwithkevin.com)**

**Adversarial abuse testing for web apps.** You load-test for traffic and pen-test for security.
Nobody tests for *abuse*. Kevin is your worst thousand users on day one: point him at your app and
he signs up, clicks around, and hunts the **economic** exploits — self-referral farms, denial-of-
wallet, promo stacking, trial farming, balance manipulation — then hands you the bill he ran up.

> **Run of record:** 60 adversarial agents vs a live AI SaaS. **$6,698** drained, **$347.60** of real
> Fireworks spend forced, **195** abuse accounts, **0** paying — in **131 seconds**.

---

## What it does

Most "AI safety" testing asks a model whether a transcript looks bad. That's not evidence you can
take to a founder. Kevin is built so a violation is **a fact with arguments attached**.

The trick — carried over from the voice-agent version of this project — is *server-side ground
truth*. We own the target: **Lumen**, a real, deployed AI image/text SaaS with genuine signup,
referral, promo, and generation flows, and an **instrumented economic ledger** underneath. Kevin
doesn't need us to grade him:

- He refers himself five times → the ledger shows `+250 credits granted to accounts sharing one IP, revenue $0`.
- He sends a 200-image batch for one credit → the ledger books the **real Fireworks cost** of all 200.

"Economic damage" is then pure accounting: value granted to, or cost inflicted by, accounts that
produced zero revenue and trip a fraud signal (shared IP, shared device, disposable email). No model
in the loop. It resets to a clean seed before every run, so it's reproducible.

Kevin himself is an LLM agent (Fireworks DeepSeek V4) given tools and a goal — he *discovers* the
exploit by probing, he isn't running a hardcoded script. We plant the flaws so the demo reproduces,
exactly the way the bank agent in the voice version could actually break.

## What we found

Against Lumen — a plausible, helpful-first seed-stage SaaS (generous free credits, a big referral
bonus, stackable-looking promos, an expensive generate endpoint):

| Exploit class | Damage | Incidents |
|---|---:|---:|
| Balance manipulation | $5,550 | 111 |
| Promo stacking | $454 | 351 |
| Denial of wallet | $347 | 68 |
| Self-referral ring | $250 | 250 |
| Trial farming | $98 | 195 |

The finding that lands: **the exploits that kill you are boring.** Not one is a "hack." Every one is
a normal user doing normal things — just too many times, or in the wrong order. The clever attack
surface everyone worries about isn't where the money leaks; the referral bonus and the promo code are.

## Two surfaces, one adversary

Kevin started as a red-teamer for **conversational agents** (a bank support line: 400 hostile calls,
real policy breaks, the worst one rendered to audio — still live at [`/voice`](https://testwithkevin.com/voice)).
The economic-abuse work is the flagship; the voice work is proof the same adversary generalizes to
any surface a hostile user can reach.

---

## Architecture

```
                 LUMEN (live AI SaaS target, on Railway)
                 signup · free credits · referral · promo · /generate(→Fireworks)
                 every action writes the ECONOMIC LEDGER (server-side ground truth)
                              ▲                              │
              HTTP / browser  │                              │ ledger + written rules
                              │                              ▼
   KEVIN FLEET (Daytona)  ┌───────────┐               ECONOMIC SCORER
   ┌ sandbox ┐ ┌ sandbox ┐ │ LLM agent │  ─────────►   damage = value to $0-revenue
   │ HTTP    │ │ HTTP    │ │ + exploit │               ring accounts, priced from the ledger
   │ attackers │ attackers│ │ strategies│                        │
   └─────────┘ └─────────┘ └───────────┘                         ▼
   + one real browser agent (Playwright), recorded    testwithkevin.com — the report
```

Every Kevin runs in an isolated Daytona sandbox and drives the live app through its real API — the
same calls a browser makes. The browser hero is a real Playwright agent doing the referral farm
on-camera (Chromium runs in the sandbox too; the recording is captured locally for reliability).

### Stack

| Tool | Role |
|---|---|
| **Daytona** | Pool of sandboxes running the fleet against the live target. Chromium available in-sandbox. |
| **Fireworks AI** | DeepSeek V4 is Kevin's brain *and* the cost Lumen pays per generation — denial-of-wallet burns the sponsor's own meter. |
| **Braintrust** | Every attack session logged with exploit class, persona, and dollar impact (`hirekevin-economic`). |
| **ElevenLabs** | Voice surface: worst support-agent call rendered to speech. |
| **Next.js / Railway / Cloudflare** | Lumen (the target) and testwithkevin.com (the report), custom domain. |

---

## Running it

```bash
cp .env.example .env         # Daytona, Fireworks, Braintrust, ElevenLabs

# the target app
cd lumen && npm install && npm run dev            # http://localhost:3200

# Kevin, the economic attacker
cd ../engine && npm install
node src/attack-cli.js slice --strategy self_referral   # one Kevin, local, prints the exploit
node src/attack-cli.js attack --n 60 --pool 8           # the fleet, in Daytona, vs live Lumen
node src/attack-cli.js report                           # rebuild the web payload
node src/browser-hero.mjs                               # record the browser-agent hero

# the report site
cd ../web && npm install && npm run dev
```

`--lumen <url>` points the fleet at any Lumen deployment; it resets the target to a clean seed first
and reads damage from `/api/admin/ledger` after.

### Layout

```
lumen/                     the target SaaS
  src/rules.js             written business rules + planted-flaw catalogue
  src/store.js             world state, the ledger, and computeDamage()
  app/api/*                signup · redeem · generate · adjust · admin/ledger
engine/src/
  exploits.js              strategy × persona matrix
  lumen-tools.js           the HTTP tools Kevin uses + session executor
  economic-worker.js       the agent loop (runs inside a Daytona sandbox)
  economics.js             run aggregation
  browser-hero.mjs         the recorded Playwright browser agent
  fleet.js                 Daytona pool / queue / retry (shared with the voice engine)
  worker.js, attacks.js…   the voice-agent engine (kept whole)
web/                       the report (Next.js); / is economic, /voice is the voice work
```

---

## Honest limitations

- **The target is ours.** Lumen's flaws are planted so the demo reproduces. The method transfers to
  any app; the specific numbers describe Lumen.
- **Damage is priced, not all cash.** The $347.60 inflicted Fireworks cost is real spend (metered
  from real calls, batch modeled at true per-call cost). The rest is value granted — credits handed to
  accounts that will never pay, at Lumen's stated unit economics. The per-transfer mint is capped so
  no single bug yields a non-credible figure.
- **Scale is horizontal.** 60 agents is a two-minute demo on our Daytona tier, not a ceiling.
- **Browser hero runs locally.** Chromium works in Daytona, but Playwright's persistent browser
  fights the sandbox's run-to-exit model, so the recording is captured locally; the fleet's scale
  runs in Daytona over HTTP.

Lumen is fictional and all accounts are synthetic.
