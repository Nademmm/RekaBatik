import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  // Dev server settings to prevent unexpected reloads
  server: {
    watch: {
      // Ignore certain files to prevent unnecessary reloads
      ignored: ['**/node_modules/**', '**/.git/**'],
    },
    // Disable HMR for specific files if needed, but keep it enabled for most
    hmr: {
      overlay: false, // Disable the error overlay to prevent distractions
    },
  },
})
