import { NextResponse } from 'next/server'
import { ensureSchema } from '@/lib/db'
import { isReviewerAuthenticated } from '@/lib/auth'
import { decryptBuffer } from '@/lib/crypto-docs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const FILES = {
  passport: ['passport_data', 'passport_mime', 'passport_name'],
  bank: ['bank_data', 'bank_mime', 'bank_name'],
  nina: ['nina_data', 'nina_mime', 'nina_name'],
} as const

export async function GET(
  _request: Request,
  context: { params: Promise<{ reference: string; kind: string }> },
) {
  if (!(await isReviewerAuthenticated())) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const { reference, kind } = await context.params
  const columns = FILES[kind as keyof typeof FILES]
  if (!columns) {
    return NextResponse.json({ error: 'Document inconnu' }, { status: 404 })
  }
  const db = await ensureSchema()
  if (!db) return NextResponse.json({ error: 'Indisponible' }, { status: 503 })
  const { rows } = await db.query(
    `SELECT ${columns[0]} AS data, ${columns[1]} AS mime, ${columns[2]} AS name
     FROM applications WHERE reference = $1`,
    [reference],
  )
  const row = rows[0]
  if (!row?.data) {
    return NextResponse.json({ error: 'Fichier introuvable' }, { status: 404 })
  }
  const buffer = Buffer.isBuffer(row.data) ? row.data : Buffer.from(row.data)
  let file = buffer
  try {
    file = decryptBuffer(buffer)
  } catch {
    file = buffer
  }
  try {
    await db.query(
      `INSERT INTO application_events (reference, actor, action, detail) VALUES ($1,$2,$3,$4)`,
      [reference, 'reviewer', 'document', kind],
    )
  } catch {
    /* audit trail should never block a download */
  }
  return new NextResponse(new Uint8Array(file), {
    headers: {
      'Content-Type': row.mime || 'application/octet-stream',
      'Content-Disposition': `inline; filename="${encodeURIComponent(row.name || kind)}"`,
    },
  })
}
