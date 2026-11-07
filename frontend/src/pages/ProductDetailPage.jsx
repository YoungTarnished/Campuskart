import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { Badge, ConfirmDialog, Field, Stars, TrustLine } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { REPORT_REASONS } from '../constants'
import { conditionTone, money, statusTone } from '../utils/format'

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()
  const [product, setProduct] = useState(null)
  const [mine, setMine] = useState([])
  const [error, setError] = useState('')
  const [buyOpen, setBuyOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [exchangeOpen, setExchangeOpen] = useState(false)
  const [offeredId, setOfferedId] = useState('')
  const [reason, setReason] = useState(REPORT_REASONS[0])
  const [details, setDetails] = useState('')
  const [busy, setBusy] = useState(false)

  function load() {
    return api(`/api/products/${id}`).then((res) => setProduct(res.data)).catch((err) => setError(err.message))
  }
  useEffect(() => { load() }, [id])
  useEffect(() => {
    if (!user) return
    api('/api/products/me').then((res) => setMine(res.data.filter((item) => item.isExchangeEligible && item.status === 'available'))).catch(() => {})
  }, [user])

  if (error) return <p className="text-rose-600">{error}</p>
  if (!product) return <p className="text-slate-500">Loading listing...</p>
  const seller = product.seller
  const isOwner = user && seller && user._id === seller._id

  async function wish() {
    try {
      if (product.wished) await api(`/api/wishlist/${product._id}`, { method: 'DELETE' })
      else await api(`/api/wishlist/${product._id}`, { method: 'POST' })
      await load()
    } catch (err) { toast(err.message, 'error') }
  }
  async function buy() {
    setBusy(true)
    try {
      await api('/api/orders', { method: 'POST', body: { productId: product._id } })
      toast('Purchase request sent. Payment will be simulated after the seller accepts.')
      setBuyOpen(false)
      navigate('/purchases')
    } catch (err) { toast(err.message, 'error') } finally { setBusy(false) }
  }
  async function contact() {
    try {
      const res = await api('/api/conversations', { method: 'POST', body: { participantId: seller._id, productId: product._id } })
      navigate(`/messages/${res.data._id}`)
    } catch (err) { toast(err.message, 'error') }
  }
  async function report() {
    try {
      await api('/api/reports', { method: 'POST', body: { targetType: 'product', targetId: product._id, reason, details } })
      toast('Report submitted')
      setReportOpen(false)
    } catch (err) { toast(err.message, 'error') }
  }
  async function propose() {
    try {
      await api('/api/exchanges', { method: 'POST', body: { offeredProductId: offeredId, requestedProductId: product._id, message: 'Would you exchange these?' } })
      toast('Exchange proposal sent')
      setExchangeOpen(false)
      navigate('/exchanges')
    } catch (err) { toast(err.message, 'error') }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
      <div className="card overflow-hidden">
        <div className="grid gap-2 bg-indigo-50 p-3 sm:grid-cols-2">
          {(product.images || []).map((image) => <img key={image} src={image} alt="" className="h-64 w-full rounded-2xl object-cover" />)}
        </div>
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap gap-2">
            <Badge className={conditionTone[product.condition]}>{product.condition}</Badge>
            <Badge className={statusTone(product.status)}>{product.status}</Badge>
            {product.isUrgent && <Badge className="bg-rose-600 text-white">Urgent sale</Badge>}
            {product.isExchangeEligible && <Badge className="bg-slate-100 text-slate-700">Open to exchange</Badge>}
          </div>
          <h1 className="text-3xl font-extrabold">{product.title}</h1>
          <p className="whitespace-pre-wrap text-slate-700">{product.description}</p>
          <p className="text-sm text-slate-500">{product.category} · Pickup at {product.location} · {product.viewCount || 0} views</p>
          {product.suggestedPrice && <p className="text-sm text-slate-600">Suggested campus price when listed: {money(product.suggestedPrice)}</p>}
        </div>
      </div>
      <aside className="card h-fit space-y-4 p-5">
        <p className="text-3xl font-extrabold text-indigo-700">{money(product.price)}</p>
        {product.discountPercent >= 10 && <p className="text-sm font-semibold text-amber-700">{product.discountPercent}% off badge set by the seller</p>}
        <Link to={`/profile/${seller?._id}`} className="block rounded-2xl bg-slate-50 p-3">
          <p className="font-semibold">{seller?.name}</p>
          <p className="text-sm text-slate-500">{seller?.college} · Year {seller?.year}</p>
          <TrustLine person={seller} />
          <p className="mt-1 text-sm"><Stars value={seller?.ratingAverage} /> {seller?.ratingAverage || 0} average</p>
        </Link>
        {isOwner ? (
          <div className="flex gap-2">
            <Link className="btn-primary" to={`/products/${product._id}/edit`}>Edit</Link>
            <button className="btn-danger" type="button" onClick={async () => {
              if (!window.confirm('Delete this listing?')) return
              try { await api(`/api/products/${product._id}`, { method: 'DELETE' }); toast('Listing deleted'); navigate('/listings') }
              catch (err) { toast(err.message, 'error') }
            }}>Delete</button>
          </div>
        ) : (
          <div className="grid gap-2">
            <button className="btn-primary" type="button" disabled={!user || product.status !== 'available'} onClick={() => user ? setBuyOpen(true) : navigate('/login')}>Request to buy</button>
            <button className="btn-secondary" type="button" onClick={() => user ? contact() : navigate('/login')}>Contact seller</button>
            <button className="btn-secondary" type="button" onClick={() => user ? wish() : navigate('/login')}>{product.wished ? 'Remove from wishlist' : 'Save to wishlist'}</button>
            {product.isExchangeEligible && product.status === 'available' && (
              <button className="btn-secondary" type="button" onClick={() => setExchangeOpen(true)}>Propose exchange</button>
            )}
            <button className="btn-ghost" type="button" onClick={() => user ? setReportOpen(true) : navigate('/login')}>Report listing</button>
          </div>
        )}
        <p className="text-xs text-slate-500">Buying uses a simulated payment confirmation. No money moves in this academic prototype.</p>
      </aside>
      <ConfirmDialog open={buyOpen} title="Send purchase request" body={`Ask to buy ${product.title} for ${money(product.price)}. The price is taken from the listing, not from this screen.`} confirmLabel="Send request" busy={busy} onConfirm={buy} onClose={() => setBuyOpen(false)} />
      {reportOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
          <form className="card w-full max-w-md space-y-3 p-5" onSubmit={(e) => { e.preventDefault(); report() }}>
            <h2 className="text-lg font-bold">Report listing</h2>
            <Field label="Reason"><select className="field" value={reason} onChange={(e) => setReason(e.target.value)}>{REPORT_REASONS.map((item) => <option key={item}>{item}</option>)}</select></Field>
            <Field label="Details"><textarea className="field min-h-24" value={details} onChange={(e) => setDetails(e.target.value)} /></Field>
            <div className="flex justify-end gap-2"><button className="btn-secondary" type="button" onClick={() => setReportOpen(false)}>Back</button><button className="btn-danger" type="submit">Submit report</button></div>
          </form>
        </div>
      )}
      {exchangeOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
          <form className="card w-full max-w-md space-y-3 p-5" onSubmit={(e) => { e.preventDefault(); propose() }}>
            <h2 className="text-lg font-bold">Offer one of your items</h2>
            <Field label="Your exchange-eligible product">
              <select className="field" required value={offeredId} onChange={(e) => setOfferedId(e.target.value)}>
                <option value="">Choose</option>
                {mine.map((item) => <option key={item._id} value={item._id}>{item.title}</option>)}
              </select>
            </Field>
            <div className="flex justify-end gap-2"><button className="btn-secondary" type="button" onClick={() => setExchangeOpen(false)}>Back</button><button className="btn-primary" type="submit">Send proposal</button></div>
          </form>
        </div>
      )}
    </div>
  )
}
