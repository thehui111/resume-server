import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/auth': 'http://localhost:8312',
      '^/resume/': 'http://localhost:8312',
      '/ai': 'http://localhost:8312',
      '/avatar': 'http://localhost:8312',
      '/image': 'http://localhost:8312',
    },
    historyApiFallback: true,
  },
})
