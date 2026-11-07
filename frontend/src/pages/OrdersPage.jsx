import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { Badge, PageHeader } from '../components/ui'
import { useToast } from '../context/ToastContext'
import { money, statusTone } from '../utils/format'
import { DISPUTE_REASONS } from '../constants'

export default function OrdersPage({ mode }) {
  const toast = useToast()
  const [orders, setOrders] = useState([])
  const [disputeFor, setDisputeFor] = useState(null)
  const [reason, setReason] = useState(DISPUTE_REASONS[0])
  const [details, setDetails] = useState('')

  function load() {
    api(`/api/orders/${mode}`).then((res) => setOrders(res.data)).catch((err) => toast(err.message, 'error'))
  }
  useEffect(() => { load() }, [mode])

  async function act(id, action) {
    try {
      const res = await api(`/api/orders/${id}/${action}`, { method: 'PATCH' })
      toast(res.message)
      load()
    } catch (err) { toast(err.message, 'error') }
  }

  async function dispute(event) {
    event.preventDefault()
    try {
      await api('/api/disputes', { method: 'POST', body: { transactionType: 'order', transactionId: disputeFor, reason, details } })
      toast('Dispute opened')
      setDisputeFor(null)
      setDetails('')
      load()
    } catch (err) { toast(err.message, 'error') }
  }

  return (
    <div>
      <PageHeader title={mode === 'sales' ? 'My sales' : 'My purchases'} subtitle="Accepting a request does not move money. The buyer confirms a simulated payment." />
      <div className="space-y-3">
        {orders.map((order) => {
          const item = order.product || order.auction
          return (
            <article key={order._id} className="card flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold">{item?.title || 'Order'}</h2>
                  <Badge className={statusTone(order.status)}>{order.status}</Badge>
                </div>
                <p className="text-sm text-slate-500">{money(order.amount)} · {order.kind} · {mode === 'sales' ? order.buyer?.name : order.seller?.name}</p>
                {item?._id && order.product && <Link className="text-sm font-semibold text-indigo-700" to={`/products/${item._id}`}>View product</Link>}
              </div>
              <div className="flex flex-wrap gap-2">
                {mode === 'sales' && order.status === 'pending' && <>
                  <button className="btn-primary" type="button" onClick={() => act(order._id, 'accept')}>Accept</button>
                  <button className="btn-secondary" type="button" onClick={() => act(order._id, 'reject')}>Reject</button>
                </>}
                {mode === 'purchases' && order.status === 'pending' && <button className="btn-secondary" type="button" onClick={() => act(order._id, 'cancel')}>Cancel</button>}
                {mode === 'purchases' && order.status === 'accepted' && <button className="btn-primary" type="button" onClick={() => act(order._id, 'confirm-payment')}>Confirm simulated payment</button>}
                {['accepted', 'completed'].includes(order.status) && <button className="btn-ghost" type="button" onClick={() => setDisputeFor(order._id)}>Dispute</button>}
                {order.status === 'completed' && (
                  <Link className="btn-secondary" to={`/reports?review=${order._id}&type=order&person=${mode === 'sales' ? order.buyer?._id : order.seller?._id}`}>Review</Link>
                )}
              </div>
            </article>
          )
        })}
        {orders.length === 0 && <p className="text-sm text-slate-500">Nothing here yet.</p>}
      </div>
      {disputeFor && (
        <form className="card mt-4 space-y-3 p-4" onSubmit={dispute}>
          <h2 className="font-bold">Open a dispute</h2>
          <select className="field" value={reason} onChange={(e) => setReason(e.target.value)}>{DISPUTE_REASONS.map((item) => <option key={item}>{item}</option>)}</select>
          <textarea className="field min-h-24" required value={details} onChange={(e) => setDetails(e.target.value)} placeholder="What happened?" />
          <div className="flex gap-2"><button className="btn-danger" type="submit">Submit dispute</button><button className="btn-secondary" type="button" onClick={() => setDisputeFor(null)}>Back</button></div>
        </form>
      )}
    </div>
  )
}
