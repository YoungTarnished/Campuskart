import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { ProductCard } from '../components/Cards'
import { EmptyState, PageHeader, SkeletonGrid } from '../components/ui'
import { PRODUCT_CATEGORIES, PRODUCT_CONDITIONS } from '../constants'

function filtersFromParams(params) {
  return {
    search: params.get('search') || '',
    category: params.get('category') || '',
    condition: params.get('condition') || '',
    sort: params.get('sort') || 'newest',
    availability: params.get('availability') || '',
    minPrice: params.get('minPrice') || '',
    maxPrice: params.get('maxPrice') || '',
    deals: params.get('deals') === 'true',
    page: params.get('page') || '1',
  }
}

function toQuery(filters) {
  const next = new URLSearchParams()
  if (filters.search) next.set('search', filters.search)
  if (filters.category) next.set('category', filters.category)
  if (filters.condition) next.set('condition', filters.condition)
  if (filters.sort && filters.sort !== 'newest') next.set('sort', filters.sort)
  if (filters.availability) next.set('availability', filters.availability)
  if (filters.minPrice) next.set('minPrice', filters.minPrice)
  if (filters.maxPrice) next.set('maxPrice', filters.maxPrice)
  if (filters.deals) next.set('deals', 'true')
  if (filters.page && filters.page !== '1') next.set('page', filters.page)
  return next
}

export default function MarketplacePage() {
  const [params, setParams] = useSearchParams()
  const initial = filtersFromParams(params)
  const [filters, setFilters] = useState(initial)
  const [committedText, setCommittedText] = useState({
    search: initial.search,
    minPrice: initial.minPrice,
    maxPrice: initial.maxPrice,
  })
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState(null)
  const [ready, setReady] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setCommittedText({
        search: filters.search,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
      })
    }, 350)
    return () => window.clearTimeout(handle)
  }, [filters.search, filters.minPrice, filters.maxPrice])

  const query = toQuery({
    ...filters,
    search: committedText.search,
    minPrice: committedText.minPrice,
    maxPrice: committedText.maxPrice,
  }).toString()

  useEffect(() => {
    let active = true
    setPending(true)
    setError('')
    api(`/api/products?${query}`)
      .then((res) => {
        if (!active) return
        setData(res.data)
        setPagination(res.pagination)
      })
      .catch((err) => { if (active) setError(err.message) })
      .finally(() => {
        if (!active) return
        setReady(true)
        setPending(false)
      })
    return () => { active = false }
  }, [query])

  useEffect(() => {
    if (params.toString() === query) return
    setParams(query, { replace: true })
  }, [query, params, setParams])

  function update(key, value) {
    setFilters((current) => ({
      ...current,
      [key]: value,
      page: key === 'page' ? value || '1' : '1',
    }))
  }

  return (
    <div>
      <PageHeader eyebrow="Marketplace" title="Campus listings" subtitle="Search, filter, and sort items students are selling right now." />
      <div className="mb-6 grid gap-3 rounded-3xl bg-white p-4 ring-1 ring-slate-100 md:grid-cols-6">
        <input className="field md:col-span-2" placeholder="Keyword" value={filters.search} onChange={(e) => update('search', e.target.value)} />
        <select className="field" value={filters.category} onChange={(e) => update('category', e.target.value)}>
          <option value="">All categories</option>
          {PRODUCT_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select className="field" value={filters.condition} onChange={(e) => update('condition', e.target.value)}>
          <option value="">Any condition</option>
          {PRODUCT_CONDITIONS.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select className="field" value={filters.sort} onChange={(e) => update('sort', e.target.value)}>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
        <select className="field" value={filters.availability} onChange={(e) => update('availability', e.target.value)}>
          <option value="">Any availability</option>
          <option value="available">Available</option>
          <option value="reserved">Reserved</option>
          <option value="sold">Sold</option>
          <option value="exchanged">Exchanged</option>
        </select>
        <input className="field" type="number" min="0" placeholder="Min price" value={filters.minPrice} onChange={(e) => update('minPrice', e.target.value)} />
        <input className="field" type="number" min="0" placeholder="Max price" value={filters.maxPrice} onChange={(e) => update('maxPrice', e.target.value)} />
        <label className="flex items-center gap-2 text-sm font-medium md:col-span-2">
          <input type="checkbox" checked={filters.deals} onChange={(e) => update('deals', e.target.checked)} />
          Campus deals only
        </label>
      </div>
      {error && <p className="mb-4 text-sm text-rose-600">{error}</p>}
      {!ready ? <SkeletonGrid /> : data.length === 0 ? (
        <EmptyState title="No listings match" body="Try another keyword or clear a filter." />
      ) : (
        <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${pending ? 'opacity-70' : ''}`} aria-busy={pending}>
          {data.map((product) => <ProductCard key={product._id} product={product} />)}
        </div>
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
