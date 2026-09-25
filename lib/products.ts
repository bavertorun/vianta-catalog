import { promises as fs } from 'fs'
import path from 'path'
import { head, put } from '@vercel/blob'
import { writeAtomic } from '@/lib/atomic-write'
import type { Product, ProductsFile } from '@/types/product'

const BLOB_KEY = 'catalog/products.json'

const DATA_PATH = path.join(process.cwd(), 'data', 'products.json')

function parseProducts(raw: string): ProductsFile {
  const data = JSON.parse(raw) as ProductsFile
  if (!Array.isArray(data.products)) throw new Error('Geçersiz ürün dosyası')
  return data
}

async function readBlobProducts(): Promise<ProductsFile | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null
  try {
    const meta = await head(BLOB_KEY)
    const res = await fetch(meta.url, { cache: 'no-store' })
    if (!res.ok) return null
    return parseProducts(await res.text())
  } catch {
    return null
  }
}

async function readLocalProducts(): Promise<ProductsFile> {
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

export async function readProductsFile(): Promise<ProductsFile> {
  const fromBlob = await readBlobProducts()
  if (fromBlob) return fromBlob
  return readLocalProducts()
}

export async function writeProductsFile(data: ProductsFile): Promise<void> {
  if (!Array.isArray(data.products)) throw new Error('Geçersiz ürün dosyası')
  const body = JSON.stringify(data, null, 2)
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await put(BLOB_KEY, body, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
      cacheControlMaxAge: 60,
    })
    return
  }
  await writeAtomic(DATA_PATH, body)
}

export async function getProducts(): Promise<Product[]> {
  const data = await readProductsFile()
  return [...data.products].sort((a, b) => a.order - b.order)
}

export async function getProductByCode(code: string): Promise<Product | undefined> {
  const products = await getProducts()
  return products.find((p) => p.code === code)
}
