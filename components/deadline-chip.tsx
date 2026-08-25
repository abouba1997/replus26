'use client'

import { useEffect, useState } from 'react'

type Deadline = { open: boolean; daysLeft: number; deadline: string }

export function useDeadline() {
  const [state, setState] = useState<Deadline | null>(null)
  useEffect(() => {
    fetch('/api/deadline')
      .then((r) => r.json())
      .then(setState)
      .catch(() => setState({ open: true, daysLeft: 0, deadline: '2026-09-04' }))
  }, [])
  return state
}

export function DeadlineChip({ label, closed }: { label: string; closed: string }) {
  const state = useDeadline()
  if (!state) return <span className="deadline-chip">{label}</span>
  if (!state.open) return <span className="deadline-chip closed">{closed}</span>
  return (
    <span className="deadline-chip">
      {label} · {state.daysLeft} j
    </span>
  )
}
