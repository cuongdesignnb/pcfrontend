import { defineConfig } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const runDir = resolve(process.env.SEO_RUN_DIR || 'tests/frontend-seo-regression')
const serverLogs = resolve(runDir, 'server-logs')
mkdirSync(serverLogs, { recursive: true })

export default defineConfig({
  testDir: './tests/seo',
  testMatch: '**/*.spec.ts',
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  forbidOnly: true,
  outputDir: resolve(runDir, 'traces'),
  reporter: [
    ['line'],
    ['json', { outputFile: resolve(runDir, 'test-summary.json') }],
  ],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    headless: true,
    ignoreHTTPSErrors: false,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    launchOptions: {
      executablePath: process.env.SEO_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    },
  },
  webServer: process.env.SEO_MANAGED_SERVERS === '1' ? undefined : [
    {
      command: 'node scripts/start-seo-fixture-api.mjs',
      url: 'http://127.0.0.1:4174/health',
      cwd: process.cwd(),
      timeout: 30_000,
      reuseExistingServer: false,
      gracefulShutdown: { signal: 'SIGTERM', timeout: 1_000 },
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        SEO_FIXTURE_PORT: '4174',
        SEO_FIXTURE_LOG_FILE: resolve(runDir, 'fixture-request-log.jsonl'),
      },
    },
    {
      command: 'node scripts/start-seo-app.mjs',
      url: 'http://127.0.0.1:4173/',
      cwd: process.cwd(),
      timeout: 120_000,
      reuseExistingServer: false,
      gracefulShutdown: { signal: 'SIGTERM', timeout: 1_000 },
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        SEO_APP_PORT: '4173',
        SEO_APP_NAME: 'Runtime Fixture Store',
        SEO_SERVER_LOG_FILE: resolve(serverLogs, 'app-runtime.log'),
      },
    },
    {
      command: 'node scripts/start-seo-app.mjs',
      url: 'http://127.0.0.1:4175/',
      cwd: process.cwd(),
      timeout: 120_000,
      reuseExistingServer: false,
      gracefulShutdown: { signal: 'SIGTERM', timeout: 1_000 },
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        SEO_APP_PORT: '4175',
        SEO_APP_NAME: '',
        SEO_SERVER_LOG_FILE: resolve(serverLogs, 'app-empty-identity.log'),
      },
    },
  ],
})
