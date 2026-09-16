'use client'

import { useMemo, useState } from 'react'
import { ProductCard } from '@/components/product-card'
import type { Product } from '@/types/product'

type SortKey = 'new' | 'price-asc' | 'price-desc'
type SeriesFilter = 'all' | '3' | '4'

interface CatalogSectionProps {
  products: Product[]
  searchFocusToken?: number
}

export function CatalogSection({ products, searchFocusToken = 0 }: CatalogSectionProps) {
  const [query, setQuery] = useState('')
  const [series, setSeries] = useState<SeriesFilter>('all')
  const [sort, setSort] = useState<SortKey>('new')

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (query && !p.code.includes(query.trim())) return false
      if (series === '3' && p.sizes.length !== 3) return false
      if (series === '4' && p.sizes.length !== 4) return false
      return true
    })

    list = [...list].sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price
      if (sort === 'price-desc') return b.price - a.price
      return a.order - b.order
    })

    return list
  }, [products, query, series, sort])

  return (
    <section className="collection-section" id="koleksiyon">
      <div className="section-intro">
        <p className="eyebrow">SEÇİLİ MODELLER</p>
        <p className="intro-note">{filtered.length} model</p>
      </div>

      <div className="filter-bar">
        <label className="search-field">
          <span>Ürün kodu</span>
          <input
            key={searchFocusToken}
            autoFocus={searchFocusToken > 0}
            type="search"
            placeholder="Örn. 8047"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>

        <label>
          <span>Seri</span>
          <select value={series} onChange={(e) => setSeries(e.target.value as SeriesFilter)}>
            <option value="all">Tümü</option>
            <option value="3">3&apos;lü</option>
            <option value="4">4&apos;lü</option>
          </select>
        </label>

        <label>
          <span>Sıralama</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            <option value="new">Yeni eklenenler</option>
            <option value="price-asc">Fiyat artan</option>
            <option value="price-desc">Fiyat azalan</option>
          </select>
        </label>
      </div>

      <div className="product-grid">
        {filtered.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="empty-catalog">Bu filtrelere uyan model yok.</p>
      )}
    </section>
  )
}
