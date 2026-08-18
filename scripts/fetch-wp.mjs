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

const UA = 'Mozilla/5.0 (compatible; HermesMigration/1.0)';

async function getAll(endpoint, perPage = 100) {
  const items = [];
  let page = 1;
  for (;;) {
    const url = `${BASE}/wp-json/wp/v2/${endpoint}?per_page=${perPage}&page=${page}&_embed`;
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
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
