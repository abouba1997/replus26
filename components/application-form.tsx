'use client'

import { useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Send } from 'lucide-react'
import { useLocale } from '@/components/locale-provider'
import { DeadlineChip, useDeadline } from '@/components/deadline-chip'
import { getCopy, getSectors } from '@/lib/i18n'

type FormState = {
  prenomNom: string
  profession: string
  email: string
  telephone: string
  organisationNom: string
  organisationAdresse: string
  dateCreation: string
  secteur: string
  chiffreAffaires: string
  nombreEmployes: string
  salonInternational: string
  projetConcret: string
  raisons: string
  visaUsa: string
  consent: boolean
}

const initial: FormState = {
  prenomNom: '',
  profession: '',
  email: '',
  telephone: '',
  organisationNom: '',
  organisationAdresse: '',
  dateCreation: '',
  secteur: '',
  chiffreAffaires: '',
  nombreEmployes: '',
  salonInternational: '',
  projetConcret: '',
  raisons: '',
  visaUsa: '',
  consent: false,
}

type Files = {
  passport: File | null
  bank: File | null
  nina: File | null
}

export function ApplicationForm() {
  const { locale } = useLocale()
  const c = getCopy(locale).form
  const sectors = getSectors(locale)
  const [step, setStep] = useState(0)
  const [data, setData] = useState(initial)
  const [files, setFiles] = useState<Files>({ passport: null, bank: null, nina: null })
  const [submitted, setSubmitted] = useState(false)
  const [reference, setReference] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const maxMb = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB || 8)
  const fileHint = c.fileHint.replace('{max}', String(maxMb))

  const update = (key: keyof FormState, value: string | boolean) => {
    setData((current) => ({ ...current, [key]: value }))
  }

  const requiredForStep = [
    ['prenomNom', 'profession', 'email', 'telephone'],
    [
      'organisationNom',
      'organisationAdresse',
      'dateCreation',
      'secteur',
      'chiffreAffaires',
      'nombreEmployes',
    ],
    ['salonInternational', 'projetConcret', 'raisons', 'visaUsa'],
  ] as const

  const next = () => {
    setError('')
    const keys = requiredForStep[step]
    if (keys.some((key) => !String(data[key]).trim())) {
      setError(c.requiredError)
      return
    }
    setStep((current) => current + 1)
  }

  const submit = async () => {
    if (!data.consent) {
      setError(c.consentError)
      return
    }
    if (!files.passport || !files.bank || !files.nina) {
      setError(c.docsError)
      return
    }
    const tooLarge = [files.passport, files.bank, files.nina].some(
      (file) => file.size > maxMb * 1024 * 1024,
    )
    if (tooLarge) {
      setError(fileHint)
      return
    }
    setLoading(true)
    setError('')
    try {
      const payload = new FormData()
      Object.entries(data).forEach(([key, value]) => payload.append(key, String(value)))
      payload.append('locale', locale)
      payload.append('passport', files.passport)
      payload.append('bank', files.bank)
      payload.append('nina', files.nina)
      const response = await fetch('/api/applications', { method: 'POST', body: payload })
      if (!response.ok) throw new Error()
      const result = await response.json()
      setReference(result.reference ?? '')
      setSubmitted(true)
    } catch {
      setError(c.genericError)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="success-panel">
        <CheckCircle2 size={48} />
        <span className="eyebrow">{c.successEyebrow}</span>
        <h3>{c.successTitle}</h3>
        <p>
      {c.successBody}
          {reference ? ` ${locale === 'en' ? 'Reference' : 'Référence'} : ${reference}.` : ''}
        </p>
        <a href="#top" className="text-link">
          {c.backHome} <ArrowRight size={16} />
        </a>
      </div>
    )
  }

  const titles = [c.identity, c.company, c.questions, c.documents]
  const fileInput = (key: keyof Files, label: string) => (
    <label className="full file-field">
      {label}
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        onChange={(event) =>
          setFiles((current) => ({ ...current, [key]: event.target.files?.[0] ?? null }))
        }
      />
      <small>{files[key]?.name ?? fileHint}</small>
    </label>
  )

  let fields = null
  if (step === 0) {
    fields = (
      <div className="form-grid">
        <label>
          {c.prenomNom}
          <input
            value={data.prenomNom}
            onChange={(e) => update('prenomNom', e.target.value)}
            placeholder={c.prenomNomPh}
          />
        </label>
        <label>
          {c.profession}
          <input
            value={data.profession}
            onChange={(e) => update('profession', e.target.value)}
            placeholder={c.professionPh}
          />
        </label>
        <label>
          {c.email}
          <input
            type="email"
            value={data.email}
            onChange={(e) => update('email', e.target.value)}
            placeholder={c.emailPh}
          />
        </label>
        <label>
          {c.telephone}
          <input
            value={data.telephone}
            onChange={(e) => update('telephone', e.target.value)}
            placeholder={c.telephonePh}
          />
        </label>
      </div>
    )
  } else if (step === 1) {
    fields = (
      <div className="form-grid">
        <label>
          {c.orgName}
          <input
            value={data.organisationNom}
            onChange={(e) => update('organisationNom', e.target.value)}
            placeholder={c.orgNamePh}
          />
        </label>
        <label>
          {c.orgAddress}
          <input
            value={data.organisationAdresse}
            onChange={(e) => update('organisationAdresse', e.target.value)}
            placeholder={c.orgAddressPh}
          />
        </label>
        <label>
          {c.dateCreation}
          <input
            type="date"
            value={data.dateCreation}
            onChange={(e) => update('dateCreation', e.target.value)}
          />
        </label>
        <label>
          {c.secteur}
          <select value={data.secteur} onChange={(e) => update('secteur', e.target.value)}>
            <option value="">{c.secteurPh}</option>
            {sectors.map((sector) => (
              <option key={sector}>{sector}</option>
            ))}
          </select>
        </label>
        <label>
          {c.ca}
          <input
            value={data.chiffreAffaires}
            onChange={(e) => update('chiffreAffaires', e.target.value)}
            placeholder={c.caPh}
          />
        </label>
        <label>
          {c.employees}
          <input
            value={data.nombreEmployes}
            onChange={(e) => update('nombreEmployes', e.target.value)}
            placeholder={c.employeesPh}
          />
        </label>
      </div>
    )
  } else if (step === 2) {
    fields = (
      <div className="form-grid">
        <label className="full">
          {c.salon}
          <textarea
            value={data.salonInternational}
            onChange={(e) => update('salonInternational', e.target.value)}
            placeholder={c.salonPh}
          />
        </label>
        <label className="full">
          {c.projet}
          <textarea
            value={data.projetConcret}
            onChange={(e) => update('projetConcret', e.target.value)}
            placeholder={c.projetPh}
          />
        </label>
        <label className="full">
          {c.raisons}
          <textarea
            value={data.raisons}
            onChange={(e) => update('raisons', e.target.value)}
            placeholder={c.raisonsPh}
          />
        </label>
        <label className="full">
          {c.visa}
          <select value={data.visaUsa} onChange={(e) => update('visaUsa', e.target.value)}>
            {c.visaOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <p className="visa-note">{getCopy(locale).visaNote}</p>
      </div>
    )
  } else {
    fields = (
      <div className="review">
        <div>
          <span>{c.reviewName}</span>
          <strong>
            {data.prenomNom} · {data.profession}
          </strong>
        </div>
        <div>
          <span>{c.reviewOrg}</span>
          <strong>
            {data.organisationNom} · {data.secteur}
          </strong>
        </div>
        <div>
          <span>{c.reviewContact}</span>
          <strong>
            {data.email} · {data.telephone}
          </strong>
        </div>
        <div className="form-grid docs-grid">
          {fileInput('passport', c.passport)}
          {fileInput('bank', c.bank)}
          {fileInput('nina', c.nina)}
        </div>
        <label className="consent">
          <input
            type="checkbox"
            checked={data.consent}
            onChange={(e) => update('consent', e.target.checked)}
          />
          <span>{c.consent}</span>
        </label>
        <p className="privacy-note">{getCopy(locale).privacyDocs}</p>
      </div>
    )
  }

  return (
    <div className="application-card">
      <div className="step-head">
        <div>
          <span className="eyebrow">
            {c.steps[step]} · 0{step + 1} / 04
          </span>
          <h3>{titles[step]}</h3>
        </div>
        <div className="step-dots">
          {[0, 1, 2, 3].map((index) => (
            <span key={index} className={index <= step ? 'active' : ''} />
          ))}
        </div>
      </div>
      {fields}
      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        {step > 0 && (
          <button className="button ghost" type="button" onClick={() => setStep((s) => s - 1)}>
            <ArrowLeft size={16} /> {c.back}
          </button>
        )}
        {step < 3 ? (
          <button className="button primary" type="button" onClick={next}>
            {c.continue} <ArrowRight size={16} />
          </button>
        ) : (
          <button className="button primary" type="button" onClick={submit} disabled={loading}>
            {loading ? <Loader2 className="spin" size={16} /> : <Send size={16} />} {c.send}
          </button>
        )}
      </div>
    </div>
  )
}

export function ApplySection() {
  const { locale } = useLocale()
  const c = getCopy(locale)
  const deadline = useDeadline()
  const closed = deadline && !deadline.open
  return (
    <section id="candidature" className="apply-section">
      <div className="section-intro">
        <span className="eyebrow lime">{c.applyEyebrow}</span>
        <h2>{c.applyTitle}</h2>
        <p>{c.applyBody}</p>
        <DeadlineChip label={c.deadline} closed={c.closed} />
        <a className="official-link" href="https://www.re-plus.com/" target="_blank" rel="noreferrer">
          {c.officialSite}
        </a>
      </div>
      {closed ? (
        <div className="success-panel">
          <span className="eyebrow">{c.closed}</span>
          <h3>{c.closedTitle}</h3>
          <p>{c.closedBody}</p>
        </div>
      ) : (
        <ApplicationForm />
      )}
    </section>
  )
}
