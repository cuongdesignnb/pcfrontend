import { proxySeoText } from '../utils/seoBackend'

export default defineEventHandler(event => proxySeoText(event, '/llms.txt'))
