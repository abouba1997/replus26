import { ensureSchema, LIST_COLUMNS } from '@/lib/db'
import { isReviewerAuthenticated } from '@/lib/auth'
import { csvResponse, dossiersPdf, pdfResponse, toCsv } from '@/lib/export'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: Request) {
  if (!(await isReviewerAuthenticated())) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const db = await ensureSchema()
  if (!db) return NextResponse.json({ error: 'Indisponible' }, { status: 503 })
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') || 'csv'
  const { rows } = await db.query(`SELECT ${LIST_COLUMNS} FROM applications ORDER BY created_at DESC`)
  if (format === 'pdf') {
    const pdf = await dossiersPdf(rows)
    return pdfResponse(pdf, 'replus-dossiers-2026.pdf')
  }
  return csvResponse(toCsv(rows), 'replus-dossiers-2026.csv')
}
