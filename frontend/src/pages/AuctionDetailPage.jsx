import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { Badge, ConfirmDialog, TrustLine } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { useToast } from '../context/ToastContext'
import { countdown, money, statusTone } from '../utils/format'

export default function AuctionDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const socket = useSocket()
  const toast = useToast()
  const [payload, setPayload] = useState(null)
  const [offset, setOffset] = useState(0)
  const [now, setNow] = useState(Date.now())
  const [amount, setAmount] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)

  async function load() {
    const res = await api(`/api/auctions/${id}`)
    setPayload(res)
    setOffset(new Date(res.serverTime).getTime() - Date.now())
    setAmount(res.data.minimumNextBid)
  }

  useEffect(() => { load().catch((err) => toast(err.message, 'error')) }, [id])
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  useEffect(() => {
    if (!socket || !id) return undefined
    socket.emit('auction:join', id)
    const onBid = (update) => {
      if (String(update.auctionId) !== String(id)) return
      setPayload((current) => current ? {
        ...current,
        data: {
          ...current.data,
          currentPrice: update.currentPrice,
          bidCount: update.bidCount,
          endTime: update.endTime,
          extensionCount: update.extensionCount,
          minimumNextBid: update.minimumNextBid,
          highestBidder: update.highestBidder,
          bids: [update.bid, ...(current.data.bids || []).filter((bid) => bid._id !== update.bid._id)],
        },
      } : current)
      setAmount(update.minimumNextBid)
    }
    socket.on('bid:update', onBid)
    return () => socket.off('bid:update', onBid)
  }, [socket, id])

  useEffect(() => {
    if (!payload?.data?.endTime) return undefined
    const remaining = new Date(payload.data.endTime).getTime() - Date.now() - offset
    if (!['active', 'scheduled'].includes(payload.data.status)) return undefined
    const timer = setTimeout(() => { load().catch(() => {}) }, Math.max(remaining + 800, 1500))
    return () => clearTimeout(timer)
  }, [payload?.data?.endTime, payload?.data?.status])

  if (!payload) return <p className="text-slate-500">Loading auction...</p>
  const auction = payload.data
  const seller = auction.seller
  const isSeller = user && seller && user._id === (seller._id || seller)
  const ended = !['active', 'scheduled'].includes(auction.status) || new Date(auction.endTime).getTime() <= now + offset

  async function placeBid() {
    setBusy(true)
    try {
      const res = await api(`/api/auctions/${auction._id}/bids`, { method: 'POST', body: { amount: Number(amount) } })
      toast(res.message)
      setConfirm(false)
      await load()
    } catch (err) {
      toast(err.message, 'error')
      await load().catch(() => {})
    } finally { setBusy(false) }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.8fr]">
      <div className="card overflow-hidden">
        {auction.images?.[0] && <img src={auction.images[0]} alt="" className="h-72 w-full object-cover" />}
        <div className="space-y-3 p-5">
          <Badge className={statusTone(auction.status)}>{auction.status}</Badge>
          <h1 className="text-3xl font-extrabold">{auction.title}</h1>
          <p className="text-slate-700">{auction.description}</p>
          <p className="text-sm text-slate-500">{auction.category} · {auction.condition} · {auction.location}</p>
        </div>
      </div>
      <aside className="card h-fit space-y-4 p-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">{ended ? 'Closed' : 'Time left'} · {countdown(auction.endTime, offset)}</p>
        <p className="text-3xl font-extrabold">{auction.bidCount ? money(auction.currentPrice) : money(auction.startingPrice)}</p>
        <p className="text-sm text-slate-600">{auction.bidCount ? `${auction.bidCount} bids` : 'No bids yet'} · next minimum {money(auction.minimumNextBid)}</p>
        {auction.reservePrice && <p className="text-sm text-slate-500">Reserve price is hidden from bidders and checked when the auction closes.</p>}
        {auction.extensionCount > 0 && <p className="text-sm text-amber-700">Anti-sniping extended this auction {auction.extensionCount} time{auction.extensionCount > 1 ? 's' : ''}.</p>}
        <Link to={`/profile/${seller?._id}`} className="block"><TrustLine person={seller} /><span className="text-sm font-semibold">{seller?.name}</span></Link>
        {!isSeller && !ended && (
          <form className="space-y-2" onSubmit={(event) => { event.preventDefault(); setConfirm(true) }}>
            <input className="field" type="number" min={auction.minimumNextBid} step="1" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <button className="btn-primary w-full" type="submit" disabled={!user}>Place bid</button>
          </form>
        )}
        {user && (
          <button className="btn-secondary w-full" type="button" onClick={async () => {
            try {
              await api(`/api/auctions/${auction._id}/watch`, { method: auction.isWatching ? 'DELETE' : 'POST' })
              toast(auction.isWatching ? 'Removed from watchlist' : 'Watching this auction')
              await load()
            } catch (err) { toast(err.message, 'error') }
          }}>{auction.isWatching ? 'Unwatch' : 'Watch auction'}</button>
        )}
        {isSeller && auction.bidCount === 0 && ['active', 'scheduled'].includes(auction.status) && (
          <button className="btn-danger w-full" type="button" onClick={async () => {
            try { await api(`/api/auctions/${auction._id}/cancel`, { method: 'PATCH' }); toast('Auction cancelled'); await load() }
            catch (err) { toast(err.message, 'error') }
          }}>Cancel auction</button>
        )}
        {auction.winner && <p className="text-sm font-semibold">Winner: {auction.winner.name || 'Highest bidder'}</p>}
        <div>
          <h2 className="font-bold">Bid history</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {(auction.bids || []).map((bid) => (
              <li key={bid._id} className="flex justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span>{bid.bidder?.name || 'Student'}</span>
                <span className="font-semibold">{money(bid.amount)}</span>
              </li>
            ))}
            {!auction.bids?.length && <li className="text-slate-500">No bids yet.</li>}
          </ul>
        </div>
      </aside>
      <ConfirmDialog open={confirm} title="Confirm bid" body={`Bid ${money(amount)} on ${auction.title}. This is checked again on the server.`} confirmLabel="Place bid" busy={busy} onConfirm={placeBid} onClose={() => setConfirm(false)} />
    </div>
  )
}
