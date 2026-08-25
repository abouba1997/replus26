import { Pool } from 'pg'
import { databaseUrl, isVercel } from '@/lib/env'

let pool: Pool | null = null

export function getPool() {
  const connectionString = databaseUrl()
  if (!connectionString) return null
  if (!pool) {
    const local = /localhost|127\.0\.0\.1/.test(connectionString)
    pool = new Pool({
      connectionString,
      max: isVercel() ? 1 : 5,
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 10_000,
      allowExitOnIdle: true,
      ssl: local ? undefined : { rejectUnauthorized: false },
    })
  }
  return pool
}

const CREATE_SQL = `
CREATE TABLE IF NOT EXISTS applications (
  id SERIAL PRIMARY KEY,
  reference TEXT UNIQUE NOT NULL,
  prenom_nom TEXT NOT NULL,
  nom TEXT,
  profession TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  telephone TEXT NOT NULL,
  organisation_nom TEXT NOT NULL,
  entreprise TEXT,
  organisation_adresse TEXT NOT NULL DEFAULT '',
  date_creation TEXT,
  secteur TEXT,
  chiffre_affaires TEXT,
  nombre_employes TEXT,
  salon_international TEXT,
  projet_concret TEXT,
  raisons TEXT,
  visa_usa TEXT,
  passport_name TEXT,
  passport_mime TEXT,
  passport_data BYTEA,
  bank_name TEXT,
  bank_mime TEXT,
  bank_data BYTEA,
  nina_name TEXT,
  nina_mime TEXT,
  nina_data BYTEA,
  consent BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'new',
  score INTEGER,
  notes TEXT,
  docs_encrypted BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
`

const EXTRA_COLUMNS: Array<[string, string]> = [
  ['prenom_nom', 'TEXT'],
  ['profession', "TEXT NOT NULL DEFAULT ''"],
  ['organisation_nom', 'TEXT'],
  ['organisation_adresse', "TEXT NOT NULL DEFAULT ''"],
  ['date_creation', 'TEXT'],
  ['chiffre_affaires', 'TEXT'],
  ['nombre_employes', 'TEXT'],
  ['salon_international', 'TEXT'],
  ['projet_concret', 'TEXT'],
  ['raisons', 'TEXT'],
  ['visa_usa', 'TEXT'],
  ['passport_name', 'TEXT'],
  ['passport_mime', 'TEXT'],
  ['passport_data', 'BYTEA'],
  ['bank_name', 'TEXT'],
  ['bank_mime', 'TEXT'],
  ['bank_data', 'BYTEA'],
  ['nina_name', 'TEXT'],
  ['nina_mime', 'TEXT'],
  ['nina_data', 'BYTEA'],
  ['docs_encrypted', 'BOOLEAN NOT NULL DEFAULT TRUE'],
  ['notes', 'TEXT'],
  ['passport_blob', 'TEXT'],
  ['bank_blob', 'TEXT'],
  ['nina_blob', 'TEXT'],
]

let initialized = false

export async function ensureSchema() {
  const db = getPool()
  if (!db || initialized) return db
  await db.query(CREATE_SQL)
  const { rows } = await db.query<{ column_name: string }>(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'applications'`,
  )
  const existing = new Set(rows.map((row) => row.column_name))
  for (const [name, type] of EXTRA_COLUMNS) {
    if (!existing.has(name)) {
      await db.query(`ALTER TABLE applications ADD COLUMN ${name} ${type}`)
    }
  }
  if (existing.has('nom')) {
    await db.query('ALTER TABLE applications ALTER COLUMN nom DROP NOT NULL')
  }
  if (existing.has('entreprise')) {
    await db.query('ALTER TABLE applications ALTER COLUMN entreprise DROP NOT NULL')
  }
  await db.query(`
    CREATE TABLE IF NOT EXISTS email_outbox (
      id SERIAL PRIMARY KEY,
      reference TEXT,
      to_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued',
      provider TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await db.query(`
    CREATE TABLE IF NOT EXISTS application_events (
      id SERIAL PRIMARY KEY,
      reference TEXT NOT NULL,
      actor TEXT,
      action TEXT NOT NULL,
      detail TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  initialized = true
  return db
}

export function makeReference() {
  return `RE26-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

export const LIST_COLUMNS = `
  id, reference, prenom_nom, profession, email, telephone, organisation_nom,
  organisation_adresse, date_creation, secteur, chiffre_affaires, nombre_employes,
  salon_international, projet_concret, raisons, visa_usa, passport_name, bank_name,
  nina_name, consent, status, notes, docs_encrypted, created_at
`
