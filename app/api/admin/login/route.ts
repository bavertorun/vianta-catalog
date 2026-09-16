import { NextResponse } from 'next/server'
import { COOKIE_NAME, sessionToken, verifyPassword } from '@/lib/admin-auth'

export async function POST(request: Request) {
  const body = await request.json()
  const password = String(body.password || '')

  if (!verifyPassword(password)) {
    return NextResponse.json({ error: 'Şifre hatalı' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(COOKIE_NAME, sessionToken(), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(COOKIE_NAME, '', { httpOnly: true, path: '/', maxAge: 0 })
  return response
}
