import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useToast } from '../context/ToastContext'
import { Field } from '../components/ui'

export default function ForgotPasswordPage() {
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [demo, setDemo] = useState(null)
  const [message, setMessage] = useState('')

  async function onSubmit(event) {
    event.preventDefault()
    try {
      const res = await api('/api/auth/forgot-password', { method: 'POST', body: { email } })
      setMessage(res.message)
      setDemo(res.data?.demoReset || null)
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  return (
    <div className="mx-auto max-w-md card p-6">
      <h1 className="text-2xl font-extrabold">Forgot password</h1>
      <form className="mt-5 space-y-4" onSubmit={onSubmit}>
        <Field label="College email"><input className="field" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <button className="btn-primary w-full" type="submit">Generate reset link</button>
      </form>
      {message && <p className="mt-4 text-sm text-slate-600">{message}</p>}
      {demo && (
        <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm">
          <p className="font-semibold">{demo.label}</p>
          <Link className="btn-primary mt-3" to={demo.path}>Open demo reset page</Link>
        </div>
      )}
    </div>
  )
}
