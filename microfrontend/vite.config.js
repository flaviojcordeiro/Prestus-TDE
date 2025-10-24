import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.BFF_URL || 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
