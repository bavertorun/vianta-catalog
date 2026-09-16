import { notFound } from 'next/navigation'
import { ProductDetailClient } from '@/components/product-detail-client'
import { getProductByCode, getProducts } from '@/lib/products'
import { siteConfig } from '@/config/site'

interface PageProps {
  params: Promise<{ code: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { code } = await params
  return {
    title: `${siteConfig.refLabel} ${code} — Vianta Lingerie`,
    description: `Vianta Lingerie ${code} toptan seri fiyatı ve sipariş bilgisi.`,
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { code } = await params
  const product = await getProductByCode(code)
  if (!product) notFound()

  const all = await getProducts()
  const related = all.filter((p) => p.id !== product.id).slice(0, 3)

  return <ProductDetailClient product={product} related={related} />
}
