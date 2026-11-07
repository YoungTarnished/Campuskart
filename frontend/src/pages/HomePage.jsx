import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { ProductCard, AuctionCard } from '../components/Cards'
import { PRODUCT_CATEGORIES } from '../constants'
import { SkeletonGrid } from '../components/ui'

export default function HomePage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [deals, setDeals] = useState([])
  const [products, setProducts] = useState([])
  const [auctions, setAuctions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api('/api/products/deals'),
      api('/api/products?limit=6&sort=newest'),
      api('/api/auctions?limit=3'),
    ]).then(([dealRes, productRes, auctionRes]) => {
      setDeals(dealRes.data)
      setProducts(productRes.data)
      setAuctions(auctionRes.data.filter((item) => item.status === 'active' || item.status === 'scheduled').slice(0, 3))
    }).finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-12">
      <section className="grid items-center gap-8 rounded-[2rem] bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-500 px-6 py-10 text-white shadow-card md:grid-cols-2 md:px-10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-100">Student marketplace</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">Buy, sell, bid, and trade inside your campus.</h1>
          <p className="mt-4 max-w-xl text-indigo-50">CampusKart is for verified students. List a textbook, bid on hostel gear, swap what you no longer need, or book tutoring. Payments in this prototype are simulated.</p>
          <form className="mt-6 flex flex-col gap-2 sm:flex-row" onSubmit={(event) => { event.preventDefault(); navigate(`/marketplace?search=${encodeURIComponent(search)}`) }}>
            <input className="field text-slate-900" placeholder="Search books, cycles, lamps..." value={search} onChange={(event) => setSearch(event.target.value)} />
            <button className="btn bg-white text-indigo-700 hover:bg-indigo-50" type="submit">Search</button>
          </form>
        </div>
        <div className="hidden rounded-3xl bg-white/15 p-5 backdrop-blur md:block">
          <div className="rounded-2xl bg-white p-4 text-slate-900">
            <p className="text-xs font-semibold uppercase text-indigo-600">Campus deal</p>
            <p className="mt-2 text-xl font-bold">Data Structures Textbook</p>
            <p className="text-sm text-slate-500">Verified seller · Hostel B lobby</p>
            <p className="mt-4 text-2xl font-extrabold text-indigo-700">₹450</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">Browse by category</h2>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {PRODUCT_CATEGORIES.map((category) => (
            <Link key={category} to={`/marketplace?category=${encodeURIComponent(category)}`} className="whitespace-nowrap rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:ring-indigo-300">
              {category}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Campus deals</h2>
          <Link to="/marketplace?deals=true" className="text-sm font-semibold text-indigo-700">View all</Link>
        </div>
        {loading ? <SkeletonGrid count={3} /> : deals.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{deals.slice(0, 3).map((product) => <ProductCard key={product._id} product={product} />)}</div>
        ) : <p className="text-sm text-slate-500">No discounted or urgent listings yet.</p>}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Fresh listings</h2>
          <Link to="/marketplace" className="text-sm font-semibold text-indigo-700">Marketplace</Link>
        </div>
        {loading ? <SkeletonGrid /> : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{products.map((product) => <ProductCard key={product._id} product={product} />)}</div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Live auctions</h2>
          <Link to="/auctions" className="text-sm font-semibold text-indigo-700">All auctions</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">{auctions.map((auction) => <AuctionCard key={auction._id} auction={auction} />)}</div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ['Verified students', 'College email verification is required before listing, bidding, or opening a transaction.'],
          ['Real workflows', 'Purchases, bids, exchanges, services, chat, and reviews are saved in MongoDB.'],
          ['Academic prototype', 'Payment confirmation is simulated. Tutoring is allowed. Completing graded work for someone else is not.'],
        ].map(([title, body]) => (
          <article key={title} className="card p-5">
            <h3 className="font-bold">{title}</h3>
            <p className="mt-2 text-sm text-slate-600">{body}</p>
          </article>
        ))}
      </section>
    </div>
  )
}
