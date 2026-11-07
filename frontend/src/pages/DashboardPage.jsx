import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { ProductCard } from '../components/Cards'
import { Alert, PageHeader } from '../components/ui'
import { useAuth } from '../context/AuthContext'

const links = [
  ['/listings', 'My listings', 'myListings'],
  ['/purchases', 'Purchases', 'purchases'],
  ['/sales', 'Sales', 'sales'],
  ['/my-auctions', 'Auctions', 'auctions'],
  ['/wishlist', 'Wishlist', 'wishlistCount'],
  ['/exchanges', 'Exchanges', 'exchanges'],
  ['/messages', 'Unread messages', 'unreadMessages'],
  ['/notifications', 'Notifications', 'unreadNotifications'],
]

export default function DashboardPage() {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [recommendations, setRecommendations] = useState(null)
  const [recent, setRecent] = useState([])

  useEffect(() => {
    api('/api/dashboard').then((res) => setSummary(res.data))
    api('/api/products/recommendations').then((res) => setRecommendations(res.data))
    api('/api/products/recent').then((res) => setRecent(res.data))
  }, [])

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Dashboard" title={`Hello, ${user?.name?.split(' ')[0] || 'student'}`} subtitle="Your listings, orders, auctions, and recommendations." action={user?.isVerified ? <Link className="btn-primary" to="/products/new">New listing</Link> : null} />
      {!user?.isVerified && (
        <Alert>
          Your college email is not verified, so publishing, bidding, and new transactions stay locked.
          {' '}<Link className="font-semibold underline" to="/verify-email">Verify now</Link>
        </Alert>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {links.map(([to, label, key]) => (
          <Link key={to} to={to} className="card p-4 hover:ring-indigo-200">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="text-2xl font-extrabold">{summary ? summary[key] : '—'}</p>
          </Link>
        ))}
      </div>
      <section>
        <h2 className="mb-3 text-xl font-bold">Recommended for you</h2>
        <p className="mb-3 text-sm text-slate-500">{recommendations?.reason}</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(recommendations?.products || []).map((product) => <ProductCard key={product._id} product={product} />)}
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-xl font-bold">Recently viewed</h2>
        {recent.length === 0 ? <p className="text-sm text-slate-500">Open a product and it will show up here.</p> : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{recent.map((product) => <ProductCard key={product._id} product={product} />)}</div>
        )}
      </section>
    </div>
  )
}
