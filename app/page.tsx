import { HomePage } from '@/components/home-page'
import { getProducts } from '@/lib/products'

export default async function Page() {
  const products = await getProducts()
  return <HomePage products={products} />
}
