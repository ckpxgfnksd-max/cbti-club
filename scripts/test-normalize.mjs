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
import { MARK, cleanDescription, isNormalized, normalizeWritingPage, parseAdapterPage, homeCanonical } from './lib/normalize.mjs';
import { LEGACY_HASH_ROUTES, classify, esc, kindLabel, mapUrl, parseManifest, unesc, validItem, writingRow } from './lib/site.mjs';

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
  // With a manifest item that links this page, chasewang.me hosts it and the canonical names that copy; without one
  // chasewang.me does not build it, so the adapter's own canonical is kept.
  const linked = (item?.channels || []).some((c) => c.url === unesc(p.canonical));
  const home = linked ? unesc(p.canonical).replace('https://cbti.club/writings/', 'https://chasewang.me/writings/') : unesc(p.canonical);
  check(`${name}: canonical is ${linked ? 'the chasewang.me copy' : 'kept (no manifest link)'}`,
    home.startsWith(linked ? 'https://chasewang.me/writings/' : 'https://cbti.club/writings/') && out.includes(`<link rel="canonical" href="${esc(home)}">`), home);
  check(`${name}: title kept`, out.includes(`<title>${p.title}</title>`));
  check(`${name}: og:url equals the canonical`, unesc(attr(/<meta property="og:url" content="([^"]*)">/) || '') === home);
  for (const k of ['type', 'title', 'image']) {
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
    && ld.url === home && ld.mainEntityOfPage === home && ld.datePublished === p.date
    && ld.headline === unesc(p.headline) && ld.inLanguage === L, ldText?.slice(0, 120));

  check(`${name}: result.canonical is the declared canonical`, r.canonical === home);
  const again = normalizeWritingPage(out, { item });
  check(`${name}: idempotent (normalizing twice = once)`, again.status === 'already' && again.html === out);
}

