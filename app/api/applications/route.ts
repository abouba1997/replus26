import { NextResponse } from 'next/server'
import { ensureSchema, getPool, LIST_COLUMNS, makeReference } from '@/lib/db'
import { isReviewerAuthenticated } from '@/lib/auth'
import { encryptBuffer } from '@/lib/crypto-docs'
import { isApplicationOpen } from '@/lib/deadline'
import { applicationReceipt, sendMail } from '@/lib/email'
import { maxUploadBytes } from '@/lib/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MAX_BYTES = maxUploadBytes()
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/octet-stream',
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

async function readFile(form: FormData, key: string) {
  const value = form.get(key)
  if (!(value instanceof File) || value.size === 0) return null
  if (value.size > MAX_BYTES) {
    throw new Error('FILE_TOO_LARGE')
  }
  const named = value.name || ''
  const typeOk = !value.type || ALLOWED_TYPES.has(value.type) || ALLOWED_EXT.test(named)
  if (!typeOk) {
    throw new Error('FILE_TYPE')
  }
  const buffer = Buffer.from(await value.arrayBuffer())
  return { name: value.name, mime: value.type || 'application/octet-stream', data: buffer }
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
  try {
    if (!isApplicationOpen()) {
      return NextResponse.json({ error: 'Candidatures closes' }, { status: 403 })
    }
    const form = await request.formData()
    const field = (key: string) => String(form.get(key) ?? '').trim()
    const missing = REQUIRED_FIELDS.some((key) => !field(key))
    const consent = form.get('consent') === 'true' || form.get('consent') === 'on'
    if (missing || !consent) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }

    let passport
    let bank
    let nina
    try {
      passport = await readFile(form, 'passport')
      bank = await readFile(form, 'bank')
      nina = await readFile(form, 'nina')
    } catch (error) {
      const code = error instanceof Error ? error.message : ''
      if (code === 'FILE_TOO_LARGE') {
        return NextResponse.json({ error: 'Fichier trop volumineux (8 Mo max.)' }, { status: 400 })
      }
      if (code === 'FILE_TYPE') {
        return NextResponse.json({ error: 'Format de fichier non accepté' }, { status: 400 })
      }
      throw error
    }

    if (!passport || !bank || !nina) {
      return NextResponse.json({ error: 'Documents requis manquants' }, { status: 400 })
    }

    const db = await ensureSchema()
    const reference = makeReference()
    if (!db) {
      return NextResponse.json({ reference }, { status: 201 })
    }

    await db.query(
      `INSERT INTO applications (
        reference, prenom_nom, nom, profession, email, telephone, organisation_nom, entreprise,
        organisation_adresse, date_creation, secteur, chiffre_affaires, nombre_employes,
        salon_international, projet_concret, raisons, visa_usa, passport_name, passport_mime,
        passport_data, bank_name, bank_mime, bank_data, nina_name, nina_mime, nina_data, consent,
        docs_encrypted
      ) VALUES (
        $1,$2,$2,$3,$4,$5,$6,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25, TRUE
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
        encryptBuffer(passport.data),
        bank.name,
        bank.mime,
        encryptBuffer(bank.data),
        nina.name,
        nina.mime,
        encryptBuffer(nina.data),
        true,
      ],
    )
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
    return NextResponse.json({ reference }, { status: 201 })
  } catch (error) {
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
