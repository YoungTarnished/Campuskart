import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { TrustLine } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { money } from '../utils/format'

export default function ServiceDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [service, setService] = useState(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api(`/api/services/${id}`).then((res) => setService(res.data)).catch((err) => toast(err.message, 'error'))
  }, [id])

  if (!service) return <p className="text-slate-500">Loading service...</p>
  const provider = service.provider
  const isOwner = user && provider && user._id === provider._id

  async function requestService(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await api(`/api/services/${service._id}/requests`, { method: 'POST', body: { message } })
      toast('Request sent')
      navigate('/services/requests')
    } catch (err) { toast(err.message, 'error') } finally { setBusy(false) }
  }

  async function contact() {
    try {
      const res = await api('/api/conversations', { method: 'POST', body: { participantId: provider._id } })
      navigate(`/messages/${res.data._id}`)
    } catch (err) { toast(err.message, 'error') }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.8fr]">
      <article className="card space-y-3 p-6">
        <p className="text-sm font-semibold uppercase text-indigo-600">{service.category}</p>
        <h1 className="text-3xl font-extrabold">{service.title}</h1>
        <p className="whitespace-pre-wrap text-slate-700">{service.description}</p>
        <p className="text-sm text-slate-500">Estimated time: {service.estimatedCompletionTime}</p>
        <p className="text-sm text-slate-500">Availability: {service.availability}</p>
      </article>
      <aside className="card space-y-4 p-5">
        <p className="text-3xl font-extrabold text-indigo-700">{money(service.price)}{service.pricingType === 'hourly' ? ' / hour' : ''}</p>
        <Link to={`/profile/${provider?._id}`} className="block rounded-2xl bg-slate-50 p-3">
          <p className="font-semibold">{provider?.name}</p>
          <p className="text-sm text-slate-500">{provider?.department} · Year {provider?.year}</p>
          <TrustLine person={provider} />
        </Link>
        {isOwner ? <p className="text-sm text-slate-600">This is your service. Incoming requests are on the requests page.</p> : (
          <form className="space-y-3" onSubmit={requestService}>
            <textarea className="field min-h-24" required placeholder="What do you want help understanding?" value={message} onChange={(e) => setMessage(e.target.value)} />
            <button className="btn-primary w-full" disabled={busy || !user} type="submit">{user ? 'Request service' : 'Log in to request'}</button>
            <button className="btn-secondary w-full" type="button" onClick={() => user ? contact() : navigate('/login')}>Message provider</button>
          </form>
        )}
      </aside>
    </div>
  )
}
