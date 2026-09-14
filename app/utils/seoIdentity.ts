export function nonEmptyText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function resolveSiteName(publicSetting: unknown, runtimeAppName: unknown): string {
  return nonEmptyText(publicSetting) || nonEmptyText(runtimeAppName)
}

/** Remove separators left at the end when an optional site name is absent. */
export function normalizeSeoTitle(value: unknown): string {
  return nonEmptyText(value).replace(/(?:\s*[-|:•]\s*)+$/, '').trim()
}
