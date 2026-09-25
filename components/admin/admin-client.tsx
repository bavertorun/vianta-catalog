'use client'

import Link from 'next/link'
import { FormEvent, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { compressImage } from '@/lib/compress-image'
import { ALL_SIZES, type Product, type Size } from '@/types/product'
import { formatPrice, seriesLabel, sizesText, unitPrice } from '@/lib/format'

interface AdminClientProps {
  initialProducts: Product[]
}

const emptyProduct = (): Product => ({
  id: '',
  code: '',
  price: 2500,
  currency: 'TRY',
  sizes: ['S', 'M', 'L'],
  color: '',
  images: [],
  description: '',
  isNew: true,
  inStock: true,
  order: 0,
})

export function AdminClient({ initialProducts }: AdminClientProps) {
  const router = useRouter()
  const [products, setProducts] = useState(initialProducts)
  const [editing, setEditing] = useState<Product | null>(null)
  const [message, setMessage] = useState('')
  const [uploading, setUploading] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const editingRef = useRef<Product | null>(null)
  const imageSaveSeq = useRef(0)
  editingRef.current = editing

  const sorted = useMemo(
    () => [...products].sort((a, b) => a.order - b.order),
    [products],
  )

  const refresh = async () => {
    const res = await fetch('/api/admin/products')
    const data = await res.json()
    setProducts(data.products)
    router.refresh()
  }

  const logout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' })
    router.replace('/admin/login')
  }

  const saveProduct = async (e: FormEvent) => {
    e.preventDefault()
    const current = editingRef.current
    if (!current) return

    const payload: Product = {
      ...current,
      id: current.id || `p_${current.code}`,
      code: current.code.trim(),
      order: current.order || products.length + 1,
    }

    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const err = await res.json()
      setMessage(err.error || 'Kayıt başarısız')
      return
    }

    setMessage('Ürün kaydedildi')
    setEditing(null)
    await refresh()
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('Bu ürün silinsin mi?')) return
    await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' })
    setMessage('Ürün silindi')
    await refresh()
  }

  const toggleSize = (size: Size) => {
    if (!editing) return
    const has = editing.sizes.includes(size)
    const sizes = has
      ? editing.sizes.filter((s) => s !== size)
      : [...editing.sizes, size]
    setEditing({ ...editing, sizes: ALL_SIZES.filter((s) => sizes.includes(s)) })
  }

  const persistImages = async (productId: string, images: string[]) => {
    const res = await fetch('/api/admin/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: productId, images }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      setMessage(err.error || 'Kapak fotoğrafı kaydedilemedi')
      return false
    }
    setProducts((list) => list.map((p) => (p.id === productId ? { ...p, images } : p)))
    return true
  }

  const commitImages = async (images: string[], note: string) => {
    const current = editingRef.current
    if (!current) return
    const next = { ...current, images }
    const seq = ++imageSaveSeq.current
    editingRef.current = next
    setEditing(next)

    if (!current.id) {
      setMessage(`${note}. Ürünü kaydedince uygulanır.`)
      return
    }

    const ok = await persistImages(current.id, images)
    if (seq !== imageSaveSeq.current) return
    if (ok) {
      setMessage(note)
      router.refresh()
      return
    }

    editingRef.current = current
    setEditing(current)
    setMessage('Kapak fotoğrafı kaydedilemedi')
  }

  const setCover = (index: number) => {
    const current = editingRef.current
    if (!current || index <= 0 || index >= current.images.length) return
    const images = [...current.images]
    const [picked] = images.splice(index, 1)
    images.unshift(picked)
    void commitImages(images, 'Kapak fotoğrafı güncellendi')
  }

  const moveImage = (from: number, dir: -1 | 1) => {
    const current = editingRef.current
    if (!current) return
    const to = from + dir
    if (to < 0 || to >= current.images.length) return
    const images = [...current.images]
    const moved = images[from]
    images[from] = images[to]
    images[to] = moved
    const note = from === 0 || to === 0 ? 'Kapak fotoğrafı güncellendi' : 'Görsel sırası güncellendi'
    void commitImages(images, note)
  }

  const removeImage = (index: number) => {
    const current = editingRef.current
    if (!current) return
    const images = current.images.filter((_, idx) => idx !== index)
    void commitImages(images, index === 0 ? 'Kapak fotoğrafı kaldırıldı' : 'Görsel silindi')
  }

  const uploadFiles = async (files: FileList | null, asCover = false) => {
    const current = editingRef.current
    if (!files?.length || !current?.code.trim()) {
      setMessage('Önce ürün kodunu girin')
      return
    }

    setUploading(true)
    setMessage(`${files.length} görsel hazırlanıyor...`)

    try {
      const form = new FormData()
      form.set('code', current.code.trim())
      form.set('startIndex', String(current.images.length + 1))

      const list = Array.from(files)
      for (let i = 0; i < list.length; i++) {
        setMessage(`Sıkıştırılıyor ${i + 1}/${list.length}...`)
        const compressed = await compressImage(list[i])
        form.append('files', compressed, `img-${i}.jpg`)
      }

      setMessage('Yükleniyor...')
      const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setMessage(err.error || 'Yükleme başarısız')
        return
      }

      const data = await res.json()
      const paths: string[] = data.paths || (data.path ? [data.path] : [])
      const latest = editingRef.current
      if (!latest) return
      const images = asCover ? [...paths, ...latest.images] : [...latest.images, ...paths]
      await commitImages(
        images,
        asCover ? 'Kapak fotoğrafı güncellendi' : `${paths.length} görsel eklendi`,
      )
    } catch {
      setMessage('Yükleme hatası')
    } finally {
      setUploading(false)
    }
  }

  const changePassword = async (e: FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setMessage('Yeni şifreler eşleşmiyor')
      return
    }

    setPasswordSaving(true)
    try {
      const res = await fetch('/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMessage(data.error || 'Şifre değiştirilemedi')
        return
      }
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordOpen(false)
      setMessage('Şifre güncellendi')
    } catch {
      setMessage('Şifre değiştirilemedi')
    } finally {
      setPasswordSaving(false)
    }
  }

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ products }, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'products.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const importJson = async (file: File | null) => {
    if (!file) return
    const text = await file.text()
    const data = JSON.parse(text)
    if (!Array.isArray(data.products)) {
      setMessage('Geçersiz JSON')
      return
    }
    await fetch('/api/admin/products', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setMessage('JSON içe aktarıldı')
    await refresh()
  }

  const move = async (id: string, dir: -1 | 1) => {
    const list = [...sorted]
    const idx = list.findIndex((p) => p.id === id)
    const swap = idx + dir
    if (swap < 0 || swap >= list.length) return
    ;[list[idx], list[swap]] = [list[swap], list[idx]]
    const reordered = list.map((p, i) => ({ ...p, order: i + 1 }))
    await fetch('/api/admin/products', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products: reordered }),
    })
    await refresh()
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">VIANTA</p>
          <h1>Ürün Yönetimi</h1>
        </div>
        <div className="admin-header-actions">
          <Link href="/">Kataloğa dön</Link>
          <button type="button" onClick={exportJson}>
            JSON dışa aktar
          </button>
          <label className="file-btn">
            JSON içe aktar
            <input
              type="file"
              accept="application/json"
              hidden
              onChange={(e) => importJson(e.target.files?.[0] || null)}
            />
          </label>
          <button type="button" onClick={() => setPasswordOpen((open) => !open)}>
            Şifre değiştir
          </button>
          <button type="button" onClick={logout}>
            Çıkış
          </button>
        </div>
      </header>

      {passwordOpen && (
        <form className="admin-password" onSubmit={changePassword}>
          <h2>Şifre değiştir</h2>
          <label>
            Mevcut şifre
            <input
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </label>
          <label>
            Yeni şifre
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </label>
          <label>
            Yeni şifre (tekrar)
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </label>
          <div className="admin-form-actions">
            <button type="submit" disabled={passwordSaving}>
              {passwordSaving ? 'Kaydediliyor...' : 'Şifreyi güncelle'}
            </button>
            <button type="button" onClick={() => setPasswordOpen(false)}>
              Vazgeç
            </button>
          </div>
        </form>
      )}

      {message && <p className="admin-message">{message}</p>}

      <div className="admin-layout">
        <section className="admin-table-wrap">
          <div className="admin-toolbar">
            <button type="button" onClick={() => setEditing(emptyProduct())}>
              + Yeni ürün
            </button>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Görsel</th>
                <th>Kod</th>
                <th>Fiyat</th>
                <th>Beden</th>
                <th>Stok</th>
                <th>Sıra</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.images[0] ? (
                      <img src={p.images[0]} alt="" width={40} height={52} />
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{p.code}</td>
                  <td>
                    {formatPrice(p.price)}
                    <div className="admin-unit">
                      Adet {formatPrice(unitPrice(p.price, p.sizes))}
                    </div>
                  </td>
                  <td>{sizesText(p.sizes)}</td>
                  <td>{p.inStock ? 'Var' : 'Yok'}</td>
                  <td>
                    <button type="button" onClick={() => move(p.id, -1)}>
                      ↑
                    </button>
                    <button type="button" onClick={() => move(p.id, 1)}>
                      ↓
                    </button>
                  </td>
                  <td className="admin-row-actions">
                    <button type="button" onClick={() => setEditing({ ...p })}>
                      Düzenle
                    </button>
                    <button type="button" onClick={() => deleteProduct(p.id)}>
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {editing && (
          <section className="admin-form-panel">
            <form onSubmit={saveProduct} className="admin-form">
              <h2>{editing.id ? 'Ürünü düzenle' : 'Yeni ürün'}</h2>

              <label>
                Ürün kodu *
                <input
                  required
                  value={editing.code}
                  onChange={(e) => setEditing({ ...editing, code: e.target.value })}
                />
              </label>

              <label>
                Seri fiyatı (TL)
                <input
                  type="number"
                  required
                  min={0}
                  value={editing.price}
                  onChange={(e) =>
                    setEditing({ ...editing, price: Number(e.target.value) })
                  }
                />
              </label>
              <p className="series-hint">
                Adet fiyatı:{' '}
                {editing.sizes.length
                  ? formatPrice(unitPrice(editing.price || 0, editing.sizes))
                  : '—'}
              </p>

              <label>
                Renk
                <input
                  value={editing.color}
                  onChange={(e) => setEditing({ ...editing, color: e.target.value })}
                />
              </label>

              <label>
                Açıklama
                <textarea
                  value={editing.description}
                  onChange={(e) =>
                    setEditing({ ...editing, description: e.target.value })
                  }
                />
              </label>

              <fieldset>
                <legend>Bedenler</legend>
                <div className="size-chips">
                  {ALL_SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      className={editing.sizes.includes(size) ? 'active' : ''}
                      onClick={() => toggleSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                <p className="series-hint">
                  {editing.sizes.length
                    ? seriesLabel(editing.sizes)
                    : 'En az bir beden seçin'}
                </p>
              </fieldset>

              <div className="toggle-row">
                <label>
                  <input
                    type="checkbox"
                    checked={editing.isNew}
                    onChange={(e) =>
                      setEditing({ ...editing, isNew: e.target.checked })
                    }
                  />
                  Yeni ürün
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={editing.inStock}
                    onChange={(e) =>
                      setEditing({ ...editing, inStock: e.target.checked })
                    }
                  />
                  Stokta var
                </label>
              </div>

              <div className="cover-upload-row">
                <label className="file-btn block">
                  {uploading ? 'Yükleniyor...' : 'Kapak fotoğrafını değiştir'}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    disabled={uploading}
                    onChange={(e) => {
                      uploadFiles(e.target.files, true)
                      e.target.value = ''
                    }}
                  />
                </label>
                <label className="file-btn block">
                  {uploading ? 'Yükleniyor...' : 'Görsel yükle (çoklu)'}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    disabled={uploading}
                    onChange={(e) => {
                      uploadFiles(e.target.files)
                      e.target.value = ''
                    }}
                  />
                </label>
              </div>
              <p className="series-hint">
                İlk fotoğraf kapaktır. Başka bir fotoğrafı kapak yapmak için Kapak yap&apos;a basın.
              </p>

              {editing.images.length > 0 && (
                <div className="admin-image-list">
                  {editing.images.map((src, i) => (
                    <div key={src}>
                      {i === 0 && <span className="cover-tag">KAPAK</span>}
                      <img src={src} alt="" />
                      <div className="img-order-actions">
                        <button
                          type="button"
                          aria-label="Sola taşı"
                          onClick={(e) => {
                            e.preventDefault()
                            moveImage(i, -1)
                          }}
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          aria-label="Sağa taşı"
                          onClick={(e) => {
                            e.preventDefault()
                            moveImage(i, 1)
                          }}
                        >
                          →
                        </button>
                      </div>
                      {i !== 0 && (
                        <button
                          type="button"
                          className="cover-btn"
                          onClick={(e) => {
                            e.preventDefault()
                            setCover(i)
                          }}
                        >
                          Kapak yap
                        </button>
                      )}
                      <button
                        type="button"
                        className="remove-img"
                        onClick={(e) => {
                          e.preventDefault()
                          removeImage(i)
                        }}
                      >
                        Sil
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="admin-preview">
                <p className="eyebrow">ÖNİZLEME</p>
                <div className="admin-card-preview">
                  <div className="preview-thumb">
                    {editing.images[0] ? (
                      <img key={editing.images[0]} src={editing.images[0]} alt="" />
                    ) : (
                      <span>Görsel yok</span>
                    )}
                  </div>
                  <span className="price-kicker">Seri fiyatı</span>
                  <strong>{formatPrice(editing.price || 0)}</strong>
                  <span>
                    Adet{' '}
                    {editing.sizes.length
                      ? formatPrice(unitPrice(editing.price || 0, editing.sizes))
                      : '—'}
                  </span>
                  <span>
                    {sizesText(editing.sizes)} —{' '}
                    {editing.sizes.length ? seriesLabel(editing.sizes) : '—'}
                  </span>
                  <em>RÉF. {editing.code || '0000'}</em>
                </div>
              </div>

              <div className="admin-form-actions">
                <button type="submit">Kaydet</button>
                <button type="button" onClick={() => setEditing(null)}>
                  Vazgeç
                </button>
              </div>
            </form>
          </section>
        )}
      </div>
    </main>
  )
}
