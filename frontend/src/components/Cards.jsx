import { Link } from 'react-router-dom'
import { Badge, Stars } from './ui'
import { conditionTone, money } from '../utils/format'

export function ProductCard({ product }) {
  const seller = product.seller
  return (
    <Link to={`/products/${product._id}`} className="card group overflow-hidden transition hover:-translate-y-0.5">
      <div className="relative h-44 bg-indigo-50">
        {product.images?.[0] && <img src={product.images[0]} alt="" className="h-full w-full object-cover" />}
        <div className="absolute left-3 top-3 flex gap-2">
          <Badge className={conditionTone[product.condition] || 'bg-white text-slate-700'}>{product.condition}</Badge>
          {product.isUrgent && <Badge className="bg-rose-600 text-white">Urgent</Badge>}
          {product.discountPercent >= 10 && <Badge className="bg-amber-400 text-amber-950">{product.discountPercent}% off</Badge>}
        </div>
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold leading-snug group-hover:text-indigo-700">{product.title}</h3>
          <p className="font-bold text-indigo-700">{money(product.price)}</p>
        </div>
        <p className="text-xs text-slate-500">{product.category} · {product.location}</p>
        {seller && (
          <p className="flex items-center gap-2 text-xs text-slate-600">
            <span>{seller.name}</span>
            {seller.isVerified && <span className="text-indigo-600">Verified</span>}
            <Stars value={seller.ratingAverage} />
          </p>
        )}
      </div>
    </Link>
  )
}

export function AuctionCard({ auction }) {
  return (
    <Link to={`/auctions/${auction._id}`} className="card overflow-hidden transition hover:-translate-y-0.5">
      <div className="h-40 bg-indigo-50">
        {auction.images?.[0] && <img src={auction.images[0]} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold">{auction.title}</h3>
          <Badge className="bg-indigo-50 text-indigo-700">{auction.status}</Badge>
        </div>
        <p className="text-sm text-slate-600">
          {auction.bidCount ? `High bid ${money(auction.currentPrice)}` : `Starts at ${money(auction.startingPrice)}`}
        </p>
        <p className="text-xs text-slate-500">{auction.bidCount || 0} bids · ends {new Date(auction.endTime).toLocaleString('en-IN')}</p>
      </div>
    </Link>
  )
}

export function ServiceCard({ service }) {
  const provider = service.provider
  return (
    <Link to={`/services/${service._id}`} className="card p-5 transition hover:-translate-y-0.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{service.category}</p>
      <h3 className="mt-1 font-semibold">{service.title}</h3>
      <p className="mt-2 line-clamp-2 text-sm text-slate-600">{service.description}</p>
      <p className="mt-3 font-bold text-indigo-700">
        {money(service.price)}{service.pricingType === 'hourly' ? ' / hour' : ''}
      </p>
      {provider && (
        <p className="mt-2 flex items-center gap-2 text-xs text-slate-600">
          <span>{provider.name}</span>
          {provider.isVerified && <span className="text-indigo-600">Verified</span>}
          <Stars value={provider.ratingAverage} />
        </p>
      )}
    </Link>
  )
}
