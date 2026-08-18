#!/usr/bin/env node
/**
 * Extraction de l'ensemble du contenu WordPress via l'API REST.
 * Écrit les données dans ../data/wp/ (posts, pages, media, categories, tags).
 *
 * Usage: node scripts/fetch-wp.mjs [https://domaine.ch]
 * Env :  WP_BASE (URL du WordPress, défaut https://fluiid.ch)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = (process.env.WP_BASE || process.argv[2] || 'https://fluiid.ch').replace(/\/$/, '');
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'wp');
fs.mkdirSync(OUT, { recursive: true });

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

// GET avec 3 tentatives + backoff (les runners cloud peuvent être rate-limités)
async function fetchRetry(url, attempts = 3) {
  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, 'Accept': 'application/json' },
        signal: AbortSignal.timeout(30000),
      });
      if (res.ok) return res;
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastErr = err;
    }
    console.warn(`  [retry ${i}/${attempts}] ${url.split('/wp-json')[1]} -> ${lastErr.message}`);
    await new Promise((r) => setTimeout(r, 2000 * i));
  }
  throw lastErr;
}

async function getAll(endpoint, perPage = 100) {
  const items = [];
  let page = 1;
  for (;;) {
    const url = `${BASE}/wp-json/wp/v2/${endpoint}?per_page=${perPage}&page=${page}&_embed`;
    const res = await fetchRetry(url);
    if (!res.ok) {
      console.warn(`  [warn] ${endpoint} page ${page} -> HTTP ${res.status}`);
      break;
    }
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    items.push(...batch);
    const total = Number(res.headers.get('x-wp-total') || 0);
    if (items.length >= total || batch.length < perPage) break;
    page += 1;
  }
  return items;
}

async function main() {
  console.log(`[fetch-wp] Extraction depuis ${BASE}`);
  for (const endpoint of ['posts', 'pages', 'media', 'categories', 'tags']) {
    const items = await getAll(endpoint);
    const file = path.join(OUT, `${endpoint}.json`);
    fs.writeFileSync(file, JSON.stringify(items, null, 1));
    console.log(`[fetch-wp] ${endpoint}: ${items.length} -> data/wp/${endpoint}.json`);
    await new Promise((r) => setTimeout(r, 400));
  }
  console.log('[fetch-wp] Terminé.');
}

main().catch((e) => {
  console.error('[fetch-wp] Erreur:', e.message);
  process.exit(1);
});
