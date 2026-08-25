'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Locale } from '@/lib/i18n'

const MONTHS = {
  fr: [
    'janvier',
    'février',
    'mars',
    'avril',
    'mai',
    'juin',
    'juillet',
    'août',
    'septembre',
    'octobre',
    'novembre',
    'décembre',
  ],
  en: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
} as const

const WEEKDAYS = {
  fr: ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'],
  en: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
} as const

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toIso(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

function parseIso(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  const date = new Date(year, month, day)
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null
  }
  return { year, month, day }
}

export function formatLongDate(value: string, locale: Locale) {
  const parsed = parseIso(value)
  if (!parsed) return ''
  const month = MONTHS[locale][parsed.month]
  if (locale === 'en') return `${month} ${parsed.day}, ${parsed.year}`
  return `${parsed.day} ${month} ${parsed.year}`
}

export function DateField({
  value,
  onChange,
  locale,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  locale: Locale
  placeholder: string
}) {
  const today = new Date()
  const maxYear = today.getFullYear()
  const minYear = 1960
  const parsed = parseIso(value)
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(parsed?.year ?? 2016)
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? 0)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    if (parsed) {
      setViewYear(parsed.year)
      setViewMonth(parsed.month)
    }
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, value])

  const years = useMemo(() => {
    const list: number[] = []
    for (let year = maxYear; year >= minYear; year -= 1) list.push(year)
    return list
  }, [maxYear])

  const blanks = (() => {
    const first = new Date(viewYear, viewMonth, 1)
    return (first.getDay() + 6) % 7
  })()
  const days = new Date(viewYear, viewMonth + 1, 0).getDate()

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1)
    const year = Math.min(maxYear, Math.max(minYear, next.getFullYear()))
    setViewYear(year)
    setViewMonth(year === next.getFullYear() ? next.getMonth() : year === maxYear ? 11 : 0)
  }

  const isDisabled = (day: number) => {
    const candidate = new Date(viewYear, viewMonth, day)
    candidate.setHours(0, 0, 0, 0)
    const limit = new Date(today)
    limit.setHours(0, 0, 0, 0)
    return candidate > limit
  }

  return (
    <div className="date-field" ref={rootRef}>
      <button
        type="button"
        className={`date-trigger${value ? ' has-value' : ''}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <CalendarDays size={18} />
        <span>{value ? formatLongDate(value, locale) : placeholder}</span>
      </button>
      {open && (
        <div className="date-popover" role="dialog" aria-label={placeholder}>
          <div className="date-toolbar">
            <button type="button" className="date-nav" onClick={() => shiftMonth(-1)} aria-label="Previous month">
              <ChevronLeft size={16} />
            </button>
            <select
              className="date-select"
              value={viewMonth}
              onChange={(event) => setViewMonth(Number(event.target.value))}
            >
              {MONTHS[locale].map((month, index) => (
                <option key={month} value={index}>
                  {month}
                </option>
              ))}
            </select>
            <select
              className="date-select"
              value={viewYear}
              onChange={(event) => setViewYear(Number(event.target.value))}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <button type="button" className="date-nav" onClick={() => shiftMonth(1)} aria-label="Next month">
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="cal-weekdays">
            {WEEKDAYS[locale].map((day, index) => (
              <span key={`${day}-${index}`}>{day}</span>
            ))}
          </div>
          <div className="cal-grid">
            {Array.from({ length: blanks }, (_, index) => (
              <span key={`b-${index}`} />
            ))}
            {Array.from({ length: days }, (_, index) => {
              const day = index + 1
              const iso = toIso(viewYear, viewMonth, day)
              const selected = value === iso
              const disabled = isDisabled(day)
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={disabled}
                  className={`cal-day${selected ? ' selected' : ''}`}
                  onClick={() => {
                    onChange(iso)
                    setOpen(false)
                  }}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
