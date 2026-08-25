import { createCipheriv, createHash, randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import pg from 'pg'

function env(name) {
  const file = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  const line = file.split('\n').find((row) => row.startsWith(`${name}=`))
  return line ? line.slice(name.length + 1).trim() : ''
}

function encrypt(data) {
  const secret = env('AUTH_SECRET') || 'replus-dev-key'
  const key = createHash('sha256').update(`replus-docs:${secret}`).digest()
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()])
  return Buffer.concat([Buffer.from('R1'), iv, cipher.getAuthTag(), encrypted])
}

function pdf(title) {
  return Buffer.from(
    `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj
4 0 obj<</Length 68>>stream
BT /F1 12 Tf 72 720 Td (${title}) Tj ET
endstream
endobj
trailer<</Root 1 0 R>>
%%EOF`,
  )
}

const people = [
  {
    reference: 'RE26-AWA001',
    prenom_nom: 'Awa Traore',
    profession: 'Directrice generale',
    email: 'awa.traore@soleilmali.ml',
    telephone: '+223 70 11 22 33',
    organisation_nom: 'Soleil Mali',
    organisation_adresse: 'ACI 2000, Bamako, Mali',
    date_creation: '2016-04-12',
    secteur: 'Solaire',
    chiffre_affaires: '420 000 000 FCFA',
    nombre_employes: '34',
    salon_international: 'Africa Energy Forum, Nairobi, 2024',
    projet_concret:
      'Centrale solaire 12 MW a Kati avec un EPC americain et un contrat d achat avec EDM.',
    raisons: 'Signer un partenariat technique et lever du financement US pour le pipeline 2027.',
    visa_usa: 'obtenu',
    status: 'accepted',
    notes: 'Profil prioritaire. Forte execution.',
  },
  {
    reference: 'RE26-IBR002',
    prenom_nom: 'Ibrahim Coulibaly',
    profession: 'Fondateur',
    email: 'ibrahim@sahelstorage.ml',
    telephone: '+223 76 44 18 90',
    organisation_nom: 'Sahel Storage',
    organisation_adresse: 'Zone industrielle, Sotuba, Bamako',
    date_creation: '2020-09-01',
    secteur: 'Stockage d’énergie',
    chiffre_affaires: '95 000 000 FCFA',
    nombre_employes: '11',
    salon_international: 'Non',
    projet_concret: 'Batteries 8 MWh couplees a un mini-reseau agricole a Segou.',
    raisons: 'Trouver un fournisseur US de batteries LFP et un contrat de maintenance.',
    visa_usa: 'jamais',
    status: 'under_review',
    notes: 'Verifier la capacite financiere.',
  },
  {
    reference: 'RE26-FAT003',
    prenom_nom: 'Fatoumata Keita',
    profession: 'Ingénieure process',
    email: 'fatoumata@h2bamako.ml',
    telephone: '+223 66 20 45 11',
    organisation_nom: 'Hydrogene Bamako',
    organisation_adresse: 'Hippodrome, Bamako',
    date_creation: '2023-01-20',
    secteur: 'Hydrogène',
    chiffre_affaires: '28 000 000 FCFA',
    nombre_employes: '7',
    salon_international: 'COP28, Dubai, 2023',
    projet_concret: 'Pilote hydrogene vert 200 kW pour une unite agroalimentaire.',
    raisons: 'Rencontre des fabricants d electrolyseurs et des labs US.',
    visa_usa: 'en_cours',
    status: 'new',
    notes: '',
  },
  {
    reference: 'RE26-MOU004',
    prenom_nom: 'Moussa Diallo',
    profession: 'Directeur operations',
    email: 'moussa@microgrid-sikasso.ml',
    telephone: '+223 79 12 67 04',
    organisation_nom: 'MicroGrid Sikasso',
    organisation_adresse: 'Quartier Medine, Sikasso',
    date_creation: '2018-06-08',
    secteur: 'Microréseaux',
    chiffre_affaires: '160 000 000 FCFA',
    nombre_employes: '22',
    salon_international: 'Powering Africa Summit, 2025',
    projet_concret: '15 microréseaux villageois avec paiement mobile et stockage.',
    raisons: 'Acceder a des integrateurs US et a des garanties de performance.',
    visa_usa: 'obtenu',
    status: 'new',
    notes: '',
  },
  {
    reference: 'RE26-AMI005',
    prenom_nom: 'Aminata Toure',
    profession: 'CEO',
    email: 'aminata@voltmali.ml',
    telephone: '+223 73 55 09 21',
    organisation_nom: 'Volt Mali EV',
    organisation_adresse: 'Hamdallaye ACI, Bamako',
    date_creation: '2021-11-03',
    secteur: 'Infrastructure de véhicules électriques',
    chiffre_affaires: '74 000 000 FCFA',
    nombre_employes: '16',
    salon_international: 'Non',
    projet_concret: 'Reseau de 40 bornes de recharge a Bamako avec un partenaire US.',
    raisons: 'Negocier du hardware de charge et un programme de formation.',
    visa_usa: 'jamais',
    status: 'under_review',
    notes: 'Bon recit commercial.',
  },
  {
    reference: 'RE26-SEY006',
    prenom_nom: 'Seydou Konate',
    profession: 'Promoteur',
    email: 'seydou@harmattan-wind.ml',
    telephone: '+223 65 88 30 17',
    organisation_nom: 'Harmattan Wind',
    organisation_adresse: 'Kayes-ville, Kayes',
    date_creation: '2014-02-14',
    secteur: 'Énergie éolienne',
    chiffre_affaires: '12 000 000 FCFA',
    nombre_employes: '4',
    salon_international: 'Non',
    projet_concret: 'Mesures de vent et petite eolienne 500 kW pour une mine artisanale.',
    raisons: 'Valider la faisabilite avec des fabricants US.',
    visa_usa: 'refuse',
    status: 'declined',
    notes: 'Dossier trop premature. Revoir en 2027.',
  },
  {
    reference: 'RE26-OUM007',
    prenom_nom: 'Oumar Cisse',
    profession: 'Directeur commercial',
    email: 'oumar@energiekayes.ml',
    telephone: '+223 77 02 41 63',
    organisation_nom: 'Energie Kayes',
    organisation_adresse: 'Liberté, Kayes',
    date_creation: '2012-08-19',
    secteur: 'Solaire',
    chiffre_affaires: '210 000 000 FCFA',
    nombre_employes: '41',
    salon_international: 'Solar Power Africa, Le Cap, 2025',
    projet_concret: 'Toitures solaires C&I 6 MW pour des usines a Kayes.',
    raisons: 'Importer des modules et onduleurs US a conditions preferentielles.',
    visa_usa: 'obtenu',
    status: 'new',
    notes: '',
  },
  {
    reference: 'RE26-MAR008',
    prenom_nom: 'Mariam Sangare',
    profession: 'Conseillere investissement',
    email: 'mariam@greenbank.ml',
    telephone: '+223 61 47 25 80',
    organisation_nom: 'GreenBank Advisory',
    organisation_adresse: 'Badalabougou, Bamako',
    date_creation: '2019-05-27',
    secteur: 'Autre',
    chiffre_affaires: '88 000 000 FCFA',
    nombre_employes: '9',
    salon_international: 'World Bank SDM, 2024',
    projet_concret: 'Fonds d investissement 15 MUSD pour PME energie maliennes avec un GP US.',
    raisons: 'Rencontrer family offices et DFI autour de RE+.',
    visa_usa: 'en_cours',
    status: 'accepted',
    notes: 'Utile pour structurer la delegation finance.',
  },
]

