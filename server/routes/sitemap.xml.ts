import { proxySeoXml } from '../utils/seoBackend'

export default defineEventHandler(event => proxySeoXml(event, '/sitemap.xml'))
