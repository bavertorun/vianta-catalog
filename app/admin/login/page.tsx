'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    setLoading(false)
    if (!res.ok) {
      setError('Şifre hatalı')
      return
    }
    router.replace('/admin')
    router.refresh()
  }

  return (
    <main className="admin-shell">
      <form className="admin-login" onSubmit={onSubmit}>
        <p className="eyebrow">VIANTA ADMIN</p>
        <h1>Giriş</h1>
        <label>
          Şifre
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
          />
        </label>
        {error && <p className="admin-error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? '...' : 'Giriş yap'}
        </button>
      </form>
    </main>
  )
}
