import { NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

type Dossier = {
  reference: string
  prenom_nom: string
  profession: string
  email: string
  telephone: string
  organisation_nom: string
  organisation_adresse: string
  date_creation: string
  secteur: string
  chiffre_affaires: string
  nombre_employes: string
  salon_international: string
  projet_concret: string
  raisons: string
  visa_usa: string
  status: string
  notes?: string
  created_at: string
}

function csvEscape(value: unknown) {
  const text = String(value ?? '')
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`
  return text
}

function pdfSafe(value: unknown) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\t\n\r\x20-\x7E]/g, ' ')
}

export function toCsv(rows: Dossier[]) {
  const headers = [
    'reference',
    'prenom_nom',
    'profession',
    'email',
    'telephone',
    'organisation_nom',
    'organisation_adresse',
    'date_creation',
    'secteur',
    'chiffre_affaires',
    'nombre_employes',
    'salon_international',
    'projet_concret',
    'raisons',
    'visa_usa',
    'status',
    'created_at',
  ]
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map((key) => csvEscape(row[key as keyof Dossier])).join(','))
  }
  return lines.join('\n')
}

async function drawDossier(doc: PDFDocument, row: Dossier) {
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const page = doc.addPage([595, 842])
  const ink = rgb(0.03, 0.08, 0.14)
  const muted = rgb(0.4, 0.45, 0.48)
  let y = 800
  const write = (label: string, value: string, size = 10) => {
    page.drawText(pdfSafe(label).toUpperCase(), { x: 48, y, size: 8, font: bold, color: muted })
    y -= 16
    const lines = pdfSafe(value || '-').match(/.{1,88}(\s|$)|.+/g) ?? ['-']
    for (const line of lines.slice(0, 6)) {
      page.drawText(line.trim() || '-', { x: 48, y, size, font, color: ink })
      y -= 14
    }
    y -= 10
  }
  page.drawText('RE+ MALI 2026', { x: 48, y, size: 11, font: bold, color: rgb(0.55, 0.7, 0.12) })
  y -= 22
  page.drawText(pdfSafe(row.prenom_nom || 'Dossier'), { x: 48, y, size: 22, font: bold, color: ink })
  y -= 18
  page.drawText(pdfSafe(`${row.reference}  ·  ${row.status}`), {
    x: 48,
    y,
    size: 10,
    font,
    color: muted,
  })
  y -= 28
  write('Identite', `${row.prenom_nom} · ${row.profession}`)
  write('Organisation', `${row.organisation_nom} · ${row.secteur}`)
  write('Adresse', row.organisation_adresse)
  write('Contact', `${row.email} · ${row.telephone}`)
  write(
    'Creation / CA / effectif',
    `${row.date_creation} · ${row.chiffre_affaires} · ${row.nombre_employes}`,
  )
  write('Salon international', row.salon_international)
  write('Projet concret', row.projet_concret)
  write('Raisons', row.raisons)
  write('Visa USA', row.visa_usa)
  if (row.notes) write('Notes internes', row.notes)
  page.drawText('Confidentiel - Ambassade des Etats-Unis a Bamako & AmCham Mali', {
    x: 48,
    y: 36,
    size: 8,
    font,
    color: muted,
  })
}

export async function dossierPdf(row: Dossier) {
  const doc = await PDFDocument.create()
  await drawDossier(doc, row)
  return Buffer.from(await doc.save())
}

export async function dossiersPdf(rows: Dossier[]) {
  const doc = await PDFDocument.create()
  for (const row of rows) {
    await drawDossier(doc, row)
  }
  return Buffer.from(await doc.save())
}

export function csvResponse(body: string, filename: string) {
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

export function pdfResponse(body: Buffer, filename: string, inline = false) {
  return new NextResponse(new Uint8Array(body), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${filename}"`,
    },
  })
}
