import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  // react-big-calendar's drag-and-drop addon is a deep CJS subpath import (not the package's main
  // entry), so Vite's dependency scanner doesn't auto-discover it for pre-bundling/ESM interop -
  // without this it fails at runtime with "withDragAndDrop is not a function".
  optimizeDeps: {
    include: ['react-big-calendar/lib/addons/dragAndDrop'],
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
