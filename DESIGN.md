# CBTI Design System

CBTI is one behavioral instrument with several modes: test, result dossier, public research, and long-form reading. Every route belongs to the same world.

The center of gravity is the risk × conviction field. The homepage exposes all 24 personas on that field; the quiz measures behavior; the result places the user back on the same map. Chase, papers, and tools are evidence that the instrument is part of a larger practice, not unrelated microsites.

## Product modes

- **Experience:** landing, quiz, and result. Task completion and state are primary.
- **Read:** the complete archive, papers, essays, landscape, articles, and research. Retrieval and argument are primary.
The modes change density and composition, not brand language.

## Visual signature

The site uses warm daylight canvas, drafting blue fields, lime verification marks, carbon operational fields, square rules, and measurable data. Avoid glass, ambient blur, decorative glow, pill-heavy controls, faux dashboards, and dark-cinematic section resets.

Quadrant colors are semantic and appear only for classification:

| Quadrant | Color | Token |
|---|---:|---|
| Smart Money | `#008c58` | `--site-smart` |
| Diamond Degen | `#7f3eb5` | `--site-diamond` |
| Rotating Andy | `#a06b00` | `--site-rotating` |
| Gambler | `#c72d49` | `--site-gambler` |

## Core tokens

| Role | Value | Token |
|---|---:|---|
| Canvas | `#f2f0e8` | `--site-canvas` |
| Paper | `#fbfaf5` | `--site-paper` |
| Ink | `#11131a` | `--site-ink` |
| Drafting blue | `#2347ff` | `--site-blue` |
| Deep blue | `#1732bb` | `--site-blue-deep` |
| Verification lime | `#dfff42` | `--site-lime` |
| Carbon | `#171922` | `--site-carbon` |

Typography:

- `Archivo Black` carries identity, section statements, and large numeric signals.
- `Barlow` carries interface copy and controls.
- `Noto Serif SC` / `Instrument Serif` carry sustained reading.
- `JetBrains Mono` is reserved for measurements, type codes, dates, and system status.

System fallbacks preserve hierarchy when the font CDN is unavailable.

## Layout and controls

- A persistent global header makes CBTI, Read, and Chase one product. `Read` always opens the complete archive; it never drops a visitor into an arbitrary single article.
- The archive is a flat editorial index rather than a grid of competing cards. Every row has one primary reading route, optional alternate channels, a visible content type, language, date, and tags.
- Chase contains a three-item latest-writing preview. The old duplicate paper cards, embedded PDF, and essay grid stay outside the rendered experience.
- Fields use square corners or a restrained 2–4px radius. Shadows are unnecessary when rules and color fields establish hierarchy.
- Standalone controls are at least 44px tall. Primary actions use blue; verified or highlighted actions use lime.
- Focus uses a 3px blue outline with visible offset.
- Inline links remain text links; navigation and decisions may use framed controls.
- Long-form pages target roughly 65–75 characters per line and allow tables or figures to widen beyond the reading column.

## Motion

Motion explains state only. Screen transitions are short and finite; progress and selection changes are direct. `prefers-reduced-motion` removes authored animation and smooth scrolling without hiding information.

## Responsive contract

- Desktop: the landing proposition and 24-type atlas share the first screen; Chase pairs identity with its linked field map.
- Tablet: complex two-column experiences stack while keeping the task or argument first.
- Mobile: navigation stays reachable, tap targets remain at least 44px, archive filters become a two-by-two control, reading rows recompose into one scanning column, and long strings wrap without horizontal page scroll.
- The paper remains available as HTML and PDF from the archive. An embedded PDF is intentionally absent from the main discovery path.

## Verification

Before shipping:

1. Run `audit_web.py` against the project and resolve every error.
2. Test landing → all 30 questions → result, including disabled and selected states.
3. Open Read, exercise every filter, follow an owned article route, open an internal paper, and return to the complete archive.
4. Capture desktop 1440×900 and mobile 390×844 whole-page screenshots.
5. Confirm no page-level horizontal overflow, broken assets, or unexpected console errors.
6. Test keyboard focus, `prefers-reduced-motion`, and article-manifest loading.
