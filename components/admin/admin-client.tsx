'use client'

import Image from 'next/image'
import Link from 'next/link'
import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { compressImage } from '@/lib/compress-image'
import { ALL_SIZES, type Product, type Size } from '@/types/product'
import { formatPrice, seriesLabel, sizesText } from '@/lib/format'

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
    if (!editing) return

    const payload: Product = {
      ...editing,
      id: editing.id || `p_${editing.code}`,
      code: editing.code.trim(),
      order: editing.order || products.length + 1,
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

  const moveImage = (from: number, dir: -1 | 1) => {
    if (!editing) return
    const to = from + dir
    if (to < 0 || to >= editing.images.length) return
    const images = [...editing.images]
    ;[images[from], images[to]] = [images[to], images[from]]
    setEditing({ ...editing, images })
  }

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length || !editing?.code) {
      setMessage('Önce ürün kodunu girin')
      return
    }

    setUploading(true)
    setMessage(`${files.length} görsel hazırlanıyor...`)

    try {
      const form = new FormData()
      form.set('code', editing.code.trim())
      form.set('startIndex', String(editing.images.length + 1))

      const list = Array.from(files)
      for (let i = 0; i < list.length; i++) {
        setMessage(`Sıkıştırılıyor ${i + 1}/${list.length}...`)
        const compressed = await compressImage(list[i])
        form.append('files', compressed, `img-${i}.jpg`)
      }

      setMessage('Yükleniyor...')
      const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
      if (!res.ok) {
        setMessage('Yükleme başarısız')
        return
      }

      const data = await res.json()
      const paths: string[] = data.paths || (data.path ? [data.path] : [])
      setEditing({ ...editing, images: [...editing.images, ...paths] })
      setMessage(`${paths.length} görsel eklendi — sıralamak için okları kullanın`)
    } catch {
      setMessage('Yükleme hatası')
    } finally {
      setUploading(false)
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
          <button type="button" onClick={logout}>
            Çıkış
          </button>
        </div>
      </header>

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
                      <Image src={p.images[0]} alt="" width={40} height={52} />
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{p.code}</td>
                  <td>{formatPrice(p.price)}</td>
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
                Fiyat (TL)
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

              {editing.images.length > 0 && (
                <div className="admin-image-list">
                  {editing.images.map((src, i) => (
                    <div key={src + i}>
                      {i === 0 && <span className="cover-tag">KAPAK</span>}
                      <Image src={src} alt="" width={56} height={74} />
                      <div className="img-order-actions">
                        <button type="button" aria-label="Sola taşı" onClick={() => moveImage(i, -1)}>
                          ←
                        </button>
                        <button type="button" aria-label="Sağa taşı" onClick={() => moveImage(i, 1)}>
                          →
                        </button>
                      </div>
                      <button
                        type="button"
                        className="remove-img"
                        onClick={() =>
                          setEditing({
                            ...editing,
                            images: editing.images.filter((_, idx) => idx !== i),
                          })
                        }
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
                      <Image src={editing.images[0]} alt="" fill />
                    ) : (
                      <span>Görsel yok</span>
                    )}
                  </div>
                  <strong>{formatPrice(editing.price || 0)}</strong>
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
