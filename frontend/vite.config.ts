import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// In production nginx proxies /api and /uploads to the backend, so the bundle
// ships with VITE_API_URL=/api. These dev-server proxies make that same
// relative URL work locally, which keeps one value correct in both modes.
const proxyTarget = process.env.VITE_PROXY_TARGET || 'http://localhost:4000';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: true,
      port: 3000,
      proxy: {
        '/api': { target: proxyTarget, changeOrigin: true },
        '/uploads': { target: proxyTarget, changeOrigin: true },
      },
      // HMR is disabled in AI Studio via the DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      // File watching off when DISABLE_HMR is true, to save CPU during agent edits.
      // Otherwise poll: inotify events do not cross a Windows/macOS bind mount.
      watch:
        process.env.DISABLE_HMR === 'true'
          ? null
          : { usePolling: process.env.VITE_POLL === 'true' },
    },
  };
});
