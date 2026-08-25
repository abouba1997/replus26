import { NextResponse } from 'next/server'
import { ensureSchema, getPool, LIST_COLUMNS, makeReference } from '@/lib/db'
import { isReviewerAuthenticated } from '@/lib/auth'
import { isApplicationOpen } from '@/lib/deadline'
import { applicationReceipt, sendMail } from '@/lib/email'
import {
  confirmApplicationDocs,
  deleteApplicationDocs,
  isEdgeStoreUrl,
} from '@/lib/edgestore-server'
import { maxUploadLabel } from '@/lib/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
])
const ALLOWED_EXT = /\.(pdf|jpe?g|png|webp)$/i

const REQUIRED_FIELDS = [
  'prenomNom',
  'profession',
  'email',
  'telephone',
  'organisationNom',
  'organisationAdresse',
  'dateCreation',
  'secteur',
  'chiffreAffaires',
  'nombreEmployes',
  'salonInternational',
  'projetConcret',
  'raisons',
  'visaUsa',
] as const

type StoredDoc = {
  name: string
  mime: string
  url: string
}

function collectFields(source: Record<string, string>) {
  const field = (key: string) => String(source[key] ?? '').trim()
  const missing = REQUIRED_FIELDS.some((key) => !field(key))
  const consent = source.consent === 'true' || source.consent === 'on'
  return { field, missing, consent }
}

function parseDoc(value: unknown): StoredDoc | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const url = String(record.url ?? '').trim()
  const name = String(record.name ?? '').trim()
  const mime = String(record.mime ?? '').trim()
  if (!url || !name) return null
  if (!isEdgeStoreUrl(url)) throw new Error('FILE_URL')
  const typeOk = ALLOWED_TYPES.has(mime) || ALLOWED_EXT.test(name)
  if (!typeOk) throw new Error('FILE_TYPE')
  return { url, name, mime: mime || 'application/octet-stream' }
}

async function persistApplication(
  field: (key: string) => string,
  passport: StoredDoc,
  bank: StoredDoc,
  nina: StoredDoc,
) {
  const db = await ensureSchema()
  const reference = makeReference()
  if (!db) return reference
  await db.query(
    `INSERT INTO applications (
      reference, prenom_nom, nom, profession, email, telephone, organisation_nom, entreprise,
      organisation_adresse, date_creation, secteur, chiffre_affaires, nombre_employes,
      salon_international, projet_concret, raisons, visa_usa, passport_name, passport_mime,
      passport_blob, bank_name, bank_mime, bank_blob, nina_name, nina_mime, nina_blob, consent,
      docs_encrypted
    ) VALUES (
      $1,$2,$2,$3,$4,$5,$6,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24, TRUE, FALSE
    )`,
    [
      reference,
      field('prenomNom'),
      field('profession'),
      field('email').toLowerCase(),
      field('telephone'),
      field('organisationNom'),
      field('organisationAdresse'),
      field('dateCreation'),
      field('secteur'),
      field('chiffreAffaires'),
      field('nombreEmployes'),
      field('salonInternational'),
      field('projetConcret'),
      field('raisons'),
      field('visaUsa'),
      passport.name,
      passport.mime,
      passport.url,
      bank.name,
      bank.mime,
      bank.url,
      nina.name,
      nina.mime,
      nina.url,
    ],
  )
  return reference
}

async function sendReceipts(field: (key: string) => string, reference: string) {
  const locale = field('locale') || 'fr'
  const receipt = applicationReceipt({
    name: field('prenomNom'),
    reference,
    locale,
  })
  const contact = process.env.CONTACT_EMAIL || 'replusevent@amchammali.org'
  await sendMail({
    reference,
    to: field('email').toLowerCase(),
    subject: receipt.subject,
    body: receipt.body,
  })
  await sendMail({
    reference,
    to: contact,
    subject: `Copie dossier ${reference} — ${field('prenomNom')}`,
    body: receipt.body,
  })
}

function fileError(error: unknown) {
  const code = error instanceof Error ? error.message : ''
  if (code === 'FILE_TOO_LARGE') {
    const maxMb = maxUploadLabel('fr')
    return NextResponse.json(
      { error: `Chaque pièce ne doit pas dépasser ${maxMb} Mo.` },
      { status: 400 },
    )
  }
  if (code === 'FILE_TYPE') {
    return NextResponse.json({ error: 'Format de fichier non accepté' }, { status: 400 })
  }
  if (code === 'FILE_URL') {
    return NextResponse.json({ error: 'Lien de document invalide' }, { status: 400 })
  }
  return null
}

export async function GET() {
  try {
    if (!(await isReviewerAuthenticated())) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const db = await ensureSchema()
    if (!db) return NextResponse.json([])
    const { rows } = await db.query(
      `SELECT ${LIST_COLUMNS} FROM applications ORDER BY created_at DESC`,
    )
    return NextResponse.json(rows)
  } catch (error) {
    console.error('GET /api/applications', error)
    return NextResponse.json({ error: 'Impossible de charger les dossiers' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const uploaded: string[] = []
  try {
    if (!isApplicationOpen()) {
      return NextResponse.json({ error: 'Candidatures closes' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
    }

    const source: Record<string, string> = {}
    for (const key of [...REQUIRED_FIELDS, 'consent', 'locale']) {
      source[key] = String((body as Record<string, unknown>)[key] ?? '')
    }
    const { field, missing, consent } = collectFields(source)

    let passport: StoredDoc | null
    let bank: StoredDoc | null
    let nina: StoredDoc | null
    try {
      passport = parseDoc((body as Record<string, unknown>).passport)
      bank = parseDoc((body as Record<string, unknown>).bank)
      nina = parseDoc((body as Record<string, unknown>).nina)
    } catch (error) {
      const response = fileError(error)
      if (response) return response
      throw error
    }

    if (missing || !consent) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }
    if (!passport || !bank || !nina) {
      return NextResponse.json({ error: 'Documents requis manquants' }, { status: 400 })
    }

    uploaded.push(passport.url, bank.url, nina.url)
    await confirmApplicationDocs(uploaded)
    const reference = await persistApplication(field, passport, bank, nina)
    try {
      await sendReceipts(field, reference)
    } catch (error) {
      console.error('receipt mail', error)
    }
    return NextResponse.json({ reference }, { status: 201 })
  } catch (error) {
    if (uploaded.length) await deleteApplicationDocs(uploaded)
    console.error('POST /api/applications', error)
    return NextResponse.json({ error: 'Impossible d’enregistrer la candidature' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    if (!(await isReviewerAuthenticated())) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const body = await request.json()
    const reference = String(body.reference ?? '')
    const status = String(body.status ?? '')
    const allowed = new Set(['new', 'under_review', 'accepted', 'declined'])
    if (!reference || !allowed.has(status)) {
      return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
    }
    const db = getPool()
    if (!db) return NextResponse.json({ ok: true })
    await db.query(
      'UPDATE applications SET status = $1, notes = COALESCE($3, notes) WHERE reference = $2',
      [status, reference, typeof body.notes === 'string' ? body.notes : null],
    )
    try {
      await db.query(
        `INSERT INTO application_events (reference, actor, action, detail) VALUES ($1,$2,$3,$4)`,
        [reference, 'reviewer', 'status', status],
      )
    } catch {
      /* status update still succeeds */
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('PATCH /api/applications', error)
    return NextResponse.json({ error: 'Impossible de mettre à jour le dossier' }, { status: 500 })
  }
}
