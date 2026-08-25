'use client'

import './reviewer.css'
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileBadge,
  FileText,
  IdCard,
  Inbox,
  Landmark,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { useEdgeStore } from '@/lib/edgestore'

type Applicant = {
  id: number
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
  passport_name: string
  bank_name: string
  nina_name: string
  status: string
  notes: string
  created_at: string
}

type MailRow = {
  id: number
  reference: string
  to_email: string
  subject: string
  status: string
  provider: string
  created_at: string
}

const statusLabel: Record<string, string> = {
  new: 'Nouveau',
  under_review: 'À étudier',
  accepted: 'Accepté',
  declined: 'Non retenu',
}

const visaLabel: Record<string, string> = {
  jamais: 'Jamais demandé',
  obtenu: 'Visa obtenu',
  refuse: 'Visa refusé',
  en_cours: 'Demande en cours',
}

const mailLabel: Record<string, string> = {
  sent: 'Envoyé',
  queued: 'En file',
  failed: 'Échec',
  logged: 'Journalisé',
}

function formatWhen(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatLongDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!match) return value || '—'
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '·'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

type DocTab = 'passport' | 'bank' | 'nina' | 'pdf'

const DOC_TABS: {
  id: DocTab
  label: string
  hint: string
  Icon: typeof IdCard
  file: (row: Applicant) => string
}[] = [
  { id: 'passport', label: 'Passeport', hint: 'Identité', Icon: IdCard, file: (row) => row.passport_name },
  { id: 'bank', label: 'Banque', hint: 'Relevé', Icon: Landmark, file: (row) => row.bank_name },
  { id: 'nina', label: 'NINA', hint: 'Attestation', Icon: FileBadge, file: (row) => row.nina_name },
  { id: 'pdf', label: 'Fiche', hint: 'Synthèse', Icon: FileText, file: () => 'PDF du dossier' },
]

function isImageFile(name: string) {
  return /\.(jpe?g|png|webp|gif)$/i.test(name || '')
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return target.closest('input, textarea, select, [contenteditable="true"]') !== null
}

