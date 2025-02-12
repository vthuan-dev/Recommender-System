import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://tstore-backend.onrender.com',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '/assets': {
        target: 'https://tstore-backend.onrender.com',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})