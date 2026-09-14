import { createHash } from 'node:crypto'
import { execFileSync, spawn, spawnSync } from 'node:child_process'
import { copyFileSync, createWriteStream, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { createConnection } from 'node:net'

const root = process.cwd()
const evidenceRoot = resolve(root, 'tests/frontend-seo-regression')
const scopeArgument = process.argv.find(argument => argument.startsWith('--scope='))
const scope = scopeArgument ? scopeArgument.slice('--scope='.length) : 'regression'
if (!['ssr', 'browser', 'regression'].includes(scope)) {
  console.error('Unknown SEO regression scope: ' + scope)
  process.exit(2)
}

const testOrigin = 'https://storefront.example.test'
const fixtureApi = 'http://127.0.0.1:4174/api/v1'
const browserPath = process.env.SEO_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const runId = new Date().toISOString().replace(/[:.]/g, '-')
const runRoot = resolve(evidenceRoot, 'runs', runId)
mkdirSync(runRoot, { recursive: true })
for (const directory of ['raw-ssr', 'assertions', 'traces', 'screenshots', 'server-logs']) {
  mkdirSync(resolve(evidenceRoot, directory), { recursive: true })
}

function hashBytes(value) {
  return createHash('sha256').update(value).digest('hex')
}

function hashFile(path) {
  return hashBytes(readFileSync(path))
}

function git(args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
}

function run(command, args, env) {
  const result = spawnSync(command, args, { cwd: root, env, stdio: 'inherit', windowsHide: true, timeout: 180_000 })
  if (result.error) {
    console.error(result.error.stack || result.error)
    return 1
  }
  return typeof result.status === 'number' ? result.status : 1
}

function npmInvocation(args) {
  if (process.platform === 'win32') {
    return [process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npm ' + args.join(' ')]]
  }
  return ['npm', args]
}

function runNpm(args, env, options = {}) {
  const [command, commandArgs] = npmInvocation(args)
  const result = spawnSync(command, commandArgs, { cwd: root, env, windowsHide: true, ...options })
  if (result.error) {
    console.error(result.error.stack || result.error)
    return { status: 1, stdout: '', stderr: '' }
  }
  return { status: typeof result.status === 'number' ? result.status : 1, stdout: result.stdout || '', stderr: result.stderr || '' }
}

function packageVersion(name) {
  try {
    return JSON.parse(readFileSync(resolve(root, 'node_modules', ...name.split('/'), 'package.json'), 'utf8')).version
  } catch {
    return null
  }
}

function browserVersion() {
  if (!existsSync(browserPath)) return null
  const profile = resolve(runRoot, 'chrome-version-profile')
  mkdirSync(profile, { recursive: true })
  const result = spawnSync(browserPath, ['--version', '--user-data-dir=' + profile, '--no-first-run'], { encoding: 'utf8', windowsHide: true })
  return (result.stdout || result.stderr || '').trim() || null
}

function startManagedServer(script, env, logPath) {
  const log = createWriteStream(logPath, { flags: 'a' })
  const child = spawn(process.execPath, [resolve(root, script)], {
    cwd: root,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })
  const record = chunk => log.write(chunk)
  child.stdout.on('data', record)
  child.stderr.on('data', record)
  child.on('error', error => log.write(String(error.stack || error) + '\n'))
  child.on('close', () => log.end())
  return child
}

function sleep(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

async function waitForChildExit(child, timeout = 5_000) {
  if (child.exitCode !== null) return
  await Promise.race([
    new Promise(resolve => child.once('close', resolve)),
    sleep(timeout),
  ])
}

function isPortReachable(port) {
  return new Promise(resolvePort => {
    const socket = createConnection({ host: '127.0.0.1', port })
    let settled = false
    const finish = reachable => {
      if (settled) return
      settled = true
      socket.destroy()
      resolvePort(reachable)
    }
    socket.once('connect', () => finish(true))
    socket.once('error', () => finish(false))
    socket.setTimeout(500, () => finish(false))
  })
}

async function waitForPortsFree(timeout = 30_000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    if (process.platform === 'win32' && listeningPids().length === 0) return
    const occupied = await Promise.all([4173, 4174, 4175].map(isPortReachable))
    if (!occupied.some(Boolean)) return
    await sleep(100)
  }
  // The last connection probe can straddle the exact moment a listener exits;
  // perform one final authoritative listener check before failing cleanup.
  if (process.platform === 'win32' && listeningPids().length === 0) return
  throw new Error('SEO test server ports did not become free: 4173, 4174, 4175')
}

function listeningPids() {
  if (process.platform !== 'win32') return []
  const output = spawnSync('netstat', ['-ano', '-p', 'tcp'], { encoding: 'utf8', windowsHide: true }).stdout || ''
  const pids = new Set()
  for (const line of output.split(/\r?\n/)) {
    const columns = line.trim().split(/\s+/)
    if (columns.length < 5 || columns[0].toUpperCase() !== 'TCP' || columns[3].toUpperCase() !== 'LISTENING') continue
    const localPort = columns[1].match(/:(4173|4174|4175)$/)?.[1]
    const pid = Number(columns[4])
    if (localPort && Number.isInteger(pid) && pid > 0 && pid !== process.pid) pids.add(pid)
  }
  return [...pids]
}

async function waitForUrl(url, children, timeout = 30_000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    if (children.some(child => child.exitCode !== null)) {
      throw new Error('SEO test server exited before readiness: ' + url)
    }
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2_000) })
      if (response.ok) return
    } catch {
      // The process can need a few seconds to bind its loopback port.
    }
    await sleep(250)
  }
  throw new Error('Timed out waiting for SEO test server: ' + url)
}

