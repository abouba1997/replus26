import { getPool } from '@/lib/db'

type OutboxMail = {
  reference?: string
  to: string
  subject: string
  body: string
}

export function applicationReceipt({
  name,
  reference,
  locale,
}: {
  name: string
  reference: string
  locale: string
}) {
  if (locale === 'en') {
    return {
      subject: `RE+ Mali 2026 — application ${reference} received`,
      body: `Hello ${name},\n\nWe have received your application for the Malian delegation to RE+ 2026 (Las Vegas, 16–19 November).\n\nReference: ${reference}\nDeadline: 4 September 2026\n\nThe U.S. Embassy Bamako commercial section and AmCham Mali will review your file. If selected, we will contact you about next steps, including U.S. visa timing.\n\nA U.S. visa can take several weeks. Start that process as soon as you are invited.\n\nContact: ${process.env.CONTACT_EMAIL || 'replusevent@amchammali.org'}\n`,
    }
  }
  return {
    subject: `RE+ Mali 2026 — candidature ${reference} reçue`,
    body: `Bonjour ${name},\n\nNous avons bien reçu votre candidature pour la délégation malienne à RE+ 2026 (Las Vegas, 16–19 novembre).\n\nRéférence : ${reference}\nDate limite : 04 septembre 2026\n\nLa section économique et commerciale de l’Ambassade des États-Unis à Bamako et AmCham Mali étudieront votre dossier. Si vous êtes retenu(e), nous vous contacterons pour la suite, y compris le calendrier visa.\n\nUn visa américain peut prendre plusieurs semaines. Anticipez dès qu’une invitation est confirmée.\n\nContact : ${process.env.CONTACT_EMAIL || 'replusevent@amchammali.org'}\n`,
  }
}

export async function sendMail(mail: OutboxMail) {
  const db = getPool()
  let status = 'queued'
  let provider = 'outbox'
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.MAIL_FROM || 'RE+ Mali <noreply@amchammali.org>',
          to: [mail.to],
          subject: mail.subject,
          text: mail.body,
        }),
      })
      status = response.ok ? 'sent' : 'failed'
      provider = 'resend'
    } catch {
      status = 'failed'
      provider = 'resend'
    }
  } else {
    status = 'logged'
    provider = 'outbox'
  }
  if (db) {
    await db.query(
      `INSERT INTO email_outbox (reference, to_email, subject, body, status, provider)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [mail.reference ?? null, mail.to, mail.subject, mail.body, status, provider],
    )
  }
  return { status, provider }
}
