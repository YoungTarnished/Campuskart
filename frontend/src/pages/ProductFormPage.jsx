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
  const [uploading, setUploading] = useState(false)

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
    const files = [...event.target.files].slice(0, 5 - form.images.length)
    event.target.value = ''
    if (!files.length) return
    setUploading(true)
    try {
      const urls = await uploadImages(files)
      set('images', [...form.images, ...urls].slice(0, 5))
    } catch (err) { toast(err.message, 'error') } finally { setUploading(false) }
  }

  function removePhoto(url) {
    set('images', form.images.filter((image) => image !== url))
  }

  async function onSubmit(event) {
    event.preventDefault()
    if (!form.images.length) {
      toast('Add at least one photo of the item.', 'error')
      return
    }
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
      <PageHeader title={editing ? 'Edit listing' : 'Sell or trade'} subtitle="Add photos, then submit. An admin approves the listing before other students can see it." />
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
        <fieldset className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/60 p-4">
          <legend className="px-1 text-sm font-semibold text-indigo-950">Photos of the item</legend>
          <p className="text-sm text-slate-600">Add up to 5 photos so buyers can see the condition. JPEG, PNG, or WEBP.</p>
          <label className="btn-secondary mt-3 inline-flex cursor-pointer">
            {uploading ? 'Uploading photos...' : 'Add photos'}
            <input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" multiple disabled={uploading || form.images.length >= 5} onChange={onFiles} />
          </label>
          <div className="mt-3 flex flex-wrap gap-3">
            {form.images.map((image) => (
              <div key={image} className="relative">
                <img src={image} alt="" className="h-24 w-24 rounded-xl object-cover" />
                <button className="absolute -right-2 -top-2 rounded-full bg-white px-2 py-0.5 text-xs font-bold shadow" type="button" onClick={() => removePhoto(image)}>Remove</button>
              </div>
            ))}
          </div>
        </fieldset>
        <button className="btn-primary" disabled={busy || uploading} type="submit">{busy ? 'Saving...' : editing ? 'Save changes' : 'Submit for approval'}</button>
      </form>
    </div>
  )
}