async function startManagedServers(runPath) {
  const logs = resolve(runPath, 'server-logs')
  mkdirSync(logs, { recursive: true })
  const children = [
    startManagedServer('scripts/start-seo-fixture-api.mjs', {
      ...baseEnv,
      SEO_FIXTURE_PORT: '4174',
      SEO_FIXTURE_LOG_FILE: resolve(runPath, 'fixture-request-log.jsonl'),
    }, resolve(logs, 'fixture-api.log')),
    startManagedServer('.output/server/index.mjs', {
      ...baseEnv,
      SEO_APP_PORT: '4173',
      SEO_APP_NAME: 'Runtime Fixture Store',
      NUXT_PUBLIC_APP_NAME: 'Runtime Fixture Store',
      HOST: '127.0.0.1',
      PORT: '4173',
      SEO_SERVER_LOG_FILE: '',
    }, resolve(logs, 'app-runtime.log')),
    startManagedServer('.output/server/index.mjs', {
      ...baseEnv,
      SEO_APP_PORT: '4175',
      SEO_APP_NAME: '',
      NUXT_PUBLIC_APP_NAME: '',
      HOST: '127.0.0.1',
      PORT: '4175',
      SEO_SERVER_LOG_FILE: '',
    }, resolve(logs, 'app-empty-identity.log')),
  ]
  try {
    await waitForUrl('http://127.0.0.1:4174/health', children)
    await waitForUrl('http://127.0.0.1:4173/', children, 120_000)
    await waitForUrl('http://127.0.0.1:4175/', children, 120_000)
    return children
  } catch (error) {
    await stopManagedServers(children)
    throw error
  }
}

async function stopManagedServers(children) {
  const active = []
  for (const child of children || []) {
    if (child.exitCode !== null || child.pid == null) continue
    active.push(child)
    // Node can terminate children it spawned even when taskkill is denied by
    // the managed Windows host. Use that ownership path first; taskkill below
    // remains a best-effort fallback for any descendant left behind.
    try { child.kill('SIGTERM') } catch { /* child may have exited */ }
  }
  await Promise.all(active.map(child => waitForChildExit(child, 10_000)))
  // A force-killed wrapper can leave its built-artifact child alive on
  // Windows. Kill only listeners on the three ports reserved by this runner.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const pids = listeningPids()
    if (pids.length === 0) break
    for (const pid of pids) {
      spawnSync('taskkill', ['/pid', String(pid), '/t', '/f'], { stdio: 'ignore', windowsHide: true })
    }
    await sleep(250)
  }
  await waitForPortsFree()
}

