import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react()],
    build: {
      // Default targets emit media-query range syntax (`width<=767px`), which
      // iOS Safari < 16.4 ignores, breaking every responsive rule on older
      // iPhones. These targets make the CSS use classic min-/max-width.
      cssTarget: ['chrome87', 'edge88', 'firefox78', 'safari14'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify — file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