// ── Fixtures rendered by the adapter ──
const excerpts = JSON.parse(await readFile(path.join(FIXTURES, 'adapter-excerpts.json'), 'utf8'));
for (const lang of ['zh', 'en']) {
  const html = await readFile(path.join(FIXTURES, `adapter-${lang}.html`), 'utf8');
  const id = `fixture-${lang}`;
  const item = { id, primaryLang: lang, tags: ['deep-research', 'x-article'], excerpt: { [lang]: excerpts[id] },
    channels: [{ url: `https://cbti.club/writings/${id}/` }] };
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

// Own-property lookups (B3 F-2): a manifest string that names an Object.prototype member is an unknown key,
// never an inherited value (before: format "constructor" classified as a function, kind "__proto__" as an object).
for (const name of ['constructor', '__proto__', 'toString', 'hasOwnProperty', 'valueOf']) {
  check(`classify format "${name}" is unknown, tags decide`, classify({ format: name, tags: ['x-article'] }) === 'analysis' && classify({ format: name, tags: [] }) === 'essay');
  const k = kindLabel({ kind: name });
  check(`kindLabel kind "${name}" is shown as written`, k?.zh === name && k?.en === name, JSON.stringify(k));
}
check('kindLabel known kind keeps its label', kindLabel({ kind: 'Field map' })?.zh === '领域地图' && kindLabel({ kind: 'Data study' })?.en === 'Data study');
check('classify and kindLabel ignore tags that are not a list', classify({ tags: 'x-article' }) === 'essay' && kindLabel({ tags: 'x-article' }) === null);
{
  const item = (extra) => ({ id: 'v', publishedAt: '2026-01-01', primaryLang: 'en', title: { en: 'T' }, excerpt: { en: 'E' }, ...extra });
  check('validItem accepts a plain valid item', validItem(item({ channels: [{ lang: 'en', url: 'https://x.com/a' }] })).length === 0);
  check('validItem: a channel lang needs its own title key', validItem(item({ channels: [{ lang: 'constructor', url: 'https://x.com/a' }] })).includes('channel lang constructor'));
  check('validItem: channels that are not a list are a problem, not a crash', validItem(item({ channels: { lang: 'en' } })).includes('channels') && validItem(item({ channels: 5 })).includes('channels'));
  const warned = [];
  const items = parseManifest(JSON.stringify({ version: 1, items: [
    item({ id: 'ok', channels: [{ lang: 'en', url: 'https://x.com/a' }] }),
    item({ id: 'obj', channels: { lang: 'en' } }),
    item({ id: 'proto', channels: [{ lang: 'constructor', url: 'https://x.com/a' }] }),
  ] }), (m) => warned.push(m));
  check('parseManifest skips malformed items and keeps going', items.length === 1 && items[0].id === 'ok' && warned.length === 2, warned.join(' | '));
  const row = writingRow(item({ title: { en: 'T', toString: 'x' }, channels: [{ lang: 'en', url: 'https://x.com/a' }, { lang: 'toString', url: 'https://example.com/a' }] }));
  check('writingRow: no inherited value reaches the language badges', !/function|native code|undefined/.test(row), row);
}

// Legacy hash channels (B3 F-3): the same targets app.js redirects to (window.CBTI_LEGACY in index.html);
// any other hash is dropped from the row with a warning, never a build failure.
{
  const indexHtml = await readFile(path.join(ROOT, 'index.html'), 'utf8');
  const m = indexHtml.match(/window\.CBTI_LEGACY = (\{[\s\S]*?\});/);
  let legacy = null;
  try { legacy = JSON.parse(m?.[1]); } catch { /* reported below */ }
  check('index.html: window.CBTI_LEGACY table found', !!legacy && typeof legacy === 'object');
  if (legacy) {
    check('LEGACY_HASH_ROUTES lists exactly the routes of window.CBTI_LEGACY',
      JSON.stringify(Object.keys(LEGACY_HASH_ROUTES).sort()) === JSON.stringify(Object.keys(legacy).sort()), Object.keys(legacy).join(' '));
    for (const [route, target] of Object.entries(legacy)) {
      let got; try { got = mapUrl(`#${route}`); } catch (e) { got = e.message; }
      check(`mapUrl #${route} → ${target}, as app.js`, got === target, got);
    }
  }
  check('mapUrl decodes the hash as app.js does', mapUrl('#chase%2Dtools') === 'https://chasewang.me/work');
  check('mapUrl keeps adapter writing on this site', mapUrl('https://cbti.club/writings/arc/') === '/writings/arc/');
  check('homeCanonical maps only a page its manifest item links', homeCanonical('https://cbti.club/writings/arc/', { channels: [{ url: 'https://cbti.club/writings/arc/' }] }) === 'https://chasewang.me/writings/arc/'
    && homeCanonical('https://www.cbti.club/writings/arc/index.html', { channels: [{ url: 'https://cbti.club/writings/arc/' }] }) === 'https://chasewang.me/writings/arc/'
    && homeCanonical('https://cbti.club/writings/arc/', null) === 'https://cbti.club/writings/arc/'
    && homeCanonical('https://cbti.club/writings/arc/', { channels: [{ url: 'https://cbti.club/writings/agent/' }] }) === 'https://cbti.club/writings/arc/'
    && homeCanonical('https://cbti.club/writings/arc/?x=1', { channels: [{ url: 'https://cbti.club/writings/arc/' }] }) === 'https://cbti.club/writings/arc/?x=1'
    && homeCanonical('https://evil.example/writings/arc/', { channels: [{ url: 'https://cbti.club/writings/arc/' }] }) === 'https://evil.example/writings/arc/'
    && homeCanonical('https://cbti.club/writings/arc/x/', { channels: [{ url: 'https://cbti.club/writings/arc/' }] }) === 'https://cbti.club/writings/arc/x/');
  check('mapUrl sends the research page and the field map home', mapUrl('https://cbti.club/research/crypto-crime-timeline/') === 'https://chasewang.me/research/crypto-crime-timeline/'
    && mapUrl('https://cbti.club/landscape.html') === 'https://chasewang.me/landscape');
  check('mapUrl sends slash and .html variants of the moved pages home', mapUrl('https://cbti.club/research/crypto-crime-timeline') === 'https://chasewang.me/research/crypto-crime-timeline/'
    && mapUrl('https://www.cbti.club/landscape/') === 'https://chasewang.me/landscape' && mapUrl('https://cbti.club/research/crypto-crime-timeline/index.html#x') === 'https://chasewang.me/research/crypto-crime-timeline/#x');
  check('mapUrl keeps other cbti.club paths local', mapUrl('https://cbti.club/assets/paper/crypto-body.pdf') === '/assets/paper/crypto-body.pdf');
  for (const u of ['#nope', '#chase-nope', '#node', '#landing', '#constructor', '#__proto__', '#', '#%E0%A4%A']) {
    let threw = false;
    try { mapUrl(u); } catch { threw = true; }
    check(`mapUrl ${u}: unknown hash route`, threw);
  }
  const zh = { id: 'h', publishedAt: '2026-01-01', primaryLang: 'zh', title: { zh: '标题' }, excerpt: { zh: '摘要' } };
  const logs = [];
  const row = writingRow({ ...zh, channels: [{ lang: 'zh', url: '#nope' }, { lang: 'zh', url: 'https://x.com/ChaseWang/status/1' }] }, (msg) => logs.push(msg));
  check('writingRow drops an unknown hash channel, warns, keeps the rest',
    row.includes('href="https://x.com/ChaseWang/status/1"') && !row.includes('#nope') && logs.some((l) => l.includes('"#nope"') && l.includes('unknown hash route')), logs.join(' | '));
  check('writingRow renders nothing when no channel is usable', writingRow({ ...zh, channels: [{ lang: 'zh', url: '#nope' }] }) === '');
  check('writingRow links a legacy #read channel to chasewang.me/writing',
    writingRow({ ...zh, channels: [{ lang: 'zh', url: '#read' }] }).includes('href="https://chasewang.me/writing"'));
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