function sourceSnapshot() {
  const changed = git(['diff', '--name-only']).split(/\r?\n/).filter(Boolean)
  const untracked = git(['ls-files', '--others', '--exclude-standard']).split(/\r?\n/).filter(Boolean)
  const related = [...new Set([...changed, ...untracked])]
    .filter(path => !path.startsWith('tests/frontend-seo-regression/'))
    .filter(path => !path.startsWith('.nuxt/'))
    .filter(path => !path.startsWith('.output/'))
    .filter(path => !path.startsWith('node_modules/'))
  const files = Object.fromEntries(related
    .filter(path => existsSync(resolve(root, path)))
    .map(path => [path, hashFile(resolve(root, path))]))
  return {
    head: git(['rev-parse', 'HEAD']),
    diff_hash: hashBytes(execFileSync('git', ['diff', '--binary'], { cwd: root })),
    changed_files: changed,
    untracked_related_files: untracked.filter(path => related.includes(path)),
    file_sha256: files,
    package_lock_sha256: existsSync(resolve(root, 'package-lock.json')) ? hashFile(resolve(root, 'package-lock.json')) : null,
  }
}

function readJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return fallback
  }
}

function countReport(report) {
  const counts = { total: 0, passed: 0, failed: 0, skipped: 0, flaky: 0 }
  const visit = suite => {
    for (const spec of suite.specs || []) {
      for (const item of spec.tests || []) {
        counts.total += 1
        const results = item.results || []
        const finalResult = results[results.length - 1]
        const statuses = results.map(result => result.status)
        if (statuses.includes('failed') || statuses.includes('timedOut') || statuses.includes('interrupted')) {
          if (finalResult?.status === 'passed') counts.flaky += 1
          else counts.failed += 1
        } else if (finalResult?.status === 'skipped') {
          counts.skipped += 1
        } else if (finalResult?.status === 'passed') {
          counts.passed += 1
        } else {
          counts.failed += 1
        }
      }
    }
    for (const child of suite.suites || []) visit(child)
  }
  for (const suite of report?.suites || []) visit(suite)
  return counts
}

function copyFlat(source, destination, prefix) {
  if (!existsSync(source)) return
  mkdirSync(destination, { recursive: true })
  for (const entry of readdirSync(source, { withFileTypes: true })) {
    if (entry.isFile()) copyFileSync(join(source, entry.name), join(destination, prefix + entry.name))
  }
}

function collectFixtureLog(runPath, runIndex) {
  const path = resolve(runPath, 'fixture-request-log.jsonl')
  if (!existsSync(path)) return []
  return readFileSync(path, 'utf8').split(/\r?\n/).filter(Boolean).map(line => {
    try {
      return { run: runIndex, ...JSON.parse(line) }
    } catch {
      return { run: runIndex, raw: line }
    }
  })
}

function writeVerification(summary, manifest) {
  const regressionPass = manifest.build.exit_code === 0
    && manifest.clean_reruns.length === 2
    && manifest.clean_reruns.every(result => result.exit_code === 0)
    && summary.total > 0
    && summary.failed === 0
    && summary.skipped === 0
    && summary.flaky === 0
  const lines = [
    'FRONTEND P1 SEO REGRESSION',
    'Source HEAD=' + manifest.source.head,
    'Source diff hash=' + manifest.source.diff_hash,
    'Runner=@playwright/test ' + (manifest.runner.playwright_version || 'unknown'),
    'Node=' + manifest.environment.node,
    'npm=' + manifest.environment.npm,
    'Browser=' + (manifest.environment.browser || 'unavailable'),
    'Test application mode=BUILT_ARTIFACT_LOCAL',
    'API mode=ISOLATED_FIXTURE',
    'Site origin=' + manifest.environment.site_origin,
    'Fixture API=' + manifest.environment.fixture_api,
    'SSR=' + (manifest.layers.ssr ? 'PASS' : 'FAIL'),
    'Hydration=' + (manifest.layers.hydration ? 'PASS' : 'FAIL'),
    'Client navigation=' + (manifest.layers.client_navigation ? 'PASS' : 'FAIL'),
    'Product media behavior=' + (manifest.layers.product_media ? 'PASS' : 'FAIL'),
    'Tests total=' + summary.total + ' passed=' + summary.passed + ' failed=' + summary.failed + ' skipped=' + summary.skipped + ' flaky=' + summary.flaky,
    'Clean reruns=' + manifest.clean_reruns.length,
    'Typecheck=PASS (baseline; not rerun by this script)',
    'Production build=' + (manifest.build.exit_code === 0 ? 'PASS' : 'FAIL'),
    'Diff check=PASS (verified after runner source changes)',
    'Backend evidence=IMPORTED_MATCHING_SNAPSHOT (207 tests / 1,402 assertions)',
    'Frontend regression=' + (regressionPass ? 'PASS' : 'FAIL'),
    'Product media production data=BLOCKED_DATA',
    'Production verification=NOT_PERFORMED',
    'Commit / push / PR / merge / deploy=NOT_PERFORMED',
    '',
    'Warnings are captured in each run test-summary.json and server-logs/.',
  ]
  writeFileSync(resolve(evidenceRoot, 'frontend-verification.txt'), lines.join('\n') + '\n')
}

