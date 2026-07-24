# testwithkevin — Adversarial Abuse Testing for Web Apps

**Point Kevin at your app before your users do.**

Kevin is your worst thousand users on day one. He signs up, clicks around, and hunts the *economic*
exploits that quietly bleed a business — self-referral farms, denial-of-wallet, promo stacking,
trial farming, balance manipulation — then hands you the bill he ran up. He also picks up the phone
and red-teams your voice agents.

## What we built

A self-serve adversarial red-teaming platform that finds **economic** vulnerabilities, not just
security bugs. You prove you own a domain, send Kevin in, and he runs a *real* audit against your
app — every finding backed by **server-side ground truth**, not an LLM's opinion.

To prove it end-to-end we built **Lumen**, a real, deployed AI-generation SaaS (free credits,
referrals, promo codes, paid plans) with an instrumented economic ledger underneath. Turning 60
Kevin agents loose on it drained **$6,698** and forced **$347.60 of real inference spend** across
**195 abuse accounts** — **0 of them ever paid a cent** — in **131 seconds**.

## How it works

1. **Authorize.** You can only audit a domain you control. Kevin issues a `testwithkevin-verify`
   TXT DNS challenge and confirms it over DNS before any audit runs. A security tool, not a weapon.
2. **Send Kevin in.** LLM agents drive the target's real API/UI and *discover and execute* economic
   exploits — no hardcoded scripts. A live "Send Kevin in" button streams the damage climbing in
   real time.
3. **Prove it.** Because the target books every credit and cost server-side, "Kevin drained $X" is
   pure accounting: value granted to accounts that never paid and share a fraud signal (shared IP,
   device, or disposable email). Reproducible; resets to a clean seed each run.
4. **Call it.** Kevin has a real phone number and places real red-team calls to voice agents,
   holding a turn-based adversarial conversation.

## Architecture

The through-line across every surface: **the target is instrumented, so the damage is provable.**
Web-app economics via an economic ledger; voice agents via a written policy plus planted secrets a
violation reveals by exact match.

```
  verify domain (TXT DNS)  ──►  SEND KEVIN IN  ──►  live audit streams damage
        │                            │                       │
   authorization gate          Kevin = LLM agents      server-side ledger
                                (Fireworks DeepSeek)    = provable $ damage
                                     │
              ┌──────────────────────┼───────────────────────┐
        Daytona sandboxes      Braintrust scoring       Telnyx phone calls
        (isolated, parallel)   (per-exploit, per-$)     + ElevenLabs voice
```

| Service | Role in the system |
|---|---|
| **Daytona** | Isolates every Kevin agent in its own sandbox and runs the fleet in parallel against the live target (Chromium available in-sandbox for browser agents). |
| **Fireworks AI** | DeepSeek V4 is Kevin's brain — it decides every move — *and* the cost the target pays per generation, so denial-of-wallet burns the sponsor's own meter for real. |
| **Braintrust** | Logs and scores every attack session by exploit class, persona, and dollar impact — "which exploit pays best" is a filter, not a rerun. |
| **ElevenLabs** | Renders the worst voice-agent call to audio (two voices) — the recorded proof on the voice surface. |
| **Telnyx** | Gives Kevin a real phone number to place real turn-based red-team calls. |
| **Brevo** | Real transactional email for genuine signups on the target app. |
| **Cloudflare + Railway** | DNS + domain verification, and deployment of both the target (Lumen) and the report site. |

## Try it

**→ [testwithkevin.com](https://testwithkevin.com)** — send Kevin in and watch the damage climb live.

**→ Repo: [github.com/gereonelvers/daytona-hacksprint](https://github.com/gereonelvers/daytona-hacksprint)**

*Load testing tells you if your app survives success. Kevin tells you if it survives your users.*
