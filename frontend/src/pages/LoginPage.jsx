import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Field } from '../components/ui'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setSession } = useAuth()
  const toast = useToast()
  const [form, setForm] = useState({ email: '', password: '' })
  const [busy, setBusy] = useState(false)

  async function onSubmit(event) {
    event.preventDefault()
    setBusy(true)
    try {
      const res = await api('/api/auth/login', { method: 'POST', body: form })
      setSession(res.data.user, res.data.token)
      toast('Welcome back')
      navigate(location.state?.from || '/dashboard')
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-6">
        <h1 className="text-2xl font-extrabold">Log in</h1>
        <p className="mt-1 text-sm text-slate-600">Use the college email on your CampusKart account.</p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <Field label="College email"><input className="field" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Password"><input className="field" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
          <button className="btn-primary w-full" disabled={busy} type="submit">{busy ? 'Signing in...' : 'Log in'}</button>
        </form>
        <div className="mt-4 flex justify-between text-sm">
          <Link className="font-semibold text-indigo-700" to="/forgot-password">Forgot password</Link>
          <Link className="font-semibold text-indigo-700" to="/register">Create an account</Link>
        </div>
      </div>
    </div>
  )
}
