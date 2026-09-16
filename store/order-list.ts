'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OrderItem, Product } from '@/types/product'

interface OrderListState {
  items: OrderItem[]
  note: string
  isOpen: boolean
  lastRemoved: OrderItem | null
  setOpen: (open: boolean) => void
  setNote: (note: string) => void
  addItem: (product: Product, seriesQty: number) => void
  updateQty: (productId: string, seriesQty: number) => void
  removeItem: (productId: string) => void
  undoRemove: () => void
  clearList: () => void
  getItem: (productId: string) => OrderItem | undefined
}

export const useOrderList = create<OrderListState>()(
  persist(
    (set, get) => ({
      items: [],
      note: '',
      isOpen: false,
      lastRemoved: null,
      setOpen: (open) => set({ isOpen: open }),
      setNote: (note) => set({ note }),
      addItem: (product, seriesQty) => {
        const qty = Math.min(20, Math.max(1, seriesQty))
        const existing = get().items.find((i) => i.productId === product.id)
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.productId === product.id ? { ...i, seriesQty: qty } : i,
            ),
          })
          return
        }
        const item: OrderItem = {
          productId: product.id,
          code: product.code,
          price: product.price,
          sizes: product.sizes,
          image: product.images[0] || '/placeholder.jpg',
          seriesQty: qty,
        }
        set({ items: [...get().items, item] })
      },
      updateQty: (productId, seriesQty) => {
        const qty = Math.min(20, Math.max(1, seriesQty))
        set({
          items: get().items.map((i) =>
            i.productId === productId ? { ...i, seriesQty: qty } : i,
          ),
        })
      },
      removeItem: (productId) => {
        const removed = get().items.find((i) => i.productId === productId) || null
        set({
          items: get().items.filter((i) => i.productId !== productId),
          lastRemoved: removed,
        })
      },
      undoRemove: () => {
        const removed = get().lastRemoved
        if (!removed) return
        set({ items: [...get().items, removed], lastRemoved: null })
      },
      clearList: () => set({ items: [], note: '', lastRemoved: null }),
      getItem: (productId) => get().items.find((i) => i.productId === productId),
    }),
    {
      name: 'vianta-order-list',
      partialize: (state) => ({ items: state.items, note: state.note }),
    },
  ),
)
