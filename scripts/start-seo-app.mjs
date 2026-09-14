import { appendFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { spawn } from 'node:child_process'

const port = Number(process.env.SEO_APP_PORT || 4173)
const logFile = process.env.SEO_SERVER_LOG_FILE || ''
const entry = resolve(process.cwd(), '.output/server/index.mjs')

if (logFile) mkdirSync(dirname(logFile), { recursive: true })

function record(stream, chunk) {
  const value = chunk.toString()
  if (logFile) appendFileSync(logFile, value)
  stream.write(chunk)
}

const child = spawn(process.execPath, [entry], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    NODE_ENV: 'production',
    HOST: '127.0.0.1',
    PORT: String(port),
    NUXT_PUBLIC_API_BASE: 'http://127.0.0.1:4174/api/v1',
    NUXT_PUBLIC_SITE_URL: 'https://storefront.example.test',
    NUXT_PUBLIC_APP_NAME: process.env.SEO_APP_NAME || '',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
})

child.stdout.on('data', chunk => record(process.stdout, chunk))
child.stderr.on('data', chunk => record(process.stderr, chunk))
child.on('error', error => {
  process.stderr.write(String(error.stack || error) + '\n')
  process.exitCode = 1
})
child.on('exit', (code, signal) => {
  process.exit(code || (signal ? 1 : 0))
})

function shutdown() {
  if (!child.killed) child.kill()
  setTimeout(() => process.exit(1), 2_000).unref()
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
