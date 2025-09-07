import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load env variables from .env files
  const env = loadEnv(mode, process.cwd(), '')

  console.log("API Base URL from .env:", env.VITE_API_URL)

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_API_URL, // ✅ use from .env
          changeOrigin: true,
        },
      },
    },
  }
})
