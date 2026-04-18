# writings/ — future publishing agent landing spot

This folder is a placeholder for a future Claude Code "publishing agent" that
will manage Chase's article publications as a single source of truth and sync
them across X, Substack, and cbti.club.

## v1 (today)

The `#chase` page on cbti.club seeds the Writing section with two hand-picked
X posts embedded via the X widget. The HTML lives directly in `index.html`.

## v2 (planned) — `writings/index.json`

When the publishing agent ships, drop an `index.json` here with this shape:

```jsonc
{
  "version": 1,
  "items": [
    {
      "id": "2025-04-01-why-eth-is-an-institution",
      "title": "Why ETH is the institution layer",
      "summary": "...",
      "publishedAt": "2025-04-01",
      "tags": ["eth", "tokenomics"],
      "sources": [
        { "type": "x",        "url": "https://x.com/ChaseWang/status/..." },
        { "type": "substack", "url": "https://chasewang2026.substack.com/p/..." }
      ],
      "markdown": "writings/2025-04-01-why-eth-is-an-institution.md"
    }
  ]
}
```

When `index.json` is present, the `#chase` writing block in `index.html`
should be replaced with a small loader that fetches the manifest and renders
entries — X posts as `twitter-tweet` embeds, Substack posts as link cards,
native long-form as in-site readers (similar to `#paper`).

## Item types to support

- `x` — X/Twitter embed via `platform.twitter.com/widgets.js`
- `substack` — Substack post card with cover image + excerpt
- `longform` — on-site article (markdown rendered as HTML, same typography as
  `.paper-article-body`)
- `paper` — academic paper (reuses the `#paper` screen pattern)

## Why a manifest, not RSS

RSS feeds lose control of ordering, excerpts, and cross-platform provenance
(the same essay might live as a Substack post AND an X thread). A manifest
lets the agent express the canonical relationship between source platforms.
