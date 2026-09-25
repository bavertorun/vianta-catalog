import { NextResponse } from 'next/server'
import { AdminConfigError, COOKIE_NAME, sessionCookieOptions, sessionToken, verifyPassword } from '@/lib/admin-auth'

export async function POST(request: Request) {
  const body = await request.json()
  const password = String(body.password || '')

  try {
    if (!(await verifyPassword(password))) {
      return NextResponse.json({ error: 'Şifre hatalı' }, { status: 401 })
    }
  } catch (error) {
    if (error instanceof AdminConfigError) {
      return NextResponse.json({ error: 'Sunucuda ADMIN_PASSWORD tanımlı değil' }, { status: 500 })
    }
    throw error
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
