import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    hmr: {
      overlay: false
    },
    watch: {
      usePolling: true,
      interval: 1000
    }
  },
  build: {
    // Split vendor chunks for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries - stable and rarely change
          react: ['react', 'react-dom'],
          // Router - changes less frequently than app code
          router: ['react-router-dom'],
          // UI libraries - relatively stable
          ui: ['@radix-ui/react-slot', 'class-variance-authority', 'clsx', 'tailwind-merge'],
          // Large utilities that don't change often
          supabase: ['@supabase/supabase-js'],
          // Icons - large but stable
          icons: ['lucide-react']
        }
      }
    },
    // Optimize bundle size
    chunkSizeWarningLimit: 1000,
    // Enable source maps for debugging
    sourcemap: false,
    // Minify for production
    minify: 'terser',
    terserOptions: {
      compress: {
        // Remove console logs in production
        drop_console: true,
        drop_debugger: true
      }
    },
    cssMinify: false
  },
  // Enable modern JS features for smaller bundles (ES2020+)
  esbuild: {
    target: 'es2020',
    // Remove console logs in production
    drop: ['console', 'debugger']
  },
  // Tree shaking and dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js'
    ]
  }
})