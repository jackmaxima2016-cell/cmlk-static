// Helpers de chargement des données WordPress extraites
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'data', 'wp');

function load(name) {
  const file = path.join(DATA_DIR, `${name}.json`);
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

export function getPosts() {
  // Tri identique à WordPress : date de publication décroissante
  return load('posts')
    .filter((p) => p.status === 'publish')
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function getPages() {
  return load('pages').filter((p) => p.status === 'publish');
}

export function getMedia() {
  return load('media');
}

export function getCategories() {
  return load('categories');
}

export function getTags() {
  return load('tags');
}

// Image à la une d'un post (via _embed)
export function getFeaturedImage(post) {
  const media = post._embedded?.['wp:featuredmedia']?.[0];
  if (media?.source_url) return media.source_url;
  if (media?.media_details?.sizes?.large?.source_url) return media.media_details.sizes.large.source_url;
  return null;
}

// Décodage des entités HTML (les champs WP sont encodés: &#039; &amp; ...)
export function decodeEntities(str = '') {
  return str
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/&rsquo;/g, '’')
    .replace(/&lsquo;/g, '‘')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&hellip;/g, '…');
}

// Texte brut d'un champ HTML rendu par WP
export function stripHtml(html = '') {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')).trim();
}

// Nombre d'articles par page (identique au réglage WordPress)
export const PAGE_SIZE = 10;
