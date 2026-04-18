# CBTI — Crypto Behavioral Type Indicator

Viral bilingual (CN + EN) crypto personality quiz at **https://cbti.club**.
30 paginated questions → one of 24 crypto archetypes → shareable result card.

---

## Project state (session handoff)

**Live:** https://cbti.club (Cloudflare Pages, custom domain)
**Primary repo:** https://github.com/ckpxgfnksd-max/cbti.club (PRIVATE)
**Legacy repo:** https://github.com/ckpxgfnksd-max/cbti-club (PUBLIC, same code — may want to delete)
**Owner X:** [@ChaseWang](https://x.com/ChaseWang)
**Tip address:** EVM `0x98338f4ade9d2c2aa9310300f6a016a88538242d`

### Open decisions from last session
1. **Remote cleanup** — local has two remotes (`origin` → old public, `cbti-club-private` → new private). Need to decide: (A) swap origin to private + delete public, (B) swap without delete, (C) leave as-is.
2. **gstack upgrade available** — 0.5.3 → 1.1.0.0. Not blocking.

---

## Architecture

Flat static site, no framework. Everything is vanilla HTML/CSS/JS.

```
crypto-personality-test/
├── index.html          # single page, 3 screens (landing / quiz / result)
├── style.css           # all styles — design tokens + liquid glass + responsive
├── app.js              # quiz engine + scoring + scatter render + share + video control
├── data.js             # 30 questions + 24 personas (with scatter coords, patterns, desc)
├── assets/
│   ├── personas/       # 24 meme avatars (one JPG per persona code, e.g. HODL.jpg)
│   └── video/
│       ├── bg.mp4           # pre-baked ping-pong (forward+reverse concat, 16s, 2.5MB, no audio)
│       └── bg-poster.jpg    # first-frame poster for instant paint
├── .claude/launch.json # local dev server config (python3 -m http.server 8080)
└── .gitignore          # excludes .wrangler/, .DS_Store
```

### Screens state machine
`showScreen(id)` in `app.js`:
- Toggles `.active` on the matching `.screen` div
- Sets `body.className = 'screen-' + id` (drives video visibility + :has() fallback)
- Delegates video play/pause to `BgVideo.resume/pause`
- Scrolls to top

---

## Design system (baked into `style.css`)

**Aesthetic:** luxury editorial on pure black. Cinematic video bg on landing + quiz; pure black on result.

**Typography**
- Display/hero: **Instrument Serif** (italic for accents)
- Body: **Barlow** (300/400/500/600)
- Data / labels / stamps: **JetBrains Mono**
- CN fallback: **Noto Serif SC** / **Noto Sans SC**

**Color tokens (CSS vars in `:root`)**
- `--bg` pure near-black `#050506`
- `--fg` white, plus `--fg-70/60/50/40/20/10/06` alpha stops
- Quadrant accents: `--sm-accent` (#00E676 green), `--dd-accent` (#B24BF3 purple), `--ra-accent` (#FFB800 yellow), `--ag-accent` (#FF2E4C red)

**Surfaces — "liquid glass"**
- `background: rgba(255,255,255,0.015–0.022)` with `backdrop-filter: blur(8–18px)`
- `::before` pseudo-element with gradient border via mask-composite trick (strong at top/bottom, transparent in middle — gives subtle highlight edge)
- Film grain overlay on whole viewport via body::after SVG data URI
- Radial ambient glow from top/bottom corners via body::before

**Radii**
- Pills: `--r-pill: 9999px` (buttons, badges, tags)
- Cards: `--r-card: 20px`
- Small cards: `--r-card-sm: 12px`

**Motion**
- Blur-in-up on landing hero tokens (`.blur-in` class, staggered by `:nth-child`)
- Staggered card reveal on quiz page transition (`#questions-list.page-enter .question-card:nth-child(N)`)
- Staggered section reveal on result (`#result .X { animation-delay: Y }`)
- All under `prefers-reduced-motion: reduce` → disabled + video hidden

---

## Quiz engine

**30 questions across 15 dimensions (2 per dim) across 5 models:**
- Investment Mindset (IM1 risk, IM2 conviction, IM3 self-awareness)
- Emotional Control (EM1 FOMO resist, EM2 loss, EM3 greed)
- Market Worldview (MW1 bull/bear, MW2 narrative, MW3 philosophy)
- Trading Style (TS1 time, TS2 decision, TS3 execution)
- Social Behavior (SB1 share, SB2 community, SB3 independence)

Each answer is 1/2/3, summed per dimension → level H/M/L.

**Pagination:** 4 questions per page × 8 pages (last page has 2). Auto-advance after 400ms on all-answered. Back button to revisit.

**Scoring = rule-based classifier (NOT pattern matching).** Each persona has a scoring formula like:
```
scores.BUIDL = community*3 + time*3 + (7-narrative)*3 + conviction*2 + (7-risk)*2
```
All persona formulas have identical total weight (13 = 3+3+3+2+2). Highest scorer wins.

Simulated 100K random runs → all 24 personas reachable, max/min distribution ratio ~11x. Full table in `data.js`. Previously verified distribution:
- Smart Money quadrant: 52.7% (11 personas)
- Absolute Gambler: 18.1% (6 personas)
- Diamond Degen: 15.1% (2 personas — MOON, CHEF)
- Rotating Andy: 14.1% (5 personas)

---

## Scatter plot (result screen)

Canvas-rendered plot on black. Risk (x) × Conviction (y), 4 quadrants with subtle color washes.

**Critical UX rule (established after a reported bug):** user dot is plotted at **persona's canonical position** (`state.result.scatter.{risk,conviction}`), NOT at the user's answer-derived position (`state.scatterPos`). Same for share-text numbers. This prevents inconsistencies where the stamp says "SMART MONEY" but the dot sits in the Gambler quadrant.

**Label placement:** label sits above the dot by default, flips below when the dot is within 40px of the plot's top edge (prevents collision with quadrant titles like "SMART MONEY" which sit *outside* the plot frame at `pad - 8`).

**Dim bars:** monochrome white (intentional — reads like editorial data readout, not a rainbow chart).

All 24 personas audited: canonical coords match intended quadrant; stamp class, card glow, and dot color all consistent.

---

## Background video

`assets/video/bg.mp4` (2.5MB, 16s, no audio):
- Pre-baked forward+reverse concatenation via ffmpeg
- Native `<video loop>` handles the ping-pong — no JS reverse-seek (that caused keyframe jumps)
- Visible on landing + quiz, paused + hidden (opacity 0) on result
- 38% opacity + gradient overlay so text stays legible
- Hidden entirely under `prefers-reduced-motion`

To regenerate (source was `K_Video_Generation_Request.mp4` from Veo):
```bash
FFMPEG=/path/to/ffmpeg
$FFMPEG -i source.mp4 -vf reverse -an rev.mp4
printf "file 'source.mp4'\nfile 'rev.mp4'\n" > concat.txt
$FFMPEG -f concat -safe 0 -i concat.txt -c copy -an -movflags +faststart bg.mp4
```

---

## Share

"Post on 𝕏" opens `https://x.com/intent/tweet?text=...` with bilingual (CN+EN) pre-filled text:
- Persona code + CN + EN name
- Intro quote in both languages
- Canonical quadrant label
- Canonical risk/conviction numbers (not user-answer-derived — see scatter rule above)
- Link to https://cbti.club
- `#CBTI #CryptoPersonality`

Copy button fallback writes same text to clipboard.

---

## Local dev

```bash
# Preview (python's http.server, uses .claude/launch.json)
cd crypto-personality-test
python3 -m http.server 8080

# Cache busting — increment the ?v=N on all three script/style refs in index.html
# after each change so Cloudflare + browsers don't serve stale assets
```

**Cache version:** bump `?v=N` in index.html on every `<link>` and `<script>` ref after content changes. Currently `v=14`.

---

## Deploy

```bash
cd crypto-personality-test
npx wrangler pages deploy . --project-name cbti-club --commit-dirty=true
```

Custom domain `cbti.club` is configured on the `cbti-club` Cloudflare Pages project (NOT named after the new private repo). Leave that alone — it wires to https://cbti.club.

---

## Common tasks

**Add a new persona:**
1. Add entry in `data.js` `personas` object (code, cn, en, intro, introEn, pattern, scatter, desc, descEn)
2. Add scoring formula in `app.js` `computeResult` (must total weight=13: 3+3+3+2+2)
3. Add meme image at `assets/personas/{CODE}.jpg`
4. Update distribution simulation if you care about balance
5. Bump cache version, deploy

**Tune scoring:** edit formulas in `app.js` `computeResult`. Run `node -e` simulation in the earlier session's style to verify distribution.

**Edit questions:** `data.js` `questions` array. Each question: `{id, dim, text, en, options: [{label, en, value}]}`. Keep 2 per dimension.

**Typography/color changes:** edit `:root` CSS vars in `style.css` — everything cascades from there.

---

## What NOT to change without thought

- **Persona canonical coordinates** in `data.js` — they're the source of truth for quadrant classification. Moving one can put it in the wrong quadrant (audit with the "all 24 → expected quadrant" check in the session log).
- **Scoring formula weight totals** — keeping them all at 13 prevents any one persona from dominating.
- **Use of `state.result.scatter` (not `state.scatterPos`)** in scatter plot + share text — keeps stamp/dot/tweet consistent.
- **The `<video loop>` + pre-baked bg.mp4** — previous attempts to do JS-driven reverse caused keyframe jumps.
- **Cache version bumps** — Cloudflare caches aggressively; stale assets will burn you.
