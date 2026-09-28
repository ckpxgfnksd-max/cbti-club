# EVALS — cbti.club redesign (run 20260928-sites-redesign, unit B2)

Not deployed (`docs/` is outside the build allowlist). Screenshots are in the run directory:
`workers/B2/shots/{r1,r2,final,blockcn}/` (`/Users/chasewang/.agent-context/contexts/task_runs/20260928-sites-redesign/`).
"Before" is the R-audit set in `workers/R-audit/before/`.

## Rubric (DESIGN_BRIEF §4) — 1 to 5 per item

| # | Item | What 5 means here |
|---|---|---|
| R1 | Identity and taxonomy at a glance | A visitor can tell in one screen: this is CBTI, a crypto personality test, made by Chase Wang; author pages read as Chase's publications with the right format label |
| R2 | Restraint | One accent (IKB), quadrant colours only as data marks, no glow/gradient/glass, one design move (the precise index) |
| R3 | Chinese/English typography | System CJK fonts, 1.8 line height, 40em measure, mono only for metadata, no faux italics in Chinese |
| R4 | Cross-site consistency + product personality | Same tokens and components as chasewang.me; CBTI still recognisable through its wordmark, map and quadrant layer |
| R5 | Mobile | 390 px: nothing clipped, no horizontal scroll, controls ≥44 px, sensible length |
| R6 | Accessibility | AA text contrast, visible keyboard focus, focus moved on screen changes, state not by colour alone, landmarks |
| R7 | Truthfulness | No new facts; method text states code facts only; labels match what the page does |
| R8 | Performance and mainland reachability | No third-party request; no dead weight; fonts self-hosted and cached |

## Personas

- **P1** crypto fund partner, reads English, judges research credibility.
- **P2** Chinese reader arriving on a phone from an X Article link (a `writings/<id>/` page).
- **P3** AI engineer looking for open-source skills.
- **P4** Chinese CBTI user who just finished the test and wants to know who made it.

## Round 0 — before (R-audit screenshots)

| Surface | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Landing | 2 | 2 | 2 | 1 | 3 | 3 | 3 | 1 | CBTI and a second Chase homepage in one app; lime + blue fields + dark band; "live index" on a static grid; 2.5 MB hidden video still downloaded; Google Fonts render-blocking |
| Quiz | 3 | 2 | 2 | 1 | 3 | 3 | 4 | 1 | Dark rail with 90 px Archivo headline; English lines in faux-italic serif |
| Result | 3 | 2 | 2 | 1 | 2 | 3 | 4 | 2 | `WAGMI` clipped at 390 px; neon scatter + card quadrant colours = two palettes on one screen |
| Writing (`/writings/agent/`) | 2 | 2 | 2 | 1 | 3 | 3 | 3 | 1 | Black + purple glow; no site header; "Deep research" vs "Research" labels; Noto Serif SC webfont (459–687 KB per weight) |

## Round 1 — first full build (`shots/r1/`)

| Surface | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 |
|---|---|---|---|---|---|---|---|---|
| Landing | 4 | 4 | 3 | 4 | 3 | 4 | 4 | 5 |
| Quiz | 4 | 4 | 3 | 4 | 4 | 4 | 5 | 5 |
| Result | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 5 |
| Writing (`arc`, `crypto-k`) | 4 | 5 | 3 | 5 | 4 | 4 | 5 | 5 |

Findings (each checked on the screenshot or with a probe, not by reading code):

1. **R2/R4 landing** — the quadrant legend under the map repeated names already printed around the map. → Removed the legend; the count now sits in each quadrant label inside the SVG.
2. **R5 landing** — the 24-type catalog made the landing 10,597 px tall at 390. → Quadrant groups are `<details>`, open on wide screens, closed on phones with every code listed in the summary: 6,168 px.
3. **R3 all zh pages** — `getComputedStyle` showed `<time>`, `<a>`, `<span>` inside mono metadata (row dates, kicker, rail) switching to the sans face. Cause: cw.css base rule `:where(:lang(zh)) { font-family: var(--font-sans-zh) }` matches every descendant. → Scoped workaround in `assets/cbti/cbti.css` and `assets/cbti/reading.css`; reported to the cw-system owner with the proper fix (scope the rule to `[lang|="zh"]`).
4. **R7 copy** — types note said "右侧数字" (on phones the numbers sit below) and the result map note said "灰点" (they are pale quadrant colours). → Position-free wording; "浅色点".
5. **R5 result** — other personas' labels on the phone map were 9 px. → 10 px minimum.
6. **R6/R7 writing** — test run found the adapter's own meta description is escaped twice (`&amp;quot;`); the fallback path would have shown entities. → Fallback unescapes twice and removes the space before punctuation left by tag stripping (the manifest excerpt is still the first choice).

## Round 2 — persona pass (`shots/r2/`)

