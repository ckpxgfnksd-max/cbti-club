// Deploy-time normalizer for x-auto adapter pages (writings/<id>/index.html).
//
// The adapter (X-auto-loop cbti_publish.py, render_page) owns those files and rewrites them whole
// on every replay, so the repository copies stay exactly as the adapter wrote them. At build time
// this module reads the adapter's known page shape and rebuilds each page in the shared Chase Wang
// reading template. The article body is carried over byte-for-byte.
//
// Recognised shape (raw template, and the hand-edited ai-btc / crypto-k variants that add a site
// header, /redesign.css and body/main attributes):
//   <html lang="zh|en"> … <title>{title} · Chase Wang</title> <meta name="description">
//   <link rel="canonical"> og:type/title/url/image … <main …>
//   <div class="eyebrow">… YYYY-MM-DD</div> <h1>{title}</h1> …
//   <article class="article">{body}</article> <nav class="actions"><a class="action primary" href="{x url}">
// Anything else: the page is returned unchanged with the reasons, and the build only warns.

import { AUTHOR_REF, FORMAT, HOME, PERSON_ID, UI, classify, esc, htmlLang, kindLabel, renderAuthorPage, unesc } from './site.mjs';

export const MARK = 'data-cw-normalized';

/** An adapter writing URL on this site: cbti.club or www, /writings/<id>/ or /writings/<id>/index.html, no query.
 *  chasewang.me (scripts/lib/hosted.mjs CBTI_WRITING) recognises the same forms; keep the two in step. */
export const WRITING_URL = /^https:\/\/(?:www\.)?cbti\.club\/writings\/([a-z0-9][a-z0-9-]*)\/(?:index\.html)?(?:#.*)?$/;

/** The writing lives on chasewang.me (2026-10-07): chasewang.me hosts /writings/<id>/ for every manifest item that
 *  links https://cbti.club/writings/<id>/, built from these same repository files. So an adapter page's canonical
 *  maps to that home copy only when its manifest item links it; otherwise (no manifest entry, another URL) the URL
 *  is returned unchanged, so a canonical never points at a page chasewang.me does not build. */
export function homeCanonical(url, item) {
  const m = String(url).match(WRITING_URL);
  const linked = m && Array.isArray(item?.channels)
    && item.channels.some((c) => typeof c?.url === 'string' && c.url.match(WRITING_URL)?.[1] === m[1]);
  return linked ? `${HOME}/writings/${m[1]}/` : url;
}

/** True when the document's own <html> start tag carries the marker (text elsewhere does not count). */
export function isNormalized(html) {
  const tag = String(html).match(/<html\b[^>]*>/i);
  return !!tag && new RegExp(`\\s${MARK}="1"`).test(tag[0]);
}

export function parseAdapterPage(html) {
  const problems = [];
  const get = (re, from = html) => {
    const m = from.match(re);
    return m ? m[1] : null;
  };
  const langRaw = get(/<html\b[^>]*\blang="([^"]*)"/i);
  const lang = /^zh\b/i.test(langRaw || '') ? 'zh' : /^en\b/i.test(langRaw || '') ? 'en' : null;
  if (!lang) problems.push(`html lang "${langRaw}"`);
  const title = get(/<title>([\s\S]*?)<\/title>/i);
  if (!title) problems.push('title');
  const description = get(/<meta\s+name="description"\s+content="([^"]*)"/i);
  const canonical = get(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
  if (!canonical || !/^https:\/\//.test(canonical)) problems.push('canonical');
  const og = Object.create(null); // keyed by names read from the page: no inherited keys
  for (const m of html.matchAll(/<meta\s+property="og:([a-z_:]+)"\s+content="([^"]*)"/gi)) og[m[1]] = m[2];

  const mainAt = html.search(/<main\b/i);
  if (mainAt < 0) problems.push('main');
  const main = mainAt >= 0 ? html.slice(mainAt) : '';
  const date = get(/<div class="eyebrow">[^<]*?(\d{4}-\d{2}-\d{2})\s*<\/div>/, main);
  if (!date) problems.push('eyebrow date');
  const headline = get(/<h1>([\s\S]*?)<\/h1>/, main);
  if (!headline) problems.push('h1');

  const OPEN = '<article class="article">';
  const open = html.indexOf(OPEN);
  const actions = html.indexOf('<nav class="actions">');
  const close = open >= 0 && actions > open ? html.lastIndexOf('</article>', actions) : -1;
  if (open < 0 || close < open + OPEN.length) problems.push('article body');
  if (open >= 0 && html.indexOf(OPEN, open + 1) >= 0) problems.push('more than one article body');
  const body = open >= 0 && close >= open + OPEN.length ? html.slice(open + OPEN.length, close) : null;
  const xUrl = actions >= 0 ? get(/<a class="action primary" href="([^"]+)"/, html.slice(actions)) : null;
  if (!xUrl || !/^https:\/\//.test(unesc(xUrl))) problems.push('primary action link');

  return { ok: problems.length === 0, problems, lang, title, description, canonical, og, date, headline, body, xUrl };
}

/** Whitespace-collapsed, clipped at a sentence end when one is close to the limit. */
export function cleanDescription(text, lang, limit = 160) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (t.length <= limit) return t;
  const cut = t.slice(0, limit);
  const stops = lang === 'zh' ? ['。', '！', '？', '；'] : ['. ', '! ', '? '];
  const at = Math.max(...stops.map((s) => cut.lastIndexOf(s)));
  if (at >= limit * 0.5) return cut.slice(0, at + 1).trim();
  return cut.replace(/[\s,，、;；:：]+$/, '') + '…';
}

