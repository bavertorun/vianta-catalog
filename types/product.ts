export type Size = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'

export interface Product {
  id: string
  code: string
  price: number
  currency: 'TRY'
  sizes: Size[]
  color: string
  images: string[]
  description: string
  isNew: boolean
  inStock: boolean
  order: number
}

export interface ProductsFile {
  products: Product[]
}

export interface OrderItem {
  productId: string
  code: string
  price: number
  sizes: Size[]
  image: string
  seriesQty: number
}

export const ALL_SIZES: Size[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
