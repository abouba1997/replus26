'use client'

import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  FileBadge,
  IdCard,
  Landmark,
  Loader2,
  Send,
} from 'lucide-react'
import { DateField, formatLongDate } from '@/components/date-field'
import { FileDrop } from '@/components/file-drop'
import { useLocale } from '@/components/locale-provider'
import { DeadlineChip, useDeadline } from '@/components/deadline-chip'
import { useEdgeStore } from '@/lib/edgestore'
import { maxUploadLabel, maxUploadMb } from '@/lib/env'
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
  const { edgestore, state: store } = useEdgeStore()
  const c = getCopy(locale).form
  const sectors = getSectors(locale)
  const [step, setStep] = useState(0)
  const [data, setData] = useState(initial)
  const [files, setFiles] = useState<Files>({ passport: null, bank: null, nina: null })
  const [submitted, setSubmitted] = useState(false)
  const [reference, setReference] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const maxMb = maxUploadMb()
  const maxLabel = maxUploadLabel(locale)
  const fileHint = c.fileHint.replace('{max}', maxLabel)
  const tooLarge = c.fileTooLargeError.replace('{max}', maxLabel)

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

  const go = (nextStep: number) => {
    setError('')
    setStep(nextStep)
  }

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
    if (
      files.passport.size > maxMb * 1024 * 1024 ||
      files.bank.size > maxMb * 1024 * 1024 ||
      files.nina.size > maxMb * 1024 * 1024
    ) {
      setError(tooLarge)
      return
    }
    if (store.error || !store.initialized) {
      setError(c.genericError)
      return
    }
    setLoading(true)
    setError('')
    const uploaded: string[] = []
    try {
      const upload = async (kind: 'passport' | 'bank' | 'nina', file: File) => {
        const result = await edgestore.applicationDocs.upload({
          file,
          input: { kind },
          options: { temporary: true },
        })
        uploaded.push(result.url)
        return {
          url: result.url,
          name: file.name,
          mime: file.type || 'application/octet-stream',
        }
      }
      const [passport, bank, nina] = await Promise.all([
        upload('passport', files.passport),
        upload('bank', files.bank),
        upload('nina', files.nina),
      ])
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, locale, passport, bank, nina }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(typeof result?.error === 'string' ? result.error : '')
      }
      setReference(result?.reference ?? '')
      setSubmitted(true)
    } catch (err) {
      await Promise.all(
        uploaded.map((url) => edgestore.applicationDocs.delete({ url }).catch(() => null)),
      )
      setError(err instanceof Error && err.message ? err.message : c.genericError)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="success-panel">
        <span className="success-mark">
          <CheckCircle2 size={36} />
        </span>
        <span className="eyebrow lime">{c.successEyebrow}</span>
        <h3>{c.successTitle}</h3>
        <p className="success-lead">{c.successLead}</p>
        {reference ? (
          <div className="success-ref">
            <span>{c.successRefLabel}</span>
            <strong>{reference}</strong>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(reference)
                  setCopied(true)
                  window.setTimeout(() => setCopied(false), 1800)
                } catch {
                  /* ignore */
                }
              }}
            >
              <Copy size={15} /> {copied ? c.successCopied : c.successCopy}
            </button>
          </div>
        ) : null}
        <p>{c.successBody}</p>
        <a href="#top" className="button primary large">
          {c.backHome} <ArrowRight size={18} />
        </a>
      </div>
    )
  }

  const titles = [c.identity, c.company, c.questions, c.documents]
  const visaLabel = c.visaOptions.find((option) => option.value === data.visaUsa)?.label ?? data.visaUsa
  const dropProps = {
    hint: fileHint,
    maxMb,
    locale,
    chooseLabel: c.chooseFile,
    replaceLabel: c.replaceFile,
    removeLabel: c.removeFile,
    dropLabel: c.dropFile,
    tooLargeLabel: tooLarge,
    typeLabel: c.fileTypeError,
  }

  let fields = null
  if (step === 0) {
    fields = (
      <div className="form-grid">
        <label>
          {c.prenomNom}
          <input
            autoComplete="name"
            value={data.prenomNom}
            onChange={(e) => update('prenomNom', e.target.value)}
            placeholder={c.prenomNomPh}
          />
        </label>
        <label>
          {c.profession}
          <input
            autoComplete="organization-title"
            value={data.profession}
            onChange={(e) => update('profession', e.target.value)}
            placeholder={c.professionPh}
          />
        </label>
        <label>
          {c.email}
          <input
            type="email"
            autoComplete="email"
            value={data.email}
            onChange={(e) => update('email', e.target.value)}
            placeholder={c.emailPh}
          />
        </label>
        <label>
          {c.telephone}
          <input
            type="tel"
            autoComplete="tel"
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
            autoComplete="organization"
            value={data.organisationNom}
            onChange={(e) => update('organisationNom', e.target.value)}
            placeholder={c.orgNamePh}
          />
        </label>
        <label>
          {c.orgAddress}
          <input
            autoComplete="street-address"
            value={data.organisationAdresse}
            onChange={(e) => update('organisationAdresse', e.target.value)}
            placeholder={c.orgAddressPh}
          />
        </label>
        <div className="field full">
          {c.dateCreation}
          <DateField
            value={data.dateCreation}
            onChange={(value) => update('dateCreation', value)}
            locale={locale}
            placeholder={c.datePlaceholder}
          />
        </div>
        <label className="full">
          {c.secteur}
          <span className="select-wrap">
            <select value={data.secteur} onChange={(e) => update('secteur', e.target.value)}>
              <option value="">{c.secteurPh}</option>
              {sectors.map((sector) => (
                <option key={sector}>{sector}</option>
              ))}
            </select>
          </span>
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
            inputMode="numeric"
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
        <fieldset className="full visa-fieldset">
          <legend>{c.visa}</legend>
          <div className="visa-cards">
            {c.visaOptions
              .filter((option) => option.value)
              .map((option) => (
                <label key={option.value} className={data.visaUsa === option.value ? 'on' : ''}>
                  <input
                    type="radio"
                    name="visaUsa"
                    value={option.value}
                    checked={data.visaUsa === option.value}
                    onChange={() => update('visaUsa', option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
          </div>
          <p className="visa-note">{getCopy(locale).visaNote}</p>
        </fieldset>
      </div>
    )
  } else {
    fields = (
      <div className="review-board">
        <div className="review-block">
          <div className="review-block-head">
            <h4>{c.reviewTitle}</h4>
          </div>
          <div className="review-group">
            <div className="review-group-head">
              <span>{c.reviewName}</span>
              <button type="button" onClick={() => go(0)}>
                {c.edit}
              </button>
            </div>
            <p>
              {data.prenomNom}
              <small>
                {data.profession} · {data.email} · {data.telephone}
              </small>
            </p>
          </div>
          <div className="review-group">
            <div className="review-group-head">
              <span>{c.reviewOrg}</span>
              <button type="button" onClick={() => go(1)}>
                {c.edit}
              </button>
            </div>
            <p>
              {data.organisationNom}
              <small>
                {data.organisationAdresse}
                {' · '}
                {formatLongDate(data.dateCreation, locale)}
                {' · '}
                {data.secteur} · {data.chiffreAffaires} · {data.nombreEmployes}
              </small>
            </p>
          </div>
          <div className="review-group">
            <div className="review-group-head">
              <span>{c.reviewProject}</span>
              <button type="button" onClick={() => go(2)}>
                {c.edit}
              </button>
            </div>
            <p>
              {data.projetConcret}
              <small>
                {data.salonInternational}
                {' · '}
                {c.reviewVisa}: {visaLabel}
              </small>
            </p>
            <p className="review-reasons">{data.raisons}</p>
          </div>
        </div>

        <div className="docs-stack">
          <div className="review-block-head">
            <h4>{c.docsTitle}</h4>
            <p>{c.docsIntro.replace('{max}', maxLabel)}</p>
          </div>
          <FileDrop
            {...dropProps}
            file={files.passport}
            label={c.passport}
            icon={<IdCard size={22} />}
            onFile={(file) => setFiles((current) => ({ ...current, passport: file }))}
          />
          <FileDrop
            {...dropProps}
            file={files.bank}
            label={c.bank}
            icon={<Landmark size={22} />}
            onFile={(file) => setFiles((current) => ({ ...current, bank: file }))}
          />
          <FileDrop
            {...dropProps}
            file={files.nina}
            label={c.nina}
            icon={<FileBadge size={22} />}
            onFile={(file) => setFiles((current) => ({ ...current, nina: file }))}
          />
        </div>

        <label className="consent-card">
          <input
            type="checkbox"
            checked={data.consent}
            onChange={(e) => update('consent', e.target.checked)}
          />
          <span>
            {c.consent}
            <small>{getCopy(locale).privacyDocs}</small>
          </span>
        </label>
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
      </div>
      <ol className="step-track">
        {c.steps.map((label, index) => {
          const done = index < step
          const current = index === step
          return (
            <li key={label} className={current ? 'current' : done ? 'done' : ''}>
              <button type="button" disabled={!done} onClick={() => go(index)}>
                <span>{done ? <Check size={12} /> : `0${index + 1}`}</span>
                {label}
              </button>
            </li>
          )
        })}
      </ol>
      {fields}
      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        {step > 0 && (
          <button className="button ghost" type="button" onClick={() => go(step - 1)}>
            <ArrowLeft size={16} /> {c.back}
          </button>
        )}
        {step < 3 ? (
          <button className="button primary" type="button" onClick={next}>
            {c.continue} <ArrowRight size={16} />
          </button>
        ) : (
          <button
            className="button primary"
            type="button"
            onClick={submit}
            disabled={loading || store.loading || store.error}
          >
            {loading ? <Loader2 className="spin" size={16} /> : <Send size={16} />}{' '}
            {loading ? c.sending : c.send}
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
