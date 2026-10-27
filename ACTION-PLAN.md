# ACTION PLAN — what we do from here

**Status:** site built, verified, and pushed to GitHub.
**Strategy:** [BUSINESS-PLAN.md](BUSINESS-PLAN.md) — read that for the *why*.
**This file is the *what*, in order, with checkboxes.**

---

## 0. Where we are right now

| Done | Evidence |
|---|---|
| ✅ Strategy written | `BUSINESS-PLAN.md` |
| ✅ Track A landing page built | `index.html` — offers, published prices, quote form |
| ✅ Free tool #1, fully working | `invoice.html` — line items, tax, discount, autosave, PDF |
| ✅ Free tool #2, fully working | `calculator.html` — break-even, margin, market verdict |
| ✅ Track B product page built | `product.html` — offer, proof, $49 price, checkout wired |
| ✅ Tested in a real browser | maths verified, autosave survives reload, **0 console errors** |
| ✅ On your GitHub | `OsamaHaroonn/stacklane-site` — commit `aeb0a33`, private |

**Not done yet (that's this file):** branding, payments, going live, first outreach, first sale.

> **Rule for the whole plan:** one action per day beats five actions on Sunday.
> The daily outreach is the only non-negotiable line.

---

## PHASE 1 — Make it yours  ⏱ today, ~45 minutes

Nothing below is optional if you want to charge money. All of it is editing text.

- [ ] **Pick your business name.** Not "LLC" — something you'd say out loud. Currently `Stacklane` is a placeholder.
- [ ] **Search-replace `Stacklane` → your name** across all 7 files.
- [ ] **Search-replace `hello@example.com` → your real email** in `index.html` and `assets/store.js`.
- [ ] **Rewrite the three services and prices** in `index.html` to match what *you* will actually deliver. My numbers ($600 / $1,400 / $1,200+) are starting points — raise them if the work is bigger, lower them only to land your first client.
- [ ] **Set up payments.** Free Stripe account → https://dashboard.stripe.com/payment-links → create a link for $49 → paste it into `assets/store.js`:

  ```js
  window.STORE = {
    CHECKOUT_URL: 'https://buy.stripe.com/your-link',
    CONTACT_EMAIL: 'you@example.com'
  };
  ```

- [ ] **Change the product name and price** in `product.html` if the $49 kit isn't what you're selling.
- [ ] **Ask me to re-test after every edit.** I'll re-run the browser checks — don't assume an edit didn't break something.

**✅ Phase 1 done when:** you click "Buy now" and land on a real Stripe checkout page.

---

## PHASE 2 — Go live  ⏱ tomorrow, ~20 minutes

Right now the site exists but nobody can reach it.

- [ ] **Make the repo public** (Settings → General → Danger Zone → Change visibility), *or* ask me to do it.
- [ ] **Turn on GitHub Pages** (Settings → Pages → Deploy from a branch → `master` / root).
- [ ] **Wait ~2 minutes, then check the live URL:** `https://osamaharoonn.github.io/stacklane-site/`
- [ ] **Test the live site on your phone** — not just your laptop.
- [ ] **Free custom domain** — a `.com` is ~$10/yr; GitHub lets you attach one under Settings → Pages → Custom domain. **Do this after your first sale**, not before.
- [ ] **(Optional, recommended) Deploy to Cloudflare Pages or Netlify too** — they give you a nicer preview URL and analytics for free. Ask me and I'll set it up.

**✅ Phase 2 done when:** you can open the site on someone else's phone via a link.

---

## PHASE 3 — Track A: the outreach machine  ⏱ days 1–30, 30 min/day

**This is the only part that guarantees income. Everything else is optional except this.**

### Before you send anything (one time, ~1 hour)
- [ ] Decide **one** service to lead with (my bet: the $1,400 website+booking package — highest value per conversation).
- [ ] **Ask me for 10 ready-to-send messages.** I'll write them for a specific list of businesses you give me.
- [ ] Make the demo link you'll send: point prospects at your live invoice tool or a sample build.

### Daily loop — every single day
- [ ] **Find 10 businesses** with an obvious problem: dead site, no online booking, broken mobile. Google Maps in your city is the fastest source.
- [ ] **Send 10 personalised messages.** Template is in `BUSINESS-PLAN.md` §3.4.
- [ ] **Reply to every reply within a few hours.** Speed wins more deals than skill does.
- [ ] **Log the numbers** in the scorecard below.

### Weekly targets (4 weeks)
| Week | Messages | Real conversations | Paid clients |
|---|---|---|---|
| 1 | 70 | 2–4 | 0–1 (free/half-price proof job is OK here) |
| 2 | 70 | 4–6 | 1 at $300+ |
| 3 | 70 | 4–6 | 1–2, raise your price |
| 4 | 70 | 4–6 | 1–2, add a retainer |

**Rules:**
- One free or half-price job in week 1, for a testimonial and a case study. Then never again.
- Charge a fixed price, never an hourly rate.
- Add a $150–500/mo care plan to every client you land — that's your first recurring revenue.
- If 100 messages produce zero conversations, the *message* is wrong. Send it to me and I'll rewrite it. If conversations happen but no closes, the *offer or price* is wrong. Don't blame yourself first.

**✅ Phase 3 done when:** one client has paid you.

---

## PHASE 4 — Track B: the machine that runs while you sleep  ⏱ from day 7

Track A pays the bills. Track B is what's still earning when you stop working.

- [ ] **Niche check** — you never answered this, and it matters more than any code. I need: *what you know well*, *how many hours a day you have*, *what $100/day would change for you.* Answer those and I'll lock in one Track A offer and one Track B product.
- [ ] **Pick the paid product.** The $49 kit is a placeholder — the real product should come from what clients keep asking you for.
- [ ] **Add one new free tool every 2 weeks** — each tool is a permanent, compounding entry point. I build them; you tell me the job-to-be-done. Good candidates: invoice → quote builder → receipt maker → contract template → job scheduler.
- [ ] **Choose ONE distribution channel and stick with it for 60 days** (pick by where your buyers already are):
  - **Communities** (Reddit / niche forums / Facebook groups) — fastest, free, needs a human voice
  - **Search** (tool-style keywords only, never articles) — slowest, compounds forever
  - **Short video** (30-second screen recording of the tool working) — biggest upside
- [ ] **Post daily for 60 days before judging anything.** Week-1 traffic means nothing.
- [ ] **Capture emails from day one.** Ask me to add a signup form — that list is the only audience you actually own.

**✅ Phase 4 done when:** you made a sale you didn't do anything for that day.

---

## The scorecard  (check every Sunday, 30 minutes)

| Metric | This week | Last week |
|---|---|---|
| Outreach messages sent | ___ / 70 | |
| Conversations held | | |
| Clients closed | | |
| Revenue ($) | | |
| Recurring revenue/mo ($) | | |
| Site visits | | |
| Email signups | | |
| Product sales | | |

**Three questions every Sunday:**
1. What produced money or conversations this week? → **do more of it**
2. What produced nothing after two honest weeks? → **kill it**
3. What is the **one** number that must go up next week? → **that's the week's focus**

---

## Decision points — when to change the plan

| Situation | Do this |
|---|---|
| 100 messages, zero replies | Rewrite the message with me — don't send #101 |
| Replies but zero closes | Lower the barrier: offer the paid preview-first model, or cut scope and price |
| One service keeps selling | Drop the other two. Specialise. Specialists charge more |
| A client asks for something 3× the price | That's your new product — Track B by accident |
| Track B gets 1,000 visits and zero sales | Fix the offer or the price, not the traffic |
| You've done 14 days of outreach with nothing | We change the niche or the offer, not your effort |
| First $1,000/month recurring | Reinvest: paid tool, a domain, maybe ads — **only then** |

---

## What I do vs. what you do

**I do (just ask):**
Build new tools · rewrite the outreach messages · rewrite the sales copy when it isn't converting · analyse why a page isn't getting clicks · add the email signup form · set up analytics · deploy to a better host · make the repo public and enable Pages · re-test everything after every edit

**You do (the 30 minutes that decide everything):**
Find the 10 businesses · send the messages · reply fast · name the price out loud · collect the payment · answer my three niche questions

---

## Start now — the next five actions

1. **Answer my three questions** — what you know well / hours per day / what $100/day changes. Everything about niche selection is blocked on this.
2. **Pick your business name** and tell me — I'll do the search-replace across all files.
3. **Create the Stripe payment link** and paste it into `assets/store.js` (or hand me the file and I'll do it).
4. **Make the repo public + enable Pages** → ask me, I'll do it in one command.
5. **Tomorrow morning: send your first 10 messages.** I'll write them the moment you give me a list of businesses.

**Phase 1 today. Phase 2 tomorrow. Ten messages a day starting tomorrow. Everything else follows.**
