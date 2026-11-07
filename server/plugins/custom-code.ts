/**
 * "Mã tuỳ chỉnh đầu/cuối trang" from Cài đặt → SEO, printed as-is into every
 * server-rendered page: custom_head_code inside <head>, custom_body_code
 * before </body>. Only admins can edit these settings. Values are cached for a
 * minute; a backend error keeps the last values.
 */
interface CustomCode { head: string, body: string }

const TTL_MS = 60_000
let cache: { at: number, code: CustomCode } | null = null
let pending: Promise<CustomCode> | null = null

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

async function load(): Promise<CustomCode> {
  const origin = (process.env.NUXT_API_PROXY_TARGET || '').replace(/\/$/, '')
  if (!origin) return { head: '', body: '' }
  try {
    const settings = await $fetch<Record<string, unknown>>(`${origin}/api/v1/settings`, { timeout: 2000, retry: 0 })
    const code = { head: text(settings?.custom_head_code), body: text(settings?.custom_body_code) }
    cache = { at: Date.now(), code }
    return code
  } catch {
    cache = { at: Date.now(), code: cache?.code ?? { head: '', body: '' } }
    return cache.code
  }
}

async function customCode(): Promise<CustomCode> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.code
  pending ??= load().finally(() => { pending = null })
  return pending
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', async (html) => {
    const code = await customCode()
    if (code.head) html.head.push(code.head)
    if (code.body) html.bodyAppend.push(code.body)
  })
})
