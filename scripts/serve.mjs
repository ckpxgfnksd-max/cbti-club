#!/usr/bin/env node
// Local static server that mimics the Cloudflare Pages behaviours this site relies on:
// clean URLs (/x serves x.html; /x.html → 308 /x; /dir → 308 /dir/), _redirects rules (if any),
// _headers rules, and 404.html served with status 404. Zero dependencies.
//   node scripts/serve.mjs [dir=_site] [--port 8811] [--build]
import http from 'node:http';
import { execFileSync } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const port = portIndex >= 0 ? Number(args[portIndex + 1]) : 8811;
const dirArg = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--port');
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.resolve(dirArg || path.join(repo, '_site'));
if (args.includes('--build')) execFileSync(process.execPath, [path.join(repo, 'scripts', 'build.mjs')], { stdio: 'inherit' });

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon',
  '.pdf': 'application/pdf', '.woff2': 'font/woff2', '.csv': 'text/csv; charset=utf-8',
};

async function isFile(p) {
  try { return (await stat(p)).isFile(); } catch { return false; }
}
async function readRules(name) {
  try { return (await readFile(path.join(root, name), 'utf8')).split('\n'); } catch { return []; }
}
function toRegex(pattern) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '(.*)');
  return new RegExp(`^${escaped}$`);
}
async function redirects() {
  return (await readRules('_redirects')).map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map((l) => {
    const [from, to, status = '302'] = l.split(/\s+/);
    return { re: toRegex(from), to, status: Number(status) };
  });
}
async function headerRules() {
  const rules = [];
  let current = null;
  for (const raw of await readRules('_headers')) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue;
    if (!/^\s/.test(raw)) { current = { re: toRegex(raw.trim()), headers: [] }; rules.push(current); continue; }
    const m = raw.trim().match(/^([^:]+):\s*(.*)$/);
    if (current && m) current.headers.push([m[1], m[2]]);
  }
  return rules;
}
function safeJoin(urlPath) {
  let decoded;
  try { decoded = decodeURIComponent(urlPath); } catch { return null; }
  const p = path.normalize(path.join(root, decoded));
  return p.startsWith(root) ? p : null;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const extra = [];
  for (const rule of await headerRules()) if (rule.re.test(pathname)) extra.push(...rule.headers);
  const send = async (status, file) => {
    const body = file ? await readFile(file) : Buffer.alloc(0);
    const type = file ? TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' : 'text/plain';
    res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', ...Object.fromEntries(extra) });
    res.end(req.method === 'HEAD' ? undefined : body);
  };
  const redirect = (status, location) => { res.writeHead(status, { Location: location + url.search }); res.end(); };

  for (const rule of await redirects()) {
    const m = pathname.match(rule.re);
    if (m) return redirect(rule.status, rule.to.replace(':splat', m[1] || ''));
  }
  const target = safeJoin(pathname);
  if (!target) return send(400, null);

  if (pathname.endsWith('.html')) {
    if (await isFile(target)) return redirect(308, pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '') || '/');
  } else if (pathname.endsWith('/')) {
    if (await isFile(path.join(target, 'index.html'))) return send(200, path.join(target, 'index.html'));
    if (pathname !== '/' && await isFile(target.replace(/\/$/, '') + '.html')) return redirect(308, pathname.replace(/\/$/, ''));
  } else {
    if (await isFile(target)) return send(200, target);
    if (await isFile(target + '.html')) return send(200, target + '.html');
    if (await isFile(path.join(target, 'index.html'))) return redirect(308, pathname + '/');
  }
  const notFound = path.join(root, '404.html');
  return send(404, (await isFile(notFound)) ? notFound : null);
});

server.listen(port, '127.0.0.1', () => console.log(`serving ${root} at http://127.0.0.1:${port}`));
