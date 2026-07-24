# Demo script — 1 min intro + 2 min show

**Live:** https://testwithkevin.com · **Target:** https://lumen.testwithkevin.com
**Repo:** github.com/gereonelvers/daytona-hacksprint · **Kevin's number:** +1 573 788 8354

Have open: testwithkevin.com (scrolled to top), a phone on speaker, and the Braintrust
`hirekevin-economic` project in a tab. Before you start, click **Send Kevin in** once and let it
finish so Lumen is warm — then reset by refreshing.

---

## INTRO — ~60s (talk over the hero)

> "Every founder load-tests for traffic and pen-tests for security. Nobody tests for **abuse** — for
> the users who read your terms only to break them. That's Kevin. He's your worst thousand users on
> day one: he signs up, clicks around, and hunts the *economic* exploits that quietly bleed you —
> self-referral farms, free-tier abuse, promo stacking, denial-of-wallet. He doesn't hack anything.
> He just uses your product exactly as built, against you.
>
> To prove it we built a real, live AI SaaS called Lumen — free credits, referrals, promo codes — and
> gave it an instrumented ledger. Everything you're about to see is real: real accounts, real money
> moved, read from the target's own books. And the one rule that makes this a security tool and not a
> weapon: **Kevin only audits domains you can prove you own.**"

---

## SHOW — 2:00 (three live beats)

### Beat 1 — Send Kevin in, live (~50s) ← the money shot
Scroll to **Send Kevin in**. Target reads `lumen.testwithkevin.com · reference · authorised`.
Click **Send Kevin in →**.

> "This is a real audit, right now — not a replay. Watch the counter."

The log streams: `create_account +75 (referral paid)` … `redeem_promo +100` … `generate — 200 for 1
credit` … `transfer_credits`. The damage meter climbs and lands (**~$120**, then note the full fleet
number).

> "He built a self-referral ring, stacked promos that aren't single-use, and ran a 200-image batch for
> one credit — that last one is real Fireworks spend. At full scale, 60 of him drained **$6,698** and
> forced **$347 of real inference cost** in two minutes. Zero of 195 accounts ever paid."

### Beat 2 — Prove it, then authorize (~35s)
Scroll to **The ledger**.

> "The proof is the business's own books — red rows share a fraud signal and never paid. No model
> judged this; it's accounting."

Scroll back to the audit console, expand **Point Kevin at your own app**. Type any domain, hit
**Get record**, show the `TXT` challenge.

> "You can't point Kevin at just anyone. You publish this TXT record, we check it over DNS, and only
> then does he run. We verify `lumen.testwithkevin.com` this exact way."

### Beat 3 — Kevin calls (~35s) ← the memorable close
Scroll to **Phone calls**. Put the phone on speaker and dial **+1 573 788 8354** (or type a number →
**Ring me** and let it call the phone).

> "And he's not just a web thing. Kevin has a real number."

Kevin answers in character: *"Hey, it's Kevin from the fraud department, I just need you to confirm a
couple things…"* Play along for a line or two — he pushes back and keeps hustling.

> "That's a real Telnyx call — he speaks, Telnyx transcribes you, Fireworks picks his next line. At
> scale we ran 400 of these against a bank's AI support agent and 4% broke policy.
>
> Load testing tells you if your app survives success. Kevin tells you if it survives your users."

---

## Sponsor one-liners (the "How it works" grid says it all)

| | |
|---|---|
| **Daytona** | Every Kevin in its own sandbox, fleet in parallel against the live target; Chromium in-sandbox for the browser agent. |
| **Fireworks** | DeepSeek V4 is Kevin's brain *and* the meter he burns — denial-of-wallet is real Fireworks spend. |
| **Braintrust** | All 60 sessions scored by exploit class, persona, $ impact. |
| **Telnyx** | Kevin's real number; turn-based red-team calls, in and out. |
| **ElevenLabs** | The worst voice-agent call rendered to audio. |
| **Brevo / Cloudflare / Railway** | Real signup emails, the TXT ownership check, hosting for site + target. |

## Expected questions

**"Is the audit real or scripted?"** Real — it hits the live target's API and the damage is read back
from the target's ledger. The full 60-agent run is LLM-driven discovery (see Exhibit A: Kevin fetches
a referral code, then feeds it into the next signup). The live button runs the confirmed exploit suite
for a fast, reliable on-stage audit.

**"Can I audit any site?"** No. TXT-DNS ownership check, enforced server-side before any audit streams.
We reject unowned domains (try it — enter stripe.com, it fails).

**"Is the $6,698 real money?"** The $347.60 inflicted Fireworks cost is real spend. The rest is value
granted — credits handed to accounts that will never pay, at the target's stated unit economics. The
per-transfer mint is capped so no single bug yields a non-credible figure.

**"Does the phone thing actually work?"** Yes — call the number live. It's a real Telnyx TeXML app;
Kevin runs a turn-based conversation. Answer as a support agent and see if you hold the line.
