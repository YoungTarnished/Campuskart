import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { ProductCard } from '../components/Cards'
import { EmptyState, PageHeader } from '../components/ui'
import { useAuth } from '../context/AuthContext'

export default function MyListingsPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [services, setServices] = useState([])

  useEffect(() => {
    api('/api/products/me').then((res) => setProducts(res.data))
    api('/api/services/me').then((res) => setServices(res.data)).catch(() => {})
  }, [])

  return (
    <div className="space-y-8">
      <PageHeader title="My listings" action={user?.isVerified ? <Link className="btn-primary" to="/products/new">Add product</Link> : null} />
      {products.length === 0 ? <EmptyState title="No products yet" body="Verified students can publish books, hostel gear, and more." /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{products.map((product) => (
          <div key={product._id}>
            <ProductCard product={product} />
            {product.status === 'pending' && <p className="mt-1 text-xs font-semibold text-amber-700">Waiting for admin approval</p>}
          </div>
        ))}</div>
      )}
      <h2 className="text-xl font-bold">My services</h2>
      <div className="grid gap-3">
        {services.map((service) => (
          <Link key={service._id} to={`/services/${service._id}`} className="card flex items-center justify-between p-4">
            <span className="font-semibold">{service.title}</span>
            <span className="text-sm text-slate-500">{service.status}</span>
          </Link>
        ))}
        {services.length === 0 && <p className="text-sm text-slate-500">You have not offered a service.</p>}
      </div>
    </div>
  )
}
