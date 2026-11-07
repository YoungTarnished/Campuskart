import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { AuctionCard } from '../components/Cards'
import { EmptyState, PageHeader, SkeletonGrid } from '../components/ui'
import { useAuth } from '../context/AuthContext'

export default function AuctionsPage() {
  const { user } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('active')

  useEffect(() => {
    setLoading(true)
    api(`/api/auctions?status=${status}&limit=24`)
      .then((res) => setData(res.data))
      .finally(() => setLoading(false))
  }, [status])

  return (
    <div>
      <PageHeader
        eyebrow="Auctions"
        title="Bid on campus items"
        subtitle="The countdown is a guide. The server decides when an auction ends and who wins."
        action={user?.isVerified ? <Link className="btn-primary" to="/auctions/new">Start an auction</Link> : null}
      />
      <div className="mb-4 flex gap-2">
        {['active', 'scheduled', 'sold', 'unsold'].map((item) => (
          <button key={item} className={status === item ? 'btn-primary' : 'btn-secondary'} type="button" onClick={() => setStatus(item)}>{item}</button>
        ))}
      </div>
      {loading ? <SkeletonGrid /> : data.length === 0 ? <EmptyState title="No auctions here" body="Try another status, or start one if your email is verified." /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.map((auction) => <AuctionCard key={auction._id} auction={auction} />)}</div>
      )}
    </div>
  )
}
