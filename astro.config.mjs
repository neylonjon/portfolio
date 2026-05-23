// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';

export default defineConfig({
  output: 'server',

  adapter: vercel({
    webAnalytics: { enabled: false },
    maxDuration: 10,
  }),

  integrations: [react()],

  site: 'https://jonneylon.com',

  vite: {
    plugins: [tailwindcss()],
  },

  prefetch: {
    prefetchAll: false,
  },
});