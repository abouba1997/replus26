import { handler } from '@/lib/edgestore-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export { handler as GET, handler as POST }
