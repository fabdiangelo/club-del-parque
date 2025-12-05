import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


const PROJECT = 'club-del-parque-8ec2a'
const REGION  = 'us-central1'  
const FUNC    = 'api'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: `https://us-central1-club-del-parque-8ec2a.cloudfunctions.net`,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''), 
      },
    },
  },
  preview: {
    proxy: {
      '/api': {
        target: `https://us-central1-club-del-parque-8ec2a.cloudfunctions.net`,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
