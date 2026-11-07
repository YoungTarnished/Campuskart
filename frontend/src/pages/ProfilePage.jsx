import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api, uploadImages } from '../api/client'
import { ProductCard } from '../components/Cards'
import { PageHeader, Stars, TrustLine } from '../components/ui'
import { YEARS } from '../constants'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function ProfilePage() {
  const { id } = useParams()
  const { user, setSession, refresh } = useAuth()
  const toast = useToast()
  const own = !id || id === user?._id
  const [profile, setProfile] = useState(null)
  const [listings, setListings] = useState([])
  const [reviews, setReviews] = useState([])
  const [form, setForm] = useState(null)

  useEffect(() => {
    const target = id || user?._id
    if (!target) return
    api(`/api/users/${target}`).then((res) => {
      setProfile(res.data.user)
      setListings(res.data.listings)
      if (own) setForm(res.data.user)
    })
    api(`/api/reviews/user/${target}`).then((res) => setReviews(res.data))
  }, [id, user?._id])

  async function save(event) {
    event.preventDefault()
    try {
      const res = await api('/api/auth/profile', { method: 'PUT', body: {
        name: form.name, college: form.college, department: form.department, year: form.year, profilePicture: form.profilePicture || '',
      } })
      setSession(res.data, localStorage.getItem('campuskart_token'))
      await refresh()
      toast('Profile updated')
    } catch (err) { toast(err.message, 'error') }
  }

  if (!profile) return <p className="text-slate-500">Loading profile...</p>
  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="card space-y-3 p-5">
        <PageHeader title={profile.name} subtitle={`${profile.college} · ${profile.department} · Year ${profile.year}`} />
        {profile.profilePicture && <img src={profile.profilePicture} alt="" className="h-24 w-24 rounded-full object-cover" />}
        <TrustLine person={profile} />
        <p><Stars value={profile.ratingAverage} /> {profile.ratingAverage} from {profile.ratingCount} reviews</p>
        {own && form && (
          <form className="space-y-3" onSubmit={save}>
            <input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="field" value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} />
            <input className="field" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            <select className="field" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })}>{YEARS.map((year) => <option key={year} value={year}>Year {year}</option>)}</select>
            <input className="field" type="file" accept="image/png,image/jpeg,image/webp" onChange={async (event) => {
              try {
                const urls = await uploadImages([event.target.files[0]])
                setForm({ ...form, profilePicture: urls[0] })
              } catch (err) { toast(err.message, 'error') }
            }} />
            <button className="btn-primary" type="submit">Save profile</button>
          </form>
        )}
      </section>
      <div className="space-y-6">
        <section>
          <h2 className="mb-3 text-xl font-bold">Listings</h2>
          <div className="grid gap-4 sm:grid-cols-2">{listings.map((product) => <ProductCard key={product._id} product={{ ...product, seller: profile }} />)}</div>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-bold">Reviews</h2>
          {reviews.map((review) => (
            <article key={review._id} className="card p-4">
              <Stars value={review.rating} />
              <p className="mt-1 text-sm">{review.feedback || 'No written feedback.'}</p>
              <p className="mt-1 text-xs text-slate-500">{review.reviewer?.name}</p>
            </article>
          ))}
          {reviews.length === 0 && <p className="text-sm text-slate-500">No reviews yet.</p>}
        </section>
      </div>
    </div>
  )
}
