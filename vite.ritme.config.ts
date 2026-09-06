import path from "node:path"
import { fileURLToPath } from "node:url"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: path.resolve(rootDir, "ritme"),
  publicDir: path.resolve(rootDir, "public"),
  envDir: rootDir,
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    fs: {
      allow: [rootDir],
    },
  },
  preview: {
    port: 4174,
  },
  build: {
    outDir: path.resolve(rootDir, "dist-ritme"),
    emptyOutDir: true,
  },
})
