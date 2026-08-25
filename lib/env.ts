function trimSlash(url: string) {
  return url.replace(/\/$/, '')
}

function vercelHttps(host: string | undefined) {
  if (!host) return ''
  return `https://${host.replace(/^https?:\/\//, '')}`
}

/** Canonical public URL for this deployment. */
export function siteUrl() {
  if (process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL) {
    return vercelHttps(process.env.VERCEL_URL)
  }
  const explicit = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_SITE_URL
  if (explicit) return trimSlash(explicit)
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return vercelHttps(process.env.VERCEL_PROJECT_PRODUCTION_URL)
  }
  if (process.env.VERCEL_URL) return vercelHttps(process.env.VERCEL_URL)
  return 'http://localhost:3000'
}

export function trustedOrigins() {
  const origins = new Set<string>([siteUrl()])
  for (const value of [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.BETTER_AUTH_URL,
    vercelHttps(process.env.VERCEL_URL),
    vercelHttps(process.env.VERCEL_PROJECT_PRODUCTION_URL),
    vercelHttps(process.env.VERCEL_BRANCH_URL),
  ]) {
    if (value) origins.add(trimSlash(value))
  }
  return [...origins]
}

export function databaseUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    ''
  )
}

export function authSecret() {
  return process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET || ''
}

export function isVercel() {
  return process.env.VERCEL === '1'
}

/**
 * Vercel Functions cap request bodies at 4.5 MB. Three attachments plus
 * form fields must stay under that, so production defaults to 1 MB per file.
 */
export function maxUploadMb() {
  const raw = process.env.MAX_UPLOAD_MB || process.env.NEXT_PUBLIC_MAX_UPLOAD_MB
  if (raw) return Number(raw)
  return isVercel() ? 1 : 8
}

export function maxUploadBytes() {
  return maxUploadMb() * 1024 * 1024
}
