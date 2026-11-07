import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { EmptyState, PageHeader } from '../components/ui'
import { when } from '../utils/format'

export default function NotificationsPage() {
  const [items, setItems] = useState([])
  function load() { api('/api/notifications?limit=50').then((res) => setItems(res.data)) }
  useEffect(() => { load() }, [])
  return (
    <div>
      <PageHeader title="Notifications" action={<button className="btn-secondary" type="button" onClick={async () => { await api('/api/notifications/read-all', { method: 'PATCH' }); load() }}>Mark all read</button>} />
      {items.length === 0 ? <EmptyState title="You're caught up" body="Bids, orders, messages, and reports will land here." /> : (
        <div className="space-y-2">
          {items.map((item) => (
            <Link key={item._id} to={item.link || '/notifications'} className={`card block p-4 ${item.read ? 'opacity-70' : ''}`} onClick={() => api(`/api/notifications/${item._id}/read`, { method: 'PATCH' })}>
              <p className="font-semibold">{item.title}</p>
              <p className="text-sm text-slate-600">{item.body}</p>
              <p className="mt-1 text-xs text-slate-400">{when(item.createdAt)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
