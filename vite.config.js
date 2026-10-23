import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
  // Fixed port; a service worker left behind by another project on a shared address
  // (e.g. 5173/5174) can otherwise hijack this app.
  server: { host: '127.0.0.1', port: 3000, strictPort: true, proxy: { '/api': 'http://localhost:8787' } },
})
