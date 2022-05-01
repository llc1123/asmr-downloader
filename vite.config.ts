import { resolve } from 'path'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        download: resolve(__dirname, 'download.html'),
      },
    },
    assetsDir: './',
  },
  plugins: [react()],
})
