'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Search, ShoppingBag } from 'lucide-react'
import { useOrderList } from '@/store/order-list'

interface SiteHeaderProps {
  onSearchClick?: () => void
}

export function SiteHeader({ onSearchClick }: SiteHeaderProps) {
  const items = useOrderList((s) => s.items)
  const setOpen = useOrderList((s) => s.setOpen)
  const [scrolled, setScrolled] = useState(false)
  const count = items.length

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
      <nav className="header-nav" aria-label="Ana navigasyon">
        <Link className="nav-link" href="/#koleksiyon">
          Koleksiyon
        </Link>
      </nav>

      <Link className="wordmark wordmark-horizontal" href="/" aria-label="Vianta Lingerie ana sayfa">
        VIANTA
        <span>LINGERIE</span>
      </Link>

      <div className="header-actions">
        <button
          className="icon-button"
          type="button"
          aria-label="Ürün kodu ara"
          onClick={onSearchClick}
        >
          <Search size={17} />
        </button>
        <button
          className="bag-button"
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Sipariş listesini aç"
        >
          <ShoppingBag size={17} />
          {count > 0 && <span className="bag-count">{count}</span>}
        </button>
      </div>
    </header>
  )
}
