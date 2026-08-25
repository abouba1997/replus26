const base = 'http://127.0.0.1:3000'
const results = []

async function check(name, fn) {
  const started = Date.now()
  try {
    const detail = await fn()
    results.push({ name, ok: true, ms: Date.now() - started, detail })
  } catch (error) {
    results.push({ name, ok: false, ms: Date.now() - started, detail: String(error) })
  }
}

await check('home', async () => {
  const res = await fetch(base)
  if (res.status !== 200) throw new Error(res.status)
  const html = await res.text()
  if (!html.includes('RE+ Mali')) throw new Error('missing title')
  return res.status
})

await check('sun-image', async () => {
  const res = await fetch(base + '/sun-surface.png')
  if (res.status !== 200 || Number(res.headers.get('content-length') || 0) < 1000) {
    throw new Error('sun missing')
  }
  return res.status
})

await check('deadline-open', async () => {
  const data = await (await fetch(base + '/api/deadline')).json()
  if (!data.open) throw new Error('should be open')
  return data.daysLeft
})

await check('apps-unauthorized', async () => {
  const res = await fetch(base + '/api/applications')
  if (res.status !== 401) throw new Error(res.status)
  return 401
})

await check('login-rejected', async () => {
  const res = await fetch(base + '/api/reviewer/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'x@x.com', password: 'nope' }),
  })
  if (res.status !== 401) throw new Error(res.status)
  return 401
})

const jar = new Map()
await check('login-ok', async () => {
  const res = await fetch(base + '/api/reviewer/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'replusevent@amchammali.org',
      password: 'ReplusMali2026!',
    }),
  })
  if (res.status !== 200) throw new Error(await res.text())
  const setCookie = res.headers.getSetCookie?.() || []
  for (const cookie of setCookie) {
    const [pair] = cookie.split(';')
    const [k, v] = pair.split('=')
    jar.set(k.trim(), v)
  }
  return Date.now()
})

function cookieHeader() {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
}

await check('list-dossiers', async () => {
  const res = await fetch(base + '/api/applications', { headers: { cookie: cookieHeader() } })
  const rows = await res.json()
  if (!Array.isArray(rows) || rows.length < 8) throw new Error(JSON.stringify(rows).slice(0, 200))
  return rows.length
})

await check('patch-status', async () => {
  const res = await fetch(base + '/api/applications', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', cookie: cookieHeader() },
    body: JSON.stringify({
      reference: 'RE26-FAT003',
      status: 'under_review',
      notes: 'Prioritaire hydrogene',
    }),
  })
  const data = await res.json()
  if (!data.ok) throw new Error(JSON.stringify(data))
  return data.ok
})

await check('passport-decrypt', async () => {
  const res = await fetch(base + '/api/applications/RE26-IBR002/passport', {
    headers: { cookie: cookieHeader() },
  })
  const buf = Buffer.from(await res.arrayBuffer())
  if (res.status !== 200 || buf.subarray(0, 4).toString() !== '%PDF') throw new Error('not pdf')
  return buf.length
})

await check('pdf-accented-dossier', async () => {
  const res = await fetch(base + '/api/applications/RE26-IBR002/pdf', {
    headers: { cookie: cookieHeader() },
  })
  const buf = Buffer.from(await res.arrayBuffer())
  if (res.status !== 200 || buf.subarray(0, 4).toString() !== '%PDF') throw new Error(res.status)
  return buf.length
})

await check('csv-export', async () => {
  const res = await fetch(base + '/api/applications/export?format=csv', {
    headers: { cookie: cookieHeader() },
  })
  const text = await res.text()
  if (!text.includes('RE26-AWA001')) throw new Error('csv missing Awa')
  return text.split('\n').length
})

await check('pdf-all-export', async () => {
  const res = await fetch(base + '/api/applications/export?format=pdf', {
    headers: { cookie: cookieHeader() },
  })
  const buf = Buffer.from(await res.arrayBuffer())
  if (res.status !== 200 || buf.subarray(0, 4).toString() !== '%PDF') throw new Error(res.status)
  return buf.length
})

await check('outbox', async () => {
  const res = await fetch(base + '/api/reviewer/outbox', { headers: { cookie: cookieHeader() } })
  const rows = await res.json()
  if (!Array.isArray(rows) || rows.length < 8) throw new Error('outbox empty')
  return rows.length
})

await check('submit-application', async () => {
  const pdf = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n')
  const form = new FormData()
  const fields = {
    prenomNom: 'Teste Qualite',
    profession: 'Analyste',
    email: 'qa@replus.test',
    telephone: '+223 70 00 11 22',
    organisationNom: 'QA Energie',
    organisationAdresse: 'Bamako',
    dateCreation: '2022-01-01',
    secteur: 'Solaire',
    chiffreAffaires: '10 000 000 FCFA',
    nombreEmployes: '3',
    salonInternational: 'Non',
    projetConcret: 'Mini centrale de test pour verification plateforme.',
    raisons: 'Valider le flux complet de candidature.',
    visaUsa: 'jamais',
    consent: 'true',
    locale: 'fr',
  }
  for (const [key, value] of Object.entries(fields)) form.append(key, value)
  const file = new File([pdf], 'doc.pdf', { type: 'application/pdf' })
  form.append('passport', file)
  form.append('bank', file)
  form.append('nina', file)
  const res = await fetch(base + '/api/applications', { method: 'POST', body: form })
  const data = await res.json()
  if (res.status !== 201 || !data.reference) throw new Error(JSON.stringify(data))
  return data.reference
})

await check('embassy-login', async () => {
  const res = await fetch(base + '/api/reviewer/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'embassy@amchammali.org', password: 'ReplusMali2026!' }),
  })
  if (res.status !== 200) throw new Error(await res.text())
  return 200
})

const failed = results.filter((row) => !row.ok)
console.log(JSON.stringify({ failed: failed.length, results }, null, 2))
if (failed.length) process.exit(1)
