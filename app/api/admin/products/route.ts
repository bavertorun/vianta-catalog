import { NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/admin-auth'
import { getProducts, readProductsFile, writeProductsFile } from '@/lib/products'
import type { Product, ProductsFile } from '@/types/product'

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

  await writeProductsFile({ products: body.products })
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

  await writeProductsFile(data)
  return NextResponse.json({ ok: true, product })
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
  await writeProductsFile(data)
  return NextResponse.json({ ok: true })
}
