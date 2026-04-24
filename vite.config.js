import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const siteOrigin =
    process.env.VITE_SITE_ORIGIN ||
    (mode === 'development' ? 'http://localhost:5173' : 'https://mdy.kranz.design')

  return {
    plugins: [
      react(),
      {
        name: 'inject-site-origin-meta',
        transformIndexHtml(html) {
          return html.replaceAll('%SITE_ORIGIN%', siteOrigin)
        },
      },
    ],
  }
})
