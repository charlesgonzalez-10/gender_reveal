/// <reference types="vitest/config" />
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Emulates Vercel's filesystem-based /api routes during `vite dev`, so the
 * serverless functions under api/ can be exercised locally without the
 * Vercel CLI. Not used in the production build — Vercel's own platform
 * serves api/ directly there.
 */
function vercelApiDevMiddleware(): Plugin {
  return {
    name: 'vercel-api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) return next()
        const urlPath = req.url.split('?')[0]
        const modPath = path.join(dirname, `${urlPath}.ts`)
        if (!existsSync(modPath)) return next()

        let body: unknown
        if (req.method && req.method !== 'GET' && req.method !== 'HEAD') {
          const chunks: Buffer[] = []
          for await (const chunk of req) chunks.push(chunk as Buffer)
          const raw = Buffer.concat(chunks).toString('utf8')
          if (raw) {
            try {
              body = JSON.parse(raw)
            } catch {
              body = undefined
            }
          }
        }

        const vercelReq = req as typeof req & { body?: unknown }
        vercelReq.body = body
        const vercelRes = res as typeof res & { status: (code: number) => typeof res; json: (data: unknown) => void }
        vercelRes.status = (code: number) => {
          res.statusCode = code
          return res
        }
        vercelRes.json = (data: unknown) => {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(data))
        }

        try {
          const mod = await server.ssrLoadModule(modPath)
          await (mod.default as (req: unknown, res: unknown) => Promise<void>)(vercelReq, vercelRes)
        } catch (err) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), vercelApiDevMiddleware()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
