# writings/ — single source of truth for Chase's published essays

This folder is the manifest layer for Chase's writing across X, Substack,
chasewang.me and cbti.club. Two surfaces render from `index.json`, both as static
HTML at build time — **no external widgets, no third-party JS**:

- **chasewang.me/writing** — the complete index, grouped by format (Research,
  Analysis, Essays). The chasewang.me build reads this file from this public
  repository through the GitHub API (daily cron), with a committed fallback copy.
- **cbti.club landing, "作者的写作"** — the latest three items, rendered by
  `scripts/build.mjs` into `_site/index.html` on every deploy.

The old `#read` archive and `#chase` profile moved to chasewang.me; those hash
routes now redirect there (`https://chasewang.me/writing`, `/about`).

The x-auto publishing adapter reads from / writes to this same manifest. Its only
contract is to keep `index.json` valid; nothing in this redesign changed it.

---

## Schema (v1, locked)

```jsonc
{
  "version": 1,
  "items": [
    {
      "id": "kebab-case-slug",          // REQUIRED — stable, used as DOM key
      "publishedAt": "YYYY-MM-DD",      // REQUIRED — ISO date, used for sort
      "datePrecision": "year" | "month", // optional — use when only year/month is verified
      "primaryLang": "en" | "zh",       // REQUIRED — which lang renders on the card
      "kind": "Essay",                  // optional — visible content-type label
                                        //   ("Academic paper", "Field map", "Data study", …)
      "format": "research" | "analysis" | "essay", // optional — hand-maintained entries only

      "tags": ["macro", "stablecoin"],  // optional, for future filtering

      // Per-language fields. Card uses primaryLang; missing langs are skipped.
      "title":     { "en": "...", "zh": "..." },     // REQUIRED in primaryLang
      "subtitle":  { "en": "...", "zh": "..." },     // optional
      "pullQuote": { "en": "...", "zh": "..." },     // optional, italic serif
      "excerpt":   { "en": "...", "zh": "..." },     // REQUIRED in primaryLang

      // Where this article lives in the wild. Order = display order on card.
      "channels": [
        {
          "lang": "en",                              // REQUIRED
          "platform": "substack" | "x" | "longform" | "paper" | "other",
          "url": "https://...",                      // REQUIRED, canonical permalink
          "label": "Read on Substack"                // optional, defaults derived from platform
        }
      ]
    }
  ]
}
```

### Render order

`items[]` are sorted by `publishedAt` desc client-side. The agent does **not**
need to maintain order — write in any order, oldest or newest.

### Validation rules (the agent must enforce)

1. `id` must be unique across all items
2. `id` must match `^[a-z0-9][a-z0-9-]*$`
3. `publishedAt` must parse as ISO date
4. `primaryLang` must be a key present in `title` and `excerpt`
5. Every `channels[].lang` must be a key present in `title`
6. At least one `channels[]` entry is required
7. URLs must be `https://`. The adapter's validator also accepts `#...` (the
   old same-page routes); no entry uses one any more — `#paper` and
   `#essay-three-body` became `https://chasewang.me/paper` and
   `https://chasewang.me/essay-three-body`.

If any item fails validation, the renderer **skips that item silently** and
logs to console. The page does not break.

---

## Loop publishing contract

When x-auto marks an Article `published`, its cbti adapter:

1. Reads the approved `article.md` and visual from the durable Article job.
2. Renders a full static page at `writings/<id>/index.html` and copies the
   visual beside it.
3. Upserts one manifest item with both the owned cbti URL and X permalink.
   Automated entries omit `pullQuote`; a later editorial pass may add one.
4. Validates the whole v1 manifest, then commits and pushes one
   `add writing: <id>` commit. GitHub Actions deploys Cloudflare Pages.
5. Replays safely after failure: an existing page/entry is updated in place,
   never duplicated. A failed mirror stays pending without changing the
   already-public X Article.

The adapter **never** edits the renderer code. Schema changes require a
human-reviewed change to `index.json`, `scripts/build.mjs` / `scripts/lib/`
here, and the chasewang.me build.

### Format (how an item is grouped)

Both sites classify every item the same way, so adapter entries never need a
field they would lose on replay:

1. `format` field, when present (only hand-maintained entries carry one):
   `research`, `analysis` or `essay` (the plurals `analyses` / `essays` are
   accepted too);
2. else tag `x-article` → **analysis** (every adapter entry);
3. else `kind` is Academic paper / Field map / Data study, or a tag contains
   `research` → **research**;
4. else **essay**.

### Deploy-time normalization (the adapter contract is unchanged)

The adapter writes each `writings/<id>/index.html` whole, in its own dark
template, and may rewrite it on any replay. Those repository files are left
exactly as the adapter wrote them. At deploy time `scripts/build.mjs` copies the
site into `_site/` and runs `scripts/lib/normalize.mjs` on the **copy** of every
`writings/*/index.html`:

- it reads the adapter's known page shape (title, canonical, og tags, date,
  `<article class="article">` body, X link) and rebuilds the page in the shared
  Chase Wang reading template (cw-system), with the body carried over
  byte-for-byte;
- canonical and og tags are kept; `lang="zh"` becomes `zh-Hans`; the meta
  description is cleaned (whitespace, length) and also shown as the article's
  dek under the title; Google Fonts are dropped; the `/#chase` links become
  `https://chasewang.me/writing`; Article JSON-LD is added with the author
  `https://chasewang.me/#person`;
- a page is recognised as already normalized only by the marker on its own
  `<html>` tag (`data-cw-normalized="1"`), so normalizing twice equals once;
- a page whose structure is not recognised is published unchanged, the build
  prints a warning and still deploys.

`node scripts/test-normalize.mjs` checks the normalizer against a fixture built
from the adapter's template and against the real pages here. Nothing about the
page path, the manifest fields, the `add writing: <id>` commit, or pushing to
`main` changed.

---

## Adding a non-loop entry by hand

1. Pick a slug: `kebab-case`, derived from the title. Stable forever.
2. Open the canonical version (Substack if you wrote it long-form, X if it was
   thread-only).
3. Copy a representative pull-quote (the line you'd put on a billboard).
4. Write a 2–4 sentence excerpt in the primary language (and optionally a
   translation).
5. Add a `channels[]` entry per platform where the post lives.
6. `git add writings/index.json && git commit -m "add writing: <id>"`. Auto-deploy
   handles the rest.

---

## Why a manifest, not RSS or live embeds

- **RSS** loses cross-language provenance — the same essay as a Substack post
  AND an X thread are two separate RSS items, but conceptually one article.
- **Live X embeds** (`platform.twitter.com/widgets.js`) fail in mainland China,
  inside ad-blockers, and increasingly demand sign-in. cbti.club has a large CN
  audience; live embeds were the v0 implementation and were unusable for them.
- **A flat JSON manifest** is the smallest thing that works everywhere, gives
  Chase full editorial control over how each piece is presented, and gives the
  adapter an unambiguous machine-writable target.
