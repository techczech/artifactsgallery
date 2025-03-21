import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const isProduction = command === 'build';
  
  return {
    // Use base path only in production (GitHub Pages)
    base: isProduction ? '/artifactsgallery/' : '/',
    plugins: [
      react(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        'src': path.resolve(__dirname, './src'),
      },
    }
  }
})