'use client'

import './reviewer.css'
import { FormEvent, useEffect, useState } from 'react'
import {
  Download,
  FileText,
  LogOut,
  Mail,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react'

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

export default function ReviewerPage() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [rows, setRows] = useState<Applicant[]>([])
  const [mail, setMail] = useState<MailRow[]>([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [selected, setSelected] = useState<Applicant | null>(null)
  const [tab, setTab] = useState<'dossiers' | 'courrier'>('dossiers')

  const load = async () => {
    const response = await fetch('/api/applications')
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

  const login = async (event: FormEvent) => {
    event.preventDefault()
    setLoginError('')
    const response = await fetch('/api/reviewer/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!response.ok) {
      setLoginError('Identifiants incorrects.')
      return
    }
    await load()
  }

  const logout = async () => {
    await fetch('/api/reviewer/login', { method: 'DELETE' })
    setAuthed(false)
    setRows([])
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

  const filtered = rows.filter(
    (row) =>
      (status === 'all' || row.status === status) &&
      `${row.prenom_nom} ${row.organisation_nom} ${row.email}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  )

  if (authed === null) {
    return (
      <main className="reviewer">
        <p>Chargement de l’espace équipe…</p>
      </main>
    )
  }

  if (!authed) {
    return (
      <main className="reviewer">
        <form className="reviewer-login" onSubmit={login}>
          <ShieldCheck size={36} />
          <span className="eyebrow lime">Espace équipe · confidentiel</span>
          <h1>Connexion.</h1>
          <p>Comptes Embassy, AmCham et coordination. Better Auth + mot de passe équipe.</p>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Mot de passe
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {loginError && <p className="form-error">{loginError}</p>}
          <button className="button primary" type="submit">
            Entrer
          </button>
        </form>
      </main>
    )
  }

  return (
    <main className="reviewer">
      <header className="reviewer-head">
        <div>
          <span className="eyebrow lime">Espace équipe · confidentiel</span>
          <h1>La sélection.</h1>
          <p>
            Centralisez, exportez et appelez les opérateurs qui feront rayonner le Mali à RE+ 2026.
          </p>
        </div>
        <div className="reviewer-head-actions">
          <ShieldCheck size={42} />
          <a className="button ghost" href="/api/applications/export?format=csv">
            <Download size={16} /> CSV
          </a>
          <a className="button ghost" href="/api/applications/export?format=pdf">
            <Download size={16} /> PDF
          </a>
          <button className="button ghost" onClick={logout}>
            <LogOut size={16} /> Sortir
          </button>
        </div>
      </header>
      <div className="reviewer-tabs">
        <button className={tab === 'dossiers' ? 'active' : ''} onClick={() => setTab('dossiers')}>
          Dossiers
        </button>
        <button className={tab === 'courrier' ? 'active' : ''} onClick={() => setTab('courrier')}>
          Courrier
        </button>
      </div>
      {tab === 'courrier' ? (
        <section className="applicants">
          <div className="table-head">
            <span>Destinataire</span>
            <span>Sujet</span>
            <span>Référence</span>
            <span>Statut</span>
          </div>
          {mail.length ? (
            mail.map((row) => (
              <div className="applicant-row" key={row.id}>
                <div>
                  <strong>{row.to_email}</strong>
                  <small>{new Date(row.created_at).toLocaleString('fr-FR')}</small>
                </div>
                <span>{row.subject}</span>
                <code>{row.reference || '—'}</code>
                <span className={`status ${row.status}`}>
                  <Mail size={12} /> {row.status}
                </span>
              </div>
            ))
          ) : (
            <div className="empty">Aucun courrier dans la file.</div>
          )}
        </section>
      ) : (
        <>
          <section className="reviewer-toolbar">
            <div className="search">
              <Search size={17} />
              <input
                aria-label="Rechercher"
                placeholder="Rechercher un opérateur..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <select
              aria-label="Filtrer par statut"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">Tous les dossiers</option>
              <option value="new">Nouveaux</option>
              <option value="under_review">À étudier</option>
              <option value="accepted">Acceptés</option>
              <option value="declined">Non retenus</option>
            </select>
            <SlidersHorizontal size={18} />
          </section>
          <div className="review-stats">
            <div>
              <span>Dossiers reçus</span>
              <strong>{rows.length}</strong>
            </div>
            <div>
              <span>À étudier</span>
              <strong>{rows.filter((row) => row.status === 'new').length}</strong>
            </div>
            <div>
              <span>Acceptés</span>
              <strong>{rows.filter((row) => row.status === 'accepted').length}</strong>
            </div>
            <div>
              <span>Affichés</span>
              <strong>{filtered.length}</strong>
            </div>
          </div>
          <section className="applicants">
            <div className="table-head">
              <span>Opérateur</span>
              <span>Activité</span>
              <span>Référence</span>
              <span>Statut</span>
            </div>
            {filtered.length ? (
              filtered.map((row) => (
                <button
                  className="applicant-row"
                  key={row.reference}
                  onClick={() => setSelected(row)}
                  type="button"
                >
                  <div>
                    <strong>{row.prenom_nom}</strong>
                    <small>{row.organisation_nom}</small>
                  </div>
                  <span>{row.secteur || '—'}</span>
                  <code>{row.reference}</code>
                  <span className={`status ${row.status}`}>
                    {statusLabel[row.status] ?? row.status}
                  </span>
                </button>
              ))
            ) : (
              <div className="empty">Aucun dossier ne correspond à votre recherche.</div>
            )}
          </section>
        </>
      )}
      {selected && (
        <aside className="dossier">
          <header>
            <div>
              <span className="eyebrow">{selected.reference}</span>
              <h2>{selected.prenom_nom}</h2>
              <p>
                {selected.profession} · {selected.organisation_nom}
              </p>
            </div>
            <button className="button ghost" onClick={() => setSelected(null)}>
              Fermer
            </button>
          </header>
          <dl>
            <div>
              <dt>Contact</dt>
              <dd>
                {selected.email} · {selected.telephone}
              </dd>
            </div>
            <div>
              <dt>Adresse</dt>
              <dd>{selected.organisation_adresse}</dd>
            </div>
            <div>
              <dt>Création / CA / effectif</dt>
              <dd>
                {selected.date_creation} · {selected.chiffre_affaires} · {selected.nombre_employes}
              </dd>
            </div>
            <div>
              <dt>Salon international</dt>
              <dd>{selected.salon_international}</dd>
            </div>
            <div>
              <dt>Projet concret</dt>
              <dd>{selected.projet_concret}</dd>
            </div>
            <div>
              <dt>Raisons</dt>
              <dd>{selected.raisons}</dd>
            </div>
            <div>
              <dt>Visa USA</dt>
              <dd>{selected.visa_usa}</dd>
            </div>
          </dl>
          <div className="dossier-files">
            <a href={`/api/applications/${selected.reference}/passport`} target="_blank" rel="noreferrer">
              <FileText size={16} /> Passeport
            </a>
            <a href={`/api/applications/${selected.reference}/bank`} target="_blank" rel="noreferrer">
              <FileText size={16} /> Relevé bancaire
            </a>
            <a href={`/api/applications/${selected.reference}/nina`} target="_blank" rel="noreferrer">
              <FileText size={16} /> NINA / attestation
            </a>
            <a href={`/api/applications/${selected.reference}/pdf`} target="_blank" rel="noreferrer">
              <Download size={16} /> PDF dossier
            </a>
          </div>
          <label>
            Statut
            <select
              value={selected.status}
              onChange={(e) => updateStatus(selected.reference, e.target.value, selected.notes)}
            >
              <option value="new">Nouveau</option>
              <option value="under_review">À étudier</option>
              <option value="accepted">Accepté</option>
              <option value="declined">Non retenu</option>
            </select>
          </label>
          <label>
            Notes internes
            <textarea
              value={selected.notes || ''}
              onChange={(e) => setSelected({ ...selected, notes: e.target.value })}
              onBlur={() => updateStatus(selected.reference, selected.status, selected.notes)}
            />
          </label>
        </aside>
      )}
    </main>
  )
}
