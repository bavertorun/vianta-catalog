import { siteConfig } from '@/config/site'
import { formatPrice, sizesText } from '@/lib/format'
import type { OrderItem } from '@/types/product'

export function buildWhatsAppMessage(items: OrderItem[], note: string): string {
  const lines = items.map((item, index) => {
    const lineTotal = item.price * item.seriesQty
    return `${index + 1}) Ürün Kodu: ${item.code} — ${item.seriesQty} seri (${sizesText(item.sizes).replace(/ · /g, '·')}) — ${formatPrice(lineTotal)}`
  })

  const totalSeries = items.reduce((sum, item) => sum + item.seriesQty, 0)
  const totalPieces = items.reduce((sum, item) => sum + item.sizes.length * item.seriesQty, 0)
  const grandTotal = items.reduce((sum, item) => sum + item.price * item.seriesQty, 0)

  const parts = [
    'Merhaba Vianta,',
    'Sipariş listem:',
    '',
    ...lines,
    '',
    `Toplam: ${totalSeries} seri / ${totalPieces} parça`,
    `Genel Toplam: ${formatPrice(grandTotal)}`,
  ]

  if (note.trim()) {
    parts.push('', `Not: ${note.trim()}`)
  }

  return parts.join('\n')
}

export function buildWhatsAppUrl(items: OrderItem[], note: string): { url: string; tooLong: boolean } {
  const message = buildWhatsAppMessage(items, note)
  const tooLong = message.length > 2000
  const url = `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(message)}`
  return { url, tooLong }
}

export function buildPlainTextList(items: OrderItem[], note: string): string {
  return buildWhatsAppMessage(items, note)
}
