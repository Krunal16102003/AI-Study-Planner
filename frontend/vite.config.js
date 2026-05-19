import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  esbuild: {
    jsxInject: `import React from 'react'`
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('react') || id.includes('scheduler')) return 'react-vendor'
          if (id.includes('framer-motion') || id.includes('motion-')) return 'motion-vendor'
          if (id.includes('lucide-react')) return 'icons-vendor'
          if (id.includes('axios')) return 'http-vendor'
          return undefined
        }
      }
    }
  }
})
