# CBTI — Crypto Behavioral Type Indicator

Bilingual (CN + EN) crypto personality test at **https://cbti.club** — "CBTI — by Chase Wang".
30 paginated questions → one of 24 crypto archetypes → shareable result.

---

## Project state (session handoff)

**Live:** https://cbti.club (Cloudflare Pages project `cbti-club`, custom domain)
**Repos:** see `.github/DEPLOY.md` — `github.com/ckpxgfnksd-max/cbti-club` (public) runs the deploy
workflow; `cbti.club` is described there as the legacy mirror.
**Owner X:** [@ChaseWang](https://x.com/ChaseWang)
**Tip address:** EVM `0x98338f4ade9d2c2aa9310300f6a016a88538242d`

### Open decisions from earlier sessions
1. **Remote cleanup** — which of the two GitHub repos to keep (see `.github/DEPLOY.md`).
2. **gstack upgrade available** — 0.5.3 → 1.1.0.0. Not blocking.

---

## Architecture

Static site, no framework, no npm dependencies. The deploy uploads `_site/`, built by
`scripts/build.mjs`; nothing else in the repository is public.

```
index.html              # one page, 3 screens (landing / quiz / result); hash router in app.js
app.js                  # quiz engine + scoring + result render + SVG type map + share
data.js                 # 15 dimensions, 30 questions, 24 personas (canonical coords), axis weights
404.html                # real 404 (Pages no longer falls back to the home page)
landscape.html          # template: the AI Workflow field map, wrapped at build time
research/crypto-crime-timeline/index.html   # template: the report; data files beside it
writings/               # manifest + pages written by the x-auto adapter (see writings/README.md)
assets/cw/, assets/fonts/   # cw-system, shared with chasewang.me — byte copies, never edit here
assets/cbti/            # product layer (cbti.css), landscape.css, report.css, og.png
assets/personas/        # 24 meme images, one per persona code
scripts/build.mjs       # allowlist copy → _site/, normalize writings, sitemap/robots/_headers, checks
scripts/lib/            # reading chrome + manifest helpers (site.mjs), adapter normalizer (normalize.mjs)
scripts/test-normalize.mjs  # normalizer tests (fixtures rendered by the adapter itself + real pages)
scripts/serve.mjs       # local Pages-like server (clean URLs, _headers, 404)
```

### Screens and routes
`showScreen(id, anchor)` in `app.js` toggles `.active` on the `.screen` divs and sets
`body.screen-<id>`. The router handles `#landing` (default) and the landing sections `#types`,
`#method`, `#writing`. Old routes (`#read`, `#chase`, `#paper`, `#essay-three-body`, `#chase-*`)
redirect to chasewang.me with `location.replace`; the table is `window.CBTI_LEGACY` in
`index.html` (runs before first paint). `#node` still falls back to the landing. Quiz and result
have no URL. The build links a manifest `#` channel with the same table (`LEGACY_HASH_ROUTES` in
`scripts/lib/site.mjs`; `test-normalize.mjs` fails if the two differ) and drops any other hash with a warning.

---

## Design system

cw-system (shared with chasewang.me) + the CBTI product layer. See `DESIGN.md`. In short: paper,
ink, IKB as the one accent; Inter + JetBrains Mono self-hosted; Chinese in system fonts; the
precise index as the one design move; quadrant colours only as data marks.

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
All persona formulas have identical total weight (13 = 3+3+3+2+2). Highest scorer wins; ties go to
the first persona in `data.js` key order (so that order is part of the scoring contract). IM3 is
measured and shown but no formula uses it.

**Golden harness:** the run's `R-audit/scoring/harness.mjs <checkout> --compare golden.json` loads
`data.js` + `app.js` unchanged and must report MATCH (458 vectors, share-text hashes included).

---

## Type map (landing and result)

One SVG renderer (`TypeMap` in `app.js`) draws all 24 personas at their canonical
risk (x) × conviction (y) coordinates, coloured by quadrant; labels are placed greedily so they do
not collide. On the result the user's persona is ringed and labelled.

**Critical UX rule (established after a reported bug):** the result dot is the persona's
**canonical position** (`state.result.scatter`), NOT the answer-derived position
(`state.scatterPos`). This keeps the stamp, the map and the identity consistent. The user's own
answers are in the dimension bars.

---

## Share

"Post on 𝕏" opens `https://x.com/intent/tweet?text=...` with `getShareText()`:
- `CODE · 中文名 / English name`
- the intro quote in Chinese and in English
- `cbti.club  #CBTI`

"Copy / 复制" writes the same text to the clipboard. No result URL, no share image.

---

## Local dev

```bash
node scripts/serve.mjs --build        # build _site/ and serve it at http://127.0.0.1:8811
node scripts/test-normalize.mjs       # normalizer tests
```

---

## Deploy

Push to `main` → `.github/workflows/deploy.yml`: fixture tests → `node scripts/build.mjs` →
`wrangler pages deploy _site --project-name=cbti-club --branch=main`. Custom domain `cbti.club`
is configured on the `cbti-club` Pages project. Leave that alone.

---

## Common tasks

**Add a new persona:**
1. Add entry in `data.js` `personas` object (code, cn, en, intro, introEn, pattern, scatter, desc, descEn) — at the end, so existing tie-breaks keep their order
2. Add scoring formula in `app.js` `computeResult` (must total weight=13: 3+3+3+2+2)
3. Add meme image at `assets/personas/{CODE}.jpg`
4. Regenerate the golden on purpose and review the diff

**Edit questions:** `data.js` `questions` array. Each question: `{id, dim, text, en, options: [{label, en, value}]}`. Keep 2 per dimension.

**Styles:** product layer in `assets/cbti/cbti.css`. Never edit `assets/cw/**` or `assets/fonts/**`
here; change them in the chasewang.me repo and copy.

---

## What NOT to change without thought

- **Persona canonical coordinates** in `data.js` — they're the source of truth for quadrant classification.
- **Persona key order** in `data.js` — ties are broken by it.
- **Scoring formula weight totals** — keeping them all at 13 prevents any one persona from dominating.
- **Use of `state.result.scatter` (not `state.scatterPos`)** in the map and quadrant stamp.
- **`writings/<id>/index.html` and the adapter-owned manifest entries** — the x-auto adapter owns them; style changes belong in `scripts/lib/normalize.mjs`.
