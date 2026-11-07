import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { SERVICE_CATEGORIES } from '../constants'
import { useToast } from '../context/ToastContext'
import { Field, PageHeader } from '../components/ui'

export default function ServiceFormPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [form, setForm] = useState({
    title: '', description: '', category: SERVICE_CATEGORIES[0], pricingType: 'hourly',
    price: '', estimatedCompletionTime: '', availability: '',
  })
  const [busy, setBusy] = useState(false)
  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value })

  async function onSubmit(event) {
    event.preventDefault()
    setBusy(true)
    try {
      const res = await api('/api/services', { method: 'POST', body: { ...form, price: Number(form.price) } })
      toast(res.message)
      navigate(`/services/${res.data._id}`)
    } catch (err) { toast(err.message, 'error') } finally { setBusy(false) }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Offer a service" subtitle="Describe tutoring, explanations, or original study resources. Do not offer to sit an exam or submit graded work for another student." />
      <form className="card space-y-4 p-5" onSubmit={onSubmit}>
        <Field label="Title"><input className="field" required value={form.title} onChange={set('title')} /></Field>
        <Field label="Description"><textarea className="field min-h-28" required value={form.description} onChange={set('description')} /></Field>
        <Field label="Category"><select className="field" value={form.category} onChange={set('category')}>{SERVICE_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Pricing"><select className="field" value={form.pricingType} onChange={set('pricingType')}><option value="hourly">Hourly</option><option value="fixed">Fixed</option></select></Field>
          <Field label="Price (INR)"><input className="field" type="number" min="0" required value={form.price} onChange={set('price')} /></Field>
          <Field label="Estimated time"><input className="field" required value={form.estimatedCompletionTime} onChange={set('estimatedCompletionTime')} /></Field>
          <Field label="Availability"><input className="field" required value={form.availability} onChange={set('availability')} /></Field>
        </div>
        <button className="btn-primary" disabled={busy} type="submit">{busy ? 'Publishing...' : 'Publish service'}</button>
      </form>
    </div>
  )
}
