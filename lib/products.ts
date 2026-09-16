import { promises as fs } from 'fs'
import path from 'path'
import type { Product, ProductsFile } from '@/types/product'

const DATA_PATH = path.join(process.cwd(), 'data', 'products.json')

export async function readProductsFile(): Promise<ProductsFile> {
  const raw = await fs.readFile(DATA_PATH, 'utf8')
  return JSON.parse(raw) as ProductsFile
}

export async function writeProductsFile(data: ProductsFile): Promise<void> {
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), 'utf8')
}

export async function getProducts(): Promise<Product[]> {
  const data = await readProductsFile()
  return [...data.products].sort((a, b) => a.order - b.order)
}

export async function getProductByCode(code: string): Promise<Product | undefined> {
  const products = await getProducts()
  return products.find((p) => p.code === code)
}
