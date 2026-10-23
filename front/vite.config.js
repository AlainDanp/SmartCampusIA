import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// En dev (npm run dev), /api est redirigé vers l'API locale. En prod, Express sert le front compilé et l'API.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3000' },
  },
});
