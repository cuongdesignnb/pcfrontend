import { createError, getRequestURL } from 'h3'
import { proxySeoXml } from '../../utils/seoBackend'

// Read the shard from the path itself: with a `[shard].xml` file route the
// router param includes the extension (or is missing), so getRouterParam
// cannot be trusted here.
export default defineEventHandler(event => {
  const match = getRequestURL(event).pathname.match(/^\/sitemaps\/([a-z0-9-]+)\.xml$/)
  if (!match) {
    throw createError({ statusCode: 404, statusMessage: 'Sitemap shard not found' })
  }
  return proxySeoXml(event, `/sitemaps/${match[1]}.xml`)
})
