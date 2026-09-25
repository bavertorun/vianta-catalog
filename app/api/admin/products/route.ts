import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { isReadOnlyFsError } from '@/lib/atomic-write'
import { isAuthenticated } from '@/lib/admin-auth'
import { getProducts, readProductsFile, writeProductsFile } from '@/lib/products'
import type { Product, ProductsFile } from '@/types/product'

function revalidateCatalog() {
  revalidatePath('/')
  revalidatePath('/urun/[code]', 'page')
}

function writeError(error: unknown) {
  if (isReadOnlyFsError(error)) {
    return NextResponse.json(
      { error: 'Katalog diske yazılamadı. Canlı sunucuda kalıcı disk gerekli.' },
      { status: 500 },
    )
  }
  throw error
}

function safeImages(images: unknown[]): string[] {
  return images.filter(
    (src): src is string =>
      typeof src === 'string' && src.startsWith('/products/') && !src.includes('..'),
  )
}

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }
  const products = await getProducts()
  return NextResponse.json({ products })
}

export async function PUT(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  const body = (await request.json()) as ProductsFile | { products: Product[] }
  if (!Array.isArray(body.products)) {
    return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 })
  }

  try {
    await writeProductsFile({ products: body.products })
  } catch (error) {
    return writeError(error)
  }
  revalidateCatalog()
  return NextResponse.json({ ok: true })
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  const product = (await request.json()) as Product
  const data = await readProductsFile()

  if (!product.code?.trim()) {
    return NextResponse.json({ error: 'Ürün kodu zorunlu' }, { status: 400 })
  }

  const codeExists = data.products.some(
    (p) => p.code === product.code && p.id !== product.id,
  )
  if (codeExists) {
    return NextResponse.json({ error: 'Bu ürün kodu zaten var' }, { status: 409 })
  }

  const existingIndex = data.products.findIndex((p) => p.id === product.id)
  if (existingIndex >= 0) {
    data.products[existingIndex] = product
  } else {
    product.id = product.id || `p_${product.code}`
    product.order = product.order || data.products.length + 1
    data.products.push(product)
  }

  try {
    await writeProductsFile(data)
  } catch (error) {
    return writeError(error)
  }
  revalidateCatalog()
  return NextResponse.json({ ok: true, product })
}

export async function PATCH(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const id = String(body.id || '')
  if (!id || !Array.isArray(body.images)) {
    return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 })
  }

  const images = safeImages(body.images)

  const data = await readProductsFile()
  const index = data.products.findIndex((p) => p.id === id)
  if (index < 0) {
    return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 })
  }

  data.products[index] = { ...data.products[index], images }
  try {
    await writeProductsFile(data)
  } catch (error) {
    return writeError(error)
  }
  revalidateCatalog()
  return NextResponse.json({ ok: true, product: data.products[index] })
}

export async function DELETE(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 })

  const data = await readProductsFile()
  data.products = data.products.filter((p) => p.id !== id)
  try {
    await writeProductsFile(data)
  } catch (error) {
    return writeError(error)
  }
  revalidateCatalog()
  return NextResponse.json({ ok: true })
}
