#!/usr/bin/env node
// Build cbti.club into _site/ (the only directory that is deployed). Zero dependencies, Node >= 18.
//
//   node scripts/build.mjs [--out DIR] [--quiet]
//
// 1. Copy an allowlist of public files (repository metadata such as README, CLAUDE.md, DESIGN.md,
//    .github/, .claude/, scripts/ and docs/ never reaches the output).
// 2. Render the author pages kept as templates (landscape.html, research/crypto-crime-timeline/)
//    inside the shared Chase Wang reading chrome.
// 3. Normalize every writings/<id>/index.html written by the x-auto adapter into the same reading
//    template (scripts/lib/normalize.mjs). The repository copies are never modified; a page whose
//    structure is not recognised is published unchanged with a warning, and the build continues.
// 4. Fill the landing's "作者的写作" strip with the latest three manifest items.
// 5. Write robots.txt, sitemap.xml, _headers and /favicon.ico.
// 6. Check the output: private denylist, repository metadata, third-party runtime references,
//    internal links and anchors, JSON-LD. Any failure exits 1 (except for unrecognised writings
//    pages, which only warn). The build never reads the clock: same inputs, same tree hash.

import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AUTHOR_REF, ORIGIN, PERSON_ID, byDateDesc, parseManifest, renderAuthorPage, writingRow } from './lib/site.mjs';
import { normalizeWritingPage } from './lib/normalize.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const OUT = path.resolve(ROOT, args.includes('--out') ? args[args.indexOf('--out') + 1] : '_site');
const QUIET = args.includes('--quiet');

const log = (...m) => { if (!QUIET) console.log('[build]', ...m); };
const warn = (...m) => console.warn('[build] WARN:', ...m);
const fail = (msg) => { console.error(`[build] FAIL: ${msg}`); process.exit(1); };

// The output directory is deleted first: never let it be the repository or anything above it.
if (OUT === ROOT || ROOT.startsWith(OUT + path.sep) || OUT === path.parse(OUT).root) fail(`refusing --out ${OUT}: it contains the repository`);

// ── Allowlist ──
const FILES = ['index.html', '404.html', 'app.js', 'data.js', '.well-known/security.txt'];
const DIRS = [
  { dir: 'assets/cw' },
  { dir: 'assets/fonts' },
  { dir: 'assets/cbti', ext: /\.(css|png|svg)$/i },
  { dir: 'assets/personas', ext: /\.jpe?g$/i },
  { dir: 'assets/icon', ext: /\.(png|ico|jpe?g)$/i },
  { dir: 'assets/paper', ext: /\.pdf$/i },
  { dir: 'assets/essays', ext: /\.png$/i },
  { dir: 'research/crypto-crime-timeline', ext: /\.(csv|json|png)$/i },
];
const TEMPLATES = [
  { src: 'landscape.html', out: 'landscape.html', path: '/landscape' },
  { src: 'research/crypto-crime-timeline/index.html', out: 'research/crypto-crime-timeline/index.html', path: '/research/crypto-crime-timeline/' },
];
const WRITING_ASSET = /\.(jpe?g|png|webp|gif|svg)$/i;

const DENY_NAMES = new Set(['maria.html', 'maira.html', 'x-auto-loop.html', 'td_stats.json', 'node.html']);
const FORBIDDEN = [/(^|\/)README(\.md)?$/i, /\.md$/i, /^\.github\//, /^\.claude\//, /^scripts\//, /^docs\//, /^src\//,
  /(^|\/)\.gitignore$/, /(^|\/)\.DS_Store$/, /(^|\/)CLAUDE\.md$/i, /(^|\/)DESIGN\.md$/i, /\.mjs$/];
const THIRD_PARTY = /(fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|unpkg\.com|googletagmanager|google-analytics|platform\.twitter\.com)/;

const HEADERS = `/assets/fonts/*
  Cache-Control: public, max-age=31536000, immutable
`;
const ROBOTS = `User-agent: *
Allow: /

Sitemap: ${ORIGIN}/sitemap.xml
`;

// ── Helpers ──
async function exists(p) { try { await stat(p); return true; } catch { return false; } }
async function walk(dir) {
  const out = [];
  let entries = [];
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))) {
    const p = path.join(dir, e.name);
    if (e.isSymbolicLink()) fail(`symlink in a published path: ${rel(p, ROOT)} (copy the file instead)`);
    if (e.isDirectory()) out.push(...await walk(p));
    else if (e.isFile()) out.push(p);
  }
  return out;
}
const rel = (p, base = OUT) => path.relative(base, p).split(path.sep).join('/');
async function put(relPath, data) {
  const target = path.join(OUT, relPath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, data);
}
async function copy(relSrc, relDst = relSrc) {
  const target = path.join(OUT, relDst);
  await mkdir(path.dirname(target), { recursive: true });
  await copyFile(path.join(ROOT, relSrc), target);
}

function frontMatter(raw, name) {
  const m = raw.match(/^<!--page\s*([\s\S]*?)-->\s*/);
  if (!m) fail(`${name}: missing <!--page {...}--> front matter`);
  return { page: JSON.parse(m[1]), body: raw.slice(m[0].length) };
}

