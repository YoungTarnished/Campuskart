import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Badge, PageHeader } from '../components/ui'
import { useToast } from '../context/ToastContext'
import { statusTone } from '../utils/format'

export default function ServiceRequestsPage() {
  const toast = useToast()
  const [incoming, setIncoming] = useState([])
  const [outgoing, setOutgoing] = useState([])
  function load() {
    api('/api/services/requests/incoming').then((res) => setIncoming(res.data))
    api('/api/services/requests/outgoing').then((res) => setOutgoing(res.data))
  }
  useEffect(() => { load() }, [])
  async function act(id, action) {
    try { const res = await api(`/api/services/requests/${id}/${action}`, { method: 'PATCH' }); toast(res.message); load() }
    catch (err) { toast(err.message, 'error') }
  }
  function List({ title, rows, mine }) {
    return (
      <section className="space-y-3">
        <h2 className="text-xl font-bold">{title}</h2>
        {rows.length === 0 && <p className="text-sm text-slate-500">None yet.</p>}
        {rows.map((row) => (
          <article key={row._id} className="card space-y-2 p-4">
            <div className="flex items-center justify-between"><h3 className="font-semibold">{row.service?.title}</h3><Badge className={statusTone(row.status)}>{row.status}</Badge></div>
            <p className="text-sm text-slate-600">{row.message}</p>
            <div className="flex flex-wrap gap-2">
              {mine === 'in' && row.status === 'pending' && <>
                <button className="btn-primary" type="button" onClick={() => act(row._id, 'accept')}>Accept</button>
                <button className="btn-secondary" type="button" onClick={() => act(row._id, 'reject')}>Reject</button>
              </>}
              {mine === 'out' && ['pending', 'accepted'].includes(row.status) && <button className="btn-secondary" type="button" onClick={() => act(row._id, 'cancel')}>Cancel</button>}
              {row.status === 'accepted' && <button className="btn-primary" type="button" onClick={() => act(row._id, 'complete')}>Mark complete</button>}
            </div>
          </article>
        ))}
      </section>
    )
  }
  return (
    <div className="space-y-8">
      <PageHeader title="Service requests" subtitle="Providers can reject only while a request is pending. Either person can mark an accepted request complete." />
      <List title="Incoming" rows={incoming} mine="in" />
      <List title="Outgoing" rows={outgoing} mine="out" />
    </div>
  )
}
