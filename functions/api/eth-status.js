// Cloudflare Pages Function — public sanitized proxy for the private ETH node dashboard.
//
// Trust boundary: this function is the ONLY thing that talks to the private origin.
// The browser sees a same-origin envelope built by an explicit allow-list — never
// the raw upstream JSON. New upstream fields do not leak by default.
//
// Env vars (set in Pages dashboard, never committed):
//   NODE_TUNNEL_URL          required — e.g. https://eth-status.example.cfargotunnel.com
//   CF_ACCESS_CLIENT_ID      optional — Cloudflare Access service-token id
//   CF_ACCESS_CLIENT_SECRET  optional — Cloudflare Access service-token secret

const ORIGIN_TIMEOUT_MS = 4000;

export async function onRequestGet({ env }) {
  const now = new Date().toISOString();

  if (!env.NODE_TUNNEL_URL) {
    return jsonResponse(
      { ok: false, reason: 'not_configured', updatedAt: now },
      { maxAge: 5 }
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ORIGIN_TIMEOUT_MS);

  try {
    const headers = { 'accept': 'application/json' };
    if (env.CF_ACCESS_CLIENT_ID && env.CF_ACCESS_CLIENT_SECRET) {
      headers['CF-Access-Client-Id'] = env.CF_ACCESS_CLIENT_ID;
      headers['CF-Access-Client-Secret'] = env.CF_ACCESS_CLIENT_SECRET;
    }

    const upstreamUrl = env.NODE_TUNNEL_URL.replace(/\/+$/, '') + '/api/status';
    const res = await fetch(upstreamUrl, { headers, signal: controller.signal });
    if (!res.ok) {
      return jsonResponse(
        { ok: false, reason: 'origin_http_' + res.status, updatedAt: now },
        { maxAge: 5 }
      );
    }

    const raw = await res.json();
    return jsonResponse(project(raw, now), { maxAge: 30 });
  } catch (err) {
    const reason = err && err.name === 'AbortError' ? 'origin_timeout' : 'origin_unreachable';
    return jsonResponse({ ok: false, reason, updatedAt: now }, { maxAge: 5 });
  } finally {
    clearTimeout(timer);
  }
}

// Allow-list projection: ANY field not explicitly mapped here is dropped.
// This is the field-exposure policy. Widening it requires an intentional code change.
//
// Upstream shape (from eth-node-status-dashboard /api/status):
//   { erigon: { ok, data: { chainId(hex), blockNumber(num), peerCount(num), syncing(bool), genesisBlockHash, ... } },
//     lighthouse: { ok, data: { syncing: { is_syncing, is_optimistic, el_offline, head_slot(str), sync_distance(str) },
//                                version: { version }, configName, depositChainId } },
//     summary: { chainId, networkLabel, mainnet } }
function project(raw, now) {
  const erigonData     = (raw && raw.erigon && raw.erigon.data) || {};
  const lighthouseData = (raw && raw.lighthouse && raw.lighthouse.data) || {};
  const lhSync         = lighthouseData.syncing || {};
  const summary        = (raw && raw.summary) || {};

  const block = numOrNull(erigonData.blockNumber);
  const slot  = strNumOrNull(lhSync.head_slot);
  const peers = numOrNull(erigonData.peerCount);

  const syncDistance  = strNumOrNull(lhSync.sync_distance);
  const erigonSyncing = boolOrNull(erigonData.syncing);
  const lhIsSyncing   = boolOrNull(lhSync.is_syncing);
  const elOffline     = boolOrNull(lhSync.el_offline);

  // Single bool collapsed from multiple fields. Raw flags never leave this function.
  const syncing =
    erigonSyncing === true ||
    lhIsSyncing === true ||
    (syncDistance !== null && syncDistance > 2) ||
    elOffline === true ||
    raw?.erigon?.ok === false ||
    raw?.lighthouse?.ok === false;

  // summary.mainnet is the cleanest source — only confirm mainnet, otherwise hide.
  const chain = summary.mainnet === true ? 'mainnet' : 'other';

  return {
    ok: true,
    block: block,
    slot: slot,
    peers: peers,
    syncing: syncing,
    chain: chain,
    updatedAt: now,
  };
}

function numOrNull(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

// Lighthouse REST returns numeric fields as strings (head_slot, sync_distance).
function strNumOrNull(v) {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v !== 'string' || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function boolOrNull(v) {
  return typeof v === 'boolean' ? v : null;
}

function jsonResponse(payload, opts) {
  const maxAge = (opts && opts.maxAge) || 30;
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': `public, max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=60`,
      // Same-origin only; no CORS by design.
    },
  });
}
