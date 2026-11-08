import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { YEARS } from '../constants'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Field } from '../components/ui'

const empty = { name: '', email: '', password: '', department: '', year: '1' }

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setSession } = useAuth()
  const toast = useToast()
  const [form, setForm] = useState(empty)
  const [demo, setDemo] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value })

  async function onSubmit(event) {
    event.preventDefault()
    setBusy(true)
    try {
      const res = await api('/api/auth/register', { method: 'POST', body: form })
      setSession(res.data.user, res.data.token)
      setDemo(res.data.demoVerification)
      toast('Account created. Verify your college email to list or bid.')
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="card p-6">
        <h1 className="text-2xl font-extrabold">Create your student account</h1>
        <p className="mt-1 text-sm text-slate-600">Use your IIITA roll email, such as iit2024123@iiita.ac.in. The prefix is iit, iib, ice, or msb, then 202, a year digit, and three roll digits.</p>
        <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
          <Field label="Full name"><input className="field" required value={form.name} onChange={set('name')} /></Field>
          <Field label="College email"><input className="field" type="email" required value={form.email} onChange={set('email')} /></Field>
          <Field label="Password"><input className="field" type="password" required value={form.password} onChange={set('password')} /></Field>
          <p className="text-xs text-slate-500">At least 8 characters with an uppercase letter, a lowercase letter, and a number. Your college is IIIT Allahabad.</p>
          <Field label="Department"><input className="field" required value={form.department} onChange={set('department')} /></Field>
          <Field label="Year">
            <select className="field" value={form.year} onChange={set('year')}>{YEARS.map((year) => <option key={year} value={year}>Year {year}</option>)}</select>
          </Field>
          <button className="btn-primary" disabled={busy} type="submit">{busy ? 'Creating account...' : 'Create account'}</button>
        </form>
        {demo && (
          <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-950">
            <p className="font-semibold">{demo.label}</p>
            <button className="btn-primary mt-3" type="button" onClick={() => navigate(demo.path)}>Open demo verification</button>
          </div>
        )}
        <p className="mt-4 text-sm">Already registered? <Link className="font-semibold text-indigo-700" to="/login">Log in</Link></p>
      </div>
    </div>
  )
}
