import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { Badge, EmptyState, PageHeader } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { statusTone } from '../utils/format'

export default function ExchangesPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [rows, setRows] = useState([])
  function load() { api('/api/exchanges').then((res) => setRows(res.data)).catch((err) => toast(err.message, 'error')) }
  useEffect(() => { load() }, [])

  async function act(id, action) {
    try { const res = await api(`/api/exchanges/${id}/${action}`, { method: 'PATCH' }); toast(res.message); load() }
    catch (err) { toast(err.message, 'error') }
  }

  return (
    <div>
      <PageHeader title="Exchanges" subtitle="Offer one available, exchange-eligible product for another. Both items lock together when the owner accepts." />
      {rows.length === 0 ? <EmptyState title="No proposals" body="Open an exchange-eligible product and propose a swap." action={<Link className="btn-primary" to="/marketplace">Browse marketplace</Link>} /> : (
        <div className="space-y-3">
          {rows.map((row) => {
            const incoming = row.recipient?._id === user?._id
            return (
              <article key={row._id} className="card space-y-2 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-semibold">{row.offeredProduct?.title} for {row.requestedProduct?.title}</h2>
                  <Badge className={statusTone(row.status)}>{row.status}</Badge>
                </div>
                <p className="text-sm text-slate-600">{incoming ? `${row.proposer?.name} offered you a swap.` : `Waiting on ${row.recipient?.name}.`}</p>
                {row.message && <p className="text-sm">{row.message}</p>}
                {row.status === 'pending' && incoming && (
                  <div className="flex gap-2">
                    <button className="btn-primary" type="button" onClick={() => act(row._id, 'accept')}>Accept</button>
                    <button className="btn-secondary" type="button" onClick={() => act(row._id, 'reject')}>Reject</button>
                  </div>
                )}
                {row.status === 'pending' && !incoming && <button className="btn-secondary" type="button" onClick={() => act(row._id, 'cancel')}>Cancel</button>}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
