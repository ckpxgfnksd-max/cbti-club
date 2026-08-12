# CBTI Design System

CBTI contains two intentionally different visual surfaces:

- The quiz, result, paper reader, and ETH node screens retain the original dark cinematic system.
- `#chase` is a daylight public-research instrument. Its job is to connect Chase's writing, tools, and running systems without looking like a generic dark portfolio.

Do not make one surface inherit the other's visual language. Shared routing, content, and accessibility behavior remain global; visual tokens for the profile stay scoped under `#chase`.

## Chase profile direction

The page owns one idea: behavior becomes markets, code becomes institutions, and workflows compound. The first viewport proves that relationship with a linked field map rather than repeating the thesis as decorative copy.

The visual world uses a cool drafting surface, decisive blue fields, lime verification marks, square rules, and dense evidence. It deliberately avoids the prior combination of black background, neon glow, glass cards, italic display serif, tracked section numbers, and card grids.

## Tokens

| Role | Token | Value | Use |
|---|---|---:|---|
| Canvas | `--chase-canvas` | `#e9ebe5` | Page and quiet reading regions |
| Paper | `--chase-paper` | `#f8f9f4` | Document and neutral project surfaces |
| Ink | `--chase-ink` | `#15171b` | Primary text and controls |
| Drafting blue | `--chase-blue` | `#143fe5` | Linked ideas, primary fields, focus |
| Deep blue | `--chase-blue-deep` | `#0d2aa8` | Blue text on light surfaces |
| Verification lime | `--chase-lime` | `#dfff3f` | Confirmation, active contrast, authored highlights |
| Carbon | `--chase-carbon` | `#171a22` | Running systems and closing fields |
| Rule | `--chase-line` | `rgba(21,23,27,.22)` | Section and list boundaries |

Typography:

- `Archivo Black` is reserved for identity, section statements, and project names; a 900-weight system fallback preserves hierarchy when the font CDN is unavailable.
- `Barlow` carries body copy and controls.
- `JetBrains Mono` is limited to metadata, measurements, repository paths, and field-map notation.
- Chinese copy uses the existing Noto Sans/Serif SC fallbacks according to reading context.

## Layout and surfaces

- The profile uses square fields and rules. Do not introduce glass, soft shadows, decorative blur, or rounded content cards.
- Section spacing follows a 4px base rhythm, with tighter spacing inside a content group and materially larger spacing between sections.
- Writing renders as proof: the paper preview sits beside its argument on wide screens and disappears on narrow mobile screens where inline PDF rendering is unreliable.
- Essays are an asymmetric index, not an equal-card grid.
- Tool projects use full-width case-study fields. Running projects use two decisive color fields.

## Interaction states

- Every standalone control is at least 44px tall.
- Keyboard focus uses a 3px drafting-blue outline with a 4px offset.
- Light controls invert to blue or lime on hover; controls on blue/carbon surfaces preserve AA contrast.
- Inline text links use underline or rule changes and are not styled as pills.
- The three field-map nodes are real links, not decorative labels.

## Motion

The field map owns the page's only authored motion: one finite scan and one finite core reveal. Content is visible before motion. `prefers-reduced-motion` removes both animations without removing hierarchy or state.

## Responsive contract

- Desktop: identity and field map share the first viewport; evidence remains directly below.
- Tablet: the hero stacks and the map becomes a full-width demonstration.
- Mobile: name, thesis, positioning, and both actions remain visible before the map; no content relies on hover; all long strings wrap without horizontal scroll.

## Verification

Before shipping changes to `#chase`:

1. Capture desktop and 390px mobile screenshots of the hero, writing, tools, and systems sections.
2. Confirm the name and positioning are visible on a direct `/#chase` load.
3. Check zero horizontal overflow and no console errors.
4. Walk the page with keyboard focus and verify 44px standalone targets.
5. Check `prefers-reduced-motion`, article manifest loading, internal hash routes, and the theme-color switch.
6. Scan changed files for glass/blur decoration, card grids, section numbers, emoji icons, hard-coded colors outside the scoped token system, and `outline: none`.
