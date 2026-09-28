#!/usr/bin/env node
// Tests for the deploy-time normalizer (scripts/lib/normalize.mjs). Zero dependencies.
//
//   node scripts/test-normalize.mjs                 fixtures + every real writings/*/index.html
//   node scripts/test-normalize.mjs --fixtures-only fixtures only (CI: a future adapter template change
//                                                   must not block a deploy; the build publishes an
//                                                   unrecognised page unchanged and warns)
//
// scripts/fixtures/adapter-{zh,en}.html were rendered by the x-auto adapter's own markdown_to_html()
// and render_page() (X-auto-loop cbti_publish.py @ 40f453a) from Markdown that uses every element the
// adapter can emit: p strong em del a pre/code table figure/figcaption h2–h4 hr blockquote ul/ol.

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MARK, cleanDescription, isNormalized, normalizeWritingPage, parseAdapterPage } from './lib/normalize.mjs';
import { classify, esc, parseManifest, unesc } from './lib/site.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURES = path.join(ROOT, 'scripts', 'fixtures');
const fixturesOnly = process.argv.includes('--fixtures-only');

let passed = 0;
const failures = [];
function check(name, ok, detail = '') {
  if (ok) passed += 1;
  else failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
}

function assertNormalized(name, html, item) {
  const p = parseAdapterPage(html);
  const r = normalizeWritingPage(html, { item });
  check(`${name}: recognised`, r.status === 'normalized', r.warnings.join('; '));
  if (r.status !== 'normalized') return;
  const out = r.html;
  const L = p.lang === 'zh' ? 'zh-Hans' : 'en';
  const attr = (re) => { const m = out.match(re); return m ? m[1] : null; };

  check(`${name}: reading template`, [
    '<article class="cw-article">', 'class="cw-container cw-article-head"', 'class="cw-article-rail"',
    'class="cw-article-body"', 'class="cw-sources"', 'class="cw-container cw-article-foot"',
  ].every((s) => out.includes(s)));
  check(`${name}: shared stylesheets`, out.includes('href="/assets/cw/cw.css"') && out.includes('href="/assets/cw/cw-reading.css"'));
  check(`${name}: self-hosted font preload`, out.includes('href="/assets/fonts/inter-latin-wght.v5.woff2"'));
  check(`${name}: Chase Wang header links home`, out.includes('<a class="cw-brand" href="https://chasewang.me/">'));
  check(`${name}: body carried over byte-for-byte`, out.includes(`<div class="cw-prose" lang="${L}">${p.body}</div>`));
  check(`${name}: html lang ${p.lang} → ${L}`, out.startsWith(`<!DOCTYPE html>\n<html lang="${L}" ${MARK}="1">`));
  check(`${name}: no Google Fonts`, !/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(out));
  check(`${name}: no adapter inline CSS`, !out.includes('--bg:#050506') && !out.includes('/redesign.css'));
  check(`${name}: no /#chase or /#read links`, !/href="\/#(chase|read)"/.test(out));
  check(`${name}: writing links go to chasewang.me/writing`, out.includes('href="https://chasewang.me/writing"'));
  check(`${name}: canonical kept as-is`, out.includes(`<link rel="canonical" href="${p.canonical}">`));
  check(`${name}: title kept`, out.includes(`<title>${p.title}</title>`));
  for (const k of ['type', 'title', 'url', 'image']) {
    const v = attr(new RegExp(`<meta property="og:${k}" content="([^"]*)">`));
    check(`${name}: og:${k} kept`, v !== null && unesc(v) === unesc(p.og[k]), `${v} vs ${p.og[k]}`);
  }
  const desc = attr(/<meta name="description" content="([^"]*)">/);
  const head = out.slice(out.indexOf('<header class="cw-container cw-article-head">'), out.indexOf('</header>', out.indexOf('cw-article-head')));
  check(`${name}: visible dek in the article head`, !!desc && head.includes(`<p class="cw-article-dek" lang="${L}">${esc(unesc(desc))}</p>`), head.slice(0, 200));
  const descText = unesc(desc || '');
  check(`${name}: meta description cleaned`, !!desc && !/\s{2,}|\n/.test(descText) && descText.length <= 161 && descText === descText.trim()
    && !/&(amp|quot|lt|gt|#x27);/.test(descText) && !/\s[,.;:，。；：]/.test(descText), descText);
  check(`${name}: X link kept`, out.includes(`href="${p.xUrl}"`) || out.includes(`href="${unesc(p.xUrl).replace(/&/g, '&amp;')}"`));
  check(`${name}: date shown`, out.includes(`<time datetime="${p.date}">${p.date}</time>`));

  const ldText = attr(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  let ld = null;
  try { ld = JSON.parse(ldText); } catch { /* reported below */ }
  check(`${name}: Article JSON-LD`, !!ld && ld['@type'] === 'Article' && ld.author?.['@id'] === 'https://chasewang.me/#person'
    && ld.url === unesc(p.canonical) && ld.mainEntityOfPage === unesc(p.canonical) && ld.datePublished === p.date
    && ld.headline === unesc(p.headline) && ld.inLanguage === L, ldText?.slice(0, 120));

  const again = normalizeWritingPage(out, { item });
  check(`${name}: idempotent (normalizing twice = once)`, again.status === 'already' && again.html === out);
}

// ── Fixtures rendered by the adapter ──
const excerpts = JSON.parse(await readFile(path.join(FIXTURES, 'adapter-excerpts.json'), 'utf8'));
for (const lang of ['zh', 'en']) {
  const html = await readFile(path.join(FIXTURES, `adapter-${lang}.html`), 'utf8');
  const id = `fixture-${lang}`;
  const item = { id, primaryLang: lang, tags: ['deep-research', 'x-article'], excerpt: { [lang]: excerpts[id] } };
  assertNormalized(`fixture ${lang}`, html, item);
  assertNormalized(`fixture ${lang} (no manifest entry)`, html, null);

  // The hand-edited shape of ai-btc / crypto-k: site header, /redesign.css, body/main attributes, /#read.
  const handEdited = html
    .replace('</head>', '  <link rel="stylesheet" href="/redesign.css?v=3">\n</head>')
    .replace('<body>', '<body class="standalone-article">\n  <a class="site-skip" href="#article-main">Skip to content</a>\n  <header class="site-header site-header-standalone"><a class="site-brand" href="/#landing"><strong>CBTI</strong></a></header>')
    .replace('<main class="page">', '<main class="page standalone-site-main" id="article-main">')
    .replace(/href="\/#chase"/g, 'href="/#read"');
  assertNormalized(`fixture ${lang} (hand-edited variant)`, handEdited, item);

  // Unrecognised shapes are returned unchanged with reasons (the build then warns and publishes as-is).
  for (const [label, broken] of [
    ['no article body', html.replace(/<article class="article">[\s\S]*<\/article>/, '<div>moved</div>')],
    ['no date', html.replace(/<div class="eyebrow">[^<]*<\/div>/, '<div class="eyebrow">Deep research</div>')],
    ['no X link', html.replace(/<a class="action primary"[^>]*>/, '<a class="action">')],
  ]) {
    const r = normalizeWritingPage(broken, { item });
    check(`fixture ${lang} (${label}): unchanged + reported`, r.status === 'unrecognized' && r.html === broken && r.warnings.length > 0, r.status);
  }
}

// classify(): an explicit format wins; only listed plural aliases map (review r1 F1: "analysis" once
// lost its trailing "s" and fell back to essay).
for (const [format, want] of [['analysis', 'analysis'], ['Analysis', 'analysis'], ['analyses', 'analysis'], ['research', 'research'],
  ['essay', 'essay'], ['essays', 'essay']]) {
  check(`classify format "${format}" → ${want}`, classify({ format, tags: [] }) === want, classify({ format, tags: [] }));
}
check('classify unknown format falls back to tags', classify({ format: 'bogus', tags: ['x-article'] }) === 'analysis');
check('classify no format, research kind', classify({ kind: 'Field map', tags: [] }) === 'research');
check('classify no format, plain item', classify({ tags: ['macro'] }) === 'essay');
{
  const html = await readFile(path.join(FIXTURES, 'adapter-zh.html'), 'utf8');
  const r = normalizeWritingPage(html, { item: { id: 'fixture-zh', primaryLang: 'zh', format: 'analysis', tags: [], excerpt: { zh: excerpts['fixture-zh'] } } });
  check('explicit format "analysis" reaches the kicker', r.html.includes('<a href="https://chasewang.me/writing#analysis">分析</a>'));
}

// The idempotency marker only counts on the <html> start tag (review r1: a marker string inside the body
// must not make the normalizer skip a page).
{
  const html = await readFile(path.join(FIXTURES, 'adapter-zh.html'), 'utf8');
  const withText = html.replace('<p>最后一段。</p>', `<p title='${MARK}="1"'>最后一段。</p>`);
  check('marker text inside the body does not count', !isNormalized(withText) && normalizeWritingPage(withText, {}).status === 'normalized');
  check('marker on the html tag counts', isNormalized(normalizeWritingPage(html, {}).html));
}

// cleanDescription: whitespace collapsed, clipped at a sentence end near the limit.
check('cleanDescription collapses whitespace', cleanDescription('  a \n\n b  ', 'en') === 'a b');
{
  const zh = '第一句话说明背景。'.repeat(12) + '最后一句没有句号';
  const out = cleanDescription(zh, 'zh', 60);
  check('cleanDescription clips zh at 。', out.length <= 60 && out.endsWith('。'), out);
  const en = 'word '.repeat(80);
  const outEn = cleanDescription(en, 'en', 50);
  check('cleanDescription marks a hard clip with …', outEn.endsWith('…') && outEn.length <= 51, outEn);
}

// ── Real pages in this repository (as the adapter or earlier hand edits left them) ──
if (!fixturesOnly) {
  const items = parseManifest(await readFile(path.join(ROOT, 'writings', 'index.json'), 'utf8'));
  const byId = new Map(items.map((i) => [i.id, i]));
  const dirs = (await readdir(path.join(ROOT, 'writings'), { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => e.name).sort();
  for (const id of dirs) {
    let html;
    try { html = await readFile(path.join(ROOT, 'writings', id, 'index.html'), 'utf8'); } catch { continue; }
    check(`writings/${id}: repository copy not normalized`, !isNormalized(html));
    assertNormalized(`writings/${id}`, html, byId.get(id) || null);
  }
}

const total = passed + failures.length;
if (failures.length) {
  console.error(`test-normalize: ${failures.length} of ${total} checks FAILED`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`test-normalize: all ${total} checks passed${fixturesOnly ? ' (fixtures only)' : ''}`);
