import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// VITE_BASE_PATH : "/" par défaut (Vercel, local) ; "/nom-du-depot/" pour GitHub Pages
export default defineConfig({ base: process.env.VITE_BASE_PATH || '/', plugins: [react()] })