| Surface | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 |
|---|---|---|---|---|---|---|---|---|
| Landing | 4 | 5 | 4 | 5 | 4 | 4 | 5 | 5 |
| Quiz | 4 | 5 | 4 | 5 | 4 | 5 | 5 | 5 |
| Result | 5 | 5 | 4 | 5 | 5 | 5 | 5 | 5 |
| Writing | 5 | 5 | 4 | 5 | 4 | 5 | 5 | 5 |

1. **P1, R1 landing** — the method section, the product's credibility argument, was Chinese only. → Every method fact now has an English line (muted, smaller), the same pattern the questions and results already use; "作者的写作" also carries "Writing".
2. **P1/P2, report** — on `/research/crypto-crime-timeline/` the timeline and the 4-column tables were squeezed into the 40em text measure (680 px), avatars overlapping. → The report body spans the rest of the grid (timeline 924 px at 1440); paragraphs keep the 40em measure.
3. **P4, sharing** — the old social card (`og-image.jpg`) was a dark card with a third-party character, off-system. → New `assets/cbti/og.png` rendered from the real type map (`scripts/brand/render_og.py`); the old file stays served for old links but is no longer referenced.
4. **R4** — cw-system moved v1 → v4 during the build (24 px section titles, `.cw-tag`, link colour rule, `text-wrap: pretty`). Re-synced byte for byte; re-checked every page.
5. **Tablet** — at 1024 the hero stacked and pushed the map and the start button below the fold. → The two-column hero now holds down to 896 px (checked at 1024 and 768, no overflow).

## Round 3 — final (`shots/final/`, `shots/blockcn/`)

| Surface | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 |
|---|---|---|---|---|---|---|---|---|
| Landing | 5 | 5 | 4 | 5 | 4 | 5 | 5 | 5 |
| Quiz | 4 | 5 | 4 | 5 | 5 | 5 | 5 | 5 |
| Result | 5 | 5 | 4 | 5 | 5 | 5 | 5 | 4 |
| Writing | 5 | 5 | 4 | 5 | 5 | 5 | 5 | 5 |

Claims ledger pass (every method sentence checked against `data.js` / `app.js` by script):

- **R7 method** — "每题 3 个选项，依次记 1、2、3 分" was false for 4 of 30 questions, whose options run 3-2-1. → "每个选项记 1、2 或 3 分" (English line likewise). Verified by script: 30 questions, 2 per dimension; 24 formulas, each weighted 3-3-3-2-2; 14 dimensions feed the formulas (IM3 is measured and shown only); no storage, fetch, beacon or socket calls in `app.js`, `data.js` or `index.html`.

Persona read-through:

- **P1** lands on the map, reads the method in English, follows "源代码 ↗" to `computeResult()`; the field map and the crime report carry the Chase Wang header and Article metadata.
- **P2** gets the Chinese interface on `/writings/<id>/` (写作 · 作品 · 关于, 分析 · X 长文 · date), Chinese line height and measure, one tap to the X thread, "全部写作 →" to chasewang.me/writing. No Google Fonts: nothing to hang on in mainland networks.
- **P3** reaches chasewang.me/work from "by Chase Wang ↗" or any author page's 作品/Work; the landing's source link points at the public repo.
- **P4** sees "by Chase Wang ↗" in the header of the result, "built by Chase Wang ↗" under it, and the landing strip with the three latest pieces and "关于 Chase Wang ↗".

Why not 5 everywhere (known limits, not fixed in this unit):

- **R3** — the base zh font rule in cw.css (finding 3) is worked around here, not fixed at the source; `text-autospace` puts a visible gap before ASCII "..." in some question texts; synthesised italics for English `<em>` (only Inter normal is loaded).
- **R1 quiz** — the product nav stays in Chinese only (测试 · 类型 · 方法), per the brief.
- **R8 result** — "Post on 𝕏" opens x.com, unreachable in mainland China; "Copy / 复制" is the working fallback. Persona images (1.5 MB set, one loaded per result) are unchanged.
- **R5 report** — the timeline's "全景 · 74" view is dense on phones; the per-period buttons are the readable view (behaviour unchanged from before).

## Checks behind the scores (final run)

