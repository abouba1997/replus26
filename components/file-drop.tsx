'use client'

import { useRef, useState, type ReactNode } from 'react'
import { FileUp, X } from 'lucide-react'

const ACCEPT = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png'
const ALLOWED = /\.(pdf|jpe?g|png)$/i

function formatSize(bytes: number, locale: 'fr' | 'en') {
  const mb = bytes / (1024 * 1024)
  if (mb >= 1) return locale === 'en' ? `${mb.toFixed(1)} MB` : `${mb.toFixed(1)} Mo`
  const kb = Math.max(1, Math.round(bytes / 1024))
  return locale === 'en' ? `${kb} KB` : `${kb} Ko`
}

export function FileDrop({
  file,
  label,
  hint,
  icon,
  maxMb,
  maxTotalBytes,
  otherBytes = 0,
  locale,
  chooseLabel,
  replaceLabel,
  removeLabel,
  dropLabel,
  tooLargeLabel,
  typeLabel,
  onFile,
}: {
  file: File | null
  label: string
  hint: string
  icon: ReactNode
  maxMb: number
  maxTotalBytes?: number
  otherBytes?: number
  locale: 'fr' | 'en'
  chooseLabel: string
  replaceLabel: string
  removeLabel: string
  dropLabel: string
  tooLargeLabel: string
  typeLabel: string
  onFile: (file: File | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  const [error, setError] = useState('')

  const take = (next: File | undefined) => {
    if (!next) return
    if (!ALLOWED.test(next.name) && !/pdf|jpeg|jpg|png/i.test(next.type)) {
      setError(typeLabel)
      return
    }
    if (next.size > maxMb * 1024 * 1024) {
      setError(tooLargeLabel)
      return
    }
    if (maxTotalBytes && otherBytes + next.size > maxTotalBytes) {
      setError(tooLargeLabel)
      return
    }
    setError('')
    onFile(next)
  }

  return (
    <div className={`file-drop${drag ? ' is-drag' : ''}${file ? ' has-file' : ''}${error ? ' has-error' : ''}`}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="file-drop-input"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(event) => take(event.target.files?.[0])}
      />
      {file ? (
        <div className="file-drop-ready">
          <span className="file-drop-icon ok">{icon}</span>
          <div>
            <strong>{file.name}</strong>
            <small>
              {formatSize(file.size, locale)} · {hint}
            </small>
          </div>
          <div className="file-drop-actions">
            <button type="button" onClick={() => inputRef.current?.click()}>
              {replaceLabel}
            </button>
            <button
              type="button"
              className="file-remove"
              aria-label={removeLabel}
              onClick={() => {
                onFile(null)
                setError('')
                if (inputRef.current) inputRef.current.value = ''
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="file-drop-empty"
          onClick={() => inputRef.current?.click()}
          onDragEnter={(event) => {
            event.preventDefault()
            setDrag(true)
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setDrag(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDrag(false)
            take(event.dataTransfer.files[0])
          }}
        >
          <span className="file-drop-icon">{drag ? <FileUp size={22} /> : icon}</span>
          <span className="file-drop-copy">
            <b>{label}</b>
            <small>{drag ? dropLabel : hint}</small>
          </span>
          <span className="file-choose">{chooseLabel}</span>
        </button>
      )}
      {error && <p className="file-drop-error">{error}</p>}
    </div>
  )
}
