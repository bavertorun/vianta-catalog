'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { OrderDrawer } from '@/components/order-drawer'
import { ProductCard } from '@/components/product-card'
import { QuantityControl } from '@/components/quantity-control'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { siteConfig } from '@/config/site'
import { formatPrice, seriesLabel, sizesText } from '@/lib/format'
import { useOrderList } from '@/store/order-list'
import type { Product } from '@/types/product'

interface ProductDetailProps {
  product: Product
  related: Product[]
}

export function ProductDetailClient({ product, related }: ProductDetailProps) {
  const existing = useOrderList((s) => s.items.find((i) => i.productId === product.id))
  const addItem = useOrderList((s) => s.addItem)
  const updateQty = useOrderList((s) => s.updateQty)
  const setOpen = useOrderList((s) => s.setOpen)

  const images = product.images.length ? product.images : ['/products/placeholder-1.svg']
  const [active, setActive] = useState(0)
  const [qty, setQty] = useState(existing?.seriesQty ?? 1)
  const inList = Boolean(existing)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setActive((i) => (i + 1) % images.length)
      if (e.key === 'ArrowLeft') setActive((i) => (i - 1 + images.length) % images.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [images.length])

  const handleQty = (value: number) => {
    setQty(value)
    if (inList) updateQty(product.id, value)
  }

  const askUrl = `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
    `Merhaba Vianta, ${siteConfig.refLabel} ${product.code} hakkında bilgi almak istiyorum.`,
  )}`

  return (
    <main className="vianta-shell">
      <SiteHeader />
      <section className="detail-section">
        <Link className="back-link" href="/#koleksiyon">
          <ArrowLeft size={14} /> Koleksiyona dön
        </Link>

        <div className="detail-grid">
          <div className="detail-gallery">
            <div className="detail-main-image">
              <Image
                src={images[active]}
                alt={`Vianta ${product.code}`}
                fill
                sizes="(max-width: 900px) 100vw, 50vw"
                className="product-image"
                priority
              />
              <span className="watermark">VIANTA</span>
            </div>
            {images.length > 1 && (
              <div className="detail-thumbs">
                {images.map((src, i) => (
                  <button
                    key={src + i}
                    type="button"
                    className={i === active ? 'active' : ''}
                    onClick={() => setActive(i)}
                  >
                    <Image src={src} alt="" width={72} height={96} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="detail-info">
            <p className="eyebrow">
              {siteConfig.refLabel} {product.code}
            </p>
            <h1 className="detail-price">{formatPrice(product.price)}</h1>
            <p className="series-detail">
              {sizesText(product.sizes)} — {seriesLabel(product.sizes)}
            </p>
            {product.color && <p className="detail-meta">Renk · {product.color}</p>}
            {product.description ? (
              <p className="detail-desc">{product.description}</p>
            ) : (
              <p className="detail-desc muted">[ÜRÜN AÇIKLAMASI — opsiyonel]</p>
            )}

            <div className="series-row">
              <span className="series-label">Seri adedi</span>
              <QuantityControl value={qty} onChange={handleQty} />
            </div>

            <button
              className={`add-button ${inList ? 'added' : ''}`}
              type="button"
              disabled={!product.inStock}
              onClick={() => {
                addItem(product, qty)
                setOpen(true)
              }}
            >
              {inList ? `✓ LİSTEDE (${existing?.seriesQty} seri)` : 'SİPARİŞ LİSTESİNE EKLE'}
            </button>

            <a className="ask-link" href={askUrl} target="_blank" rel="noopener noreferrer">
              WhatsApp&apos;tan bu ürünü sor <ArrowRight size={13} />
            </a>
          </div>
        </div>

        {related.length > 0 && (
          <div className="related-section">
            <p className="eyebrow">DİĞER MODELLER</p>
            <div className="product-grid related-grid">
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        )}
      </section>
      <SiteFooter />
      <OrderDrawer />
    </main>
  )
}
