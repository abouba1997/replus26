import { NextResponse } from 'next/server'
import { ensureSchema } from '@/lib/db'
import { isReviewerAuthenticated } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET() {
  if (!(await isReviewerAuthenticated())) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const db = await ensureSchema()
  if (!db) return NextResponse.json([])
  const { rows } = await db.query(
    `SELECT id, reference, to_email, subject, status, provider, created_at
     FROM email_outbox ORDER BY created_at DESC LIMIT 80`,
  )
  return NextResponse.json(rows)
}
