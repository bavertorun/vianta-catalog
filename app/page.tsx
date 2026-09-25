import { HomePage } from '@/components/home-page'
import { getProducts } from '@/lib/products'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const products = await getProducts()
  return <HomePage products={products} />
}
