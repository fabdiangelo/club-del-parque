import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa';
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


const PROJECT = 'club-del-parque-68530'
const REGION  = 'us-central1'  
const FUNC    = 'api'

export default defineConfig({
  plugins: [react(), tailwindcss(), VitePWA({
      registerType: 'autoUpdate',
      manifest: require('./public/manifest.json'),
      devOptions: {
        enabled: true
      }
    })],
  server: {
    proxy: {
      '/api': {
        target: `http://127.0.0.1:5001/${PROJECT}/${REGION}/${FUNC}`,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''), 
      },
    },
  },
  preview: {
    proxy: {
      '/api': {
        target: `http://127.0.0.1:5001/${PROJECT}/${REGION}/${FUNC}`,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
