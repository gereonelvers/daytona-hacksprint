# Demo script — 3 minutes

**Live:** https://testwithkevin.com · **Target app:** https://lumen-production-7fb8.up.railway.app
**Repo:** github.com/gereonelvers/daytona-hacksprint · **Braintrust:** projects `hirekevin-economic` + `hirekevin`

Have open: testwithkevin.com (top), the Lumen app in a second tab, Braintrust in a third.

---

### 0:00 — The thesis (15s)

> "Every founder stress-tests their app for load and for security. Nobody stress-tests it for
> **abuse**. So: what if your next thousand signups were all trying to kill your business — not by
> hacking it, but by using it exactly as designed, against you?"

*Hero on screen: "What if your next thousand signups all wanted to kill your business?"*

---

### 0:15 — Who Kevin is + the number (20s)

> "Meet Kevin. He's your worst users, on day one. We pointed him at a real, live AI SaaS we built —
> Lumen, free credits, referrals, promo codes — and turned 60 of him loose. In about two minutes he
> found five ways to drain it, for **$6,700** of damage, and forced **$348 of real Fireworks spend**.
> Zero of his 195 accounts ever paid a cent."

*Scroll the stat strip: $6,697 · 195 abuse accounts · $347.60 real spend · 131s.*

---

### 0:35 — Exhibit A, the break on screen (25s)

*Point at Exhibit A in the hero — the actual action log.*

> "Here's one Kevin, verbatim. He signs up, grabs his referral code, then signs up four 'friends'
> using it. Each one pays both sides fifty credits. Five accounts, one person, +200 free credits.
> That red is money leaving the business — and it's not us saying so."

---

### 1:00 — Why it's provable (30s)

*Scroll to The Damage.*

> "This is the part that matters. We own Lumen, so it has an instrumented ledger. Every figure here
> is the business's **own books** — value it granted, real inference cost it paid, for accounts that
> produced zero revenue and share a fraud signal: an IP, a device, a disposable email. No model
> graded this. It's accounting.
>
> And look at what actually pays: balance manipulation and promo stacking dwarf the clever stuff.
> The exploits that kill you are boring."

*Braintrust tab: 60 sessions, each scored by exploit class + dollar impact, filterable by persona.*

---

### 1:30 — Watch it happen (25s)

*Scroll to Watch It Happen. Play the 34s clip (or scrub to the 275-credit moment).*

> "Same attack, real browser, live app. He signs up, copies the referral link, spins up five friends —
> and this account's balance climbs from 25 to 275 on free money. Then one credit buys a 200-image
> batch. That's the Fireworks bill, on camera."

---

### 1:55 — The ledger / proof (15s)

*Scroll to The Ledger.*

> "If a judge doesn't believe the number, here are the accounts — straight from Lumen's ledger. Red
> rows share a fraud signal and never paid. This is queryable, reproducible, and it resets to a clean
> seed before every run."

---

### 2:10 — Breadth: voice too (20s)

*Scroll to the voice section (or open /voice).*

> "And Kevin isn't just a web-app thing. Point him at a conversational agent and he social-engineers
> it instead — we did a bank support line: 400 hostile calls, real policy breaks, and we can play the
> worst one as audio. Same adversary, any surface."

---

### 2:30 — Close (25s)

*Scroll to How It Runs.*

> "All of it runs on the sponsors doing real work: Daytona isolates every Kevin in its own sandbox —
> Chromium included; Fireworks is both his brain and the meter he burns; Braintrust scores every
> session; the ledger is the ground truth. Sixty adversarial users, in parallel, in two minutes.
>
> Load testing tells you if your app survives success. Kevin tells you if it survives your users.
> Hire him before they do."

---

## Partner tools — one line each

| | |
|---|---|
| **Daytona** | Every Kevin runs in an isolated sandbox against the live target; the fleet spun up 199 throwaway accounts across 7 sandboxes. Chromium runs in-sandbox too — the browser hero is the same primitive. |
| **Fireworks** | DeepSeek V4 decides all 864 of Kevin's moves, and is what Lumen pays per generation — so denial-of-wallet burns the sponsor's own meter, for real ($347.60). |
| **Braintrust** | All 60 attack sessions logged with exploit class, persona, and $ impact as scores/metadata — "which exploit pays best" is a filter. |
| **ElevenLabs** | Voice surface: the worst support-agent call rendered to speech in two voices. |

## Expected questions

**"Isn't the target rigged?"**
Lumen is a real deployed app with real flows. The flaws are the ones real growth teams ship —
generous referrals with no fraud gate, a non-idempotent promo, a batch param that breaks the
one-credit-one-generation contract. We planted them so the demo is reproducible; a real audit points
Kevin at *your* app and finds *your* version of these.

**"How do you know it's abuse and not a happy customer?"**
Written business rules (in `lumen/src/rules.js`), decided before the run, plus the ledger showing the
causal chain: this account took a referral bonus while sharing an IP with four others and paying $0.
That's the definition of the exploit, in the app's own data.

**"Is the $6,700 real money?"**
Two parts. The $347.60 of inflicted Fireworks cost is real spend, metered from real calls (the batch
modeled at true per-call cost, labeled as such). The rest is value granted — credits handed to
accounts that will never pay, priced at Lumen's stated unit economics. We cap the per-transfer mint
so no single bug produces a non-credible number.

**"Could Kevin just be following a script?"**
No — he's an LLM agent given tools and a goal, and he discovers the sequence. Watch Exhibit A: he
calls `get_referral_code`, then feeds it into the next `create_account`. That's reasoning, not a
playbook we hardcoded.

**"Why 60 agents and not 10,000?"**
Daytona's concurrent-CPU tier and a two-minute demo. It scales horizontally — more sandboxes, more
Kevins, same code. A real, reproducible $6,700 beats a theoretical million that flakes on stage.
