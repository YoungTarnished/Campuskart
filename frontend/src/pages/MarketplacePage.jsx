import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { ProductCard } from '../components/Cards'
import { EmptyState, PageHeader, SkeletonGrid } from '../components/ui'
import { PRODUCT_CATEGORIES, PRODUCT_CONDITIONS } from '../constants'

export default function MarketplacePage() {
  const [params, setParams] = useSearchParams()
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const query = params.toString()
  useEffect(() => {
    let active = true
    setLoading(true)
    const search = new URLSearchParams(params)
    if (search.get('deals') === 'true') search.set('deals', 'true')
    api(`/api/products?${search.toString()}`)
      .then((res) => { if (active) { setData(res.data); setPagination(res.pagination) } })
      .catch((err) => { if (active) setError(err.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [query])

  function update(key, value) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next)
  }

  return (
    <div>
      <PageHeader eyebrow="Marketplace" title="Campus listings" subtitle="Search, filter, and sort items students are selling right now." />
      <div className="mb-6 grid gap-3 rounded-3xl bg-white p-4 ring-1 ring-slate-100 md:grid-cols-6">
        <input className="field md:col-span-2" placeholder="Keyword" value={params.get('search') || ''} onChange={(e) => update('search', e.target.value)} />
        <select className="field" value={params.get('category') || ''} onChange={(e) => update('category', e.target.value)}>
          <option value="">All categories</option>
          {PRODUCT_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select className="field" value={params.get('condition') || ''} onChange={(e) => update('condition', e.target.value)}>
          <option value="">Any condition</option>
          {PRODUCT_CONDITIONS.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select className="field" value={params.get('sort') || 'newest'} onChange={(e) => update('sort', e.target.value)}>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
        <select className="field" value={params.get('availability') || ''} onChange={(e) => update('availability', e.target.value)}>
          <option value="">Any availability</option>
          <option value="available">Available</option>
          <option value="reserved">Reserved</option>
          <option value="sold">Sold</option>
          <option value="exchanged">Exchanged</option>
        </select>
        <input className="field" type="number" min="0" placeholder="Min price" value={params.get('minPrice') || ''} onChange={(e) => update('minPrice', e.target.value)} />
        <input className="field" type="number" min="0" placeholder="Max price" value={params.get('maxPrice') || ''} onChange={(e) => update('maxPrice', e.target.value)} />
        <label className="flex items-center gap-2 text-sm font-medium md:col-span-2">
          <input type="checkbox" checked={params.get('deals') === 'true'} onChange={(e) => update('deals', e.target.checked ? 'true' : '')} />
          Campus deals only
        </label>
      </div>
      {error && <p className="mb-4 text-sm text-rose-600">{error}</p>}
      {loading ? <SkeletonGrid /> : data.length === 0 ? (
        <EmptyState title="No listings match" body="Try another keyword or clear a filter." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.map((product) => <ProductCard key={product._id} product={product} />)}</div>
      )}
      {pagination && pagination.pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button className="btn-secondary" type="button" disabled={pagination.page <= 1} onClick={() => update('page', String(pagination.page - 1))}>Previous</button>
          <span className="text-sm text-slate-600">Page {pagination.page} of {pagination.pages}</span>
          <button className="btn-secondary" type="button" disabled={pagination.page >= pagination.pages} onClick={() => update('page', String(pagination.page + 1))}>Next</button>
        </div>
      )}
    </div>
  )
}
