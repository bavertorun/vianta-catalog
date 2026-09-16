import { redirect } from 'next/navigation'
import { AdminClient } from '@/components/admin/admin-client'
import { isAuthenticated } from '@/lib/admin-auth'
import { getProducts } from '@/lib/products'

export const metadata = {
  title: 'Admin — Vianta',
}

export default async function AdminPage() {
  const ok = await isAuthenticated()
  if (!ok) redirect('/admin/login')

  const products = await getProducts()
  return <AdminClient initialProducts={products} />
}
