// @ts-check
import { defineConfig } from 'astro/config';

// Le site cible final (canonical). Surchargé par ASTRO_SITE pour la préversion.
const site = process.env.ASTRO_SITE || 'https://cmlk.ch';

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
});
