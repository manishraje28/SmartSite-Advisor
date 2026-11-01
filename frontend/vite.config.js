import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // The API URL is baked into the bundle at build time. Without it the app falls
  // back to http://localhost:5000, which on a deployed site means the visitor's own
  // machine — so refuse to build rather than ship a site that can't log anyone in.
  if (command === 'build') {
    const apiUrl = loadEnv(mode, process.cwd(), 'VITE_').VITE_APP_API_BASE_URL
    const onRender = !!process.env.RENDER // set by Render on every build
    if (!apiUrl || (onRender && apiUrl.includes('localhost'))) {
      throw new Error(
        'VITE_APP_API_BASE_URL must be set to the deployed API, e.g. https://smartsite-api.onrender.com/api'
      )
    }
  }

  return { plugins: [react()] }
})
