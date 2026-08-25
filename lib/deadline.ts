export function applicationDeadline() {
  const raw = process.env.NEXT_PUBLIC_APPLICATION_DEADLINE || process.env.APPLICATION_DEADLINE || '2026-09-04'
  const date = new Date(`${raw}T23:59:59.000Z`)
  return Number.isNaN(date.getTime()) ? new Date('2026-09-04T23:59:59.000Z') : date
}

export function isApplicationOpen(now = new Date()) {
  return now.getTime() <= applicationDeadline().getTime()
}

export function daysUntilDeadline(now = new Date()) {
  const ms = applicationDeadline().getTime() - now.getTime()
  return Math.max(0, Math.ceil(ms / 86_400_000))
}
