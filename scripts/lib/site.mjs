// Shared pieces for the cbti.club build: the Chase Wang reading chrome used by every author
// page hosted on cbti.club (writings, landscape, research), and the writings-manifest helpers.
// Zero dependencies. Taxonomy and labels mirror chasewang.me (brief §3.1) so a piece reads the
// same on both sites.

export const ORIGIN = 'https://cbti.club';
export const HOME = 'https://chasewang.me';

/** True unless `url` names another host than this site (a missing or unparsable URL counts as local; http/https and
 *  the www form count as this site; a different port does not). Decides sitemap membership. */
export function localCanonical(url) {
  if (!url) return true;
  const host = (u) => { const x = new URL(u); return `${x.hostname.replace(/^www\./, '')}${x.port ? `:${x.port}` : ''}`; };
  try { return host(String(url).replace(/&amp;/g, '&')) === host(ORIGIN); } catch { return true; }
}

/** The href of the first <link> whose rel includes "canonical", in any attribute order and quoting; null when none. */
export function declaredCanonical(html) {
  for (const m of String(html).matchAll(/<link\b((?:[^>"']|"[^"]*"|'[^']*')*)>/gi)) {
    const attr = (name) => m[1].match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, 'i'));
    const rel = attr('rel');
    if (rel && /(^|\s)canonical(\s|$)/i.test(rel[1] ?? rel[2] ?? rel[3])) {
      const href = attr('href');
      return href ? (href[1] ?? href[2] ?? href[3]) : null;
    }
  }
  return null;
}
export const PERSON_ID = `${HOME}/#person`;
export const AUTHOR_REF = { '@type': 'Person', '@id': PERSON_ID, name: 'Chase Wang', url: `${HOME}/` };

/** Own-property lookup for tables keyed by manifest or page strings: "constructor" or "__proto__" is an unknown
 *  key, never a value inherited from Object.prototype. Non-objects have no keys. */
export const own = (table, key) => (table !== null && typeof table === 'object' && Object.hasOwn(table, key) ? table[key] : undefined);
export const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const unesc = (v) => String(v ?? '')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#39;/g, "'").replace(/&amp;/g, '&');
export const htmlLang = (l) => (l === 'zh' ? 'zh-Hans' : 'en');
export const jsonLd = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;
const arrow = (external) => `<span class="cw-arrow" aria-hidden="true">${external ? '↗' : '→'}</span>`;

// ── Interface copy for the reading chrome, by page language ──
export const UI = {
  zh: {
    skip: '跳到正文', nav: [['写作', '/writing'], ['作品', '/work'], ['关于', '/about']],
    navLabel: 'Chase Wang', footerNavLabel: '页脚导航',
    statement: '研究制度如何运转，也把判断做成工具。',
    elsewhere: '其他平台', feed: '订阅',
    published: '发布日期', updated: '更新日期', format: '格式', language: '语言', alsoAt: '其他渠道', data: '数据',
    details: '详情', contents: '目录',
    langName: { zh: '中文', en: 'English' },
    readOnX: '在 X 上阅读和讨论', moreWriting: '全部写作',
    archive: '站内存档 · cbti.club',
  },
  en: {
    skip: 'Skip to content', nav: [['Writing', '/writing'], ['Work', '/work'], ['About', '/about']],
    navLabel: 'Chase Wang', footerNavLabel: 'Footer',
    statement: 'I study how institutions work. Then I turn the judgment into tools.',
    elsewhere: 'Elsewhere', feed: 'Feed',
    published: 'Published', updated: 'Updated', format: 'Format', language: 'Language', alsoAt: 'Also at', data: 'Data',
    details: 'Details', contents: 'Contents',
    langName: { zh: '中文', en: 'English' },
    readOnX: 'Read / discuss on X', moreWriting: 'More writing',
    archive: 'Self-hosted research archive · cbti.club',
  },
};

const ELSEWHERE = [
  ['X', 'https://x.com/ChaseWang'],
  ['GitHub', 'https://github.com/ckpxgfnksd-max'],
  ['Substack', 'https://chasewang2026.substack.com/'],
  ['Academia', 'https://www.academia.edu/143701755/What_Is_a_Crypto_Body_Rethinking_the_Role_of_the_Blockchain_Ledger'],
];

/** Header for author pages: the Chase Wang brand and nav, pointing at chasewang.me. */
export function readingHeader(lang, current = 'writing') {
  const ui = own(UI, lang) || UI.en;
  const items = ui.nav.map(([label, href]) => {
    const cur = href === `/${current}` ? ' aria-current="true"' : '';
    return `<li><a href="${HOME}${href}"${cur}>${label}</a></li>`;
  }).join('');
  return `<a class="cw-skip" href="#main">${ui.skip}</a>
<header class="cw-header">
  <div class="cw-container cw-header-inner">
    <a class="cw-brand" href="${HOME}/"><span class="cw-mark" aria-hidden="true"></span><span class="cw-wordmark" lang="en">Chase Wang</span></a>
    <nav class="cw-nav" aria-label="${ui.navLabel}"><ul>${items}</ul></nav>
    <div class="cw-header-tools"></div>
  </div>
</header>`;
}

/** Footer for author pages (same structure as chasewang.me; absolute links). */
export function readingFooter(lang) {
  const ui = own(UI, lang) || UI.en;
  const nav = ui.nav.map(([label, href]) => `<li><a href="${HOME}${href}">${label}</a></li>`).join('');
  const ext = ELSEWHERE.map(([name, href]) => `<li><a href="${esc(href)}" rel="noopener">${name}${arrow(true)}</a></li>`).join('')
    + `<li><a href="${HOME}/feed.xml">${ui.feed}</a></li>`;
  return `<footer class="cw-footer">
  <div class="cw-container cw-footer-inner">
    <div class="cw-footer-brand">
      <a class="cw-brand" href="${HOME}/"><span class="cw-mark" aria-hidden="true"></span><span class="cw-wordmark" lang="en">Chase Wang</span></a>
      <p>${ui.statement}</p>
    </div>
    <nav class="cw-footer-nav" aria-label="${ui.footerNavLabel}">
      <p class="cw-footer-label" lang="en">Chase Wang</p>
      <ul>${nav}</ul>
    </nav>
    <div class="cw-footer-links">
      <p class="cw-footer-label">${ui.elsewhere}</p>
      <ul>${ext}</ul>
    </div>
    <p class="cw-footer-base"><span>© Chase Wang</span><a href="/" lang="en">CBTI · cbti.club</a></p>
  </div>
</footer>`;
}

/**
 * A complete author page on cbti.club. `page`: { lang ('zh'|'en'), title, description, canonical,
 * og: {type,title,url,image,description}, css: [], jsonld, body, scripts: [] (inline script bodies
 * or {src}), extraHead: [] }.
 */
export function renderAuthorPage(page) {
  const lang = page.lang === 'zh' ? 'zh' : 'en';
  const og = page.og || {};
  const meta = [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${page.titleHtml ?? esc(page.title)}</title>`,
    page.description ? `<meta name="description" content="${esc(page.description)}">` : '',
    page.canonical ? `<link rel="canonical" href="${esc(page.canonical)}">` : '',
    '<meta name="author" content="Chase Wang">',
    `<meta property="og:type" content="${esc(og.type || 'article')}">`,
    og.title ? `<meta property="og:title" content="${og.titleRaw ? og.title : esc(og.title)}">` : '',
    og.description ? `<meta property="og:description" content="${esc(og.description)}">` : '',
    og.url ? `<meta property="og:url" content="${esc(og.url)}">` : '',
    og.image ? `<meta property="og:image" content="${esc(og.image)}">` : '',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:creator" content="@ChaseWang">',
    ...(page.extraHead || []),
    '<meta name="theme-color" content="#fafaf8">',
    '<link rel="icon" href="/assets/cw/icons/mark.svg" type="image/svg+xml">',
    '<link rel="icon" href="/assets/cw/icons/favicon.ico" sizes="any">',
    '<link rel="apple-touch-icon" href="/assets/cw/icons/mark-180.png">',
    '<link rel="preload" href="/assets/fonts/inter-latin-wght.v5.woff2" as="font" type="font/woff2" crossorigin>',
    '<link rel="stylesheet" href="/assets/cw/cw.css">',
    '<link rel="stylesheet" href="/assets/cw/cw-reading.css">',
    ...(page.css || []).map((href) => `<link rel="stylesheet" href="${esc(href)}">`),
    page.jsonld ? jsonLd(page.jsonld) : '',
  ].filter(Boolean);
  const scripts = (page.scripts || []).map((s) => (typeof s === 'string' ? `<script>${s}</script>` : `<script src="${esc(s.src)}" defer></script>`)).join('\n');
  const htmlAttrs = [`lang="${htmlLang(lang)}"`, ...(page.htmlAttrs || [])].join(' ');
  return `<!DOCTYPE html>
<html ${htmlAttrs}>
<head>
${meta.join('\n')}
</head>
<body${page.bodyClass ? ` class="${esc(page.bodyClass)}"` : ''}>
${readingHeader(lang, page.current || 'writing')}
<main id="main">
${page.body.trim()}
</main>
${readingFooter(lang)}
${scripts}
</body>
</html>
`;
}

// ── Writings manifest (writings/index.json, v1; the x-auto adapter's contract) ──
const ID_RE = /^[a-z0-9][a-z0-9-]*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Same checks as the adapter's validate_manifest(); invalid items are skipped, never fatal. */
export function validItem(item, seen = new Set()) {
  const problems = [];
  if (!item || typeof item !== 'object') return ['not an object'];
  if (typeof item.id !== 'string' || !ID_RE.test(item.id)) problems.push('id');
  if (seen.has(item.id)) problems.push('duplicate id');
  if (typeof item.publishedAt !== 'string' || !DATE_RE.test(item.publishedAt)) problems.push('publishedAt');
  if (item.primaryLang !== 'en' && item.primaryLang !== 'zh') problems.push('primaryLang');
  if (!own(item.title, item.primaryLang) || !own(item.excerpt, item.primaryLang)) problems.push('title/excerpt in primaryLang');
  const channels = Array.isArray(item.channels) ? item.channels : [];
  if (channels.length === 0) problems.push('channels');
  for (const c of channels) {
    if (!c || typeof c.url !== 'string' || !(c.url.startsWith('https://') || c.url.startsWith('#'))) problems.push(`channel url ${c?.url}`);
    if (!c || !own(item.title, c.lang)) problems.push(`channel lang ${c?.lang}`);
  }
  return problems;
}

export function parseManifest(text, log = () => {}) {
  const data = JSON.parse(text);
  if (data?.version !== 1 || !Array.isArray(data.items)) throw new Error('writings manifest is not v1');
  const seen = new Set();
  const items = [];
  for (const item of data.items) {
    const problems = validItem(item, seen);
    if (problems.length) { log(`writings: skipped ${item?.id ?? '(no id)'}: ${problems.join(', ')}`); continue; }
    seen.add(item.id);
    items.push(item);
  }
  return items;
}

export const FORMAT = {
  research: { key: 'research', zh: '研究', en: 'Research' },
  analysis: { key: 'analysis', zh: '分析', en: 'Analysis' },
  essay: { key: 'essays', zh: '文章', en: 'Essay' },
};
const KIND = {
  'academic paper': { zh: '论文', en: 'Paper' },
  'field map': { zh: '领域地图', en: 'Field map' },
  'data study': { zh: '数据研究', en: 'Data study' },
  essay: { zh: '文章', en: 'Essay' },
};

// Accepted `format` values. Plural aliases are listed explicitly: stripping a trailing "s" would turn
// "analysis" into "analysi" and silently misfile it (review r1 F1).
const FORMAT_ALIASES = { research: 'research', analysis: 'analysis', analyses: 'analysis', essay: 'essay', essays: 'essay' };

const tagsOf = (item) => (Array.isArray(item?.tags) ? item.tags : []);

/** Brief §3.1: format field → x-article tag → research kind/tag → essay. */
export function classify(item) {
  const f = own(FORMAT_ALIASES, String(item?.format || '').trim().toLowerCase());
  if (f) return f;
  const tags = tagsOf(item).map((x) => String(x).toLowerCase());
  if (tags.includes('x-article')) return 'analysis';
  const kind = String(item?.kind || '').toLowerCase();
  if (['academic paper', 'field map', 'data study'].includes(kind) || tags.some((x) => x.includes('research'))) return 'research';
  return 'essay';
}
export function kindLabel(item) {
  if (item?.kind) return own(KIND, String(item.kind).toLowerCase()) || { zh: item.kind, en: item.kind };
  if (tagsOf(item).includes('x-article')) return { zh: 'X 长文', en: 'X Article' };
  return null;
}

/** The old cbti.club hash routes that moved to chasewang.me, with the target app.js sends each one to. Same table
 *  as window.CBTI_LEGACY in index.html; test-normalize.mjs checks that the two agree. */
export const LEGACY_HASH_ROUTES = Object.freeze({
  read: `${HOME}/writing`,
  chase: `${HOME}/about`,
  paper: `${HOME}/paper`,
  'essay-three-body': `${HOME}/essay-three-body`,
  'chase-socials': `${HOME}/about`,
  'chase-writing': `${HOME}/writing`,
  'chase-essays': `${HOME}/writing`,
  'chase-reading-preview': `${HOME}/writing`,
  'chase-tools': `${HOME}/work`,
  'chase-systems': `${HOME}/work`,
});

/** A channel URL as this site links it. A legacy hash route goes where app.js redirects it; any other hash throws
 *  (the caller drops the channel with a warning). cbti.club URLs become same-origin clean paths. */
export function mapUrl(u) {
  if (u.startsWith('#')) {
    let route = null;
    try { route = decodeURIComponent(u.slice(1)); } catch { /* malformed escape: not a known route */ }
    const target = own(LEGACY_HASH_ROUTES, route);
    if (target) return target;
    throw new Error('unknown hash route');
  }
  const url = new URL(u);
  if (url.hostname === 'cbti.club' || url.hostname === 'www.cbti.club') {
    const p = url.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
    // The research page and the field map live on chasewang.me (2026-10-07): link to the home copy. Adapter writing
    // pages stay linked here: chasewang.me picks a new one up on its next rebuild (up to 6 h later), and this site's
    // copy, whose canonical names chasewang.me, exists from the moment it is published.
    const home = { '/research/crypto-crime-timeline': '/research/crypto-crime-timeline/', '/landscape': '/landscape' }[p.replace(/\/$/, '')];
    if (home) return `${HOME}${home}${url.hash}`;
    return (p || '/') + url.hash;
  }
  return url.toString();
}
export function channelName(url) {
  if (url.startsWith('/')) return 'cbti.club';
  const { hostname, pathname } = new URL(url);
  if (pathname.toLowerCase().endsWith('.pdf')) return 'PDF';
  if (/(^|\.)x\.com$|(^|\.)twitter\.com$/.test(hostname)) return 'X';
  if (hostname.endsWith('substack.com')) return 'Substack';
  if (hostname.endsWith('academia.edu')) return 'Academia';
  if (hostname === 'github.com') return 'GitHub';
  if (hostname === 'chasewang.me') return 'chasewang.me';
  return hostname.replace(/^www\./, '');
}
export function dateLabel(item) {
  if (item.datePrecision === 'year') return item.publishedAt.slice(0, 4);
  if (item.datePrecision === 'month') return item.publishedAt.slice(0, 7);
  return item.publishedAt;
}
// Code-point comparison (not localeCompare): output bytes must not depend on the build machine's locale.
export const byDateDesc = (a, b) => (a.publishedAt < b.publishedAt ? 1 : a.publishedAt > b.publishedAt ? -1 : a._order - b._order);

/** One index row (cw-index) for the landing's "作者的写作" strip. Interface copy in Chinese.
 *  A channel whose URL does not parse, or an unknown hash route, is dropped (warned by the caller's log), never fatal. */
export function writingRow(item, log = () => {}) {
  const lang = item.primaryLang;
  const channels = item.channels.flatMap((c) => {
    try {
      const url = mapUrl(c.url);
      return [{ url, lang: c.lang, external: /^https?:\/\//.test(url), name: channelName(url) }];
    } catch (e) {
      log(`writings: ${item.id}: skipped channel ${JSON.stringify(c.url)} (${e.message})`);
      return [];
    }
  });
  if (channels.length === 0) return '';
  const primary = channels.find((c) => !c.external && c.lang === lang) || channels.find((c) => !c.external)
    || channels.find((c) => c.lang === lang) || channels[0];
  const format = FORMAT[classify(item)];
  const kind = kindLabel(item);
  const langs = [...new Set([lang, ...channels.map((c) => c.lang)])];
  const badge = { en: '<span class="cw-badge" lang="en">EN</span>', zh: '<span class="cw-badge">中文</span>' };
  const tags = [`<span class="cw-tag">${format.zh}</span>`];
  if (kind) tags.push(`<span class="cw-tag">${esc(kind.zh)}</span>`);
  const chans = channels.filter((c) => c !== primary).map((c) => {
    const other = c.lang !== lang ? ` <span class="cw-chan-lang">${c.lang === 'zh' ? '中文' : 'EN'}</span>` : '';
    return `<a class="cw-chan" href="${esc(c.url)}"${c.external ? ' rel="noopener"' : ''}>${esc(c.name)}${other}${arrow(c.external)}</a>`;
  }).join('');
  const sub = item.subtitle?.[lang] ? ` <span class="cw-row-sub">${esc(item.subtitle[lang])}</span>` : '';
  const d = dateLabel(item);
  return `<li class="cw-row" data-id="${esc(item.id)}">
  <div class="cw-row-date"><time datetime="${esc(d)}">${esc(d)}</time></div>
  <div class="cw-row-main" lang="${htmlLang(lang)}">
    <h3 class="cw-row-title"><a href="${esc(primary.url)}"${primary.external ? ' rel="noopener"' : ''}>${esc(item.title[lang])}</a>${sub}</h3>
    <p class="cw-row-dek cw-clamp-2">${esc(item.excerpt[lang])}</p>
  </div>
  <p class="cw-row-tags">${tags.join('')}${langs.map((l) => own(badge, l) || '').join('')}</p>
  <p class="cw-row-chans">${chans}</p>
</li>`;
}
