import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Em desenvolvimento, /api é encaminhado para a API local.
    proxy: {
      '/api': 'http://localhost:3333',
    },
  },
  build: {
    sourcemap: true,
  },
});