function splitScripts(body) {
  // Inline <script> blocks at the end of a template body go after the footer.
  const scripts = [];
  const html = body.replace(/<script>([\s\S]*?)<\/script>\s*$/g, (_, js) => { scripts.push(js.trim()); return ''; });
  return { html, scripts };
}

// ── Main ──
await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

for (const f of FILES) {
  if (!await exists(path.join(ROOT, f))) fail(`allowlisted file missing: ${f}`);
  await copy(f);
}
for (const { dir, ext } of DIRS) {
  for (const file of await walk(path.join(ROOT, dir))) {
    const r = rel(file, ROOT);
    if (path.basename(r) === '.DS_Store') continue;
    if (ext && !ext.test(r)) continue;
    await copy(r);
  }
}
await copyFile(path.join(ROOT, 'assets/cw/icons/favicon.ico'), path.join(OUT, 'favicon.ico'));

// Manifest (the adapter's contract: read-only here).
const manifestText = await readFile(path.join(ROOT, 'writings', 'index.json'), 'utf8');
let items;
try { items = parseManifest(manifestText, (m) => warn(m)); } catch (e) { fail(`writings/index.json: ${e.message}`); }
items.forEach((item, i) => { item._order = i; });
const byId = new Map(items.map((i) => [i.id, i]));
await put('writings/index.json', manifestText);

// Author pages kept as templates.
const sitemap = [{ loc: `${ORIGIN}/` }];
/** A page belongs in this sitemap unless its canonical names another origin (a missing canonical counts as local). */
function localCanonical(url) {
  if (!url) return true;
  try { return new URL(url.replace(/&amp;/g, '&')).origin === ORIGIN; } catch { return true; }
}
for (const t of TEMPLATES) {
  const raw = await readFile(path.join(ROOT, t.src), 'utf8');
  const { page, body } = frontMatter(raw, t.src);
  const { html, scripts } = splitScripts(body);
  const jsonld = page.article ? {
    '@context': 'https://schema.org', '@type': 'Article', headline: page.article.headline, description: page.description,
    inLanguage: page.article.inLanguage, datePublished: page.article.datePublished, url: page.canonical,
    mainEntityOfPage: page.canonical, ...(page.og_image ? { image: page.og_image } : {}), author: AUTHOR_REF, publisher: { '@id': PERSON_ID },
  } : null;
  const out = renderAuthorPage({
    lang: page.lang, title: page.title, description: page.description, canonical: page.canonical,
    og: { type: 'article', title: page.og_title || page.title, description: page.og_description || page.description, url: page.canonical, image: page.og_image },
    css: page.css || [], jsonld, body: html, scripts,
  });
  await put(t.out, out);
  // The sitemap lists only pages whose canonical is on this site (landscape and the research page now live on chasewang.me).
  if (localCanonical(page.canonical)) sitemap.push({ loc: `${ORIGIN}${t.path}`, lastmod: page.lastmod });
}

// Adapter pages: copy assets, normalize HTML (repository files stay untouched).
const writingDirs = (await readdir(path.join(ROOT, 'writings'), { withFileTypes: true }))
  .filter((e) => e.isDirectory()).map((e) => e.name).sort();
const keptAsIs = new Set();
let normalized = 0;
for (const id of writingDirs) {
  for (const file of await walk(path.join(ROOT, 'writings', id))) {
    const r = rel(file, ROOT);
    if (WRITING_ASSET.test(r)) await copy(r);
  }
  const src = path.join(ROOT, 'writings', id, 'index.html');
  if (!await exists(src)) continue;
  const html = await readFile(src, 'utf8');
  const result = normalizeWritingPage(html, { item: byId.get(id) || null });
  if (result.status === 'unrecognized') {
    warn(`writings/${id}/index.html: structure not recognised (${result.warnings.join('; ')}); published unchanged`);
    keptAsIs.add(`writings/${id}/index.html`);
  } else {
    normalized += 1;
  }
  if (!byId.has(id)) warn(`writings/${id}/ has no manifest entry`);
  await put(`writings/${id}/index.html`, result.html);
  // Pages whose emitted canonical is chasewang.me/writings/<id>/ stay out of this sitemap.
  if (localCanonical(result.html.match(/<link rel="canonical" href="([^"]*)"/i)?.[1])) {
    sitemap.push({ loc: `${ORIGIN}/writings/${id}/`, lastmod: byId.get(id)?.publishedAt });
  }
}

// Landing: the author's latest three pieces.
{
  const START = '<!-- author-writing:start -->';
  const END = '<!-- author-writing:end -->';
  const indexPath = path.join(OUT, 'index.html');
  const html = await readFile(indexPath, 'utf8');
  const a = html.indexOf(START), b = html.indexOf(END);
  if (a < 0 || b < a) fail('index.html: author-writing markers missing');
  const rows = [...items].sort(byDateDesc).slice(0, 3).map((item) => writingRow(item, warn)).filter(Boolean).join('\n');
  await writeFile(indexPath, html.slice(0, a + START.length) + '\n' + rows + '\n' + html.slice(b));
  log(`landing: latest writing ${[...items].sort(byDateDesc).slice(0, 3).map((i) => i.id).join(', ')}`);
}

