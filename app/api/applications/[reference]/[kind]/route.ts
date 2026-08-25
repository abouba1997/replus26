import { NextResponse } from 'next/server'
import { ensureSchema } from '@/lib/db'
import { isReviewerAuthenticated } from '@/lib/auth'
import { decryptBuffer } from '@/lib/crypto-docs'
import { isDocKind } from '@/lib/docs'
import { isEdgeStoreUrl } from '@/lib/edgestore-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const FILES = {
  passport: ['passport_blob', 'passport_data', 'passport_mime', 'passport_name'],
  bank: ['bank_blob', 'bank_data', 'bank_mime', 'bank_name'],
  nina: ['nina_blob', 'nina_data', 'nina_mime', 'nina_name'],
} as const

export async function GET(
  _request: Request,
  context: { params: Promise<{ reference: string; kind: string }> },
) {
  if (!(await isReviewerAuthenticated())) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const { reference, kind } = await context.params
  if (!isDocKind(kind)) {
    return NextResponse.json({ error: 'Document inconnu' }, { status: 404 })
  }
  const columns = FILES[kind]
  const db = await ensureSchema()
  if (!db) return NextResponse.json({ error: 'Indisponible' }, { status: 503 })
  const { rows } = await db.query(
    `SELECT ${columns[0]} AS blob, ${columns[1]} AS data, ${columns[2]} AS mime, ${columns[3]} AS name
     FROM applications WHERE reference = $1`,
    [reference],
  )
  const row = rows[0]
  if (!row) {
    return NextResponse.json({ error: 'Fichier introuvable' }, { status: 404 })
  }

  try {
    await db.query(
      `INSERT INTO application_events (reference, actor, action, detail) VALUES ($1,$2,$3,$4)`,
      [reference, 'reviewer', 'document', kind],
    )
  } catch {
    /* audit trail should never block a download */
  }

  if (typeof row.blob === 'string' && row.blob) {
    if (!isEdgeStoreUrl(row.blob)) {
      return NextResponse.json({ error: 'Fichier introuvable' }, { status: 404 })
    }
    return NextResponse.redirect(row.blob, 302)
  }

  if (!row.data) {
    return NextResponse.json({ error: 'Fichier introuvable' }, { status: 404 })
  }

  const buffer = Buffer.isBuffer(row.data) ? row.data : Buffer.from(row.data)
  let body: Uint8Array
  try {
    body = new Uint8Array(decryptBuffer(buffer))
  } catch {
    body = new Uint8Array(buffer)
  }

  return new NextResponse(body, {
    headers: {
      'Content-Type': row.mime || 'application/octet-stream',
      'Content-Disposition': `inline; filename="${encodeURIComponent(row.name || kind)}"`,
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
