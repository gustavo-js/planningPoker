import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/planningPoker/',
  test: {
    environment: 'node',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
})
