import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, uploadImages } from '../api/client'
import { PRODUCT_CATEGORIES, PRODUCT_CONDITIONS } from '../constants'
import { useToast } from '../context/ToastContext'
import { Field, PageHeader } from '../components/ui'
import { money } from '../utils/format'

const empty = {
  title: '', description: '', category: 'Books', condition: 'Good', price: '',
  location: '', isExchangeEligible: false, discountPercent: 0, isUrgent: false, images: [],
}

export default function ProductFormPage() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const toast = useToast()
  const [form, setForm] = useState(empty)
  const [suggestion, setSuggestion] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!editing) return
    api(`/api/products/${id}`).then((res) => setForm({
      title: res.data.title,
      description: res.data.description,
      category: res.data.category,
      condition: res.data.condition,
      price: res.data.price,
      location: res.data.location,
      isExchangeEligible: res.data.isExchangeEligible,
      discountPercent: res.data.discountPercent || 0,
      isUrgent: res.data.isUrgent,
      images: res.data.images || [],
    })).catch((err) => toast(err.message, 'error'))
  }, [id])

  function set(key, value) { setForm((current) => ({ ...current, [key]: value })) }

  async function suggest() {
    try {
      const res = await api('/api/products/price-suggestion', {
        method: 'POST',
        body: { category: form.category, condition: form.condition, title: form.title, excludeId: id },
      })
      setSuggestion(res.data)
      if (res.data.suggestedPrice) set('price', res.data.suggestedPrice)
    } catch (err) { toast(err.message, 'error') }
  }

  async function onFiles(event) {
    const files = [...event.target.files].slice(0, 5)
    try {
      const urls = await uploadImages(files)
      set('images', [...form.images, ...urls].slice(0, 5))
    } catch (err) { toast(err.message, 'error') }
  }

  async function onSubmit(event) {
    event.preventDefault()
    setBusy(true)
    const body = { ...form, price: Number(form.price), discountPercent: Number(form.discountPercent) || 0 }
    try {
      const res = await api(editing ? `/api/products/${id}` : '/api/products', { method: editing ? 'PUT' : 'POST', body })
      toast(res.message)
      navigate(`/products/${res.data._id}`)
    } catch (err) { toast(err.message, 'error') } finally { setBusy(false) }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={editing ? 'Edit listing' : 'New listing'} subtitle="The price a buyer pays is the price you enter. Discount and urgent flags power Campus Deals." />
      <form className="card space-y-4 p-5" onSubmit={onSubmit}>
        <Field label="Title"><input className="field" required value={form.title} onChange={(e) => set('title', e.target.value)} /></Field>
        <Field label="Description"><textarea className="field min-h-28" required value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category"><select className="field" value={form.category} onChange={(e) => set('category', e.target.value)}>{PRODUCT_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></Field>
          <Field label="Condition"><select className="field" value={form.condition} onChange={(e) => set('condition', e.target.value)}>{PRODUCT_CONDITIONS.map((item) => <option key={item}>{item}</option>)}</select></Field>
          <Field label="Price (INR)"><input className="field" type="number" min="1" required value={form.price} onChange={(e) => set('price', e.target.value)} /></Field>
          <Field label="Campus location"><input className="field" required value={form.location} onChange={(e) => set('location', e.target.value)} /></Field>
          <Field label="Discount badge %"><input className="field" type="number" min="0" max="90" value={form.discountPercent} onChange={(e) => set('discountPercent', e.target.value)} /></Field>
        </div>
        <button className="btn-secondary" type="button" onClick={suggest}>Suggest a price</button>
        {suggestion && <p className="rounded-2xl bg-indigo-50 p-3 text-sm text-indigo-950">{suggestion.explanation} {suggestion.suggestedPrice ? `Suggested ${money(suggestion.suggestedPrice)}.` : ''}</p>}
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isExchangeEligible} onChange={(e) => set('isExchangeEligible', e.target.checked)} /> Open to exchange</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isUrgent} onChange={(e) => set('isUrgent', e.target.checked)} /> Urgent sale</label>
        <Field label="Images"><input className="field" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={onFiles} /></Field>
        <div className="flex gap-2">{form.images.map((image) => <img key={image} src={image} alt="" className="h-16 w-16 rounded-xl object-cover" />)}</div>
        <button className="btn-primary" disabled={busy} type="submit">{busy ? 'Saving...' : editing ? 'Save changes' : 'Publish listing'}</button>
      </form>
    </div>
  )
}