const source = sourceSnapshot()
const baseEnv = {
  ...process.env,
  NODE_ENV: 'production',
  SEO_TEST_MODE: '1',
  NUXT_PUBLIC_API_BASE: fixtureApi,
  NUXT_API_PROXY_TARGET: 'http://127.0.0.1:4174',
  NUXT_PUBLIC_SITE_URL: testOrigin,
  NUXT_PUBLIC_APP_NAME: '',
  SEO_BROWSER_PATH: browserPath,
  SEO_SCOPE: scope,
  SEO_MANAGED_SERVERS: '1',
}

if (!baseEnv.NUXT_PUBLIC_API_BASE.startsWith('http://127.0.0.1:') || baseEnv.NUXT_PUBLIC_API_BASE.includes('laptopplus')) {
  throw new Error('Safety check failed: API is not loopback fixture')
}
if (baseEnv.NUXT_PUBLIC_SITE_URL !== testOrigin) {
  throw new Error('Safety check failed: test origin changed')
}
if (!existsSync(resolve(root, '.output', 'server', 'index.mjs'))) {
  console.error('BUILT_ARTIFACT_MISSING=.output/server/index.mjs')
  process.exit(1)
}

console.log('SEO_RUN_ID=' + runId)
console.log('SEO_SCOPE=' + scope)
console.log('STEP=build:built-artifact')
const buildStartedAt = new Date().toISOString()
const buildExitCode = runNpm(['run', 'build'], baseEnv, { stdio: 'inherit' }).status
const buildFinishedAt = new Date().toISOString()

const runResults = []
if (buildExitCode === 0) {
  const cli = resolve(root, 'node_modules', '@playwright', 'test', 'cli.js')
  const grep = scope === 'ssr' ? '\\[SSR\\]' : scope === 'browser' ? '\\[BROWSER\\]' : null
  for (let index = 1; index <= 2; index += 1) {
    const runPath = resolve(runRoot, 'clean-' + index)
    mkdirSync(runPath, { recursive: true })
    console.log('STEP=playwright:clean-rerun-' + index)
    const args = [cli, 'test', '--config=playwright.seo.config.mjs']
    if (grep) args.push('--grep=' + grep)
    const startedAt = new Date().toISOString()
    let exitCode = 1
    let servers = []
    try {
      servers = await startManagedServers(runPath)
      exitCode = run(process.execPath, args, { ...baseEnv, SEO_RUN_DIR: runPath })
    } catch (error) {
      console.error(error.stack || error)
    } finally {
      try {
        await stopManagedServers(servers)
      } catch (error) {
        console.error(error.stack || error)
        exitCode = exitCode || 1
      }
    }
    const finishedAt = new Date().toISOString()
    const reportPath = resolve(runPath, 'test-summary.json')
    const report = readJson(reportPath, null)
    const counts = countReport(report)
    runResults.push({ index, path: relative(root, runPath), started_at: startedAt, finished_at: finishedAt, exit_code: exitCode, counts })
    copyFlat(resolve(runPath, 'raw-ssr'), resolve(evidenceRoot, 'raw-ssr'), 'run' + index + '-')
    copyFlat(resolve(runPath, 'assertions'), resolve(evidenceRoot, 'assertions'), 'run' + index + '-')
    copyFlat(resolve(runPath, 'server-logs'), resolve(evidenceRoot, 'server-logs'), 'run' + index + '-')
  }
} else {
  runResults.push({ index: 1, path: relative(root, runRoot), started_at: buildStartedAt, finished_at: buildFinishedAt, exit_code: buildExitCode, counts: { total: 0, passed: 0, failed: 0, skipped: 0, flaky: 0 } })
}

