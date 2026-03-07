import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  root: '.',
  build: {
    outDir: '../self-growth',
    emptyDirOutDir: true,
  },
  plugins: [react(), tailwindcss()],
})
