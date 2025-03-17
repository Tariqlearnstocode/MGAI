import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  build: {
    outDir: 'dist',
    target: 'es2015',
    sourcemap: false,
    minify: 'terser',
    cssMinify: true,
    rollupOptions: {
      external: [
        '@react-pdf/renderer',
        'docx',
        'file-saver',
        'lucide-react',
        '@heroicons/react',
        'class-variance-authority',
        'clsx',
        'tailwind-merge',
        'openai',
        '@supabase/supabase-js',
        'stripe',
        'react-markdown',
        'rehype-sanitize',
        'rehype-stringify',
        'remark-parse',
        'remark-rehype'
      ],
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui': ['@headlessui/react'],
          'supabase': ['@supabase/auth-helpers-react', '@supabase/auth-ui-react', '@supabase/auth-ui-shared']
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/]
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020',
      supported: { bigint: true }
    }
  },
  ssr: {
    noExternal: ['react', 'react-dom', 'react-router-dom']
  }
});
