# writings/ — single source of truth for Chase's published essays

This folder is the manifest layer for Chase's writing across X, Substack, and
cbti.club. The `#chase` page on cbti.club renders cards directly from
`index.json` — **no external widgets, no third-party JS**. Works in mainland
China, behind ad-blockers, and inside browsers that block X embeds.

A future Claude Code "publishing agent" reads from / writes to this same
manifest. The site code does not need to change when the agent ships — the
agent's only contract is to keep `index.json` valid.

---

## Schema (v1, locked)

```jsonc
{
  "version": 1,
  "items": [
    {
      "id": "kebab-case-slug",          // REQUIRED — stable, used as DOM key
      "publishedAt": "YYYY-MM-DD",      // REQUIRED — ISO date, used for sort
      "primaryLang": "en" | "zh",       // REQUIRED — which lang renders on the card

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
7. URLs must be `https://`

If any item fails validation, the renderer **skips that item silently** and
logs to console. The page does not break.

---

## Agent contract

The publishing agent (planned) is a Claude Code skill that:

1. **Detects new posts** via inputs Chase provides — typically just an X post URL
   or a Substack URL. The agent does not need to poll feeds in v1.
2. **Pulls content** — extracts title / excerpt / pull-quote (Claude can read
   the page via `WebFetch`).
3. **Generates the manifest entry** — fills the schema above, asks Chase to
   confirm the pull-quote pick (the most editorial choice).
4. **Cross-language matching** — if Chase indicates "this is the EN version of
   item `<id>`", the agent appends a new `channels[]` entry to the existing
   item rather than creating a new one.
5. **Commits and pushes** — single commit per article: `add writing: <id>`.

The agent **never** edits the renderer code. Schema changes require a
human-reviewed PR to both `index.json` and the renderer in `app.js`.

---

## Adding an entry by hand (until the agent ships)

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
  future agent an unambiguous machine-writable target.