| Check | Result |
|---|---|
| Golden harness `--compare golden.json` | MATCH, byte-identical, exit 0 |
| `scripts/test-normalize.mjs` | all checks pass (fixtures from the adapter's own renderer + 4 real pages); seeded faults caught: body change, Google Fonts, missing marker, `/#chase` link, canonical rewrite, JSON-LD author |
| Quiz click-through, desktop + mobile | 30 answers, 8 pages, result WAGMI (all 2) and PAPER (all 1); share text equal to the pre-redesign run; clipboard copy verified; code fully visible at 390 (70.8 px, scrollWidth = clientWidth) |
| Horizontal overflow | none at 1440, 1024, 768, 390 on every page; none on any quiz page |
| Console | no errors (the 404 page logs its own 404 status) |
| `--block-cn` pass | 0 blocked requests on every page: the site makes no third-party request |
| Keyboard | skip link, nav, start, quiz options (Enter selects), writing page: IKB 2 px outline, 3 px offset |
| audit_web.py on `_site/` | 0 ERROR, 0 WARN, 0 REVIEW |

## Contrast (computed from token values, WCAG 2.x)

| Pair | Ratio | Use |
|---|---:|---|
| ink `#0a0a0a` / paper `#fafaf8` | 18.94 | body, titles |
| gray-700 `#3d3d3b` / paper | 10.42 | secondary text |
| gray-700 / raised `#f0f0ee` | 9.54 | secondary text on the executive-summary box |
| gray-500 `#737373` / paper | 4.54 | one-line metadata, map labels (never on raised) |
| IKB `#002fa7` / paper | 10.23 | links, current nav, focus ring |
| paper / IKB | 10.23 | primary button text |
| Smart Money `#008c58` / paper | 4.11 | marks only (non-text ≥ 3:1) |
| Diamond Degen `#7f3eb5` / paper | 6.17 | marks only |
| Rotating Andy `#a06b00` / paper | 4.37 | marks only |
| Absolute Gambler `#c72d49` / paper | 5.15 | marks only |
| Smart Money / raised | 3.76 | lowest quadrant pair, still ≥ 3:1 |
| BTC line `#e0561f` / paper | 3.64 | report chart line (was `#ff6b35`, 2.71) |

## Fix round after review r1 (lead FIX_LIST B-1…B-8)

Evidence: `workers/B2/checks/fix-r1/` and `workers/B2/shots/fix-r1/` in the run directory.

| Item | Change | Proof |
|---|---|---|
| B-1 classify | `format` is looked up in an explicit alias table (research, analysis/analyses, essay/essays); nothing strips a trailing "s" any more | new tests: `analysis`, `Analysis`, `analyses` → analysis, and an explicit analysis item reaches the kicker as 分析; reverting to the old code fails 4 checks |
| B-2 dek | normalized articles show the cleaned manifest excerpt (escaped, ≤160 characters, cut at a sentence end) as `.cw-article-dek` under the title; the crime report shows its own og:description the same way | test asserts the dek inside the article head on fixtures and the 4 real pages; removing it fails 10 checks; screenshots `shots/fix-r1/writing-*`. The adapter's excerpt is the article's first paragraph, so the dek repeats the opening sentence of the body |
| B-3 auto-advance | one pending timer, kept in `autoAdvanceTimer`, cleared by `nextPage`, `prevPage`, `startTest` and `showScreen`; the timer also checks it is still on the page it was set for | `backcheck.py`: answer the last question, press Back 4 ms later, wait 900 ms → still page 1/8, answers kept (desktop + mobile PASS). The same check on a seeded pre-fix build ends on 2/8 (FAIL). Golden harness still MATCH |
| B-4 build URLs | malformed percent-encoding in an href or url() is a warning, not a crash; a manifest channel whose URL does not parse is dropped from the row with a warning | seeded `/a%zz` link and an `https://exa mple.com` channel: build exit 0 with two warnings |
| B-5 clipboard | one `writeClipboard()` for both copy buttons; missing API and refusal both show "复制失败" on the button and in the status region | Playwright with `navigator.clipboard` removed and with `writeText` rejecting: feedback shown, 0 page errors |
| B-6 marker | `isNormalized()` reads the marker only from the document's own `<html>` start tag | test: marker text inside the body no longer skips normalization; reverting fails the test |
| B-7 deploy | the commit message is no longer interpolated into the wrangler command (wrangler reads it from the checked-out commit with `git show`, no shell); the deploy step runs only on `refs/heads/main` | YAML parses; wrangler 4.98 source checked for the git fallback |
| B-8 cw-system v5 | shared files re-copied (`cw.css` changed); the local zh-mono workarounds are gone, `assets/cbti/reading.css` deleted; one rule stays for a product container: `.cbti-q-meta [lang] { font-family: inherit; }` | computed font-family with the workarounds removed: kicker `time`/`a`, rail `dt`, footer base, landing row dates and quiz meta all JetBrains Mono on zh pages; `check-shared --frozen` identical |

Also in this round (same risk class as the chasewang.me items C5–C7, cheap): `--out` may not be the repository or above it (the directory is deleted first), a symlink under a published path fails the build, and the author-strip sort compares code points instead of `localeCompare`.

Gates after the fix round: golden MATCH (byte-identical); test-normalize 255/255 (159/159 fixtures-only); two builds identical (81 files, `diff -r` clean); audit_web 0/0/0 on `_site`; URL inventory 0 non-asset misses (the same 4 deliberately removed assets); 15 hash routes as before; quiz click-through WAGMI and PAPER on desktop and mobile, share text equal to the pre-redesign run; block-cn 0 requests, no overflow, no console errors except the 404 page's own status; contrast unchanged (lowest text pair 4.54, lowest mark 3.64); placeholder grep 0.
