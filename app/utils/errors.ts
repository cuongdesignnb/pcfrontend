function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object'
    ? value as Record<string, unknown>
    : null
}

function asStatusCode(value: unknown): number | null {
  const status = typeof value === 'number'
    ? value
    : typeof value === 'string'
      ? Number(value)
      : Number.NaN

  return Number.isInteger(status) && status >= 100 && status <= 599 ? status : null
}

export function getErrorStatusCode(error: unknown, fallback = 500): number {
  const record = asRecord(error)
  if (!record) return fallback

  const response = asRecord(record.response)
  for (const candidate of [record.statusCode, record.status, response?.status]) {
    const status = asStatusCode(candidate)
    if (status !== null) return status
  }

  return fallback
}

export function hasErrorStatusCode(error: unknown): boolean {
  return getErrorStatusCode(error, 0) > 0
}
