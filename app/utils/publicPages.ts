import type { PublicPage } from '~/types/public-page'

export function parsePublicPage(value: unknown): PublicPage | null {
  if (!value || typeof value !== 'object' || !('page' in value)) return null
  const page = value.page
  if (!page || typeof page !== 'object') return null
  const record = page as Record<string, unknown>
  if (!Number.isInteger(record.id) || Number(record.id) < 1
    || typeof record.title !== 'string' || !record.title.trim()
    || typeof record.slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.slug)
    || typeof record.body !== 'string'
    || record.canonical_path !== `/${record.slug}`
    || ![record.meta_title, record.meta_description, record.updated_at].every(value => value == null || typeof value === 'string')) return null
  return {
    id: Number(record.id), title: record.title.trim(), slug: record.slug,
    body: record.body, canonical_path: `/${record.slug}`,
    meta_title: typeof record.meta_title === 'string' ? record.meta_title : null,
    meta_description: typeof record.meta_description === 'string' ? record.meta_description : null,
    updated_at: typeof record.updated_at === 'string' ? record.updated_at : null,
  }
}
