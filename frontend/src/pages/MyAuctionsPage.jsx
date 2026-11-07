import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { AuctionCard } from '../components/Cards'
import { PageHeader } from '../components/ui'

export default function MyAuctionsPage() {
  const [data, setData] = useState({ selling: [], bidding: [], watching: [] })
  useEffect(() => { api('/api/auctions/me').then((res) => setData(res.data)) }, [])
  const sections = [
    ['Selling', data.selling],
    ['Bidding', data.bidding],
    ['Watching', data.watching],
  ]
  return (
    <div className="space-y-8">
      <PageHeader title="My auctions" action={<Link className="btn-primary" to="/auctions/new">New auction</Link>} />
      {sections.map(([title, items]) => (
        <section key={title}>
          <h2 className="mb-3 text-xl font-bold">{title}</h2>
          {items.length === 0 ? <p className="text-sm text-slate-500">None yet.</p> : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((auction) => (
                <div key={auction._id}>
                  <AuctionCard auction={auction} />
                  {auction.result && <p className="mt-1 text-xs font-semibold uppercase text-slate-500">{auction.result}</p>}
                </div>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  )
}
