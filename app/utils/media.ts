export function isUsablePublicImageUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const candidate = value.trim()
  if (!candidate) return false
  if (candidate.startsWith('/') && !candidate.startsWith('//')) return true

  try {
    const url = new URL(candidate)
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password
  } catch {
    return false
  }
}
