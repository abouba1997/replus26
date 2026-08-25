import { betterAuth } from 'better-auth'
import { nextCookies, toNextJsHandler } from 'better-auth/next-js'
import { createHmac, timingSafeEqual } from 'crypto'
import { headers } from 'next/headers'
import { getPool } from '@/lib/db'
import { authSecret, siteUrl, trustedOrigins } from '@/lib/env'

export const REVIEWER_COOKIE = 'replus_reviewer'
const MAX_AGE = 60 * 60 * 24 * 7

function secret() {
  return authSecret()
}

export const auth = betterAuth({
  database: getPool() ?? undefined,
  secret: secret(),
  baseURL: siteUrl(),
  emailAndPassword: {
    enabled: true,
    disableSignUp: process.env.SEEDING !== '1',
  },
  trustedOrigins: trustedOrigins(),
  plugins: [nextCookies()],
})

export const authHandlers = toNextJsHandler(auth)

export function signValue(value: string) {
  const hmac = createHmac('sha256', secret()).update(value).digest('hex')
  return `${value}.${hmac}`
}

export function verifyValue(token: string | undefined) {
  if (!token || !secret()) return false
  const lastDot = token.lastIndexOf('.')
  if (lastDot < 1) return false
  const value = token.slice(0, lastDot)
  const given = token.slice(lastDot + 1)
  const expected = createHmac('sha256', secret()).update(value).digest('hex')
  try {
    return (
      given.length === expected.length &&
      timingSafeEqual(Buffer.from(given), Buffer.from(expected)) &&
      value === 'ok'
    )
  } catch {
    return false
  }
}

function reviewerEmails() {
  return [
    process.env.REVIEWER_EMAIL,
    process.env.CONTACT_EMAIL,
    'replusevent@amchammali.org',
    'embassy@amchammali.org',
    'amcham@amchammali.org',
  ]
    .filter(Boolean)
    .map((item) => item!.trim().toLowerCase())
}

export function reviewerAuthConfigured() {
  return Boolean(process.env.REVIEWER_PASSWORD?.trim() && authSecret())
}

export function checkReviewerCredentials(email: string, password: string) {
  const expectedPassword = process.env.REVIEWER_PASSWORD?.trim() || ''
  if (!expectedPassword) return false
  const given = password.trim()
  const left = Buffer.from(given)
  const right = Buffer.from(expectedPassword)
  const passwordOk =
    left.length === right.length && timingSafeEqual(left, right)
  return reviewerEmails().includes(email.trim().toLowerCase()) && passwordOk
}

export async function isReviewerAuthenticated() {
  const { cookies } = await import('next/headers')
  const jar = await cookies()
  if (verifyValue(jar.get(REVIEWER_COOKIE)?.value)) return true
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    return Boolean(session?.user)
  } catch {
    return false
  }
}

export function reviewerCookie(token: string) {
  return {
    name: REVIEWER_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  }
}
