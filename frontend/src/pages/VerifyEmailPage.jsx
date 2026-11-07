import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Field } from '../components/ui'

export default function VerifyEmailPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { setSession, user } = useAuth()
  const toast = useToast()
  const [token, setToken] = useState(params.get('token') || '')
  const [busy, setBusy] = useState(false)

  async function onSubmit(event) {
    event.preventDefault()
    setBusy(true)
    try {
      const res = await api('/api/auth/verify-email', { method: 'POST', body: { token } })
      setSession(res.data.user, res.data.token)
      toast('College email verified')
      navigate('/dashboard')
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  async function resend() {
    try {
      const res = await api('/api/auth/resend-verification', { method: 'POST' })
      if (res.data.demoVerification) {
        setToken(res.data.demoVerification.token)
        toast('Demo verification token refreshed')
      }
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  return (
    <div className="mx-auto max-w-md card p-6">
      <h1 className="text-2xl font-extrabold">Verify college email</h1>
      <p className="mt-2 text-sm text-slate-600">Local development shows the token in the registration response. Production should send it by email instead.</p>
      <form className="mt-5 space-y-4" onSubmit={onSubmit}>
        <Field label="Verification token"><textarea className="field min-h-28" value={token} onChange={(e) => setToken(e.target.value)} /></Field>
        <button className="btn-primary w-full" disabled={busy} type="submit">{busy ? 'Verifying...' : 'Verify email'}</button>
      </form>
      {user && !user.isVerified && <button className="btn-secondary mt-3 w-full" type="button" onClick={resend}>Resend demo token</button>}
    </div>
  )
}
