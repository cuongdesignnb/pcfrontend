export const getSafeRedirect = (value: unknown, fallback = '/tai-khoan'): string => {
  const candidate = Array.isArray(value) ? value[0] : value
  if (typeof candidate !== 'string' || !candidate.startsWith('/') || candidate.startsWith('//')) {
    return fallback
  }

  return candidate
}
