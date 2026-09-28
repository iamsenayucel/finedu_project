/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: false,
    // e2e/ Playwright'ın kendi test runner'ına ait (playwright.config.ts) —
    // Vitest'in varsayılan *.spec.ts deseni onları da eşleştirip "Playwright
    // Test did not expect test() to be called here" hatasıyla patlatıyordu.
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
  },
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
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

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':  ['react', 'react-dom', 'react-router'],
          'vendor-motion': ['framer-motion'],
          'vendor-dnd':    ['react-dnd', 'react-dnd-html5-backend'],
        },
      },
    },
  },
})
