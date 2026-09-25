import { NextResponse } from 'next/server'
import { isReadOnlyFsError } from '@/lib/atomic-write'
import {
  COOKIE_NAME,
  isAuthenticated,
  sessionCookieOptions,
  sessionToken,
  setAdminPassword,
  verifyPassword,
} from '@/lib/admin-auth'

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const currentPassword = String(body.currentPassword || '')
  const newPassword = String(body.newPassword || '')

  if (!(await verifyPassword(currentPassword))) {
    return NextResponse.json({ error: 'Mevcut şifre hatalı' }, { status: 400 })
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ error: 'Yeni şifre en az 6 karakter olmalı' }, { status: 400 })
  }

  if (newPassword === currentPassword) {
    return NextResponse.json({ error: 'Yeni şifre mevcut şifreyle aynı olamaz' }, { status: 400 })
  }

  try {
    await setAdminPassword(newPassword)
  } catch (error) {
    if (isReadOnlyFsError(error)) {
      return NextResponse.json(
        { error: 'Şifre diske yazılamadı. Canlı sunucuda kalıcı disk gerekli.' },
        { status: 500 },
      )
    }
    throw error
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(COOKIE_NAME, await sessionToken(), sessionCookieOptions(60 * 60 * 24 * 7))
  return response
}
