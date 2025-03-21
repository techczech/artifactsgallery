import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Get the repository name from package.json to ensure consistency
const pkgJson = require('./package.json');
const repoName = pkgJson.name === 'artifact-viewer' 
  ? 'claude-artifact-runner' 
  : pkgJson.repository?.url?.match(/\/([^\/]+)\.git$/)?.[1] || 'claude-artifact-runner';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const isProduction = command === 'build';
  
  return {
    // Use base path only in production (GitHub Pages)
    base: isProduction ? `/${repoName}/` : '/',
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