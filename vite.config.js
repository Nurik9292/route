import { fileURLToPath, URL } from 'node:url'
import path from 'path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  // server: {
  //   proxy: {
  //     '/api': {
  //         target: 'http://localhost:8081',
  //         changeOrigin: true,
  //         rewrite: (path) => path.replace(/^\/api/, '')
  //     }
  //   }
  // },

  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@modules': path.resolve(__dirname, './node_modules')
    }
  }
})