export default function ReviewerPage() {
  const { reset } = useEdgeStore()
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginBusy, setLoginBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rows, setRows] = useState<Applicant[]>([])
  const [mail, setMail] = useState<MailRow[]>([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [selected, setSelected] = useState<Applicant | null>(null)
  const [docTab, setDocTab] = useState<DocTab>('passport')
  const [tab, setTab] = useState<'dossiers' | 'courrier'>('dossiers')
  const [copied, setCopied] = useState(false)
  const [docZoom, setDocZoom] = useState(false)
  const studyRef = useRef<HTMLElement>(null)

  const load = async () => {
    const response = await fetch('/api/applications', { credentials: 'include' })
    if (response.status === 401) {
      setAuthed(false)
      return
    }
    const data = await response.json()
    setRows(Array.isArray(data) ? data : [])
    const outbox = await fetch('/api/reviewer/outbox')
    if (outbox.ok) setMail(await outbox.json())
    setAuthed(true)
  }

  useEffect(() => {
    load().catch(() => setAuthed(false))
  }, [])

  const filtered = useMemo(
    () =>
      rows.filter(
        (row) =>
          (status === 'all' || row.status === status) &&
          `${row.prenom_nom} ${row.organisation_nom} ${row.email} ${row.reference} ${row.secteur}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [rows, status, query],
  )

  const selectedIndex = selected
    ? filtered.findIndex((row) => row.reference === selected.reference)
    : -1
  const activeDoc = DOC_TABS.find((doc) => doc.id === docTab) ?? DOC_TABS[0]
  const activeFileName = selected ? activeDoc.file(selected) : ''
  const activeSrc = selected ? `/api/applications/${selected.reference}/${docTab}` : ''
  const activeIsImage = docTab !== 'pdf' && isImageFile(activeFileName)

  const openStudy = (row: Applicant) => {
    setSelected(row)
    setDocTab('passport')
    setCopied(false)
    setDocZoom(false)
  }

  const closeStudy = () => {
    if (selected) void updateStatus(selected.reference, selected.status, selected.notes)
    setSelected(null)
  }

  const goQueue = (dir: -1 | 1) => {
    if (!selected || selectedIndex < 0) return
    void updateStatus(selected.reference, selected.status, selected.notes)
    const next = filtered[selectedIndex + dir]
    if (!next) return
    setSelected(next)
    setDocTab('passport')
    setCopied(false)
    setDocZoom(false)
  }

  useEffect(() => {
    if (!selected) return
    studyRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeStudy()
        return
      }
      if (isTypingTarget(event.target)) return
      if (event.key === 'ArrowRight' || event.key === 'j') {
        event.preventDefault()
        goQueue(1)
      } else if (event.key === 'ArrowLeft' || event.key === 'k') {
        event.preventDefault()
        goQueue(-1)
      } else if (event.key >= '1' && event.key <= '4') {
        const nextTab = DOC_TABS[Number(event.key) - 1]
        if (nextTab) {
          setDocTab(nextTab.id)
          setDocZoom(false)
        }
      }
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [selected, selectedIndex, filtered])

  const login = async (event: FormEvent) => {
    event.preventDefault()
    setLoginError('')
    setLoginBusy(true)
    try {
      const response = await fetch('/api/reviewer/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        setLoginError(
          typeof body?.error === 'string'
            ? body.error
            : 'Email ou mot de passe incorrect. Utilisez les identifiants transmis par la coordination.',
        )
        return
      }
      await reset()
      await load()
    } finally {
      setLoginBusy(false)
    }
  }

  const logout = async () => {
    await fetch('/api/reviewer/login', { method: 'DELETE' })
    await reset()
    setSelected(null)
    setAuthed(false)
    setRows([])
    setMail([])
  }

  const updateStatus = async (reference: string, next: string, notes?: string) => {
    await fetch('/api/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference, status: next, notes }),
    })
    setRows((current) =>
      current.map((row) =>
        row.reference === reference ? { ...row, status: next, notes: notes ?? row.notes } : row,
      ),
    )
    setSelected((current) =>
      current?.reference === reference
        ? { ...current, status: next, notes: notes ?? current.notes }
        : current,
    )
  }

  const counts = useMemo(
    () => ({
      all: rows.length,
      new: rows.filter((row) => row.status === 'new').length,
      under_review: rows.filter((row) => row.status === 'under_review').length,
      accepted: rows.filter((row) => row.status === 'accepted').length,
    }),
    [rows],
  )

  const copyRef = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      /* ignore */
    }
  }

  if (authed === null) {
    return (
      <main className="reviewer-gate">
        <div className="reviewer-gate-grid" />
        <p className="reviewer-boot">
          <Loader2 className="spin" size={22} /> Ouverture de l’espace équipe…
        </p>
      </main>
    )
  }

  if (!authed) {
    return (
      <main className="reviewer-gate">
        <div className="reviewer-gate-grid" />
        <div className="reviewer-gate-scan" />
        <nav className="reviewer-gate-nav">
          <a className="brand" href="/">
            <BrandLogo />
          </a>
          <a className="reviewer-gate-public" href="/">
            Retour au site public <ArrowRight size={15} />
          </a>
        </nav>

        <div className="reviewer-gate-shell">
          <section className="reviewer-gate-copy">
            <div className="eyebrow lime">
              <span className="pulse-dot" /> Confidentiel · Embassy / AmCham
            </div>
            <h1>
              L’espace de <em>sélection</em>.
            </h1>
            <p>
              Accès réservé à l’équipe de l’Ambassade des États-Unis à Bamako et d’AmCham Mali pour
              l’étude des dossiers de la délégation RE+ 2026.
            </p>
            <ul className="reviewer-gate-facts">
              <li>
                <CalendarDays size={22} />
                <span>
                  <b>16–19 novembre 2026</b>
                  RE+ · Las Vegas Convention Center
                </span>
              </li>
              <li>
                <MapPin size={22} />
                <span>
                  <b>Candidatures jusqu’au 4 sept.</b>
                  Lecture, décision, export — uniquement ici
                </span>
              </li>
              <li>
                <Users size={22} />
                <span>
                  <b>Délégation malienne</b>
                  Opérateurs sélectionnés pour Las Vegas
                </span>
              </li>
            </ul>
          </section>

          <form className="reviewer-login" onSubmit={login}>
            <span className="reviewer-lock">
              <Lock size={18} />
            </span>
            <h2>Connexion équipe</h2>
            <p>Utilisez l’adresse professionnelle transmise par la coordination.</p>
            <label>
              Adresse email professionnelle
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@amchammali.org"
                required
              />
            </label>
            <label>
              Mot de passe
              <span className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((open) => !open)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </span>
            </label>
            {loginError && <p className="form-error">{loginError}</p>}
            <button className="button primary large" type="submit" disabled={loginBusy}>
              {loginBusy ? <Loader2 className="spin" size={16} /> : <ShieldCheck size={16} />}
              {loginBusy ? 'Vérification…' : 'Accéder aux dossiers'}
            </button>
          </form>
        </div>

        <p className="reviewer-gate-foot">
          Ambassade des États-Unis à Bamako · AmCham Mali · RE+ Mali 2026
        </p>
      </main>
    )
  }

  return (
    <main className="reviewer">
      <nav className="reviewer-nav">
        <a className="brand" href="/">
          <BrandLogo />
        </a>
        <div className="reviewer-nav-center">
          <span className="pulse-dot" />
          Espace équipe · confidentiel
        </div>
        <div className="reviewer-nav-actions">
          <a className="button ghost light-ghost" href="/api/applications/export?format=csv">
            <Download size={15} /> CSV
          </a>
          <a className="button ghost light-ghost" href="/api/applications/export?format=pdf">
            <Download size={15} /> PDF
          </a>
          <button className="button ghost light-ghost" type="button" onClick={logout}>
            <LogOut size={15} /> Déconnexion
          </button>
        </div>
      </nav>

      <div className="reviewer-shell">
        <header className="reviewer-intro">
          <div>
            <h1>
              Les <em>dossiers</em>.
            </h1>
            <span className="eyebrow lime">
              <span className="pulse-dot" /> RE+ Mali 2026 · Las Vegas · 16–19 novembre
            </span>
          </div>
          <aside className="reviewer-deadline">
            <span>Clôture</span>
            <strong>4 sept. 2026</strong>
          </aside>
        </header>

        <section className="review-stats">
          {(
            [
              ['all', 'Reçus', counts.all, Inbox],
              ['new', 'Nouveaux', counts.new, FileText],
              ['under_review', 'À étudier', counts.under_review, Search],
              ['accepted', 'Acceptés', counts.accepted, ShieldCheck],
            ] as const
          ).map(([key, label, value, Icon]) => (
            <button
              key={key}
              type="button"
              className={status === key ? 'on' : ''}
              onClick={() => {
                setTab('dossiers')
                setStatus(key)
              }}
            >
              <span>
                <Icon size={14} /> {label}
              </span>
              <strong>{value}</strong>
            </button>
          ))}
        </section>

        <section className="reviewer-panel">
          <div className="reviewer-panel-bar">
            <div className="reviewer-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'dossiers'}
                className={tab === 'dossiers' ? 'active' : ''}
                onClick={() => setTab('dossiers')}
              >
                Dossiers
                <em>{rows.length}</em>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'courrier'}
                className={tab === 'courrier' ? 'active' : ''}
                onClick={() => setTab('courrier')}
              >
                Courrier
                <em>{mail.length}</em>
              </button>
            </div>
            {tab === 'dossiers' ? (
              <div className="reviewer-toolbar">
                <div className="search">
                  <Search size={17} />
                  <input
                    aria-label="Rechercher"
                    placeholder="Nom, organisation, email, référence…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <select
                  aria-label="Filtrer par statut"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="all">Tous les statuts</option>
                  <option value="new">Nouveaux</option>
                  <option value="under_review">À étudier</option>
                  <option value="accepted">Acceptés</option>
                  <option value="declined">Non retenus</option>
                </select>
              </div>
            ) : (
              <p className="reviewer-mail-hint">Accusés de réception et copies envoyées à l’équipe.</p>
            )}
          </div>

          {tab === 'courrier' ? (
            <div className="applicants">
              <div className="table-head mail-head">
                <span>Destinataire</span>
                <span>Sujet</span>
                <span>Référence</span>
                <span>Statut</span>
              </div>
              {mail.length ? (
                mail.map((row) => (
                  <div className="applicant-row mail-row" key={row.id}>
                    <div>
                      <strong>{row.to_email}</strong>
                      <small>{formatWhen(row.created_at)}</small>
                    </div>
                    <span className="row-subject">{row.subject}</span>
                    <code>{row.reference || '—'}</code>
                    <span className={`status mail-${row.status}`}>
                      <Mail size={12} /> {mailLabel[row.status] ?? row.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="empty">
                  <Inbox size={28} />
                  <strong>Aucun courrier pour l’instant</strong>
                  <p>Les accusés apparaîtront ici dès qu’un dossier sera envoyé.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="applicants">
              <div className="table-head">
                <span>Opérateur</span>
                <span>Organisation</span>
                <span>Secteur</span>
                <span>Visa</span>
                <span>Reçu</span>
                <span>Statut</span>
              </div>
              {filtered.length ? (
                filtered.map((row) => (
                  <button
                    className={`applicant-row${selected?.reference === row.reference ? ' is-open' : ''}`}
                    key={row.reference}
                    onClick={() => openStudy(row)}
                    type="button"
                  >
                    <div className="row-operator">
                      <span className="row-avatar" aria-hidden>
                        {initials(row.prenom_nom)}
                      </span>
                      <div>
                        <strong>{row.prenom_nom}</strong>
                        <span className="row-job">{row.profession || '—'}</span>
                      </div>
                    </div>
                    <div className="row-org">
                      <b>{row.organisation_nom}</b>
                      <small>{row.reference}</small>
                    </div>
                    <span className="row-sector">{row.secteur || '—'}</span>
                    <span>{visaLabel[row.visa_usa] ?? row.visa_usa ?? '—'}</span>
                    <span>{formatWhen(row.created_at)}</span>
                    <span className="row-end">
                      <span className={`status ${row.status}`}>
                        {statusLabel[row.status] ?? row.status}
                      </span>
                      <ChevronRight className="row-chevron" size={18} />
                    </span>
                  </button>
                ))
              ) : (
                <div className="empty">
                  <Search size={28} />
                  <strong>Aucun dossier ici</strong>
                  <p>
                    {rows.length
                      ? 'Aucun résultat pour cette recherche ou ce filtre.'
                      : 'Les candidatures apparaîtront ici dès le premier envoi.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {selected && (
        <section
          className="study"
          ref={studyRef}
          tabIndex={-1}
          aria-label={`Étude du dossier ${selected.reference}`}
        >
          <header className="study-bar">
            <button className="study-back" type="button" onClick={closeStudy}>
              <ArrowLeft size={16} /> Liste
            </button>
            <div className="study-who">
              <span className="row-avatar" aria-hidden>
                {initials(selected.prenom_nom)}
              </span>
              <div>
                <strong>{selected.prenom_nom}</strong>
                <small>
                  {selected.organisation_nom} · {selected.reference}
                </small>
              </div>
            </div>
            <span className={`status ${selected.status}`}>
              {statusLabel[selected.status] ?? selected.status}
            </span>
            <div className="study-queue">
              <button
                type="button"
                className="study-nav-btn"
                aria-label="Dossier précédent"
                disabled={selectedIndex <= 0}
                onClick={() => goQueue(-1)}
              >
                <ChevronLeft size={18} />
              </button>
              <span>
                {selectedIndex >= 0 ? selectedIndex + 1 : '—'} / {filtered.length}
              </span>
              <button
                type="button"
                className="study-nav-btn"
                aria-label="Dossier suivant"
                disabled={selectedIndex < 0 || selectedIndex >= filtered.length - 1}
                onClick={() => goQueue(1)}
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <button
              className="dossier-close light"
              type="button"
              aria-label="Fermer le dossier"
              onClick={closeStudy}
            >
              <X size={18} />
            </button>
          </header>

          <div className="study-body">
            <div className="study-facts">
              <div className="study-facts-scroll">
                <div className="study-ref">
                  <span>Référence</span>
                  <strong>{selected.reference}</strong>
                  <button type="button" onClick={() => copyRef(selected.reference)}>
                    <Copy size={13} /> {copied ? 'Copiée' : 'Copier'}
                  </button>
                </div>

                <div className={`visa-flag ${selected.visa_usa || ''}`}>
                  <span>Visa États-Unis</span>
                  <strong>{visaLabel[selected.visa_usa] ?? selected.visa_usa}</strong>
                </div>

                <dl className="study-meta">
                  <div>
                    <dt>Contact</dt>
                    <dd>
                      <a href={`mailto:${selected.email}`}>
                        <Mail size={14} /> {selected.email}
                      </a>
                      <a href={`tel:${selected.telephone}`}>
                        <Phone size={14} /> {selected.telephone}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt>Organisation</dt>
                    <dd>
                      {selected.organisation_nom}
                      <small>
                        {selected.organisation_adresse}
                        <br />
                        {formatLongDate(selected.date_creation)} · {selected.chiffre_affaires} ·{' '}
                        {selected.nombre_employes}
                      </small>
                    </dd>
                  </div>
                  <div>
                    <dt>Secteur · métier</dt>
                    <dd>
                      {selected.secteur} · {selected.profession}
                    </dd>
                  </div>
                </dl>

                <div className="study-read">
                  <h3>Projet concret</h3>
                  <p>{selected.projet_concret}</p>
                  <h3>Pourquoi RE+</h3>
                  <p>{selected.raisons}</p>
                  <h3>Salon international</h3>
                  <p>{selected.salon_international || '—'}</p>
                </div>

                <p className="dossier-meta">
                  <span>
                    <CalendarDays size={13} /> Reçu le {formatWhen(selected.created_at)}
                  </span>
                  <span>
                    <Building2 size={13} /> {selected.organisation_nom}
                  </span>
                </p>
              </div>

              <div className="study-decision">
                <h3>Décision</h3>
                <div className="status-picks">
                  {(['new', 'under_review', 'accepted', 'declined'] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={selected.status === value ? `on ${value}` : value}
                      onClick={() => updateStatus(selected.reference, value, selected.notes)}
                    >
                      {statusLabel[value]}
                    </button>
                  ))}
                </div>
                <label>
                  Notes internes
                  <textarea
                    value={selected.notes || ''}
                    placeholder="Visible uniquement par l’équipe Embassy / AmCham."
                    onChange={(e) => setSelected({ ...selected, notes: e.target.value })}
                    onBlur={() => updateStatus(selected.reference, selected.status, selected.notes)}
                  />
                </label>
                <p className="study-keys">
                  ← → dossier · 1–4 pièces · Échap liste
                </p>
              </div>
            </div>

            <div className="study-file">
              <div className="study-docs" role="tablist" aria-label="Pièces du dossier">
                {DOC_TABS.map((doc, index) => (
                  <button
                    key={doc.id}
                    type="button"
                    role="tab"
                    aria-selected={docTab === doc.id}
                    className={docTab === doc.id ? 'on' : ''}
                    onClick={() => {
                      setDocTab(doc.id)
                      setDocZoom(false)
                    }}
                  >
                    <doc.Icon size={15} />
                    <span>
                      {doc.label}
                      <small>
                        {index + 1} · {doc.hint}
                      </small>
                    </span>
                  </button>
                ))}
              </div>
              <div className={`study-stage${docZoom ? ' is-zoom' : ''}`}>
                {activeIsImage ? (
                  <img key={activeSrc} src={activeSrc} alt={activeDoc.label} />
                ) : (
                  <iframe key={activeSrc} title={activeDoc.label} src={activeSrc} />
                )}
              </div>
              <div className="study-file-foot">
                <span>{activeFileName || activeDoc.label}</span>
                <div className="study-file-actions">
                  {activeIsImage && (
                    <button type="button" onClick={() => setDocZoom((open) => !open)}>
                      {docZoom ? 'Ajuster' : 'Taille réelle'}
                    </button>
                  )}
                  <a href={activeSrc} target="_blank" rel="noreferrer">
                    Ouvrir <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
