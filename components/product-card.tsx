'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { QuantityControl } from '@/components/quantity-control'
import { siteConfig } from '@/config/site'
import { formatPrice, piecesFor, seriesLabel, sizesText, unitPrice } from '@/lib/format'
import { useOrderList } from '@/store/order-list'
import type { Product } from '@/types/product'

interface ProductCardProps {
  product: Product
  index?: number
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const reduceMotion = useReducedMotion()
  const existing = useOrderList((s) => s.items.find((i) => i.productId === product.id))
  const addItem = useOrderList((s) => s.addItem)
  const updateQty = useOrderList((s) => s.updateQty)
  const setOpen = useOrderList((s) => s.setOpen)

  const [qty, setQty] = useState(existing?.seriesQty ?? 1)
  const [imgIndex, setImgIndex] = useState(0)
  const inList = Boolean(existing)
  const images = product.images.length ? product.images : ['/products/placeholder-1.svg']
  const subtotal = product.price * qty
  const pieces = piecesFor(product.sizes, qty)

  const handleQty = (value: number) => {
    setQty(value)
    if (inList) updateQty(product.id, value)
  }

  const handleAdd = () => {
    addItem(product, qty)
    setOpen(true)
  }

  return (
    <motion.article
      className={`product-card ${!product.inStock ? 'out-of-stock' : ''}`}
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: Math.min(index * 0.06, 0.3) }}
    >
      <div
        className="card-image-wrap"
        onMouseEnter={() => images[1] && setImgIndex(1)}
        onMouseLeave={() => setImgIndex(0)}
      >
        <Image
          src={images[imgIndex] || images[0]}
          alt={`Vianta ${product.code}`}
          fill
          sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
          className="product-image"
        />
        <span className="ref-badge">
          {siteConfig.refLabel} {product.code}
        </span>
        <span className="watermark">VIANTA</span>
        <div className="corner corner-tl" />
        <div className="corner corner-br" />
        {images.length > 1 && (
          <div className="image-dots">
            {images.map((_, i) => (
              <span key={i} className={`dot ${i === imgIndex ? 'active' : ''}`} />
            ))}
          </div>
        )}
        {product.isNew && <span className="new-badge">YENİ</span>}
        {!product.inStock && <span className="stock-badge">STOKTA YOK</span>}
      </div>

      <div className="product-meta">
        <div className="price-pair">
          <div>
            <span className="price-kicker">Seri fiyatı</span>
            <p className="price">{formatPrice(product.price)}</p>
          </div>
          <div className="price-pair-unit">
            <span className="price-kicker">Adet fiyatı</span>
            <p className="unit-price">{formatPrice(unitPrice(product.price, product.sizes))}</p>
          </div>
        </div>
        <p className="series-detail">
          {sizesText(product.sizes)} — {seriesLabel(product.sizes)}
        </p>

        <div className="series-row">
          <span className="series-label">Seri adedi</span>
          <QuantityControl value={qty} onChange={handleQty} />
        </div>
        <p className="subtotal-line">
          Ara toplam: {formatPrice(subtotal)} <span>· {pieces} parça</span>
        </p>

        <button
          className={`add-button ${inList ? 'added' : ''}`}
          type="button"
          disabled={!product.inStock}
          onClick={handleAdd}
        >
          {inList ? `✓ LİSTEDE (${existing?.seriesQty} seri)` : 'SİPARİŞ LİSTESİNE EKLE'}
        </button>

        <Link className="detail-link" href={`/urun/${product.code}`}>
          Detay <ArrowRight size={13} />
        </Link>
      </div>
    </motion.article>
  )
}
