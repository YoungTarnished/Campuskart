import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, uploadImages } from '../api/client'
import { PRODUCT_CATEGORIES, PRODUCT_CONDITIONS } from '../constants'
import { useToast } from '../context/ToastContext'
import { Field, PageHeader } from '../components/ui'

function localInput(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function AuctionFormPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const start = new Date()
  const end = new Date(Date.now() + 2 * 60 * 60 * 1000)
  const [form, setForm] = useState({
    title: '', description: '', category: 'Electronics', condition: 'Good', location: '',
    startingPrice: '', minIncrement: 10, reservePrice: '', startTime: localInput(start), endTime: localInput(end), images: [],
  })
  const [busy, setBusy] = useState(false)
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  async function onFiles(event) {
    try { set('images', await uploadImages([...event.target.files].slice(0, 5))) }
    catch (err) { toast(err.message, 'error') }
  }

  async function onSubmit(event) {
    event.preventDefault()
    setBusy(true)
    try {
      const res = await api('/api/auctions', {
        method: 'POST',
        body: {
          ...form,
          startingPrice: Number(form.startingPrice),
          minIncrement: Number(form.minIncrement),
          reservePrice: form.reservePrice ? Number(form.reservePrice) : undefined,
          startTime: new Date(form.startTime).toISOString(),
          endTime: new Date(form.endTime).toISOString(),
        },
      })
      toast(res.message)
      navigate(`/auctions/${res.data._id}`)
    } catch (err) { toast(err.message, 'error') } finally { setBusy(false) }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Create an auction" subtitle="A bid in the final two minutes extends the end time by two minutes. You cannot bid on your own auction." />
      <form className="card space-y-4 p-5" onSubmit={onSubmit}>
        <Field label="Title"><input className="field" required value={form.title} onChange={(e) => set('title', e.target.value)} /></Field>
        <Field label="Description"><textarea className="field min-h-28" required value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category"><select className="field" value={form.category} onChange={(e) => set('category', e.target.value)}>{PRODUCT_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></Field>
          <Field label="Condition"><select className="field" value={form.condition} onChange={(e) => set('condition', e.target.value)}>{PRODUCT_CONDITIONS.map((item) => <option key={item}>{item}</option>)}</select></Field>
          <Field label="Starting price"><input className="field" type="number" min="1" required value={form.startingPrice} onChange={(e) => set('startingPrice', e.target.value)} /></Field>
          <Field label="Minimum increment"><input className="field" type="number" min="1" required value={form.minIncrement} onChange={(e) => set('minIncrement', e.target.value)} /></Field>
          <Field label="Reserve price (optional)"><input className="field" type="number" min="1" value={form.reservePrice} onChange={(e) => set('reservePrice', e.target.value)} /></Field>
          <Field label="Campus location"><input className="field" required value={form.location} onChange={(e) => set('location', e.target.value)} /></Field>
          <Field label="Starts"><input className="field" type="datetime-local" required value={form.startTime} onChange={(e) => set('startTime', e.target.value)} /></Field>
          <Field label="Ends"><input className="field" type="datetime-local" required value={form.endTime} onChange={(e) => set('endTime', e.target.value)} /></Field>
        </div>
        <Field label="Images"><input className="field" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={onFiles} /></Field>
        <button className="btn-primary" disabled={busy} type="submit">{busy ? 'Creating...' : 'Publish auction'}</button>
      </form>
    </div>
  )
}
