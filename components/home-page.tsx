'use client'

import { useEffect, useState } from 'react'
import { CatalogSection } from '@/components/catalog-section'
import { Hero } from '@/components/hero'
import { HowToOrder } from '@/components/how-to-order'
import { OrderDrawer } from '@/components/order-drawer'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { useOrderList } from '@/store/order-list'
import type { OrderItem, Product } from '@/types/product'

interface HomePageProps {
  products: Product[]
}

export function HomePage({ products }: HomePageProps) {
  const [searchToken, setSearchToken] = useState(0)
  const setOpen = useOrderList((s) => s.setOpen)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const list = params.get('list')
    if (!list) return
    try {
      const decoded = JSON.parse(decodeURIComponent(escape(atob(list)))) as OrderItem[]
      if (Array.isArray(decoded) && decoded.length) {
        useOrderList.setState({ items: decoded })
        setOpen(true)
      }
    } catch {
      // geçersiz paylaşım linki
    }
  }, [setOpen])

  return (
    <main className="vianta-shell">
      <SiteHeader onSearchClick={() => {
        setSearchToken((t) => t + 1)
        document.getElementById('koleksiyon')?.scrollIntoView({ behavior: 'smooth' })
      }} />
      <Hero />
      <HowToOrder />
      <CatalogSection products={products} searchFocusToken={searchToken} />
      <SiteFooter />
      <OrderDrawer />
    </main>
  )
}
