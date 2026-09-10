import { createError, getRouterParam } from 'h3'
import { proxySeoXml } from '../../utils/seoBackend'

export default defineEventHandler(event => {
  const shard = getRouterParam(event, 'shard') || ''
  if (!/^[a-z0-9-]+$/.test(shard)) {
    throw createError({ statusCode: 404, statusMessage: 'Sitemap shard not found' })
  }
  return proxySeoXml(event, `/sitemaps/${shard}.xml`)
})
