# CBTI Design System

CBTI is a product site: **CBTI — by Chase Wang**. It runs on **cw-system**, the design system it
shares with chasewang.me, plus one product layer. Chase's profile, writing archive and long-form
pages live on chasewang.me; cbti.club keeps the test and hosts a few of Chase's publications
(writings, the field map, the crime-timeline report) in the shared Chase Wang reading template.

## Layers

| Layer | Files | Owner |
|---|---|---|
| cw-system (tokens, base, components, reading template, fonts, icons) | `assets/cw/**`, `assets/fonts/**` | chasewang.me repo; copied here byte for byte, never edited here (`node ../chasewang-me/scripts/check-shared.mjs . --frozen <CW_SYSTEM_FROZEN.json>`) |
| Product layer | `assets/cbti/cbti.css` | this repo |
| Author pages | `assets/cbti/landscape.css` (byte copy of chasewang.me `assets/site/landscape.css`), `assets/cbti/report.css` | this repo |

Reference for tokens and markup: chasewang.me `docs/CW_SYSTEM.md` and `docs/cw-specimen.html`.

## Visual rules

- Paper `#fafaf8`, ink `#0a0a0a`, one accent: IKB `#002FA7` for links, current state, focus and the
  primary button. Inter (self-hosted, latin) for type, JetBrains Mono for metadata only (dates,
  counts, type codes, coordinates), system fonts for Chinese. No third-party fonts or scripts.
- The single design move is the precise index: hairline-separated rows, a mono metadata column,
  titles first. Writing rows, the 24 types and the method facts all use it.
- Square corners, hairlines, no shadows, gradients, glow or glass. Motion only for state.

## Quadrant palette (product data layer)

Quadrant colours are semantic and mark classification only: map dots, swatches, the result's top
rule. They never colour text — two of them are below AA for text on paper.

| Quadrant | Colour | Token | On paper |
|---|---:|---|---:|
| Smart Money · 聪明钱 | `#008c58` | `--q-smart` | 4.11:1 (marks only) |
| Diamond Degen · 钻石赌狗 | `#7f3eb5` | `--q-diamond` | 6.17:1 |
| Rotating Andy · 旋转安迪 | `#a06b00` | `--q-rotating` | 4.37:1 (marks only) |
| Absolute Gambler · 纯赌怪 | `#c72d49` | `--q-gambler` | 5.15:1 |

All four pass the 3:1 non-text threshold (lowest: Smart Money on `--surface-raised`, 3.76:1). The
quadrant of a result is always taken from the persona's canonical coordinates in `data.js`, the
same rule for the result stamp, both maps and the types index.

## Screens and routes

- `/#landing` (default): proposition, test facts, start, the 24-type map (SVG, canonical
  coordinates), the types index (`#types`), the method (`#method`, code facts only), and the author
  strip (`#writing`, latest three manifest items, rendered at build time).
- Quiz and result have no URL (as before). Flow, scoring and share text are pinned by the golden
  harness; the result map plots the persona's canonical position.
- Old routes `#read`, `#chase`, `#paper`, `#essay-three-body`, `#chase-*` redirect to chasewang.me
  (table in `index.html`, `window.CBTI_LEGACY`). `#node` still falls back to the landing.

## Build and verification

`node scripts/build.mjs` writes `_site/` (the only deployed directory). Before shipping:

1. `node <run>/R-audit/scoring/harness.mjs . --compare golden.json` → MATCH.
2. `node scripts/test-normalize.mjs` → all checks pass.
3. Build twice → same tree hash; `audit_web.py` → no ERROR.
4. Desktop 1440 and mobile 390 screenshots of landing, quiz, result, a writing page, `/landscape`
   and `/research/crypto-crime-timeline/`; no horizontal overflow, no console errors, visible focus.
