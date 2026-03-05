// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import node from '@astrojs/node';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'server',

  adapter: node({
    mode: 'standalone'
  }),

  integrations: [svelte()],

  vite: {
    plugins: [tailwindcss()],
    build: {
      // Enable rollup options for better chunking
      rollupOptions: {
        output: {
          // Manual chunks for better caching
          manualChunks: {
            'mongodb': ['mongodb'],
            'xlsx': ['xlsx'],
          }
        }
      }
    },
    optimizeDeps: {
      // Pre-bundle these for faster dev
      include: ['mongodb']
    }
  },
  
  // Add compression middleware
  compressHTML: true
});