await put('robots.txt', ROBOTS);
await put('_headers', HEADERS);
await put('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemap.sort((x, y) => (x.loc < y.loc ? -1 : 1)).map((u) => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n')}
</urlset>
`);

// ── Checks on the output tree ──
const files = await walk(OUT);
const rels = files.map((f) => rel(f));
for (const r of rels) {
  if (DENY_NAMES.has(path.posix.basename(r).toLowerCase())) fail(`denylisted private file in output: ${r}`);
  if (FORBIDDEN.some((re) => re.test(r))) fail(`repository metadata in output: ${r}`);
}
const set = new Set(rels);
const html = new Map();
for (const r of rels.filter((x) => x.endsWith('.html'))) html.set(r, await readFile(path.join(OUT, r), 'utf8'));
const ids = new Map([...html].map(([r, s]) => [r, new Set([...s.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))]));
// Returns the output file a site path serves, null when nothing serves it, or undefined when the path
// has malformed percent-encoding (reported as a warning: browsers still request such URLs as-is).
const resolve = (p) => {
  let clean;
  try { clean = decodeURIComponent(p).replace(/^\//, ''); } catch { return undefined; }
  if (clean === '') return 'index.html';
  if (set.has(clean) && !clean.endsWith('.html')) return clean;
  if (set.has(`${clean}.html`)) return `${clean}.html`;
  if (set.has(`${clean.replace(/\/$/, '')}/index.html`)) return `${clean.replace(/\/$/, '')}/index.html`;
  return null;
};
const problems = [];
for (const r of rels.filter((x) => /\.(html|css|js|xml|txt)$/.test(x) || x === '_headers')) {
  const text = html.get(r) ?? await readFile(path.join(OUT, r), 'utf8');
  const kept = keptAsIs.has(r);
  const report = (msg) => (kept ? warn(`${r} (published unchanged): ${msg}`) : problems.push(`${r}: ${msg}`));
  if (THIRD_PARTY.test(text) && !r.endsWith('.xml')) report('mentions a blocked third-party host');
  if (r.endsWith('.css')) {
    for (const m of text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
      if (m[1].startsWith('data:')) continue;
      if (/^(https?:|\/\/)/.test(m[1])) { report(`external url() ${m[1]}`); continue; }
      const target = m[1].startsWith('/') ? m[1] : '/' + path.posix.join(path.posix.dirname(r), m[1]);
      const found = resolve(target);
      if (found === undefined) warn(`${r}: malformed url() ${m[1]} (not checked)`);
      else if (!found) report(`broken url() ${m[1]}`);
    }
  }
  if (!r.endsWith('.html')) continue;
  for (const m of text.matchAll(/<(link|script|img|iframe|source|video|audio|embed|object)\b[^>]*\s(?:href|src|data)="(https?:)?\/\/([^"/]+)/gi)) {
    if (m[1].toLowerCase() === 'link' && /rel="(canonical|alternate)"/.test(m[0])) continue;
    report(`third-party runtime reference to ${m[3]}`);
  }
  for (const m of text.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch (e) { report(`invalid JSON-LD: ${e.message}`); }
  }
  const pageUrl = `${ORIGIN}/${r === 'index.html' ? '' : r.replace(/\/index\.html$/, '/').replace(/\.html$/, '')}`;
  const markup = text.replace(/(<script\b[^>]*>)[\s\S]*?(<\/script>)/gi, '$1$2'); // links inside inline JS are not markup
  for (const m of markup.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const v = m[1].replace(/&amp;/g, '&');
    if (/^(https?:|mailto:|tel:|data:|\/\/)/.test(v)) continue;
    const [pathPart, hash] = v.split('#');
    if (!pathPart) { if (hash && !ids.get(r).has(hash)) report(`missing anchor #${hash}`); continue; }
    if (!pathPart.startsWith('/') && r === '404.html') { report(`relative URL ${v} (404 is served at any path)`); continue; }
    let sitePath;
    try { sitePath = new URL(pathPart, pageUrl).pathname.split('?')[0]; } catch { warn(`${r}: malformed URL ${v} (not checked)`); continue; }
    const target = resolve(sitePath);
    if (target === undefined) { warn(`${r}: malformed URL ${v} (not checked)`); continue; }
    if (!target) { report(`broken link ${v}`); continue; }
    if (hash && target.endsWith('.html') && !ids.get(target)?.has(hash)) report(`missing anchor ${v}`);
  }
}
if (problems.length) fail(`${problems.length} output problem(s):\n  ${problems.join('\n  ')}`);

const tree = createHash('sha256');
for (const f of files) tree.update(`${rel(f)}\t${createHash('sha256').update(await readFile(f)).digest('hex')}\n`);
log(`writings: ${normalized} normalized, ${keptAsIs.size} published unchanged, ${items.length} manifest items`);
log(`output: ${files.length} files in ${rel(OUT, ROOT)}/`);
log(`tree sha256: ${tree.digest('hex')}`);
