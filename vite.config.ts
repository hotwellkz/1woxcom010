import { vitePlugin as remix } from '@remix-run/dev';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import UnoCSS from 'unocss/vite';
import * as dotenv from 'dotenv';
import { execSync } from 'child_process';

dotenv.config();

// Get git hash with fallback
const getGitHash = () => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'unknown';
  }
};

// Get available port
const getPort = () => {
  const port = process.env.PORT || '3004';
  return parseInt(port, 10);
};

export default defineConfig({
  define: {
    __COMMIT_HASH__: JSON.stringify(getGitHash()),
    'process.env.NODE_DEBUG': 'false',
    'global': {},
  },
  resolve: {
    alias: {
      path: 'path-browserify',
      stream: 'stream-browserify',
      util: 'util/',
      buffer: 'buffer/',
    },
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      external: ['fsevents'],
    },
  },
  optimizeDeps: {
    include: [
      '@remix-run/react', 
      '@remix-run/server-runtime',
      'path-browserify',
      'stream-browserify',
      'util',
      'buffer',
    ],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  server: {
    port: getPort(),
    proxy: {
      '/ws': {
        target: `ws://localhost:${getPort()}`,
        ws: true,
      },
      '/api': {
        target: `http://localhost:${getPort()}`,
        changeOrigin: true,
      },
    },
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_lazyRouteDiscovery: true,
      },
    }),
    UnoCSS(),
    tsconfigPaths(),
  ],
});
