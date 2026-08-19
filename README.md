# cmlk-static — Migration WordPress → Astro (SEO-safe)

Site statique Astro généré depuis l'API WordPress de **cmlk.ch** (modèle fluiid).
Déploiement : push `main` → GitHub Actions (fetch-wp non-bloquant → build → contrat SEO bloquant → `wrangler pages deploy`).

## Pipeline

```
WordPress (API REST) ──► fetch-wp ──► data/wp/*.json ──► Astro SSG ──► dist/
                                                            │
audit (référence SEO) ──► seo_contract.py ◄─────────────────┘
```

1. **Audit** (`audit_cmlk.json`) : inventaire SEO complet du WP (192 URLs : statut, title, canonical, H1, contenu).
2. **Génération** (`npm run fetch:wp && npm run build`) : Astro reproduit chaque URL à l'identique.
3. **Contrat SEO** (`scripts/seo_contract.py`) : compare le site généré à la référence, URL par URL. **Bloque la mise en prod si écart.**

## Commandes

```bash
npm run fetch:wp                 # extraction du contenu WordPress (WP_BASE/WP_HOST)
npm run build                    # génération statique (dist/)
python3 scripts/seo_contract.py data/audit_cmlk.json dist --posts data/wp/posts.json
```

## Particularités cmlk.ch

- Sidebar reproduisant les widgets ColorMag du WP : « Sponsorised » (liens externes du réseau conservés tels quels), « Articles récents », « Catégories ».
- 173 articles, 2 pages (contact + blog), 22 catégories, 274 tags.
- Images : `/wp-content/uploads/...` téléchargées dans `public/` (site autonome).
- Formulaire de commande de publications sponsorisées (packs CHF, Turnstile, Stripe/FormSubmit).
- L'accueil WP n'a pas de H1 : H1 sr-only ajouté, contrat SEO tolérant (comparaison H1 seulement si la référence en a un).
- Canonicals WP parfois en `http://` : comparaison normalisée https dans le contrat.

## Sécurité

- Jamais de secrets dans ce dépôt.
- Accès WP/GitHub/Cloudflare : `/home/hermes/migration/secrets.env` (chmod 600), hors git.
