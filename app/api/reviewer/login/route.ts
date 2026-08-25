import { NextResponse } from 'next/server'
import { auth, checkReviewerCredentials, reviewerCookie, signValue } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const email = String(body.email ?? '')
  const password = String(body.password ?? '')
  if (checkReviewerCredentials(email, password)) {
    const response = NextResponse.json({ ok: true })
    response.cookies.set(reviewerCookie(signValue('ok')))
    return response
  }
  try {
    const result = await Promise.race([
      auth.api.signInEmail({
        body: { email, password },
        asResponse: true,
      }) as Promise<Response>,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('auth-timeout')), 400)),
    ])
    if (result.ok) return result
  } catch {
    /* no Better Auth user, or timeout */
  }
  return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 })
}

export async function DELETE() {
  try {
    await auth.api.signOut({ headers: new Headers() })
  } catch {
    /* ignore */
  }
  const response = NextResponse.json({ ok: true })
  response.cookies.set({
    name: 'replus_reviewer',
    value: '',
    path: '/',
    maxAge: 0,
  })
  return response
}
