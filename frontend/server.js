/**
 * Production static server for cPanel / Passenger / Node hosts.
 * Requires `dist/` from `npm run build`. Uses PORT from the environment.
 *
 * NOTE: On some hosts PORT is a Unix socket path, not a number — never use Number(PORT).
 */
import fs from 'fs'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.join(__dirname, 'dist')
const indexHtml = path.join(distDir, 'index.html')

if (!fs.existsSync(indexHtml)) {
  console.error(
    '[proj-cicero] FATAL: dist/index.html not found.\n' +
      `Expected: ${indexHtml}\n` +
      'Build locally (npm run build) and upload the entire dist/ folder next to server.js.',
  )
  process.exit(1)
}

const app = express()

app.use(express.static(distDir))

app.get('*', (_req, res) => {
  res.sendFile(indexHtml)
})

const rawPort = process.env.PORT
const listenCb = () => {
  console.error(`[proj-cicero] listening on ${rawPort ?? 3000}`)
}

/** Prefer stderr so host log panels often capture startup messages */
try {
  if (rawPort === undefined) {
    app.listen(3000, '0.0.0.0', listenCb)
  } else if (/^\d+$/.test(String(rawPort))) {
    app.listen(Number(rawPort), '0.0.0.0', listenCb)
  } else {
    // Unix socket / pipe (Passenger-style): path must not get Number() coercion
    app.listen(rawPort, listenCb)
  }
} catch (err) {
  console.error('[proj-cicero] listen() failed:', err)
  process.exit(1)
}
