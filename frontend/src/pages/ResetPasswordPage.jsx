import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { useToast } from '../context/ToastContext'
import { Field } from '../components/ui'

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await api('/api/auth/reset-password', { method: 'POST', body: { token: params.get('token'), password } })
      toast('Password updated. Please log in.')
      navigate('/login')
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md card p-6">
      <h1 className="text-2xl font-extrabold">Choose a new password</h1>
      <form className="mt-5 space-y-4" onSubmit={onSubmit}>
        <Field label="New password"><input className="field" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        <button className="btn-primary w-full" disabled={busy} type="submit">{busy ? 'Saving...' : 'Update password'}</button>
      </form>
    </div>
  )
}
