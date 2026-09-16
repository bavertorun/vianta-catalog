import type { Size } from '@/types/product'

export function formatPrice(value: number): string {
  return `${value.toLocaleString('tr-TR')} TL`
}

export function seriesLabel(sizes: Size[]): string {
  return `${sizes.length}'LÜ SERİ FİYATIDIR`
}

export function sizesText(sizes: Size[]): string {
  return sizes.join(' · ')
}

export function piecesFor(sizes: Size[], seriesQty: number): number {
  return sizes.length * seriesQty
}