/**
 * normalizeWritingPage(html, { item }) → { html, status, warnings }
 *   status: 'normalized' | 'already' (carries the marker; returned as-is) | 'unrecognized' (as-is)
 *   item: the manifest entry for this page when there is one (format, kind and a clean excerpt).
 */
export function normalizeWritingPage(html, { item = null } = {}) {
  if (isNormalized(html)) return { html, status: 'already', warnings: [] };
  const p = parseAdapterPage(html);
  if (!p.ok) return { html, status: 'unrecognized', warnings: p.problems };

  const lang = p.lang;
  const ui = UI[lang];
  const L = htmlLang(lang);
  const format = FORMAT[item ? classify(item) : 'analysis'];
  const kind = (item && kindLabel(item)) || { zh: 'X 长文', en: 'X Article' };
  const canonical = homeCanonical(unesc(p.canonical), item);
  const x = unesc(p.xUrl);
  // The adapter builds its meta description by escaping text that was already escaped HTML, so the
  // fallback (no manifest entry) needs two unescapes; tag stripping also left spaces before punctuation.
  const fromPage = () => unesc(unesc(p.description)).replace(/\s+([,.;:!?，。；：！？、）)])/g, '$1');
  const description = cleanDescription(item?.excerpt?.[lang] || fromPage(), lang);
  const date = p.date;

  const body = `<article class="cw-article">
  <header class="cw-container cw-article-head">
    <p class="cw-kicker"><a href="${HOME}/writing#${format.key}">${format[lang]}</a> · ${esc(kind[lang])} · <time datetime="${date}">${date}</time></p>
    <h1 class="cw-article-title" lang="${L}">${p.headline}</h1>
    ${description ? `<p class="cw-article-dek" lang="${L}">${esc(description)}</p>\n    ` : ''}<p class="cw-byline" lang="en">Chase Wang</p>
  </header>
  <div class="cw-container">
    <div class="cw-article-layout">
      <aside class="cw-article-rail" aria-label="${ui.details}">
        <dl class="cw-kv">
          <div><dt>${ui.published}</dt><dd><time datetime="${date}">${date}</time></dd></div>
          <div><dt>${ui.format}</dt><dd>${format[lang]} · ${esc(kind[lang])}</dd></div>
          <div><dt>${ui.language}</dt><dd>${ui.langName[lang]}</dd></div>
          <div><dt>${ui.alsoAt}</dt><dd><ul class="cw-chanlist"><li><a class="cw-chan" href="${esc(x)}" rel="noopener">X<span class="cw-arrow" aria-hidden="true">↗</span></a></li></ul></dd></div>
        </dl>
      </aside>
      <div class="cw-article-body">
        <div class="cw-prose" lang="${L}">${p.body}</div>
        <ul class="cw-sources">
          <li><a class="cw-btn cw-btn--primary" href="${esc(x)}" rel="noopener">${ui.readOnX} <span aria-hidden="true">↗</span></a></li>
          <li><a class="cw-btn" href="${HOME}/writing">${ui.moreWriting} <span aria-hidden="true">→</span></a></li>
        </ul>
      </div>
    </div>
  </div>
  <footer class="cw-container cw-article-foot"><div class="cw-article-foot-inner"><p>${ui.archive}</p></div></footer>
</article>`;

  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: unesc(p.headline),
    description,
    inLanguage: L,
    datePublished: date,
    url: canonical,
    mainEntityOfPage: canonical,
    ...(p.og.image ? { image: unesc(p.og.image) } : {}),
    author: AUTHOR_REF,
    publisher: { '@id': PERSON_ID },
    sameAs: [x],
  };

  const out = renderAuthorPage({
    lang,
    titleHtml: p.title,
    description,
    canonical,
    og: {
      type: unesc(p.og.type || 'article'),
      title: unesc(p.og.title || p.headline),
      description,
      url: canonical,
      image: p.og.image ? unesc(p.og.image) : '',
    },
    htmlAttrs: [`${MARK}="1"`],
    jsonld,
    body,
  });
  return { html: out, status: 'normalized', warnings: [] };
}