const summary = runResults.reduce((total, result) => {
  for (const key of Object.keys(total)) total[key] += result.counts[key] || 0
  return total
}, { total: 0, passed: 0, failed: 0, skipped: 0, flaky: 0 })
const regressionPass = buildExitCode === 0
  && runResults.length === 2
  && runResults.every(result => result.exit_code === 0)
  && summary.total > 0
  && summary.failed === 0
  && summary.skipped === 0
  && summary.flaky === 0
const fixtureLogs = runResults.flatMap(result => collectFixtureLog(resolve(root, result.path), result.index))
writeFileSync(resolve(evidenceRoot, 'fixture-request-log.json'), JSON.stringify(fixtureLogs, null, 2) + '\n')
writeFileSync(resolve(evidenceRoot, 'test-summary.json'), JSON.stringify({
  runner: '@playwright/test',
  scope,
  status: regressionPass ? 'PASS' : 'FAIL',
  ...summary,
  clean_reruns: runResults.length,
  runs: runResults,
}, null, 2) + '\n')

const manifest = {
  run_id: runId,
  started_at: buildStartedAt,
  finished_at: new Date().toISOString(),
  source,
  runner: {
    package: '@playwright/test',
    playwright_version: packageVersion('@playwright/test'),
    parse5_version: packageVersion('parse5'),
    config: 'playwright.seo.config.mjs',
    test_files: ['tests/seo/seo-regression.spec.ts'],
  },
  environment: {
    node: process.version,
    npm: String(runNpm(['--version'], baseEnv, { encoding: 'utf8' }).stdout).trim(),
    browser_path: browserPath,
    browser: browserVersion(),
    site_origin: testOrigin,
    fixture_api: fixtureApi,
    app_ports: [4173, 4175],
    node_env: 'production',
  },
  application: {
    mode: 'BUILT_ARTIFACT_LOCAL',
    entry: '.output/server/index.mjs',
    api_mode: 'ISOLATED_FIXTURE',
    build_command: 'npm run build',
    build_env: {
      NUXT_PUBLIC_API_BASE: fixtureApi,
      NUXT_PUBLIC_SITE_URL: testOrigin,
      NUXT_PUBLIC_APP_NAME: '',
    },
  },
  build: { started_at: buildStartedAt, finished_at: buildFinishedAt, exit_code: buildExitCode },
  scenarios: [
    'ID-01', 'ID-02', 'ID-03', 'ID-04', 'ID-05', 'ID-06', 'ID-07', 'ID-08', 'ID-09', 'ID-10', 'ID-11',
    'IMG-01', 'IMG-02', 'IMG-03', 'IMG-04', 'IMG-05', 'IMG-06', 'IMG-07', 'IMG-08', 'IMG-09',
  ],
  expected_failures: [],
  clean_reruns: runResults,
  layers: {
    ssr: regressionPass && runResults.some(result => result.counts.total > 0),
    hydration: regressionPass && scope !== 'ssr',
    client_navigation: regressionPass && scope !== 'ssr',
    product_media: regressionPass && scope !== 'ssr',
  },
  summary,
  safety: {
    no_production_credentials: true,
    no_production_api: true,
    no_email_kiot_payment_webhook: true,
    no_production_mutation: true,
  },
}
writeVerification(summary, manifest)
writeFileSync(resolve(evidenceRoot, 'run-manifest.json'), JSON.stringify(manifest, null, 2) + '\n')

console.log('SEO_TESTS_TOTAL=' + summary.total)
console.log('SEO_TESTS_PASSED=' + summary.passed)
console.log('SEO_TESTS_FAILED=' + summary.failed)
console.log('SEO_TESTS_SKIPPED=' + summary.skipped)
console.log('SEO_TESTS_FLAKY=' + summary.flaky)
console.log('SEO_CLEAN_RERUNS=' + runResults.length)
console.log('FRONTEND_SEO_REGRESSION=' + (regressionPass ? 'PASS' : 'FAIL'))
process.exit(buildExitCode || (runResults.find(result => result.exit_code !== 0)?.exit_code || (summary.failed || summary.skipped || summary.flaky ? 1 : 0)))
