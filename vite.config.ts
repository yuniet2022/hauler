
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    root: './',
    base: '/', // Cambiado de ./ a / para mejor manejo de rutas en Nginx
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      cors: true
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || env.API_KEY)
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
      minify: 'terser',
      rollupOptions: {
        output: {
          // Asegura que los nombres de archivo sean consistentes para Nginx
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]',
          manualChunks: {
            vendor: ['react', 'react-dom'],
            icons: ['lucide-react'],
            ai: ['@google/genai']
          }
        }
      }
    }
  }
})
