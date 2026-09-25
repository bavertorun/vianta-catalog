import { NextResponse } from 'next/server'
import { COOKIE_NAME, sessionCookieOptions, sessionToken, verifyPassword } from '@/lib/admin-auth'

export async function POST(request: Request) {
  const body = await request.json()
  const password = String(body.password || '')

  if (!(await verifyPassword(password))) {
    return NextResponse.json({ error: 'Şifre hatalı' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(COOKIE_NAME, await sessionToken(), sessionCookieOptions(60 * 60 * 24 * 7))
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(COOKIE_NAME, '', sessionCookieOptions(0))
  return response
}
