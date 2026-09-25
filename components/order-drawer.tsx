'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, ShoppingBag, X } from 'lucide-react'
import { QuantityControl } from '@/components/quantity-control'
import { siteConfig } from '@/config/site'
import { formatPrice, sizesText, unitPrice } from '@/lib/format'
import { buildPlainTextList, buildWhatsAppUrl } from '@/lib/whatsapp'
import { useOrderList } from '@/store/order-list'

export function OrderDrawer() {
  const items = useOrderList((s) => s.items)
  const note = useOrderList((s) => s.note)
  const isOpen = useOrderList((s) => s.isOpen)
  const lastRemoved = useOrderList((s) => s.lastRemoved)
  const setOpen = useOrderList((s) => s.setOpen)
  const setNote = useOrderList((s) => s.setNote)
  const updateQty = useOrderList((s) => s.updateQty)
  const removeItem = useOrderList((s) => s.removeItem)
  const undoRemove = useOrderList((s) => s.undoRemove)
  const clearList = useOrderList((s) => s.clearList)

  const [toast, setToast] = useState(false)
  const [copyMsg, setCopyMsg] = useState('')

  useEffect(() => {
    if (!lastRemoved) return
    setToast(true)
    const t = setTimeout(() => setToast(false), 5000)
    return () => clearTimeout(t)
  }, [lastRemoved])

  const totalSeries = items.reduce((s, i) => s + i.seriesQty, 0)
  const totalPieces = items.reduce((s, i) => s + i.sizes.length * i.seriesQty, 0)
  const grandTotal = items.reduce((s, i) => s + i.price * i.seriesQty, 0)

  const handleWhatsApp = () => {
    if (!items.length) return
    const { url, tooLong } = buildWhatsAppUrl(items, note)
    if (tooLong) {
      alert('Mesaj 2000 karakteri aşıyor. Listeyi bölerek göndermeniz önerilir.')
      return
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleCopyText = async () => {
    await navigator.clipboard.writeText(buildPlainTextList(items, note))
    setCopyMsg('Metin kopyalandı')
    setTimeout(() => setCopyMsg(''), 2000)
  }

  const handleShare = async () => {
    const payload = btoa(unescape(encodeURIComponent(JSON.stringify(items))))
    const url = `${window.location.origin}/?list=${payload}`
    await navigator.clipboard.writeText(url)
    setCopyMsg('Paylaşım linki kopyalandı')
    setTimeout(() => setCopyMsg(''), 2000)
  }

  const handleClear = () => {
    if (!items.length) return
    if (confirm('Sipariş listesini temizlemek istiyor musunuz?')) clearList()
  }

  return (
    <>
      {isOpen && (
        <button
          className="drawer-backdrop"
          type="button"
          aria-label="Listeyi kapat"
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={`order-drawer ${isOpen ? 'open' : ''}`} aria-label="Sipariş listesi">
        <div className="drawer-header">
          <div>
            <p className="eyebrow">
              SİPARİŞ LİSTESİ
              {items.length > 0 && <span className="count-badge">{items.length}</span>}
            </p>
            <h2>
              Seçtikleriniz {items.length > 0 && <span>· {items.length} ürün</span>}
            </h2>
          </div>
          <button
            className="close-button"
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Sipariş listesini kapat"
          >
            <X size={18} />
          </button>
        </div>

        <div className="drawer-content">
          {items.length === 0 ? (
            <div className="drawer-empty">
              <p>Listeniz henüz boş.</p>
              <Link href="/#koleksiyon" onClick={() => setOpen(false)}>
                Koleksiyona Dön
              </Link>
            </div>
          ) : (
            <>
              <div className="drawer-items">
                {items.map((item) => (
                  <div className="drawer-item" key={item.productId}>
                    <div className="drawer-thumb">
                      <Image
                        src={item.image}
                        alt={`${item.code} küçük görsel`}
                        fill
                        sizes="67px"
                      />
                    </div>
                    <div className="item-info">
                      <div className="item-top">
                        <h3>
                          {siteConfig.refLabel} {item.code}
                        </h3>
                        <strong>{formatPrice(item.price * item.seriesQty)}</strong>
                      </div>
                      <p>
                        Seri {formatPrice(item.price)} · Adet {formatPrice(unitPrice(item.price, item.sizes))}{' '}
                        <span>
                          · {sizesText(item.sizes)} · {item.seriesQty} seri
                        </span>
                      </p>
                      <div className="item-bottom">
                        <QuantityControl
                          value={item.seriesQty}
                          onChange={(v) => updateQty(item.productId, v)}
                        />
                        <button
                          type="button"
                          className="remove-link"
                          onClick={() => removeItem(item.productId)}
                        >
                          Kaldır
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <label className="note-label" htmlFor="order-note">
                Siparişe eklemek istediğiniz not
                <textarea
                  id="order-note"
                  placeholder="Notunuzu buraya yazın..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </label>

              <div className="drawer-summary">
                <div>
                  <span>Toplam ürün çeşidi</span>
                  <strong>{items.length}</strong>
                </div>
                <div>
                  <span>Toplam seri</span>
                  <strong>{totalSeries}</strong>
                </div>
                <div>
                  <span>Toplam parça</span>
                  <strong>{totalPieces}</strong>
                </div>
                <div className="grand-total">
                  <span>Genel toplam</span>
                  <strong>{formatPrice(grandTotal)}</strong>
                </div>
              </div>

              <button className="whatsapp-button" type="button" onClick={handleWhatsApp}>
                WhatsApp&apos;tan siparişi gönder <ArrowRight size={15} />
              </button>

              <div className="drawer-actions">
                <button type="button" onClick={handleShare}>
                  Listeyi Kopyala / Paylaş
                </button>
                <button type="button" onClick={handleCopyText}>
                  Metin Olarak Kopyala
                </button>
                <button type="button" onClick={handleClear}>
                  Listeyi Temizle
                </button>
              </div>
              {copyMsg && <p className="copy-msg">{copyMsg}</p>}
            </>
          )}
        </div>
      </aside>

      {!isOpen && (
        <button
          className="floating-bag"
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Sipariş listesini aç"
        >
          <ShoppingBag size={18} />
          {items.length > 0 && <span>{items.length}</span>}
        </button>
      )}

      {toast && lastRemoved && (
        <div className="undo-toast" role="status">
          <span>{siteConfig.refLabel} {lastRemoved.code} kaldırıldı</span>
          <button type="button" onClick={undoRemove}>
            Geri Al
          </button>
        </div>
      )}
    </>
  )
}
