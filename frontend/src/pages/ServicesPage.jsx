import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { ServiceCard } from '../components/Cards'
import { EmptyState, PageHeader, SkeletonGrid } from '../components/ui'
import { SERVICE_CATEGORIES } from '../constants'
import { useAuth } from '../context/AuthContext'

export default function ServicesPage() {
  const { user } = useAuth()
  const [data, setData] = useState([])
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [committedSearch, setCommittedSearch] = useState('')
  const [ready, setReady] = useState(false)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    const handle = window.setTimeout(() => setCommittedSearch(search), 350)
    return () => window.clearTimeout(handle)
  }, [search])

  useEffect(() => {
    let active = true
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (committedSearch) params.set('search', committedSearch)
    setPending(true)
    api(`/api/services?${params.toString()}`)
      .then((res) => { if (active) setData(res.data) })
      .finally(() => {
        if (!active) return
        setReady(true)
        setPending(false)
      })
    return () => { active = false }
  }, [category, committedSearch])

  return (
    <div>
      <PageHeader
        eyebrow="Services"
        title="Student help, not graded work"
        subtitle="Tutoring, design, notes, and photography. CampusKart blocks offers to complete assignments or exams for someone else."
        action={user?.isVerified ? <div className="flex gap-2"><Link className="btn-secondary" to="/services/requests">My requests</Link><Link className="btn-primary" to="/services/new">Offer a service</Link></div> : <Link className="btn-secondary" to="/services/requests">My requests</Link>}
      />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input className="field" placeholder="Search services" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="field" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {SERVICE_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>
      {!ready ? <SkeletonGrid /> : data.length === 0 ? <EmptyState title="No services yet" body="Verified students can offer tutoring and creative help." /> : (
        <div className={`grid gap-4 md:grid-cols-2 ${pending ? 'opacity-70' : ''}`} aria-busy={pending}>{data.map((service) => <ServiceCard key={service._id} service={service} />)}</div>
      )}
    </div>
  )
}
