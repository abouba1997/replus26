import { NextResponse } from 'next/server'
import { ensureSchema, LIST_COLUMNS } from '@/lib/db'
import { isReviewerAuthenticated } from '@/lib/auth'
import { dossierPdf, pdfResponse } from '@/lib/export'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(
  _request: Request,
  context: { params: Promise<{ reference: string }> },
) {
  if (!(await isReviewerAuthenticated())) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const { reference } = await context.params
  const db = await ensureSchema()
  if (!db) return NextResponse.json({ error: 'Indisponible' }, { status: 503 })
  const { rows } = await db.query(`SELECT ${LIST_COLUMNS} FROM applications WHERE reference = $1`, [
    reference,
  ])
  if (!rows[0]) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  const pdf = await dossierPdf(rows[0])
  return pdfResponse(pdf, `${reference}.pdf`, true)
}
