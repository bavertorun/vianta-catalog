import { cookies } from 'next/headers'
import { createHash, timingSafeEqual } from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'
import { writeAtomic } from '@/lib/atomic-write'

const COOKIE_NAME = 'vianta_admin_session'
const ADMIN_FILE = path.join(process.cwd(), 'data', 'admin.json')

function hashPassword(password: string): string {
  return createHash('sha256').update(`vianta:${password}`).digest('hex')
}

function hashesMatch(expected: string, actual: string): boolean {
  try {
    const a = Buffer.from(expected)
    const b = Buffer.from(actual)
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

async function readStoredHash(): Promise<string | null> {
  try {
    const raw = await fs.readFile(ADMIN_FILE, 'utf8')
    const data = JSON.parse(raw) as { passwordHash?: string }
    return data.passwordHash || null
  } catch {
    return null
  }
}

export class AdminConfigError extends Error {
  constructor() {
    super('ADMIN_PASSWORD missing')
  }
}

export async function getPasswordHash(): Promise<string> {
  const stored = await readStoredHash()
  if (stored) return stored
  const fromEnv = process.env.ADMIN_PASSWORD
  if (!fromEnv) {
    if (process.env.NODE_ENV === 'production') throw new AdminConfigError()
    return hashPassword('vianta-admin')
  }
  return hashPassword(fromEnv)
}

export async function verifyPassword(password: string): Promise<boolean> {
  const expected = await getPasswordHash()
  return hashesMatch(expected, hashPassword(password))
}

export async function sessionToken(): Promise<string> {
  const hash = await getPasswordHash()
  return hashPassword(`${hash}:session`)
}

export function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge,
  }
}

export async function setAdminPassword(password: string): Promise<void> {
  const passwordHash = hashPassword(password)
  await writeAtomic(ADMIN_FILE, JSON.stringify({ passwordHash }, null, 2))
}

export async function isAuthenticated(): Promise<boolean> {
  const jar = await cookies()
  const value = jar.get(COOKIE_NAME)?.value
  if (!value) return false
  try {
    return hashesMatch(await sessionToken(), value)
  } catch {
    return false
  }
}

export { COOKIE_NAME }
