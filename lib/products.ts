import { promises as fs } from 'fs'
import path from 'path'
import { writeAtomic } from '@/lib/atomic-write'
import type { Product, ProductsFile } from '@/types/product'

const DATA_PATH = path.join(process.cwd(), 'data', 'products.json')

function parseProducts(raw: string): ProductsFile {
  const data = JSON.parse(raw) as ProductsFile
  if (!Array.isArray(data.products)) throw new Error('Geçersiz ürün dosyası')
  return data
}

export async function readProductsFile(): Promise<ProductsFile> {
  try {
    return parseProducts(await fs.readFile(DATA_PATH, 'utf8'))
  } catch (error) {
    const backup = await fs.readFile(`${DATA_PATH}.bak`, 'utf8').catch(() => '')
    if (!backup) throw error
    const data = parseProducts(backup)
    await writeAtomic(DATA_PATH, JSON.stringify(data, null, 2))
    return data
  }
}

export async function writeProductsFile(data: ProductsFile): Promise<void> {
  if (!Array.isArray(data.products)) throw new Error('Geçersiz ürün dosyası')
  await writeAtomic(DATA_PATH, JSON.stringify(data, null, 2))
}

export async function getProducts(): Promise<Product[]> {
  const data = await readProductsFile()
  return [...data.products].sort((a, b) => a.order - b.order)
}

export async function getProductByCode(code: string): Promise<Product | undefined> {
  const products = await getProducts()
  return products.find((p) => p.code === code)
}
