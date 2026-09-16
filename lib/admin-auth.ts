import { cookies } from 'next/headers'
import { createHash, timingSafeEqual } from 'crypto'

const COOKIE_NAME = 'vianta_admin_session'

function hashPassword(password: string): string {
  return createHash('sha256').update(`vianta:${password}`).digest('hex')
}

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || 'vianta-admin'
}

export function verifyPassword(password: string): boolean {
  const expected = hashPassword(getAdminPassword())
  const actual = hashPassword(password)
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(actual))
  } catch {
    return false
  }
}

export function sessionToken(): string {
  return hashPassword(getAdminPassword() + ':session')
}

export async function isAuthenticated(): Promise<boolean> {
  const jar = await cookies()
  const value = jar.get(COOKIE_NAME)?.value
  if (!value) return false
  try {
    return timingSafeEqual(Buffer.from(value), Buffer.from(sessionToken()))
  } catch {
    return false
  }
}

export { COOKIE_NAME }
