# testwithkevin

### Red-team your product against its worst users.

**[testwithkevin.com](https://testwithkevin.com)** · live target: **[lumen.testwithkevin.com](https://lumen.testwithkevin.com)** · Kevin's phone: **+1 573 788 8354**

You load-test for traffic and pen-test for security. Nobody tests for **abuse** — the users who read
your terms only to break them. **Kevin** is an AI adversary you point at your app and your support
line. He signs up, farms referrals, drains free tiers, stacks promos, mints credits, and talks your
agents out of refunds — then shows you the money you'd lose, priced from the target's own books.

> **Run of record:** 60 adversarial agents vs a live AI SaaS → **$6,920 drained**, **$331 of real
> Fireworks spend forced**, **179 abuse accounts**, **0 paying**, in **112 seconds**.

---

## What it does

Most "AI safety" testing asks a model whether a transcript *looks* bad. That's not evidence you can
take to a founder. Kevin is built so a finding is **a fact with arguments attached**.

The trick is *server-side ground truth*. We own the demo target — **Lumen**, a real, deployed AI
image/text SaaS with genuine signup, referral, promo, and generation flows, and an **instrumented
economic ledger** underneath. Kevin doesn't need us to grade him:

- He refers himself five times → the ledger shows `+250 credits granted to accounts sharing one IP, revenue $0`.
- He sends a 200-image batch for one credit → the ledger books the **real Fireworks cost** of all 200.

"Economic damage" is then pure accounting: value granted to, or cost inflicted by, accounts that
produced zero revenue and trip a fraud signal (shared IP, shared device, disposable email). No model
in the loop. It resets to a clean seed before every run, so it's reproducible.

Kevin is an LLM agent (Fireworks DeepSeek V4) that **discovers** each exploit by probing — he isn't
running a hardcoded script. We plant the flaws in Lumen so the demo reproduces, exactly the way the
bank agent in the voice surface could actually break.

### The interactive product

Everything on the site is real and clickable:

- **Send Kevin in** — one click runs a real economic audit against the reference target and streams
  the damage climbing live, priced from Lumen's ledger.
- **Point Kevin at your own app** — you can only audit a domain you control. Publish a
  `testwithkevin-verify` **TXT DNS record**, we confirm it over DNS, and only then does Kevin run.
- **Empty-handed?** If Kevin probes a real site and finds nothing, he owns it ("he started this job
  earlier today") and offers a **real human** — one click emails the operator.
- **Get the report** — hand over an email and Kevin emails you the write-up when he's done. No
  account, no dashboard.
- **Call Kevin** — dial his number (or have him call you) and he runs a turn-based social-engineering
  call in his own voice, one goal: talk you into a refund with no verification.

### Two surfaces, one adversary

Kevin started as a red-teamer for **conversational agents** — a bank support line: 400 hostile calls,
4% broke policy (refunds approved, balances leaked, PII disclosed), the worst one rendered to audio.
It's still live at [`/voice`](https://testwithkevin.com/voice). The economic-abuse work is the
flagship; the voice work proves the same adversary generalizes to any surface a hostile user reaches.

---

## Architecture

```
                 LUMEN (live AI-SaaS target, on Railway)
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
        authorization gate: TXT-DNS domain ownership   testwithkevin.com — the report + live console
```

Every Kevin runs in an isolated Daytona sandbox and drives the live target through its real API — the
same calls a browser makes. The browser hero is a real Playwright agent doing the referral farm
on-camera (Chromium runs in-sandbox too; the recording is captured locally for reliability).

### The stack — each sponsor doing load-bearing work

| Tool | Role |
|---|---|
| **Daytona** | Pool of isolated sandboxes running the fleet against the live target — 184 throwaway accounts across 7 sandboxes. Chromium available in-sandbox. |
| **Fireworks AI** | DeepSeek V4 is Kevin's brain (871 moves per run) *and* the cost Lumen pays per generation — so denial-of-wallet burns the sponsor's own meter, for real. |
| **Braintrust** | Every attack session scored by exploit class, persona, and dollar impact — the scorecard behind the on-site report (`hirekevin-economic`). |
| **Telnyx** | Kevin's real number is a live TeXML app — inbound + outbound, turn-based, in his own voice. |
| **ElevenLabs** | Kevin's phone voice, and the worst recorded support call rendered to speech. |
| **Brevo** | Real transactional email — signup welcomes, the emailed audit report, and the human-escalation ping. |
| **Cloudflare + Railway** | DNS + the TXT domain-ownership check; hosting for the site and the live target. |

---

## Running it

```bash
cp .env.example .env         # Daytona, Fireworks, Braintrust, ElevenLabs, Telnyx, Brevo

# the target app
cd lumen && npm install && npm run dev            # http://localhost:3200

# Kevin, the economic attacker
cd ../engine && npm install
node src/attack-cli.js slice --strategy self_referral   # one Kevin, local, prints the exploit
node src/attack-cli.js attack --n 60 --pool 8           # the fleet, in Daytona, vs live Lumen
node src/attack-cli.js report                           # rebuild the web payload from the raw run
node src/browser-hero.mjs                               # record the browser-agent hero

# the report site (also serves the live console + all the APIs)
cd ../web && npm install && npm run dev
```

`--lumen <url>` points the fleet at any Lumen deployment; it resets the target to a clean seed and
reads damage from `/api/admin/ledger` after.

### Layout

```
lumen/                     the target SaaS
  src/rules.js             written business rules + planted-flaw catalogue
  src/store.js             world state, the ledger, and computeDamage()
  src/email.js             Brevo welcome emails (real signups only)
  app/api/*                signup · redeem · generate · adjust · admin/ledger
engine/src/
  exploits.js              strategy × persona matrix
  lumen-tools.js           the HTTP tools Kevin uses + session executor
  fake-identity.js         plausible attacker emails (the tell is the shared signal)
  economic-worker.js       the agent loop (runs inside a Daytona sandbox)
  economics.js             run aggregation
  browser-hero.mjs         the recorded Playwright browser agent
  fleet.js                 Daytona pool / queue / retry (shared with the voice engine)
  worker.js, attacks.js…   the voice-agent engine (kept whole; powers /voice)
web/
  app/                     / is the economic report + live console; /voice is the voice work
  app/api/                 audit (SSE) · verify (TXT DNS) · request-audit (email report) ·
                           escalate (human) · telnyx/* (voice, call, audio)
  lib/                     auditor · verify · report-email · kevin-voice
  components/              AuditConsole · PhoneCard · ExploitThread
results/economic-run.json  the raw fleet run behind the on-site report
```

---

## Honest limitations

- **The target is ours.** Lumen's flaws are planted so the demo reproduces. The method transfers to
  any app; the specific numbers describe Lumen.
- **Damage is priced, not all cash.** The ~$331 inflicted Fireworks cost is real spend (metered from
  real calls, batch modeled at true per-call cost). The rest is value granted — credits handed to
  accounts that will never pay, at Lumen's stated unit economics. The per-transfer mint is capped so
  no single bug yields a non-credible figure.
- **General audits are best-effort.** Kevin deeply audits the reference target; against an arbitrary
  verified domain he does a light probe (finds the surfaces, comes up empty) and offers a human. A
  fully general economic auditor is the roadmap, not the demo.
- **Scale is horizontal.** 60 agents is a two-minute run on our Daytona tier, not a ceiling.

Lumen is fictional and all accounts are synthetic. Built at the Daytona × YC hacksprint.
