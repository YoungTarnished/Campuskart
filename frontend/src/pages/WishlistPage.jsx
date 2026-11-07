import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { ProductCard } from '../components/Cards'
import { EmptyState, PageHeader } from '../components/ui'
import { useToast } from '../context/ToastContext'

export default function WishlistPage() {
  const toast = useToast()
  const [rows, setRows] = useState([])
  function load() { api('/api/wishlist').then((res) => setRows(res.data)).catch((err) => toast(err.message, 'error')) }
  useEffect(() => { load() }, [])
  return (
    <div>
      <PageHeader title="Wishlist" subtitle="Saved products stay here until you remove them or they are taken down." />
      {rows.length === 0 ? <EmptyState title="Nothing saved" body="Open a product and save it to compare later." /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <div key={row._id} className="space-y-2">
              <ProductCard product={row.product} />
              <button className="btn-ghost" type="button" onClick={async () => { await api(`/api/wishlist/${row.product._id}`, { method: 'DELETE' }); load() }}>Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
