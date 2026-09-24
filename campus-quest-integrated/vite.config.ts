import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative base: the built site works at a domain root or a sub-path (e.g. GitLab Pages).
  base: './',
  build: {
    rollupOptions: {
      // Every mission page is its own entry so `npm run build` includes it.
      // The Society Fair mission is already pre-built and lives in public/missions/society.
      input: {
        main: resolve(__dirname, 'index.html'),
        jammie: resolve(__dirname, 'missions/jammie/index.html'),
        wellness: resolve(__dirname, 'missions/wellness/index.html'),
        studentCard: resolve(__dirname, 'missions/student-card/index.html'),
      },
    },
  },
});