const sql = `
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
);
CREATE TABLE IF NOT EXISTS email_outbox (
  id SERIAL PRIMARY KEY,
  reference TEXT,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  provider TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS prenom_nom TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS profession TEXT DEFAULT '';
ALTER TABLE applications ADD COLUMN IF NOT EXISTS organisation_nom TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS organisation_adresse TEXT DEFAULT '';
ALTER TABLE applications ADD COLUMN IF NOT EXISTS date_creation TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS chiffre_affaires TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS nombre_employes TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS salon_international TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS projet_concret TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS raisons TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS visa_usa TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS passport_name TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS passport_mime TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS passport_data BYTEA;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS bank_mime TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS bank_data BYTEA;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS nina_name TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS nina_mime TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS nina_data BYTEA;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS docs_encrypted BOOLEAN DEFAULT TRUE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE applications ALTER COLUMN nom DROP NOT NULL;
ALTER TABLE applications ALTER COLUMN entreprise DROP NOT NULL;
`

const pool = new pg.Pool({ connectionString: env('DATABASE_URL'), ssl: { rejectUnauthorized: false } })
await pool.query(sql)

for (const person of people) {
  const passport = encrypt(pdf(`PASSPORT ${person.prenom_nom}`))
  const bank = encrypt(pdf(`BANK STATEMENT ${person.organisation_nom}`))
  const nina = encrypt(pdf(`NINA ${person.organisation_nom}`))
  await pool.query(
    `INSERT INTO applications (
      reference, prenom_nom, nom, profession, email, telephone, organisation_nom, entreprise,
      organisation_adresse, date_creation, secteur, chiffre_affaires, nombre_employes,
      salon_international, projet_concret, raisons, visa_usa, passport_name, passport_mime,
      passport_data, bank_name, bank_mime, bank_data, nina_name, nina_mime, nina_data, consent,
      status, notes, docs_encrypted
    ) VALUES (
      $1,$2,$2,$3,$4,$5,$6,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27, TRUE
    )
    ON CONFLICT (reference) DO UPDATE SET
      status = EXCLUDED.status,
      notes = EXCLUDED.notes,
      projet_concret = EXCLUDED.projet_concret`,
    [
      person.reference,
      person.prenom_nom,
      person.profession,
      person.email,
      person.telephone,
      person.organisation_nom,
      person.organisation_adresse,
      person.date_creation,
      person.secteur,
      person.chiffre_affaires,
      person.nombre_employes,
      person.salon_international,
      person.projet_concret,
      person.raisons,
      person.visa_usa,
      'passeport.pdf',
      'application/pdf',
      passport,
      'releve-bancaire.pdf',
      'application/pdf',
      bank,
      'nina.pdf',
      'application/pdf',
      nina,
      true,
      person.status,
      person.notes,
    ],
  )
  await pool.query(
    `INSERT INTO email_outbox (reference, to_email, subject, body, status, provider)
     VALUES ($1,$2,$3,$4,'logged','outbox')`,
    [
      person.reference,
      person.email,
      `RE+ Mali 2026 — candidature ${person.reference} recue`,
      `Bonjour ${person.prenom_nom},\n\nVotre dossier ${person.reference} est bien enregistre.\n`,
    ],
  )
}

const { rows } = await pool.query('SELECT reference, prenom_nom, status FROM applications ORDER BY id')
console.log(`Seeded ${rows.length} applications`)
for (const row of rows) console.log(`- ${row.reference} ${row.prenom_nom} [${row.status}]`)
await pool.end()
