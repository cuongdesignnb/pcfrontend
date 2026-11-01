import { proxySeoText } from '../utils/seoBackend'

// IndexNow key file. Bing fetches it to confirm that URL submissions sent by
// the admin backend come from the owner of laptopplus.vn.
export default defineEventHandler(event => proxySeoText(event, '/indexnow-key.txt'))
