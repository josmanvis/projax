import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'src/renderer',
  base: './', // Use relative paths for Electron file:// protocol
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer'),
    },
  },
  server: {
    port: 7898,
    strictPort: true,
    hmr: {
      clientPort: 7898,
    },
  },
});

