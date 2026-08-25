import { initEdgeStore } from '@edgestore/server'
import { initEdgeStoreClient } from '@edgestore/server/core'
import { readFileSync } from 'node:fs'
import { z } from 'zod'

function env(name) {
  const file = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  const line = file.split('\n').find((row) => row.startsWith(`${name}=`) && !row.startsWith('#'))
  return line ? line.slice(name.length + 1).trim() : ''
}

process.env.EDGE_STORE_ACCESS_KEY ||= env('EDGE_STORE_ACCESS_KEY')
process.env.EDGE_STORE_SECRET_KEY ||= env('EDGE_STORE_SECRET_KEY')

const pdf = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n')
const base = 'http://127.0.0.1:3000'

const es = initEdgeStore
  .context()
  .create()
const router = es.router({
  applicationDocs: es
    .fileBucket({
      maxSize: 10 * 1024 * 1024,
      accept: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
    })
    .input(z.object({ kind: z.enum(['passport', 'bank', 'nina']) }))
    .path(({ input }) => [{ kind: input.kind }]),
})

const client = initEdgeStoreClient({
  router,
  baseUrl: `${base}/api/edgestore`,
})

async function upload(kind) {
  const result = await client.applicationDocs.upload({
    content: {
      blob: new Blob([pdf], { type: 'application/pdf' }),
      extension: 'pdf',
    },
    options: { temporary: true },
    input: { kind },
  })
  if (!result?.url) throw new Error(`upload ${kind} failed`)
  return { url: result.url, name: `${kind}.pdf`, mime: 'application/pdf' }
}

const passport = await upload('passport')
const bank = await upload('bank')
const nina = await upload('nina')

const submit = await fetch(`${base}/api/applications`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prenomNom: 'Test EdgeStore',
    profession: 'Analyste',
    email: 'edgestore-qa@replus.test',
    telephone: '+223 70 00 11 22',
    organisationNom: 'QA Energie',
    organisationAdresse: 'Bamako',
    dateCreation: '2022-01-01',
    secteur: 'Solaire',
    chiffreAffaires: '10 000 000 FCFA',
    nombreEmployes: '3',
    salonInternational: 'Non',
    projetConcret: 'Verifier le depot EdgeStore de bout en bout.',
    raisons: 'Valider que les pieces sont bien stockees.',
    visaUsa: 'jamais',
    consent: true,
    locale: 'fr',
    passport,
    bank,
    nina,
  }),
})
const submitted = await submit.json().catch(() => ({}))
if (submit.status !== 201 || !submitted.reference) {
  throw new Error(`submit failed ${submit.status} ${JSON.stringify(submitted)}`)
}

const login = await fetch(`${base}/api/reviewer/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: env('REVIEWER_EMAIL'),
    password: env('REVIEWER_PASSWORD'),
  }),
})
if (login.status !== 200) throw new Error(`login failed ${login.status}`)
const cookies = (login.headers.getSetCookie?.() || []).map((row) => row.split(';')[0]).join('; ')

const doc = await fetch(`${base}/api/applications/${submitted.reference}/passport`, {
  headers: { cookie: cookies },
  redirect: 'follow',
})
const bytes = Buffer.from(await doc.arrayBuffer())
if (doc.status !== 200 || bytes.subarray(0, 5).toString() !== '%PDF-') {
  throw new Error(`document failed ${doc.status} ${bytes.subarray(0, 80).toString()}`)
}

console.log(
  JSON.stringify({
    ok: true,
    reference: submitted.reference,
    documentBytes: bytes.length,
    contentType: doc.headers.get('content-type'),
  }),
)
